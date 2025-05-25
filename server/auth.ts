import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User, userRoleEnum } from "@shared/schema";

// Add User type to Express' User interface
declare global {
  namespace Express {
    interface User extends User {}
  }
}

const scryptAsync = promisify(scrypt);

// Helper function to hash passwords
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Helper function to compare passwords
export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Middleware to check if user is authenticated
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

// Middleware to check if user is admin
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user.role === "admin") {
    return next();
  }
  res.status(403).json({ message: "Forbidden: Admin access required" });
};

// Middleware to check if user is instructor/professor
export const isInstructor = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && (req.user.role === "instructor" || req.user.role === "admin")) {
    return next();
  }
  res.status(403).json({ message: "Forbidden: Instructor access required" });
};

// Middleware to check if user is the same as requested user or admin/instructor
export const isSelfOrStaff = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    if (
      req.user.role === "admin" || 
      req.user.role === "instructor" || 
      req.user.id === parseInt(req.params.id)
    ) {
      return next();
    }
  }
  res.status(403).json({ message: "Forbidden: Access denied" });
};

export function setupAuth(app: Express) {
  // Setup session middleware
  const sessionOptions: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "senseisystem-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
    }
  };

  // Use memory store for development
  app.use(session(sessionOptions));
  
  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local strategy
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email", // Use email for authentication
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false, { message: "Incorrect email or password" });
          }
          
          // Check if user is active
          if (!user.active) {
            return done(null, false, { message: "Account is pending activation" });
          }
          
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  // Serialize and deserialize user
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Register authentication routes
  app.post("/api/register", async (req, res, next) => {
    try {
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(req.body.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }

      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(req.body.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already in use" });
      }

      // Hash password
      const hashedPassword = await hashPassword(req.body.password);

      // Create user (default active = false for pending status)
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
        active: false, // Default to pending status
      });

      // For student role, also create a student record
      if (user.role === "student") {
        await storage.createStudent({
          userId: user.id,
          beltLevel: req.body.beltLevel || "white",
          stripes: req.body.stripes || 0,
          lastPromotionDate: new Date(),
          attendanceRate: 0,
          notes: "New student registration"
        });
      }

      // Create activity log for new registration
      await storage.createActivityLog({
        activity: `New user registered: ${user.firstName} ${user.lastName} (${user.role})`,
        userId: user.id,
        entityType: "user",
        entityId: user.id,
        timestamp: new Date()
      });

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.status(201).json({ 
        user: userWithoutPassword,
        message: "Registration successful. Your account is pending approval."
      });
    } catch (err) {
      next(err);
    }
  });

  // Login route
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }
      
      if (!user) {
        return res.status(401).json({ message: info.message || "Authentication failed" });
      }
      
      req.login(user, async (err) => {
        if (err) {
          return next(err);
        }
        
        // Create activity log for login
        await storage.createActivityLog({
          activity: `User logged in: ${user.firstName} ${user.lastName}`,
          userId: user.id,
          entityType: "user",
          entityId: user.id,
          timestamp: new Date()
        });
        
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        return res.json({ user: userWithoutPassword });
      });
    })(req, res, next);
  });

  // Logout route
  app.post("/api/logout", (req, res) => {
    if (req.user) {
      const userId = req.user.id;
      const userName = `${req.user.firstName} ${req.user.lastName}`;
      
      req.logout((err) => {
        if (err) {
          return res.status(500).json({ message: "Logout failed" });
        }
        
        // Create activity log for logout
        storage.createActivityLog({
          activity: `User logged out: ${userName}`,
          userId: userId,
          entityType: "user",
          entityId: userId,
          timestamp: new Date()
        });
        
        req.session.destroy((err) => {
          if (err) {
            return res.status(500).json({ message: "Session destruction failed" });
          }
          res.json({ message: "Logged out successfully" });
        });
      });
    } else {
      res.json({ message: "No user to log out" });
    }
  });

  // Get current user
  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      const { password, ...userWithoutPassword } = req.user;
      return res.json({ user: userWithoutPassword });
    }
    res.status(401).json({ message: "Not authenticated" });
  });

  // Activate user (admin/instructor only)
  app.patch("/api/users/:id/activate", isInstructor, async (req, res, next) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedUser = await storage.updateUser(userId, { active: true });
      
      // Create activity log for account activation
      await storage.createActivityLog({
        activity: `User account activated: ${user.firstName} ${user.lastName}`,
        userId: req.user.id, // Admin/instructor who performed the action
        entityType: "user",
        entityId: userId,
        timestamp: new Date()
      });
      
      res.json({ 
        user: updatedUser,
        message: "User account activated successfully"
      });
    } catch (err) {
      next(err);
    }
  });
  
  // Initialize default admin user if it doesn't exist
  initializeDefaultAdmin();
}

// Function to create default admin user
async function initializeDefaultAdmin() {
  try {
    const existingAdmin = await storage.getUserByEmail("arkaihub@gmail.com");
    
    if (!existingAdmin) {
      const hashedPassword = await hashPassword("12345678");
      
      await storage.createUser({
        firstName: "Arkaia",
        lastName: "Admin",
        username: "arkaiadm",
        email: "arkaihub@gmail.com",
        password: hashedPassword,
        role: "admin",
        active: true,
        phone: null,
        emergencyContact: null,
        joinDate: new Date(),
      });
      
      console.log("Admin user created: arkaiadm");
    }
  } catch (err) {
    console.error("Error creating admin user:", err);
  }
}