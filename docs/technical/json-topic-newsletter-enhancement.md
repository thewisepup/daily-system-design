# Enhanced Topic & Newsletter JSON Storage Implementation Plan

## Overview
Transform the system to store complete topic data as JSON in topics table and structured newsletter content as JSON in issues table. Starting fresh with new structure (deleting existing topics/issues).

## Database Schema Changes

### 1. Topics Table Update
**File**: `src/server/db/schema/topics.ts`
- Replace `description: text()` with `topicData: json().notNull()`
- JSON structure will contain:
```json
{
  "sequenceOrder": 1,
  "title": "Load Balancing Fundamentals",
  "description": "Understanding how to distribute traffic across multiple servers...",
  "learningObjective": "Explain different load balancing strategies and their trade-offs",
  "exampleFocus": "Netflix's load balancing architecture",
  "commonPitfalls": "Not considering sticky sessions and health checks"
}
```

### 2. Issues Table Update  
**File**: `src/server/db/schema/issues.ts`
- Change `content: text()` to `content: json()`
- Will store structured newsletter JSON matching prompt output format

## Topic Generation Enhancement

### 3. Update Topic Schema
**File**: `src/server/llm/schemas/topics.ts`
- Enhance `TopicResponseSchema` to include:
  - `learningObjective: z.string()`
  - `exampleFocus: z.string()`  
  - `commonPitfalls: z.string()`

### 4. Update Syllabus Prompt
**File**: `src/server/llm/prompts.ts/syllabusPrompt.ts`
- Modify prompt to generate all 5 fields per topic
- Add batch tracking logic to prevent duplicates across batches
- Include prior titles array insertion point

### 5. Batch Generation Logic
**File**: `src/server/subject/generateTopics.ts`
- Generate 365 topics in batches (~50 per batch = 7-8 batches)
- Track previously generated titles between batches
- Store complete JSON object in `topicData` column
- Remove description field mapping (now in JSON)

## Newsletter Generation Enhancement

### 6. Create Newsletter Schema
**File**: `src/server/llm/schemas/newsletter.ts` (new)
- Define `NewsletterResponseSchema` matching prompt output structure
- Include all sections: introduction, overview, concept, tradeoffs, applications, example, commonPitfalls, faq, keyTakeaways

### 7. Update Newsletter Prompt
**File**: `src/server/llm/prompts.ts/newsletterPrompt.ts`  
- Accept complete topic JSON object as input
- Reference specific fields (learningObjective, exampleFocus, commonPitfalls)
- Ensure output matches NewsletterResponseSchema

### 8. Newsletter Generation Update
**File**: `src/server/llm/requests/generateNewsletter.ts`
- Add structured output with zodResponseFormat
- Return parsed JSON instead of string
- Use new newsletter schema for validation

## Repository Updates

### 9. Topic Repository
**File**: `src/server/db/repo/topicRepo.ts`
- Update create/createMany methods to accept topicData JSON
- Remove description parameter, use JSON structure
- Add helper methods to extract data from JSON

### 10. Issue Repository  
**File**: `src/server/db/repo/issueRepo.ts`
- Update content field type handling for JSON
- Add type safety for structured newsletter content

## Email Template Enhancement

### 11. Newsletter Template Update
**File**: `src/server/email/templates/newsletterTemplate.ts`
- Parse JSON newsletter content from issues.content  
- Create HTML structure for each newsletter section
- Handle FAQ array and key takeaways bullets
- Maintain styling and responsive design

## Generation Workflow Update

### 12. Newsletter Generation Service
**File**: `src/server/newsletter/generateNewsletter.ts`
- Extract topic data from JSON column
- Pass complete topic object to newsletter prompt
- Store structured JSON response in issues.content

## Implementation Steps
1. Update database schemas (topics.topicData, issues.content as json)
2. Enhance topic generation (schema, prompt, batch processing)  
3. Create newsletter schema and update generation
4. Update email templates for JSON parsing
5. Update repositories for new JSON structures
6. Test complete workflow end-to-end

## Files to Create
- `src/server/llm/schemas/newsletter.ts`

## Files to Modify
- `src/server/db/schema/topics.ts`
- `src/server/db/schema/issues.ts` 
- `src/server/llm/schemas/topics.ts`
- `src/server/llm/prompts.ts/syllabusPrompt.ts`
- `src/server/llm/prompts.ts/newsletterPrompt.ts`
- `src/server/llm/requests/generateNewsletter.ts`
- `src/server/subject/generateTopics.ts`
- `src/server/newsletter/generateNewsletter.ts`
- `src/server/db/repo/topicRepo.ts`
- `src/server/db/repo/issueRepo.ts`
- `src/server/email/templates/newsletterTemplate.ts`

This plan will create a comprehensive JSON-based topic and newsletter system with enhanced metadata and structured content storage.