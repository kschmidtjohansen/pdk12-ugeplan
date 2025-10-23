# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
