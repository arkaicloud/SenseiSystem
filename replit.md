# replit.md

## Overview
This project is a full-stack Jiu-Jitsu school management application designed to streamline operations for martial arts academies. It provides comprehensive tools for managing students, classes, attendance, payments, and communications. The business vision is to offer a robust, modern solution for martial arts schools, enhancing efficiency, improving student retention through better engagement, and facilitating automated administrative tasks like billing. The project aims to be a leading solution in the martial arts management software market.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript and Vite.
- **UI Components**: Shadcn/ui and Radix UI.
- **Styling**: Tailwind CSS with custom CSS variables.
- **State Management**: TanStack Query (React Query) for server state.
- **Routing**: Wouter.
- **Forms**: React Hook Form with Zod validation.
- **Internationalization**: React i18next for multi-language support (e.g., Portuguese BR).

### Backend
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript with ES modules.
- **Authentication**: Passport.js with local strategy and session-based auth, using PostgreSQL-backed sessions.
- **Role-Based Access Control**: Supports admin, instructor, and student roles.

### Database
- **Database**: PostgreSQL (configured for Neon serverless).
- **ORM**: Drizzle ORM with Drizzle Kit for migrations.
- **Connection**: Neon serverless driver with WebSocket support.
- **Schema**: Shared TypeScript schema definitions with Zod validation.

### Key Features & Design Decisions
- **Authentication System**: Session-based authentication, role-based access control, password hashing (bcryptjs), and protected routes.
- **User Management**: Multi-role system, registration with admin approval, profile management, and student-specific data (belt level, attendance).
- **Class Management**: Scheduling, instructor assignment, capacity limits, and real-time attendance tracking.
- **Attendance System**: Quick student confirmation, instructor-led taking, rate calculations, and reporting.
- **Payment Management**: Flexible payment plans, student payment tracking, automated due date calculations, and payment history. Integration with ASAAS for automated billing, subscription management, and webhook processing.
- **Communication System**: School announcements, event management, rich text editor, and targeted messaging.
- **Dashboard and Analytics**: Role-specific dashboards, student progress tracking (belt progression), attendance statistics, and engagement metrics (e.g., risk classification for student retention).
- **Belt System**: Implementation of IBJJF official belt systems (adult and child categories) with corresponding visual representation and management interfaces.
- **UI/UX**: Responsive design with mobile-first approach, consistent branding (school logo support), and adaptive components.
- **Monorepo Structure**: Shared TypeScript definitions for type safety across frontend and backend.

## External Dependencies

### Core
- **@neondatabase/serverless**: PostgreSQL connection.
- **drizzle-orm**: Type-safe ORM.
- **@tanstack/react-query**: Server state management.
- **@radix-ui/***: Headless UI components.
- **passport**: Authentication middleware.
- **bcryptjs**: Password hashing.
- **zod**: Runtime type validation.
- **asaas-node**: ASAAS payment gateway integration.

### Development & UI
- **vite**: Frontend build tool.
- **typescript**: Language.
- **tailwindcss**: CSS framework.
- **drizzle-kit**: Database migrations.
- **class-variance-authority**: Component variant management.
- **cmdk**: Command palette component.
- **date-fns**: Date manipulation.
- **react-hook-form**: Form state management.
- **wouter**: Lightweight React router.

## Recent Changes

### August 5, 2025 - IBJJF Official Belt System with Smart Display
- **Belt Category System**: Added category field to beltLevels table with 'adult' and 'child' classifications
- **IBJJF Adult Belts**: Implemented complete adult system (White, Blue, Purple, Brown, Black, Coral, Red/White, Red)
- **IBJJF Kids Belts**: Implemented complete kids system (Grey/White through Green/Black with all variations)
- **Categorized Dashboard Widgets**: Created separate "Faixas Adulto" and "Faixas Infantil" widgets
- **Dynamic Belt Display**: All widgets now automatically show newly created belts from database
- **Admin Dashboard Update**: Replaced single belt widget with two category-specific widgets
- **Belt Management Interface**: Enhanced form to include category selection for new belt creation
- **Official Color Codes**: Implemented authentic IBJJF belt colors for both adult and kids systems
- **Smart Belt Display**: Widgets now show only belts with students for cleaner, professional interface
- **Improved UX**: Reduced visual noise by hiding empty belts, better mobile experience and faster decision-making

### August 5, 2025 - Dynamic Belt System Integration & Modern Login
- **Complete Belt System Integration**: Implemented system-wide dynamic belt integration using belt_levels table
- **useBeltLevels Hook**: Created centralized hook for belt data management with adult/child categorization
- **BeltBadge Component**: Updated to use dynamic colors and names from database
- **BeltProgressionControls**: Modernized with real progression system using database data
- **BeltFilter Component**: Created reusable component for consistent belt selection across system
- **Student Management**: Updated student pages and forms to use dynamic belt system
- **Modern Login Page**: Complete redesign following modern dark/light theme pattern with school name integration
- **Removed Hardcoded References**: Eliminated all hardcoded belt references throughout the system
- **Automatic Adaptation**: All components now automatically adapt when new belts are created