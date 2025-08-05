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

### August 3, 2025 - ASAAS Payment Integration Implementation
- **Database Schema Enhanced**: Added schoolPayments, asaasWebhookEvents, and asaasCustomers tables
- **ASAAS Service Created**: Complete payment gateway integration with subscription management capabilities
- **Webhook Infrastructure**: Implemented real-time payment status updates with automatic school activation/deactivation
- **Admin Interface**: Created comprehensive ASAAS payments management page with configuration controls
- **Storage Layer**: Full implementation in both DatabaseStorage and MemStorage for payment operations
- **API Routes**: Complete set of endpoints for payment management, webhook handling, and configuration
- **Integration Ready**: System prepared for automated monthly billing and payment processing via ASAAS gateway

### August 3, 2025 - ASAAS Customer Integration During Student Onboarding
- **Student Schema Extended**: Added financial responsible party fields (name, email, phone, CPF, relationship)
- **ASAAS Customer ID**: Added asaasCustomerId field to students table for linking with payment gateway
- **Onboarding Enhanced**: PersonalInfoStep now collects financial responsible party data with auto-fill when "self"
- **Automatic ASAAS Integration**: Student registration now automatically creates ASAAS customers during onboarding
- **Smart Data Handling**: Financial responsibility data flows from onboarding form to ASAAS customer creation
- **Error Resilience**: Student creation continues even if ASAAS customer creation fails (logged but non-blocking)
- **Connection Testing**: Added test connection functionality in ASAAS admin interface

### August 3, 2025 - Complete ASAAS Billing Automation with Payment Plans and Due Dates
- **Payment Plan Integration**: Added payment plan selection directly in student onboarding form
- **Due Date Collection**: Students can select preferred monthly due date (1-28) during registration
- **Automatic Subscription Creation**: System creates ASAAS monthly subscriptions based on selected plan and due date
- **Subscription Tracking**: Added asaasSubscriptionId field to students table for subscription management
- **Smart Date Calculation**: System calculates next due date based on selected day, moving to next month if needed
- **Complete Billing Flow**: Student registration now handles customer creation, subscription setup, and billing automation

### August 3, 2025 - Enhanced Login Page Layout and School Branding
- **Fixed Empty Spaces**: Eliminated empty spaces on the right side of login page with full-width responsive layout
- **Enhanced Right Panel**: Improved features showcase with better visual hierarchy and engaging statistics
- **Consistent Branding**: Added school logo support across sidebar, mobile header, and login page
- **Adaptive Logo Component**: Created responsive logo handling for different aspect ratios (horizontal/square/vertical)
- **Visual Improvements**: Added decorative elements, better typography scaling, and enhanced card designs
- **Mobile Optimization**: Improved responsive design with proper breakpoints and mobile-first approach

### August 4, 2025 - Student Panel with Financial Responsibility and Attendance History
- **Financial Panel Implementation**: Created comprehensive financial panel for students who are financial responsible
- **CPF-based Financial Access**: System verifies if student's CPF is linked as financial responsible to show invoice access
- **ASAAS Integration Ready**: Prepared endpoints to fetch customer invoices and payment data from ASAAS gateway
- **Attendance History Component**: Built detailed attendance tracking with monthly filtering and statistics
- **Enhanced Student Dashboard**: Added tab-based navigation with "Próximas Aulas", "Financeiro", and "Histórico de Presenças"
- **Student API Endpoints**: Created `/api/student/financial/:studentId` and `/api/student/attendance-history/:studentId`
- **Responsive Design**: All new components follow mobile-first design with proper breakpoints and modern UI
- **Portuguese Localization**: All new interfaces implemented in Portuguese BR as requested

### August 4, 2025 - Real-Time Engagement Metrics System Implementation
- **Dashboard Metrics Fix**: Corrected user status filter from 'approved' to 'active' - now showing real 5 active students
- **Engagement Metrics Service**: Created dedicated service for real-time attendance and overdue payment tracking
- **New API Endpoint**: Implemented `/api/admin/widgets/engagement` with 5-minute caching and multi-tenant filtering
- **Advanced Risk Classification**: Added critical risk (< 30%) vs high risk (30-60%) student categorization
- **ASAAS Revenue Integration**: Prepared system for real monthly revenue data from ASAAS payment gateway
- **30-Day Maturity Rule**: Students must have 30+ days since joinDate to be evaluated for risk metrics
- **Real-Time Auto-Refresh**: Dashboard updates metrics every 5 minutes automatically with manual refresh option
- **Portuguese Localization**: All engagement metrics labels and descriptions implemented in Portuguese BR

### August 5, 2025 - Login Screen School Info Display & Sidebar Organization
- **School Info Card**: Created component to display school contact information on login screen with WhatsApp and social media links
- **Public API Endpoint**: Added `/api/school/public-info` for public school information display
- **Social Media Detection**: Automatic detection and labeling of Instagram, Facebook, YouTube, TikTok links
- **WhatsApp Integration**: Phone numbers automatically convert to WhatsApp links with proper formatting
- **Belt Management Menu**: Added "Gerenciar Faixas" option to Configuration section in sidebar for admin users
- **Sidebar Cleanup**: Removed duplicate/unused sidebar component, consolidated to single accordion-style sidebar
- **Login Text Update**: Changed welcome message to "Seja Bem Vindos ao {schoolName}"