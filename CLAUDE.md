# Daily System Design Newsletter - Claude Code Context

## Project Overview
AI-generated newsletter system for daily system design topics. This is Phase 0 MVP focused on validating the concept with a single subject (System Design) and single admin user.

## Tech Stack
- **Frontend**: Next.js 15 with React 19
- **Backend**: Next.js API routes
- **Database**: PostgreSQL with Drizzle ORM (Neon)
- **Authentication**: Basic Auth for admin
- **Email**: Postmark/Resend
- **LLM**: OpenAI/Claude for content generation
- **Jobs**: BullMQ with Redis for scheduling
- **Styling**: Tailwind CSS

## Key Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript checks
- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Drizzle Studio

## Project Structure
```
src/
├── app/                    # Next.js app router
│   ├── admin/             # Admin dashboard pages
│   ├── api/               # API routes
│   └── page.tsx           # Landing page with waitlist
├── server/
│   ├── api/               # tRPC routers
│   ├── db/                # Database schema and client
│   ├── jobs/              # BullMQ workers
│   ├── llm/               # LLM integration
│   └── email/             # Email service
└── lib/                   # Shared utilities
```

## Database Schema
Core tables:
- `subjects` - Newsletter subjects (System Design, etc.)
- `topics` - Individual topics within subjects (ordered)
- `issues` - Generated newsletter content
- `users` - Waitlist and subscribers
- `subscriptions` - User subscription to subjects with progress tracking
- `deliveries` - Email delivery logs

## Core Workflows
1. **Syllabus Generation**: Generate 150+ ordered topics for a subject
2. **Newsletter Generation**: Create markdown content for each topic with validation
3. **Daily Delivery**: Cron job (9am PT) to send next newsletter in sequence
4. **Admin Dashboard**: Review, approve, regenerate, and manually send newsletters

## Environment Variables Needed
- `DATABASE_URL` - Postgres connection string
- `REDIS_URL` - Redis for job queue
- `POSTMARK_TOKEN` - Email delivery
- `OPENAI_API_KEY` - Content generation
- `ADMIN_EMAIL` - Admin user email
- `ADMIN_PASSWORD` - Basic auth password

## Development Notes
- Use existing T3 stack patterns (tRPC, Drizzle)
- Keep schema extensible for future subjects
- All newsletters go through validation pipeline
- Admin dashboard uses basic auth for MVP
- Single admin user for Phase 0

## PRD Location
Full requirements in `prd/prd_0.md`