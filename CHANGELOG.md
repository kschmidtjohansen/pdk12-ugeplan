# Changelog

<!-- 
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  CRITICAL: MANDATORY CHANGELOG UPDATES ⚠️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

THIS FILE MUST BE UPDATED WITH EVERY CODE CHANGE!

📝 When to Update:
   ✅ New features or components
   ✅ Bug fixes and issue resolutions
   ✅ Performance improvements
   ✅ Database schema changes
   ✅ Security updates
   ✅ Breaking changes

📋 Format:
   ## [Unreleased]
   
   ### Fixed - YYYY-MM-DD
   - Bug fix descriptions
   
   ### Added - YYYY-MM-DD
   - New feature descriptions
   
   ### Changed - YYYY-MM-DD
   - Modification descriptions

📖 See CONTRIBUTING.md for detailed guidelines

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-->

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Security - 2025-02-12
- Fjernet hardkodet demo-adgangskode fra kildekoden (nu via environment variabel)
- Hærdnet RLS-policies: on_call_duties UPDATE, assignment_messages/files SELECT, departments/sub_departments SELECT

### Fixed - 2025-02-12
- Lager-redigering i demo mode gemmes nu korrekt i hukommelsen
- Rolle-skift toast bruger nu korrekte oversættelsesnøgler
- Super Admin ser nu samme dashboard-metrics og Quick Access som Administrator
- Super Admin kan nu redigere lagervarer og vælges som ansvarlig i planlæggeren

### Added - 2025-02-12
- Lokationsstyring med inline-redigering og sletning i Admin-panelet
- Admin locations oversættelser (da/en)

### Performance - 2025-02-12
- Reduceret Google Fonts vægt (300-700 i stedet for 300-900)
- Fjernet render-blocking font preload
- Tilføjet inline kritisk CSS for loading spinner
- Dynamic import af performanceMonitor (kun i development)
- Fjernet ubrugt App.css indhold
- Tilføjet cache-headers for statiske assets

### Added - 2025-01-09
- **Demo Mode Write Access**: Demo mode now supports full CRUD operations
  - Users can create, update, and delete assignments, cars, employees, and vacations in demo mode
  - All demo operations are automatically tracked and cleaned up every 15 minutes
  - Manual cleanup button available for immediate data reset
  - Baseline data is preserved while session-created records are removed
  - Affects: `src/hooks/car/useCarData.ts`, `src/components/Admin/UserManagement.tsx`, `src/services/optimizedAssignmentService.ts`

- **Loading Translation**: Added Danish translation for loading screens
  - New `loadingApplication` translation key added to both Danish and English
  - Browser language detection implemented for pre-initialization loading screens
  - Affects: `src/translations/da/common.ts`, `src/translations/en/common.ts`, `src/App.tsx`, `src/components/Layout/MainLayout.tsx`

- **Documentation**: Created comprehensive CONTRIBUTING.md
  - Guidelines for changelog updates (mandatory for all code changes)
  - Development workflow documentation
  - Code style guidelines and best practices
  - Testing checklist and deployment notes

### Fixed - 2025-01-09
- **Loading Screen Language**: Fixed hard-coded English "Loading application..." appearing in Danish interface
  - Loading screens now detect browser language (Danish/English) before translation system initializes
  - Consistent language experience from initial page load
  - Affects: `src/App.tsx`, `src/components/Layout/MainLayout.tsx`

### Changed - 2025-01-09
- **Demo Mode Behavior**: Removed read-only restrictions from demo mode
  - Demo users can now fully interact with the system
  - Data integrity maintained through automatic 15-minute cleanup cycles
  - Session-end cleanup ensures no demo data persists after logout
- **Changelog Header**: Enhanced with clear mandatory update instructions
  - Visual indicators for critical requirements
  - Quick reference format guide
  - Link to detailed contributing guidelines

### Fixed - 2025-01-24
- **Demo Data Persistence**: Fixed demo data disappearing on page navigation
  - Employees and assignments now persist in sessionStorage across page changes
  - Added full virtualization for employee CRUD operations (create, update, delete)
  - Added virtualization for assignment delete operations
  - Demo data now properly merges with baseline data on fetch
  - Data persists until manual deletion, "Clear demo data" button, or 15-minute auto-cleanup
  - Affects: `src/services/demoUserService.ts`, `src/hooks/employee/useEmployeeData.ts`, `src/hooks/employee/useEmployeeActions.ts`, `src/services/optimizedAssignmentService.ts`, `src/hooks/assignment/useAssignmentActions.ts`
- **Demo Mode Auto-Refresh**: Removed unnecessary polling that caused page stuttering
  - Removed 40-second polling interval from car data fetching in demo mode
  - Demo data now only fetches once on mount and updates via explicit CRUD operations
  - Significantly improves demo mode performance and prevents unwanted page refreshes
  - Affects: `src/hooks/car/useCarData.ts`
- **Employee Absence Toggle**: Fixed UI not refreshing immediately when toggling employee absence status
  - Implemented deep change detection in `useEmployeeData` to properly detect onLeave and status changes
  - Updated component key prop to include absence status and employee status for proper re-rendering
  - Added missing translation keys for absence toggle toast messages (Danish and English)
  - Toast messages now display properly translated text instead of translation keys
  - Affects: `src/hooks/employee/useEmployeeData.ts`, `src/pages/EmployeesPage.tsx`, `src/components/Employees/EmployeesTable.tsx`, `src/translations/da/employees.ts`, `src/translations/en/employees.ts`
