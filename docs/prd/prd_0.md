# 📄 Product Requirements Document (PRD)
**Product:** AI-Generated Newsletter (Phase 0)
 **Owner:** You
 **Goal:** Validate the system design newsletter concept end-to-end: from generating topics → daily newsletter → validation → sending → reviewing via a simple admin dashboard → collecting emails for launch.

---

## 1. Objectives
- ✅ Validate AI-generated newsletters can be produced consistently and at quality.
- ✅ Establish a workflow: syllabus → daily topic → newsletter generation → validation → approval → email delivery.
- ✅ Collect a waitlist before launch.
- ✅ Keep schema and codebase extensible for future subjects (DS&A, CI/CD, history, science, etc.).
---

## 2. Phase 0 Scope
### 2.1 Subjects
- Add a **subjects table** to support multiple syllabus tracks.
- Example: `System Design` , `Data Structures & Algorithms` , `CI/CD` .
- Topics belong to a subject.
---

### 2.2 Syllabus Generator (Topics)
- Script generates a **syllabus of topics** for a subject.
- Ordered list of >300 topics (atomic concepts, 1 per day).
- Stored in DB: `topics(subject_id, ord, title, description)` .
- Deduplication handled by prompt engineering + embedding similarity checks.
---

### 2.3 Newsletter Generator (Content)
- Script takes a `topic`  and generates a **full newsletter in Markdown** using a structured prompt.
- Stored in DB: `issues(topic_id, ord, md_content, status)` .
- Multiple regenerations possible for the same topic.
---

### 2.4 Newsletter Validation
- Every generated newsletter passes through a **validation step**:
    - ✅ Sections exist (`Intro` , `Concept Breakdown` , `Trade-offs` , `Real-world Examples` ).
    - ✅ Word count ~1,500–2,000.
    - ✅ No placeholders (e.g., “TODO”).
    - ✅ Consistent voice and formatting.
- If validation fails → regenerate automatically or flag in Admin Dashboard.
---

### 2.5 Daily Email Sender
- Cron job runs daily at 9am PT.
- Picks today’s `ord`  for the test user (later, per-user via subscriptions).
- If issue missing → auto-generate, validate, store, send.
- Logs delivery in `deliveries` .
---

### 2.6 Admin Dashboard
- Minimal Next.js admin page (basic auth).
- Features:
    - View all topics (`ord` , title, status).
    - View today’s issue.
    - **Send-to-me button** (re-trigger email delivery for self-testing).
    - Approve/reject newsletters.
    - Regenerate or delete issues.
---

### 2.7 Waitlist
- Landing page with signup form.
- Stores emails in `users` .
- MVP: no drip sequence, only collection.
---

### 2.8 Subscriptions
- Each user subscribes to a subject.
- Keeps track of **ordinality** (what “day” of the newsletter they’re on).
- For MVP: only you as subscriber.
---

## 3. Out of Scope (Future Phases)
- Multi-subject support beyond System Design.
- Adaptive skill-level quizzes.
- Paid subscriptions.
- Multi-user drip scheduling.
- Projects, badges, or gamification.
---

## 4. Technical Design
### 4.1 Stack
- **Frontend**: Next.js (Vercel).
- **Backend**: Next.js API routes + Neon/Postgres.
- **Auth**: Basic Auth.
- **Jobs**: BullMQ or Vercel Cron + Upstash Redis.
- **Email**: Postmark / Resend / AWS SES.
- **LLM**: OpenAI or Claude.
---

### 4.2 DB Schema (Phase 0, updated)
```sql
CREATE TABLE subjects (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE topics (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title text NOT NULL,
  description text,
  subject_id integer NOT NULL REFERENCES subjects(id),
  sequence_order integer NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TYPE issue_status AS ENUM ('generating', 'draft', 'approved', 'sent');

CREATE TABLE issues (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  topic_id integer NOT NULL REFERENCES topics(id),
  title text NOT NULL,
  content text,
  status issue_status NOT NULL DEFAULT 'generating',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz,
  approved_at timestamptz,
  sent_at timestamptz
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TYPE subscription_status AS ENUM ('active', 'paused', 'cancelled');

CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  subject_id integer NOT NULL REFERENCES subjects(id),
  status subscription_status NOT NULL DEFAULT 'active',
  current_topic_sequence integer NOT NULL DEFAULT 0,
  is_waitlist boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  activated_at timestamptz,
  paused_at timestamptz,
  cancelled_at timestamptz
);

CREATE TYPE delivery_status AS ENUM ('pending', 'sent', 'delivered', 'failed', 'bounced');

CREATE TABLE deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id integer NOT NULL REFERENCES issues(id),
  user_id uuid NOT NULL REFERENCES users(id),
  status delivery_status NOT NULL DEFAULT 'pending',
  external_id text,
  error_message text,
  created_at timestamptz DEFAULT now() NOT NULL,
  sent_at timestamptz,
  delivered_at timestamptz
);
```
---

