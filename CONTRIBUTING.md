# Contributing to Polygon Assignments

Thank you for contributing to this project! This document provides guidelines for making changes to the codebase.

## 📋 Changelog Requirements

**CRITICAL**: Every change MUST be documented in the CHANGELOG.md file before committing.

### When to Update the Changelog

Update the changelog for:
- ✅ New features or components
- ✅ Bug fixes and issue resolutions
- ✅ Performance improvements
- ✅ Database schema changes
- ✅ API or interface changes
- ✅ Security updates
- ✅ Breaking changes
- ✅ Dependency updates (major)
- ✅ Configuration changes

Do NOT update for:
- ❌ Code formatting changes
- ❌ Documentation updates (unless significant)
- ❌ Minor typo fixes
- ❌ Internal refactoring (without behavior changes)

### Changelog Format

Use the format from CHANGELOG.md:

```markdown
## [YYYY-MM-DD] - Brief Description

### Added
- New feature X
- New component Y

### Fixed
- Bug in Z component
- Issue with A functionality

### Changed
- Improved performance of B
- Updated C to use new pattern

### Removed
- Deprecated feature D
```

### Categories

- **Added**: New features, components, or functionality
- **Fixed**: Bug fixes and issue resolutions
- **Changed**: Changes to existing functionality
- **Removed**: Removed features or deprecations
- **Security**: Security-related updates
- **Performance**: Performance improvements
- **Database**: Database schema or migration changes

## 🔄 Development Workflow

1. **Before Making Changes**
   - Review existing code structure
   - Check if similar functionality exists
   - Read related documentation

2. **During Development**
   - Follow existing code patterns
   - Write clear, descriptive comments
   - Test changes thoroughly
   - Update types and interfaces

3. **After Making Changes**
   - **Update CHANGELOG.md** (REQUIRED)
   - Test in both light and dark mode
   - Verify responsive design
   - Check console for errors
   - Ensure TypeScript types are correct

## 🎨 Code Style Guidelines

### React Components
- Use functional components with hooks
- Implement proper TypeScript types
- Follow the established folder structure
- Use semantic HTML elements

### Styling
- Use Tailwind CSS semantic tokens (from index.css)
- Never hardcode colors (use design system variables)
- Ensure dark mode compatibility
- Follow responsive design principles

### Performance
- Lazy load components when appropriate
- Minimize re-renders with proper memoization
- Use React Query for data fetching
- Implement proper loading states

## 🔒 Security Best Practices

- Always validate user input
- Use RLS policies for database access
- Sanitize data before display
- Follow least privilege principle
- Log security-relevant events

## 📝 Commit Messages

Use clear, descriptive commit messages:

```
feat: Add vacation request approval workflow
fix: Resolve assignment date validation issue
perf: Optimize dashboard query performance
docs: Update changelog with latest changes
```

Prefixes:
- `feat`: New feature
- `fix`: Bug fix
- `perf`: Performance improvement
- `docs`: Documentation updates
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test updates
- `chore`: Build/tooling updates

## 🧪 Testing

Before submitting changes:
- [ ] Test in demo mode
- [ ] Test with different user roles
- [ ] Verify mobile responsiveness
- [ ] Check browser console for errors
- [ ] Test in both light and dark themes
- [ ] Verify database operations work correctly

## 🚀 Deployment

Changes are automatically deployed when merged to main. Ensure:
- All tests pass
- Changelog is updated
- Breaking changes are documented
- Database migrations are included (if needed)

## 📚 Additional Resources

- [Project README](./README.md)
- [Changelog](./CHANGELOG.md)
- [Security Documentation](./SECURITY.md)
- [Lovable Documentation](https://docs.lovable.dev)

---

**Remember**: Always update the CHANGELOG.md file before committing your changes!