- **Demo User Visibility**: Hidden demo user profile from production employee list
  - Demo user (`test@polygongroup.com`) is now filtered out in production views
  - Demo mode users still see all employees including demo user
  - Prevents confusion by keeping demo-only accounts hidden from regular users
  - Affects: `src/hooks/employee/useEmployeeData.ts`
- **Vikar Selection Error Fixed**: Improved error handling in employee selector for vikarer
  - Added comprehensive error handling and validation for employee data
  - Vikarer with missing fields no longer crash the selector
  - Added detailed error logging for debugging
  - Affects: `src/components/Planner/EmployeeSelector.tsx`
- **Expiration Date Validation**: Enhanced vikar creation with expiration date validation
  - Prevents setting expiration dates in the past
  - Warns when expiration is more than 6 months away
  - Improved user experience with clear error messages
  - Affects: `src/components/Employees/EmployeeFormDialog.tsx`
- **Cleanup Function Enhanced**: Improved temporary user cleanup function
  - Updated Petrie's expiration date for testing
  - Added detailed logging for cleanup operations
  - Now returns deletion count and affected user IDs
  - Improved error handling for auth user deletion
  - Fixed security warning (search_path set to empty string)
  - Affects: Database function `cleanup_expired_temporary_users()`

### Fixed - 2025-01-23
- **Demo Mode Data Filtering**: Cars and employees now filtered by creation date (>= 2025-10-23) to exclude baseline production data
  - Only shows recent demo cars (CAR-001, CAR-002, VAN-001) on Cars page
  - Dashboard metrics now correctly count only recent demo employees and cars
  - Affects: `src/hooks/car/useCarData.ts`, `src/services/enhancedDataFetching.ts`
  
- **Vacation Request Red Dot**: Fixed pending vacation indicator not appearing in demo mode
  - Made `useVacationRequestsStatus` schema-aware to query demo.vacations in demo mode
  - Red dot now appears on "Fridage" nav item when pending requests exist
  - Affects: `src/hooks/vacation/useVacationRequestsStatus.ts`

- **Admin Panel Navigation**: User Management ("Brugerstyring") now opens first when accessing admin section
  - Changed default tab from "overview" to "users"
  - Affects: `src/pages/AdminPage.tsx`

### Added
- Created comprehensive changelog system for tracking project changes
- Enhanced demo user role switching with proper persistence
- Real-time task creation for demo users without page reload requirement
- Complete Danish translations for demo dashboard auto-cleanup timer
- Auto-cleanup timer functionality with 15-minute extension capability
- Warning system for imminent demo data deletion
- GitHub integration documentation
- New `useVacationRequestsStatus` hook to track pending vacation requests directly from database

### Fixed
- **Toast notification system standardized** to single import location (`@/hooks/use-toast`)
- **Login now loads data immediately** without requiring page refresh
- **Vacation request notifications now persist** until requests are approved/rejected (red dot indicator)
- **Dashboard metrics** now show "no data" message instead of error when no assignments exist
- **Cars page in demo mode** now correctly filters to show only demo vehicles
- **Dashboard metrics calculations** enhanced to handle both demo and production data formats
- **Employee role enrichment** now properly fetches actual roles from `user_roles` table instead of hardcoding all employees as 'servicemedarbejder'
- **Available cars metric** now correctly excludes cars with `show_in_planner = false`
- **Available employees metric** now correctly counts only servicemedarbejder role employees
- Demo role switching now properly persists user selection without database override
- Task creation for demo users now shows immediately without manual page refresh
- Translation provider initialization race condition resolved
- Enhanced error handling for authentication state changes
- Improved real-time subscription handling for demo user isolation

### Changed
- Demo role initialization logic to prevent constant resets to database role
- Assignment data fetching to provide immediate updates for demo users
- Translation system loading to prevent useTranslation errors during initialization
- Enhanced logging for demo mode operations and role switching
- Vacation notification logic changed from notification-based to database query-based for persistence

### Technical Improvements
- **Auth stabilization delay increased** from 100ms to 200ms for better data loading synchronization
- **Data fetching** now includes 50ms delay before first fetch to ensure auth state is ready
- Optimized auth context initialization with better session handling
- Improved demo user filtering with immediate data visibility
- Enhanced translation context with proper initialization checks
- Better error recovery for authentication and user data fetching
- Removed 46 duplicate toast import references across the codebase
- Employee data fetching now joins with `user_roles` table to get actual user roles
- Dashboard metrics filtering improved for accurate employee and car counts

---

## Version History

### [1.0.0] - 2025-01-14
- Initial release of the Weekly Planner application
- Core functionality for task management, employee scheduling, and resource allocation
- Multi-language support (Danish/English)
- Role-based access control (Administrator, Skadeleder, Servicemedarbejder)
- Demo mode with automatic data cleanup
- Supabase integration for backend services
- Real-time updates for collaborative planning

---

## Maintenance Notes

This changelog is maintained to track all significant changes to the codebase.

**For Contributors:**
- Add entries under `[Unreleased]` section when making changes
- Use standard categories: Added, Changed, Deprecated, Removed, Fixed, Security, Technical Improvements
- Move unreleased changes to a new version section on release
- Follow semantic versioning for version numbers
- Keep descriptions concise but informative
- Include user-facing impact when relevant

**Changelog Update Process:**
1. Before committing significant changes, update the `[Unreleased]` section
2. Group related changes together under appropriate categories
3. Write clear, descriptive entries that explain what changed and why
4. On version release, move `[Unreleased]` items to a new version section with date
5. Create a new empty `[Unreleased]` section for future changes

For detailed commit history, see the Git repository.
