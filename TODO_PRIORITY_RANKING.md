# TODO Items - Priority Ranking

This document contains all TODO items found in the codebase, ranked by priority and value. Items are organized from **most critical** (should be done first) to **least critical** (can be deferred).

---

## 🔴 CRITICAL PRIORITY - Security & Data Integrity

### 1. **AWS SES Email Status Tracking** ⚠️ CRITICAL
**Location:** `src/server/email/providers/awsSes.ts:65`
```typescript
//TODO: IMPORTANT, we need to update status based on response status from send
```
**Why Critical:** Currently always returns "sent" status regardless of actual AWS SES response. This means:
- Failed emails are marked as sent
- No accurate delivery tracking
- Can't detect email delivery issues
- Billing/analytics will be incorrect

**Value:** **HIGHEST** - Core email functionality is broken without this. Affects all email delivery tracking.

**Estimated Effort:** Medium (2-4 hours)
- Parse AWS SES response status codes
- Map to DeliveryStatus enum
- Update delivery records accordingly

---

### 2. **Input Sanitization for Feedback** 🔒 SECURITY
**Location:** `src/server/services/FeedbackService.ts:19`
```typescript
//TODO: const sanitizedString = sanitzeInput(feedback);
```
**Why Critical:** User feedback is stored without sanitization, creating SQL injection and XSS risks.

**Value:** **HIGH** - Security vulnerability that could compromise data integrity.

**Estimated Effort:** Low (1-2 hours)
- Implement input sanitization function
- Sanitize feedback string before storing
- Consider using DOMPurify or similar library

---

### 3. **Email Validation Missing** ⚠️ DATA INTEGRITY
**Location:** `src/server/email/emailService.ts:40`
```typescript
//TODO: Add validation
```
**Why Critical:** `sendNewsletterEmail` doesn't validate input before creating delivery records. Could create invalid database entries.

**Value:** **HIGH** - Prevents bad data from entering the system.

**Estimated Effort:** Low (1 hour)
- Add Zod schema validation for EmailSendRequest
- Validate before creating delivery record

---

### 4. **Newsletter Message Tags Validation** ⚠️ DATA INTEGRITY
**Location:** `src/server/email/emailService.ts:235`
```typescript
//TODO: Add validation that all newsletter MessageTags are present.
```
**Why Critical:** Missing message tags break email analytics and tracking. Required tags include userId, subjectId, issueNumber.

**Value:** **HIGH** - Ensures proper email tracking and analytics.

**Estimated Effort:** Low (1-2 hours)
- Validate required tags exist before sending
- Throw error if missing required tags

---

## 🟠 HIGH PRIORITY - Core Functionality & Reliability

### 5. **Unsubscribe Confirmation Handler** 📧 EMAIL COMPLIANCE
**Location:** `src/app/api/webhook/ses-bounce/route.ts:80`
```typescript
// TODO: Helper function to handle unsubscribe confirmation
```
**Why Important:** Currently just logs unsubscribe confirmation. Should properly handle SNS unsubscribe events for compliance.

**Value:** **HIGH** - Email compliance requirement (CAN-SPAM, GDPR).

**Estimated Effort:** Medium (2-3 hours)
- Implement proper unsubscribe confirmation handling
- Update subscription status
- Log unsubscribe events

---

### 6. **Issue Service Caching Implementation** ⚡ PERFORMANCE
**Location:** `src/server/services/IssueService.ts:11-13`
```typescript
//TODO: we need to make this so that it is getSentIssueById
//TODO: do validation and caching
```
**Why Important:** Caching code is commented out. This method is likely called frequently and caching would improve performance significantly.

**Value:** **HIGH** - Performance optimization for frequently accessed data.

**Estimated Effort:** Medium (2-3 hours)
- Uncomment and fix caching logic
- Add proper validation
- Ensure cache invalidation on updates

---

### 7. **Issue Service Input Validation** ✅ DATA VALIDATION
**Location:** `src/server/services/IssueService.ts:36`
```typescript
//TODO: do input validation
```
**Why Important:** `getIssueSummaries` doesn't validate pagination parameters, could cause errors with invalid input.

**Value:** **MEDIUM-HIGH** - Prevents runtime errors from bad input.

**Estimated Effort:** Low (1 hour)
- Add Zod validation for pagination params
- Validate subjectId exists

---

### 8. **Newsletter Content Validation** ✅ CONTENT QUALITY
**Location:** `src/server/newsletter/generateNewsletter.ts:71`
```typescript
//TODO: add more validation here
```
**Why Important:** Generated newsletter content should be validated before saving to ensure quality and completeness.

