# replit.md

## Overview

This is a full-stack Jiu-Jitsu school management application built with modern web technologies. The system provides comprehensive functionality for managing students, classes, attendance, payments, and communications in a martial arts academy setting.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript and Vite as the build tool
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation
- **Internationalization**: React i18next for multi-language support

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with local strategy and session-based auth
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple

### Database Architecture
- **Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle ORM with Drizzle Kit for migrations
- **Connection**: Neon serverless driver with WebSocket support
- **Schema**: Shared TypeScript schema definitions with Zod validation

## Key Components

### Authentication System
- Session-based authentication using Passport.js
- Role-based access control (admin, instructor, student)
- Password hashing with bcryptjs
- Protected routes with middleware validation

### User Management
- Multi-role user system (admin, instructor, student)
- User registration with approval workflow for admins
- Profile management with customizable avatars
- Student-specific data (belt level, stripes, attendance rate)

### Class Management
- Class scheduling with day-of-week and time slots
- Instructor assignment and capacity limits
- Real-time attendance tracking
- Class attendance counters and confirmation system

### Attendance System
- Quick attendance confirmation for students
- Instructor-led attendance taking
- Attendance rate calculations and reporting
- Real-time attendance counters for classes

### Payment Management
- Flexible payment plan system
- Student payment tracking with status monitoring
- Automated payment due date calculations
- Payment history and reporting

### Communication System
- School announcements and event management
- Rich text editor for communications
- Targeted messaging (all users, students only, instructors only)
- Event scheduling with date management

### Dashboard and Analytics
- Role-specific dashboards with customizable widgets
- Student progress tracking (belt progression)
- Attendance statistics and belt distribution charts
- Activity logging and reporting

## Data Flow

### Authentication Flow
1. User submits login credentials
2. Passport.js validates against database
3. Session created and stored in PostgreSQL
4. User object attached to requests for authorization

### Student Registration Flow
1. User registers with student role
2. Admin receives notification of pending user
3. Admin approves user and assigns payment plan
4. Student record created with belt progression tracking

### Attendance Flow
1. Students confirm attendance for upcoming classes
2. Instructors take attendance during class
3. Attendance records stored with timestamps
4. Statistics updated for student progress tracking

### Payment Flow
1. Payment plans define billing schedules
2. Student payments tracked with due dates
3. Payment status monitoring (paid, pending, overdue)
4. Automated reminders and reporting

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection for serverless environments
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Headless UI components
- **passport**: Authentication middleware
- **bcryptjs**: Password hashing
- **zod**: Runtime type validation

### Development Tools
- **vite**: Frontend build tool with HMR
- **typescript**: Type safety across the stack
- **tailwindcss**: Utility-first CSS framework
- **drizzle-kit**: Database migrations and introspection

### UI and UX
- **class-variance-authority**: Component variant management
- **cmdk**: Command palette component
- **date-fns**: Date manipulation and formatting
- **react-hook-form**: Form state management
- **wouter**: Lightweight React router

## Deployment Strategy

### Build Process
- Frontend builds to `dist/public` using Vite
- Backend bundles to `dist/index.js` using esbuild
- Production build combines both frontend and backend assets

### Environment Configuration
- Database connection via `DATABASE_URL` environment variable
- Session configuration for production security
- Drizzle migrations applied via `db:push` script

### Development Setup
- Development server runs both frontend and backend concurrently
- Vite dev server with HMR for frontend development
- tsx for TypeScript execution in development
- Database schema shared between frontend and backend

### Production Deployment
- Node.js application serving static frontend assets
- Express middleware for API routes and authentication
- PostgreSQL database with connection pooling
- Session store backed by database for scalability

The application follows a monorepo structure with shared TypeScript definitions, enabling type safety across the entire stack while maintaining clear separation between frontend and backend concerns.

## Recent Changes

### January 26, 2025 - Mobile Navigation & Architecture Planning
- Fixed mobile navigation menu to respond properly to first touch
- Made mobile header bar fixed for constant access to navigation modules
- Reduced padding between sidebar and main content across all pages
- Created comprehensive roadmap for SenseiSystem evolution with 10 prioritized features
- Identified 3-phase implementation strategy focusing on retention, automation, and competitive differentiation

### August 3, 2025 - Bug Fixes & Asaas Integration Planning
- Fixed critical date conversion error in student payment updates (toISOString issue)
- Corrected TypeScript errors in students page preventing registration access
- Updated charts to show appropriate empty states instead of fake data
- Created comprehensive Asaas payment processor integration plan with security considerations
- Enhanced error handling in payment endpoints with proper date validation

### August 3, 2025 - Complete CRUD Testing & Responsiveness Verification
- **StudentForm Translation Fix**: Resolved missing 't' function by importing useTranslations hook
- **Complete CRUD Verification**: All endpoints tested and working (students, classes, payments, plans)
- **Responsiveness Confirmed**: Mobile-first design with proper breakpoints (768px, 475px)
- **Portuguese Translation**: Complete i18n implementation with pt-BR.ts covering all forms
- **Mobile Navigation**: Sidebar converts to sheet component on mobile devices
- **Authentication System**: Working with admin credentials and session management
- **System Ready**: All major functionality tested and operational for production use