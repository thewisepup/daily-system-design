# Database Architecture

## Overview
The application uses PostgreSQL as the primary database with Drizzle ORM for type-safe database operations. The database follows a normalized design optimized for the newsletter generation and delivery workflow.

## Technology Stack
- **Database**: PostgreSQL (hosted on Neon)
- **ORM**: Drizzle ORM with TypeScript
- **Migration Tool**: Drizzle Kit
- **Query Builder**: Drizzle's type-safe query builder
- **Connection**: PostgreSQL connection pooling

## Schema Design

### Core Tables

#### Users Table (`users`)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX user_email_idx ON users(email);
```

**Purpose**: Store waitlist signups and subscribers
**Fields**:
- `id`: Primary UUID identifier
- `email`: User's email address (unique)
- `createdAt`: Account creation timestamp

#### Subjects Table (`subjects`)
```sql
CREATE TABLE subjects (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

**Purpose**: Newsletter subjects (e.g., "System Design", "Algorithms")
**Current Data**: Single "System Design" subject for MVP

#### Topics Table (`topics`)
```sql
CREATE TABLE topics (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title TEXT NOT NULL,
  description TEXT,
  subject_id INTEGER NOT NULL REFERENCES subjects(id),
  sequence_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX topic_subject_idx ON topics(subject_id);
CREATE INDEX topic_sequence_idx ON topics(sequence_order);
CREATE INDEX topic_subject_sequence_idx ON topics(subject_id, sequence_order);
```

**Purpose**: Individual topics within a subject (150+ topics for System Design)
**Fields**:
- `sequenceOrder`: Defines the delivery order (1, 2, 3...)
- `subjectId`: Links to parent subject

#### Issues Table (`issues`)
```sql
CREATE TYPE issue_status AS ENUM ('generating', 'draft', 'approved', 'sent');

CREATE TABLE issues (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  topic_id INTEGER NOT NULL REFERENCES topics(id),
  title TEXT NOT NULL,
  content TEXT,
  status issue_status NOT NULL DEFAULT 'generating',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX issue_topic_idx ON issues(topic_id);
CREATE INDEX issue_status_idx ON issues(status);
CREATE INDEX issue_created_idx ON issues(created_at);
```

**Purpose**: Generated newsletter content for each topic
**Status Workflow**: generating → draft → approved → sent

#### Subscriptions Table (`subscriptions`)
```sql
CREATE TYPE subscription_status AS ENUM ('active', 'paused', 'cancelled');

CREATE TABLE subscriptions (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES users(id),
  subject_id INTEGER NOT NULL REFERENCES subjects(id),
  status subscription_status NOT NULL DEFAULT 'active',
  current_sequence INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX subscription_user_idx ON subscriptions(user_id);
CREATE INDEX subscription_subject_idx ON subscriptions(subject_id);
CREATE UNIQUE INDEX subscription_user_subject_unique ON subscriptions(user_id, subject_id);
```

**Purpose**: Track user subscriptions and progress through topic sequences
**Fields**:
- `currentSequence`: Tracks which topic number user should receive next

#### Deliveries Table (`deliveries`)
```sql
CREATE TYPE delivery_status AS ENUM ('pending', 'sent', 'failed', 'bounced');

CREATE TABLE deliveries (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  issue_id INTEGER NOT NULL REFERENCES issues(id),
  user_id UUID NOT NULL REFERENCES users(id),
  status delivery_status NOT NULL DEFAULT 'pending',
  external_id TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX delivery_issue_idx ON deliveries(issue_id);
CREATE INDEX delivery_user_idx ON deliveries(user_id);
CREATE INDEX delivery_status_idx ON deliveries(status);
CREATE INDEX delivery_sent_idx ON deliveries(sent_at);
```

**Purpose**: Track email delivery attempts and results
**Fields**:
- `externalId`: Email provider's message ID
- `errorMessage`: Failure reason if delivery failed

## Repository Pattern

### Structure
```
src/server/db/
├── index.ts           # Database client
├── schema/            # Table definitions
│   ├── users.ts
│   ├── subjects.ts
│   ├── topics.ts
│   ├── issues.ts
│   ├── subscriptions.ts
│   └── deliveries.ts
└── repo/              # Data access layer
    ├── userRepo.ts
    ├── subjectRepo.ts
    ├── topicRepo.ts
    ├── issueRepo.ts
    └── deliveryRepo.ts
```

### Repository Example
```typescript
// src/server/db/repo/userRepo.ts
export const userRepo = {
  async findById(id: string) {
    return db.query.users.findFirst({
      where: eq(users.id, id),
    });
  },

  async findByEmail(email: string) {
    return db.query.users.findFirst({
      where: eq(users.email, email),
    });
  },

  async create(data: { email: string }) {
    const [user] = await db.insert(users)
      .values(data)
      .returning();
    return user;
  },
};
```

## Configuration

### Drizzle Config (`drizzle.config.ts`)
```typescript
export default {
  schema: "./src/server/db/schema",
  dialect: "postgresql",
  dbCredentials: { url: env.DATABASE_URL },
  casing: "snake_case", // Auto-convert camelCase to snake_case
} satisfies Config;
```

### Environment Variables
```bash
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
```

## Migration Strategy

### Development
```bash
pnpm db:push    # Push schema changes directly
pnpm db:studio  # Open Drizzle Studio GUI
```

### Production
```bash
pnpm db:generate  # Generate migration files
pnpm db:migrate   # Apply migrations
```

## Indexes and Performance

### Query Optimization
- **Email lookups**: `user_email_idx` for fast user authentication
- **Topic ordering**: `topic_subject_sequence_idx` for newsletter sequence
- **Status filtering**: `issue_status_idx` for workflow queries
- **Delivery tracking**: `delivery_user_idx` and `delivery_status_idx`

### Foreign Key Constraints
All relationships enforced at database level:
- `topics.subject_id` → `subjects.id`
- `issues.topic_id` → `topics.id`
- `subscriptions.user_id` → `users.id`
- `subscriptions.subject_id` → `subjects.id`
- `deliveries.issue_id` → `issues.id`
- `deliveries.user_id` → `users.id`

## Data Flow

### Newsletter Generation Flow
1. **Syllabus Creation**: Topics inserted with `sequenceOrder`
2. **Content Generation**: Issues created with `status: 'generating'`
3. **Admin Approval**: Status updated to `approved`
4. **Email Delivery**: Delivery records track send attempts

### User Journey Flow
1. **Waitlist Signup**: User record created
2. **Subscription**: Subscription record links user to subject
3. **Daily Delivery**: Cron job finds next topic based on `currentSequence`
4. **Progress Tracking**: `currentSequence` incremented after successful delivery

## Backup and Recovery

### Automated Backups
- Neon provides automated daily backups
- Point-in-time recovery available
- Database branching for safe testing

### Manual Backup
```bash
pg_dump $DATABASE_URL > backup.sql
psql $DATABASE_URL < backup.sql
```

## Monitoring and Analytics

### Key Metrics Queries
```sql
-- User signups by day
SELECT DATE(created_at) as date, COUNT(*) as signups 
FROM users 
GROUP BY DATE(created_at) 
ORDER BY date DESC;

-- Newsletter generation status
SELECT status, COUNT(*) as count 
FROM issues 
GROUP BY status;

-- Email delivery success rate
SELECT status, COUNT(*) as count,
       ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM deliveries 
GROUP BY status;
```

## Future Scaling Considerations
- Read replicas for analytics queries
- Partitioning deliveries table by date
- Archival strategy for old delivery records
- Connection pooling optimization