**Value:** **MEDIUM-HIGH** - Ensures newsletter quality before sending.

**Estimated Effort:** Medium (2-3 hours)
- Add word count validation
- Validate content structure
- Check for required sections

---

### 9. **Newsletter Schema Validation Enhancement** ✅ CONTENT QUALITY
**Location:** `src/server/llm/schemas/newsletter.ts:3`
```typescript
// TODO: Dive deeper into validation - add word count, content quality, and structure validation
```
**Why Important:** Current validation only checks structure, not content quality. Should validate word counts, content completeness.

**Value:** **MEDIUM-HIGH** - Improves newsletter quality and consistency.

**Estimated Effort:** Medium (3-4 hours)
- Add word count validation per section
- Validate content quality metrics
- Add structure completeness checks

---

### 10. **Error Code Fix** 🐛 BUG FIX
**Location:** `src/server/api/routers/issue.ts:33`
```typescript
code: "BAD_REQUEST", //TODO: update to error code for resource not found
```
**Why Important:** Using wrong error code (BAD_REQUEST instead of NOT_FOUND) makes debugging harder and provides incorrect API semantics.

**Value:** **MEDIUM** - Improves API correctness and developer experience.

**Estimated Effort:** Low (5 minutes)
- Change to "NOT_FOUND"

---

### 11. **Newsletter Content Validation Update** ✅ DATA VALIDATION
**Location:** `src/server/newsletter/utils/newsletterUtils.ts:284`
```typescript
// TODO: Update validation to check contentJson instead of content
```
**Why Important:** Validation checks wrong field. Should validate contentJson which is the actual source of truth.

**Value:** **MEDIUM** - Ensures correct validation logic.

**Estimated Effort:** Low (30 minutes)
- Update validation to check contentJson

---

## 🟡 MEDIUM PRIORITY - Code Quality & Architecture

### 12. **Cache TTL Optimization** ⚡ PERFORMANCE
**Location:** `src/server/services/IssueService.ts:8-9`
```typescript
private GET_ISSUE_BY_ID_TTL = 12 * 60 * 60; //12 hours TODO: figure out more optimial TTL
private GET_ISSUES_SUMMARIES_TTL = 5 * 60; //5 min TODO: figure out more optimial TTL
```
**Why Important:** Current TTLs may not be optimal. Too short = unnecessary DB hits, too long = stale data.

**Value:** **MEDIUM** - Performance optimization, but current values are reasonable.

**Estimated Effort:** Low (1-2 hours)
- Analyze access patterns
- Test different TTL values
- Document rationale

---

### 13. **Raw Text Storage Optimization** 💾 STORAGE
**Location:** `src/server/newsletter/utils/newsletterUtils.ts:117`
```typescript
//TODO: We should store rawText in issues table and just do substitutions
```
**Why Important:** Currently regenerates text from contentJson each time. Storing rawText would be more efficient.

**Value:** **MEDIUM** - Performance optimization, but current approach works.

**Estimated Effort:** Medium (2-3 hours)
- Add rawText column to issues table
- Store rawText during generation
- Update to use stored rawText

---

### 14. **Delivery Repo Update Location** 🏗️ ARCHITECTURE
**Location:** `src/server/newsletter/utils/newsletterUtils.ts:238`
```typescript
//TODO: figure out if updating deliver repo here is a good idea for error handling
```
**Why Important:** Need to determine if error handling should update delivery repo or if it should be handled elsewhere.

**Value:** **MEDIUM** - Architecture clarity, but current implementation works.

**Estimated Effort:** Low (1 hour)
- Review error handling flow
- Decide on best location
- Refactor if needed

---

### 15. **Transactional Email Validation** ✅ DATA VALIDATION
**Location:** `src/server/email/emailService.ts:599`
```typescript
//TODO: ADD other validation here
```
**Why Important:** Should add more comprehensive validation for transactional emails beyond just tags.

**Value:** **MEDIUM** - Improves data quality but current validation is sufficient.

**Estimated Effort:** Low (1-2 hours)
- Add email format validation
- Validate required fields
- Check email length limits

---

### 16. **Mass Transactional Email Method** 📧 FEATURE
**Location:** `src/server/email/emailService.ts:217`
```typescript
//TODO: we need another method to sendMassTransactionalEmail
```
**Why Important:** Currently only have `sendMarketingCampaign`. May need separate method for transactional emails.

**Value:** **MEDIUM** - Feature enhancement, but current method may be sufficient.

