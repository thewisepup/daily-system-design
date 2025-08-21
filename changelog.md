# Changelog

## 2025-08-20

### Added
- Prompts for newsletter and syllabus generation
- High-level thinking mode for LLM requests  
- Admin authentication to routes and /admin page
- Topics generation workflow
- Database tables: deliveries, issues, subscriptions
- Topics and subjects schema files
- Users repository and tRPC route
- Best practices documentation in CLAUDE.md for T3 App patterns
- Stubbed posts router
- Users table migration

### Changed
- Upgraded to GPT-5 with increased reasoning effort and higher completion tokens
- Updated logs to output response details
- Refactored components structure
- Updated users schema to non-deprecated Drizzle ORM implementation
- Cleaned up state management in waitlist page
- Updated Drizzle configuration

### Fixed
- Linting issues in generateTopics method
- Various code cleanup and optimization

### Technical Details
- Implemented separation of concerns between tRPC procedures and database queries
- Added repository pattern for database operations
- Enhanced schema definitions following Drizzle ORM best practices
- Integrated OpenAI API for syllabus generation
- Set up proper database schema with foreign key relationships