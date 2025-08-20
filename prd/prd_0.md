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
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid REFERENCES subjects(id),
  ord int NOT NULL,
  title text NOT NULL,
  description text,
  UNIQUE(subject_id, ord)
);

CREATE TABLE issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid REFERENCES topics(id),
  ord int NOT NULL,  -- explicit ordinality for the issue
  md_content text,
  status text NOT NULL DEFAULT 'draft',  -- 'draft'|'approved'|'sent'
  word_count int,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  subject_id uuid REFERENCES subjects(id),
  current_ord int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, subject_id)
);

CREATE TABLE deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid REFERENCES issues(id),
  recipient_id uuid REFERENCES users(id) NOT NULL,
  status text NOT NULL,   -- 'sent'|'failed'
  meta jsonb,
  sent_at timestamptz DEFAULT now(),
  UNIQUE(issue_id, recipient_id)
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
- [ ] Create tables: `subjects` , `topics` , `issues` , `users` , `subscriptions` , `deliveries`  (with the unique constraints we defined).
- [ ] Seed script: upsert `subjects('System Design')`  and `users(ADMIN_EMAIL)` .
## Syllabus
1. Implement LLM client wrapper (simple function to call model + return JSON).
2. Write `generateSyllabus`  script: create ordered topics (e.g., 150) for System Design → insert into `topics` .
3. (Optional) Add embeddings backfill + simple duplicate check; log potential near-dupes.
## Newsletter
1. Implement `generateIssue(topicId)` : call newsletter prompt, save Markdown to `issues`  with `ord = topics.ord` .
2. Implement `validateIssue(markdown)` : check sections + length; return pass/fail + errors.
3. Implement `generateAndValidate(topicId)` : try generate → validate → retry up to 2 times → save final.
## Email
1. Add Postmark client + Markdown→HTML renderer; test a single send to `ADMIN_EMAIL` .
2. Implement `sendIssueToUser(issueId, userId)` : send email + insert into `deliveries`  (enforce unique `(issue_id, recipient_id)` ).
## Jobs / Scheduling
1. Set up BullMQ queues: `generate-issue`  and `send-issue`  workers.
2. Add daily cron handler (9am PT): pick next `ord` , ensure issue exists (generate if missing), send to `ADMIN_EMAIL` , mark `issues.status='sent'` .
## Subscriptions (pointer for your own drip)
1. Create/seed a `subscriptions`  row for `ADMIN_EMAIL`  + System Design with `current_ord = 0` .
2. Update cron to use subscription pointer: next_ord = `current_ord + 1` ; on successful send, increment `current_ord`  atomically.
## Admin UI (minimal)
1. `/admin/login`  (basic password) and cookie middleware to protect `/admin/*` .
2. `/admin/topics` : list topics with status; buttons: Generate/Regenerate, View Issue.
3. `/admin/issues/today` : show today’s ord, Generate if missing, **Send to me** button.
## Waitlist (landing)
1. `/`  landing with email input; `/api/waitlist`  inserts/upserts into `users(email, source='website')` .
## Health & Docs
1. `/api/health` : check DB + Redis; return `{ ok: true }` .
2. Update README with run commands: migrate, seed, generate syllabus, generate issue, run workers, run cron, admin login.