**Estimated Effort:** Medium (3-4 hours)
- Determine if separate method needed
- Implement if required
- Add tests

---

### 17. **Zod Schema Export for Statistics** 📊 TYPE SAFETY
**Location:** `src/server/api/routers/user.ts:88`
```typescript
//TODO: Create getSignUpStatsics ZOD object, and export it to @StaticsCard.tsx to define response types
```
**Why Important:** Improves type safety by sharing Zod schema between backend and frontend.

**Value:** **MEDIUM** - Type safety improvement, but current approach works.

**Estimated Effort:** Low (1 hour)
- Create Zod schema
- Export from router
- Import in frontend component

---

### 18. **User Service Migration Method** 🔄 REFACTORING
**Location:** `src/server/services/UserService.ts:38`
```typescript
//TODO: we need a different method because this it as system_migration in audit table
```
**Why Important:** Current method logs as system_migration in audit table, may need separate method for actual migrations.

**Value:** **MEDIUM** - Code clarity, but current implementation works.

**Estimated Effort:** Low (1-2 hours)
- Create separate migration method
- Update audit logging
- Refactor existing calls

---

### 19. **Subscription Service Refactoring** 🏗️ ARCHITECTURE
**Location:** `src/server/services/SubscriptionService.ts:202`
```typescript
* @todo Move to a SubscriptionUtils class
```
**Why Important:** Code organization improvement. Moving utility functions to separate class improves maintainability.

**Value:** **MEDIUM** - Code organization, but current structure is acceptable.

**Estimated Effort:** Medium (2-3 hours)
- Create SubscriptionUtils class
- Move utility functions
- Update references

---

### 20. **User Repo Cleanup** 🧹 REFACTORING
**Location:** `src/server/db/repo/userRepo.ts:256`
```typescript
//TODO: remove user from newsletter. Either add to subscriptions table or add field to users
```
**Why Important:** Need to clarify how user removal from newsletter should work - via subscriptions table or users table.

**Value:** **MEDIUM** - Architecture clarity, but current approach works.

**Estimated Effort:** Low (1 hour)
- Decide on approach
- Implement removal logic
- Update documentation

---

## 🟢 LOW PRIORITY - Future Enhancements & Nice-to-Haves

### 21. **Generate Newsletter Button** 🎨 UI FEATURE
**Location:** `src/app/_components/TopicsList.tsx:13`
```typescript
// TODO: add a button to generate a newsletter for a topic
```
**Why Important:** UI enhancement to allow generating newsletters directly from topics list.

**Value:** **LOW-MEDIUM** - UX improvement, but can be done via admin panel.

**Estimated Effort:** Low (1-2 hours)
- Add button component
- Wire up to newsletter generation endpoint
- Add loading/error states

---

### 22. **LLM Client Architecture** 🏗️ ARCHITECTURE
**Location:** `src/server/llm/client.ts:3`
```typescript
//TODO: Figure out if we want this to just be light layer that makes the call to an LLM? we want this to be extensible to call OpenAI, Claude,
```
**Why Important:** Architecture decision for LLM abstraction layer. Currently stubbed.

**Value:** **LOW-MEDIUM** - Important for future, but current implementation is placeholder.

**Estimated Effort:** High (4-6 hours)
- Design abstraction layer
- Implement provider pattern
- Add OpenAI/Claude providers

---

### 23. **LLM Client Implementation** 🔧 IMPLEMENTATION
**Location:** `src/server/llm/client.ts:6`
```typescript
// TODO: Replace with actual LLM API call (OpenAI/Claude)
```
**Why Important:** Currently stubbed. Need actual LLM integration.

**Value:** **LOW-MEDIUM** - Core feature, but seems to be working via other means currently.

**Estimated Effort:** High (4-6 hours)
- Implement OpenAI API integration
- Add error handling
- Add retry logic

---

### 24. **Syllabus Prompt Type Safety** 📝 TYPE SAFETY
**Location:** `src/server/llm/prompts.ts/syllabusPrompt.ts:1`
```typescript
//TODO: Pass TopicsResponseResponse Zod type into the prompt itself alongside the description for AI
```
**Why Important:** Type safety improvement for AI prompt generation.

**Value:** **LOW** - Nice-to-have type safety improvement.

**Estimated Effort:** Low (1 hour)
- Pass Zod schema to prompt
- Update prompt template

---

### 25. **Seed Configuration** 🌱 DEVELOPMENT
**Location:** `seed/config/environments.ts:26`
```typescript
// TODO: Add configs to seed subscriptions and other data
```
**Why Important:** Development/testing convenience. Not critical for production.