### 4.3 Core Scripts
1. **Generate Syllabus** → insert into `topics` .
2. **Generate Newsletter** → insert into `issues`  after validation.
3. **Daily Email Sender** → selects next issue, generates if missing, logs in `deliveries` .
---

### 4.4 Admin Dashboard (Pages)
- `/admin/topics`  → list all topics.
- `/admin/issues/today`  → view today’s issue.
- **Send-to-me** button → resend via email pipeline.
- Approve/regenerate/delete issue actions.
---

## 5. Success Metrics
- ✅ Syllabus seeded (>150 topics).
- ✅ Newsletter generated and validated successfully.
- ✅ Daily cron delivers email to you.
- ✅ Deliveries logged with uniqueness constraint.
- ✅ Admin dashboard can approve + resend.
- ✅ Waitlist collects emails.
---

## 6. Timeline (Phase 0 MVP)
- Day 1–2: Waitlist + DB schema.
- Day 3: Syllabus script + seed DB.
- Day 4–5: Newsletter generator + validator.
- Day 6: Daily cron + email pipeline.
- Day 7: Admin dashboard + send-to-me.
- ✅ End of week: test daily emails.




## Setup
- [x] Initialize Next.js + TypeScript repo; add ESLint/Prettier; create `.env.example` .
- [x] Add config loader (`/server/config.ts` ) validating env vars (DB url, Postmark token, Redis url, OpenAI key, ADMIN_EMAIL).
## Database
- [x] Add Drizzle + Postgres client; set up `drizzle.config.ts`  and migration scripts.
- [x] Create tables: `subjects` , `topics` , `issues` , `users` , `subscriptions` , `deliveries`  (with the unique constraints we defined).
- [ ] Seed script: upsert `subjects('System Design')`  and `users(ADMIN_EMAIL)` .
## Syllabus
- [x] Implement LLM client wrapper (simple function to call model + return JSON).
- [x] Write `generateSyllabus`  script: create ordered topics (e.g., 150) for System Design → insert into `topics` .
- [ ] (Optional) Add embeddings backfill + simple duplicate check; log potential near-dupes.
## Newsletter
- [x] Implement `generateIssue(topicId)` : call newsletter prompt, save Markdown to `issues`  with `ord = topics.ord` .
- [ ] Implement `validateIssue(markdown)` : check sections + length; return pass/fail + errors.
- [x] Implement `generateAndValidate(topicId)` : try generate → validate → retry up to 2 times → save final.
## Email
- [ ] Add Postmark client + Markdown→HTML renderer; test a single send to `ADMIN_EMAIL` .
- [ ] Implement `sendIssueToUser(issueId, userId)` : send email + insert into `deliveries`  (enforce unique `(issue_id, recipient_id)` ).
## Jobs / Scheduling
- [ ] Set up BullMQ queues: `generate-issue`  and `send-issue`  workers.
- [ ] Add daily cron handler (9am PT): pick next `ord` , ensure issue exists (generate if missing), send to `ADMIN_EMAIL` , mark `issues.status='sent'` .
## Subscriptions (pointer for your own drip)
- [ ] Create/seed a `subscriptions`  row for `ADMIN_EMAIL`  + System Design with `current_ord = 0` .
- [ ] Update cron to use subscription pointer: next_ord = `current_ord + 1` ; on successful send, increment `current_ord`  atomically.
## Admin UI (minimal)
- [x] `/admin/login`  (JWT auth) and middleware to protect `/admin/*` .
- [x] `/admin/topics` : topics management with Generate/Delete buttons (partial implementation).
- [ ] `/admin/issues/today` : show today's ord, Generate if missing, **Send to me** button.
## Waitlist (landing)
- [X] `/`  landing with email input; `/api/waitlist`  inserts/upserts into `users(email, source='website')` .
## Health & Docs
- [ ] `/api/health` : check DB + Redis; return `{ ok: true }` .
- [ ] Update README with run commands: migrate, seed, generate syllabus, generate issue, run workers, run cron, admin login.


