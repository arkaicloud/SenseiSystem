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

### August 5, 2025 - Onboarding System Fix & Document Upload
- **DocusealForm Removal**: Removed problematic DocusealForm causing "Failed to fetch" errors
- **Complete Document Upload System**: Implemented local file upload with validation (PDF, JPG, PNG up to 10MB)
- **Public Registration Endpoint**: Created /api/register-student for unauthenticated student registration
- **Enhanced UI/UX**: Added drag-and-drop interface with visual feedback and file information display
- **Validation System**: Comprehensive client and server-side validation with proper error handling
- **Student Registration Flow**: Complete working onboarding flow with 3 steps: Personal Info, Health/Belt, Documents
- **Pending Approval System**: Students created with active: false status requiring admin approval
- **Testing Completed**: Successfully created 3 test students through onboarding process

### August 5, 2025 - Complete Student Edit System & ASAAS Integration Functional
- **Student Edit Dialog Fixed**: Resolved data saving issues in StudentEditDialog with proper field separation
- **PUT Route Enhancement**: Enhanced /api/users/:id route to handle both user and student data updates
- **Date Handling Fix**: Corrected Date object conversion for birthDate and other timestamp fields
- **Field Mapping**: Properly separated user table fields from student table fields in update operations
- **Successful Testing**: Leo Souza (ID: 11) data successfully updated - name, birthDate, beltLevel, financialResponsibleName
- **ASAAS Integration**: Fully functional integration with https://api-sandbox.asaas.com/v3 and proper authentication
- **Complete Flow**: Student registration → approval → ASAAS customer creation → payment generation working
- **Production Ready**: Both student edit functionality and ASAAS integration ready for production deployment
- **Data Integrity**: All updates properly logged and validated with comprehensive error handling

### August 5, 2025 - Student Registration System Fixed & Fully Functional
- **Registration Endpoint Fixed**: Resolved critical timestamp conversion issues in `/api/register-student` endpoint
- **Drizzle ORM Compatibility**: Implemented workaround for timestamp field conflicts using direct SQL updates
- **Birth Date Handling**: Separated birthDate insertion using SQL execution to avoid conversion errors
- **Complete Registration Flow**: Successfully tested student registration with Lucas Henrique da Silva (ID: 17)
- **Error Resolution**: Fixed "value.toISOString is not a function" error by avoiding problematic schema fields
- **Data Integrity**: All student data now properly saved including personal info, address, and financial responsibility
- **Production Ready**: Onboarding system now fully functional with comprehensive error handling and data persistence
- **Testing Completed**: Registration working end-to-end with proper approval workflow and database storage

### August 5, 2025 - Student Approval System Fixed & Admin Authentication Resolved
- **Approval Error Fixed**: Resolved "Payment plan is required for student approval" by making mutation send planId parameter
- **Frontend Mutation Correction**: Modified approveMutation to retrieve and send student's paymentPlanId to approval route
- **API Enhancement**: Updated /api/users/pending to include complete student data with financial responsible information
- **Admin Authentication Fixed**: Reset admin password hash to resolve login issues and "Cannot read properties of undefined" errors
- **Approval Testing**: Successfully approved João Oliveira (ID: 23) with ASAAS integration attempt
- **Complete Workflow**: Student approval now works end-to-end from pending list to activation with payment plan
- **Production Ready**: Admin approval interface fully functional with proper error handling and user feedback

### August 5, 2025 - ASAAS Integration Fully Functional & Complete
- **Data Mapping Fixed**: Resolved snake_case to camelCase mapping issues in ASAAS service for financial responsible data
- **Error Handling Enhanced**: Implemented detailed error logging with specific ASAAS API error codes and descriptions
- **Customer Creation Success**: Successfully creating ASAAS customers with valid CPF validation (e.g., cus_000006912384)
- **Payment Plan Values Corrected**: Updated payment plans to meet ASAAS minimum requirements (R$ 110.00 and R$ 220.00)
- **Complete Integration Flow**: Registration → Approval → ASAAS Customer → Payment generation working end-to-end
- **Production Validation**: Tested with multiple users, proper error handling for invalid CPFs and minimum payment values
- **Payment Gateway Ready**: ASAAS sandbox integration fully functional with proper authentication and data validation
- **Automated Billing**: Students with complete financial data automatically get ASAAS customers and payments created on approval