**Value:** **LOW** - Development tooling improvement.

**Estimated Effort:** Medium (2-3 hours)
- Add subscription seeding config
- Add other data seeding configs
- Update seed scripts

---

### 26. **Subscription Generator Implementation** 🌱 DEVELOPMENT
**Location:** `seed/generators/SubscriptionGenerator.ts:22,42`
```typescript
// TODO: Implement subscription generation
// TODO: Implement actual subscription creation logic
```
**Why Important:** Development/testing tool. Not critical for production.

**Value:** **LOW** - Development tooling.

**Estimated Effort:** Medium (2-3 hours)
- Implement subscription generation logic
- Add to seed scripts

---

### 27. **Post Router Database Persistence** 🗄️ FEATURE
**Location:** `src/server/api/routers/post.ts:16,26`
```typescript
// TODO: persist to database
// TODO: get from database
```
**Why Important:** Post router seems incomplete. May be placeholder or future feature.

**Value:** **LOW** - Unclear if this is needed.

**Estimated Effort:** Medium (2-3 hours)
- Determine if post feature needed
- Implement if required
- Add database schema

---

### 28. **Terraform Code Smell** 🏗️ INFRASTRUCTURE
**Location:** `infra/main.tf:70`
```typescript
//TODO: Code smell, we're coupling ses publish policy with sns topic creation.
```
**Why Important:** Infrastructure code organization. Current implementation works but could be cleaner.

**Value:** **LOW** - Code quality improvement, but functional.

**Estimated Effort:** Medium (2-3 hours)
- Decouple SES policy from SNS topic
- Refactor Terraform modules
- Test deployment

---

### 29. **Terraform Feature Enablement** 🔧 INFRASTRUCTURE
**Location:** `infra/main.tf:661`
```typescript
#TODO: figure out how to enable this
```
**Why Important:** Unclear what feature needs enabling. May be important or may be obsolete.

**Value:** **LOW** - Unclear requirement.

**Estimated Effort:** Unknown
- Determine what needs enabling
- Research solution
- Implement if needed

---

### 30. **Advertiser Slot Decision** 📋 DESIGN
**Location:** `advertiser.md:73`
```typescript
- slot (TODO: figure out if we want slot in adReservation or adInstance)
```
**Why Important:** Design decision for advertiser feature. Not critical until advertiser feature is implemented.

**Value:** **LOW** - Design decision for future feature.

**Estimated Effort:** Low (1 hour)
- Review advertiser schema
- Make design decision
- Update documentation

---

### 31. **Update Company Component** 🎨 UI
**Location:** `src/app/admin/ads/_components/CompanyManagement/UpdateCompany.tsx:11`
```typescript
<AlertTitle>TODO</AlertTitle>
```
**Why Important:** UI placeholder. Needs proper implementation.

**Value:** **LOW** - UI polish for advertiser feature.

**Estimated Effort:** Low (1-2 hours)
- Implement proper alert title
- Complete component implementation

---

## Summary by Priority

### 🔴 Critical (Do First)
1. AWS SES Email Status Tracking
2. Input Sanitization for Feedback
3. Email Validation Missing
4. Newsletter Message Tags Validation

### 🟠 High Priority (Do Soon)
5. Unsubscribe Confirmation Handler
6. Issue Service Caching Implementation
7. Issue Service Input Validation
8. Newsletter Content Validation
9. Newsletter Schema Validation Enhancement
10. Error Code Fix
11. Newsletter Content Validation Update

### 🟡 Medium Priority (Do When Time Permits)
12-20. Various code quality, architecture, and validation improvements

### 🟢 Low Priority (Future/Backlog)
21-31. UI enhancements, future features, development tooling

---

## Recommended Action Plan

### Week 1: Critical Fixes
1. Fix AWS SES status tracking (Item #1)
2. Add input sanitization (Item #2)
3. Add email validation (Item #3)
4. Add message tags validation (Item #4)

### Week 2: High Priority
5. Implement unsubscribe handler (Item #5)
6. Fix issue service caching (Item #6)
7. Add input validations (Items #7, #8, #9)
8. Fix error codes (Item #10)

### Week 3+: Medium & Low Priority
- Tackle medium priority items as time permits
- Low priority items can be added to backlog

---

## Notes

- **Total TODOs Found:** 31 items
- **Critical Items:** 4
- **High Priority Items:** 8
- **Medium Priority Items:** 9
- **Low Priority Items:** 10

**Estimated Total Effort:** ~60-80 hours for all items
**Critical Path Effort:** ~10-15 hours (must-do items)

