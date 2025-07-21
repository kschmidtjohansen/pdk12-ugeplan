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

### Fixed
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

### Technical Improvements
- Optimized auth context initialization with better session handling
- Improved demo user filtering with immediate data visibility
- Enhanced translation context with proper initialization checks
- Better error recovery for authentication and user data fetching

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

This changelog is automatically updated with each significant change to the codebase. 
For detailed commit history, see the Git repository.

### Contributing to the Changelog
- Add entries under `[Unreleased]` for new changes
- Use categories: Added, Changed, Deprecated, Removed, Fixed, Security
- Move unreleased changes to a new version section on release
- Follow semantic versioning for version numbers