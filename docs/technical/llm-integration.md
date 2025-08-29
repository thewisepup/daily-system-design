# LLM Integration

## Overview
The application uses Large Language Models for automated content generation, specifically OpenAI's GPT-5 for creating syllabus topics and newsletter content. The LLM integration is designed for high-quality, structured content generation with proper error handling and validation.

## Architecture

### LLM Service Structure
```
src/server/llm/
├── client.ts              # LLM client initialization
├── types.ts              # TypeScript interfaces
├── providers/            # Different LLM providers
│   ├── openai.ts        # OpenAI GPT implementation
│   └── claude.ts        # Anthropic Claude (future)
├── requests/             # Specific LLM requests
│   ├── generateSyllabus.ts
│   └── generateNewsletter.ts
├── prompts.ts/           # Prompt templates
│   ├── syllabusPrompt.ts
│   └── newsletterPrompt.ts
└── schemas/              # Response validation
    ├── topics.ts
    └── newsletter.ts
```

## LLM Providers

### OpenAI GPT-5 Provider
**Current Implementation**: Primary LLM provider for content generation

```typescript
// src/server/llm/providers/openai.ts
import OpenAI from "openai";
import { env } from "~/env";

const client = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export async function generateContent(request: LLMRequest): Promise<string> {
  const completion = await client.chat.completions.create({
    model: request.options?.model ?? "gpt-5",
    reasoning_effort: "high",
    messages: [
      {
        role: "user",
        content: request.prompt,
      },
    ],
  });

  return completion.choices[0]?.message?.content ?? "";
}
```

**Configuration**:
- **Model**: GPT-5 with high reasoning effort
- **Temperature**: Default (balanced creativity/consistency)
- **Max Tokens**: Configurable per request type
- **Timeout**: 60 seconds for complex generation

### Future Providers
- **Anthropic Claude**: Alternative provider for content diversity
- **Local Models**: Open-source alternatives for cost optimization
- **Multi-Provider**: Fallback system for reliability

## Content Generation Types

### Syllabus Generation (`generateSyllabus.ts`)
**Purpose**: Generate 150+ ordered topics for System Design subject

```typescript
export async function generateSyllabus(subject: string): Promise<Topic[]> {
  const prompt = syllabusPrompt(subject);
  
  const completion = await client.chat.completions.create({
    model: "gpt-5",
    reasoning_effort: "high",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  const parsed = JSON.parse(content);
  
  // Validate response structure
  const validated = TopicsArraySchema.parse(parsed);
  
  return validated.topics;
}
```

**Prompt Strategy**:
- Detailed subject requirements and scope
- Specific formatting instructions (JSON output)
- Learning progression from basics to advanced
- Industry-relevant topics and practical applications

### Newsletter Generation (`generateNewsletter.ts`)
**Purpose**: Create detailed newsletter content for individual topics

```typescript
export async function generateNewsletter(request: LLMRequest): Promise<string> {
  try {
    const completion = await client.chat.completions.create({
      model: request.options?.model ?? "gpt-5",
      reasoning_effort: "high",
      messages: [
        {
          role: "user",
          content: request.prompt,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content returned from LLM");
    }

    return content;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Newsletter generation failed: ${error.message}`);
    }
    throw new Error("Newsletter generation failed with unknown error");
  }
}
```

## Prompt Engineering

### Syllabus Prompt Template (`prompts.ts/syllabusPrompt.ts`)
```typescript
export function syllabusPrompt(subject: string): string {
  return `
You are an expert curriculum designer creating a comprehensive learning syllabus for ${subject}.

Requirements:
- Generate exactly 150 topics ordered from beginner to advanced
- Each topic should be specific and actionable
- Topics should build upon previous knowledge
- Include both theoretical concepts and practical applications
- Cover all major areas within ${subject}

Output Format:
Return a JSON object with this exact structure:
{
  "topics": [
    {
      "sequenceOrder": 1,
      "title": "Introduction to System Design",
      "description": "Overview of system design principles and methodology"
    },
    // ... continue for all 150 topics
  ]
}

Focus Areas for ${subject}:
1. Fundamental concepts and principles
2. Core components and architecture patterns
3. Scalability and performance considerations
4. Real-world case studies and applications
5. Advanced topics and emerging trends

Generate comprehensive, industry-relevant topics that provide a complete learning path.
`;
}
```

### Newsletter Prompt Template (`prompts.ts/newsletterPrompt.ts`)
```typescript
export function newsletterPrompt(topic: Topic): string {
  return `
You are writing a daily newsletter for software engineers learning ${topic.title}.

Topic Details:
- Title: ${topic.title}
- Description: ${topic.description}
- Sequence: Topic #${topic.sequenceOrder} in the System Design curriculum

Content Requirements:
1. Write in an engaging, conversational tone
2. Include practical examples and code snippets where relevant
3. Explain concepts clearly for intermediate developers
4. Add real-world applications and use cases
5. Keep content focused and actionable (800-1200 words)
6. Use markdown formatting for structure

Structure:
# ${topic.title}

## Overview
Brief introduction to the topic and its importance

## Key Concepts
Main concepts explained with examples

## Real-World Applications
How this applies in practice with specific examples

## Implementation Considerations
Practical tips and best practices

## Next Steps
What to explore next or how to apply this knowledge

Write compelling content that helps engineers understand and apply ${topic.title} in their work.
`;
}
```

## Response Validation

### Topic Schema Validation (`schemas/topics.ts`)
```typescript
import { z } from "zod";

export const TopicSchema = z.object({
  sequenceOrder: z.number().int().positive(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(500),
});

export const TopicsArraySchema = z.object({
  topics: z.array(TopicSchema).length(150), // Exactly 150 topics
});

export type Topic = z.infer<typeof TopicSchema>;
export type TopicsArray = z.infer<typeof TopicsArraySchema>;
```

### Newsletter Schema Validation (`schemas/newsletter.ts`)
```typescript
export const NewsletterSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(100), // Minimum content length
  wordCount: z.number().min(800).max(1200), // Target word count
  hasMarkdown: z.boolean(), // Verify markdown formatting
});

export type Newsletter = z.infer<typeof NewsletterSchema>;
```

## Content Quality Control

### Pre-Generation Validation
```typescript
export async function generateTopicsWithValidation(subject: string): Promise<Topic[]> {
  // 1. Validate input
  if (!subject || subject.length < 3) {
    throw new Error("Invalid subject provided");
  }

  // 2. Generate content
  const topics = await generateSyllabus(subject);

  // 3. Validate output structure
  const validation = TopicsArraySchema.safeParse({ topics });
  if (!validation.success) {
    throw new Error(`Invalid topic structure: ${validation.error.message}`);
  }

  // 4. Content quality checks
  const qualityChecks = validateTopicQuality(topics);
  if (!qualityChecks.passed) {
    throw new Error(`Quality validation failed: ${qualityChecks.errors.join(", ")}`);
  }

  return topics;
}
```

### Post-Generation Quality Checks
```typescript
function validateTopicQuality(topics: Topic[]): QualityCheckResult {
  const errors: string[] = [];

  // Check for duplicate titles
  const titles = new Set();
  topics.forEach(topic => {
    if (titles.has(topic.title)) {
      errors.push(`Duplicate title: ${topic.title}`);
    }
    titles.add(topic.title);
  });

  // Check sequence order
  topics.forEach((topic, index) => {
    if (topic.sequenceOrder !== index + 1) {
      errors.push(`Invalid sequence order: ${topic.sequenceOrder} at position ${index}`);
    }
  });

  // Check content quality
  const shortDescriptions = topics.filter(topic => topic.description.length < 20);
  if (shortDescriptions.length > 5) {
    errors.push(`Too many short descriptions: ${shortDescriptions.length}`);
  }

  return {
    passed: errors.length === 0,
    errors,
  };
}
```

## Error Handling and Retry Logic

### Robust Error Handling
```typescript
export async function generateWithRetry<T>(
  generator: () => Promise<T>,
  maxAttempts: number = 3
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await generator();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");
      
      console.warn(`Generation attempt ${attempt} failed:`, lastError.message);
      
      if (attempt < maxAttempts) {
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Generation failed after ${maxAttempts} attempts: ${lastError.message}`);
}
```

### Rate Limiting
```typescript
class LLMRateLimiter {
  private requests: Date[] = [];
  private readonly maxRequests = 10;
  private readonly timeWindow = 60000; // 1 minute

  async throttle(): Promise<void> {
    const now = new Date();
    
    // Remove old requests outside time window
    this.requests = this.requests.filter(
      request => now.getTime() - request.getTime() < this.timeWindow
    );

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0]!;
      const waitTime = this.timeWindow - (now.getTime() - oldestRequest.getTime());
      
      console.log(`Rate limit reached, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.requests.push(now);
  }
}
```

## Business Integration

### Topics Generation Workflow
1. **Admin Trigger**: Admin clicks "Generate Topics" in dashboard
2. **API Call**: `api.topics.generate.useMutation()` calls tRPC endpoint
3. **LLM Request**: Server calls `generateSyllabus()` with subject
4. **Content Validation**: Validate structure and quality
5. **Database Storage**: Store topics with sequence order
6. **UI Update**: Refresh topics list in admin interface

### Newsletter Generation Workflow
1. **Topic Selection**: Admin selects topic for newsletter generation
2. **Content Check**: Verify no existing newsletter for topic
3. **LLM Request**: Generate newsletter content using topic prompt
4. **Content Processing**: Validate markdown and word count
5. **Database Storage**: Save as issue with "draft" status
6. **Preview**: Display generated content in admin interface

## Monitoring and Analytics

### LLM Usage Metrics
```typescript
interface LLMMetrics {
  requestCount: number;
  successRate: number;
  averageResponseTime: number;
  totalTokensUsed: number;
  costEstimate: number;
}

// Track metrics per request type
const syllabusMetrics: LLMMetrics = {
  requestCount: 5,
  successRate: 0.8,
  averageResponseTime: 45000, // 45 seconds
  totalTokensUsed: 150000,
  costEstimate: 30.0, // USD
};
```

### Content Quality Metrics
- **Topic Diversity**: Measure topic title similarity
- **Content Length**: Track newsletter word counts
- **Validation Failures**: Monitor schema validation errors
- **Generation Success Rate**: Track successful vs failed attempts

## Cost Optimization

### Token Usage Management
```typescript
export function estimateTokens(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters for English
  return Math.ceil(text.length / 4);
}

export function optimizePrompt(prompt: string): string {
  return prompt
    .replace(/\s+/g, ' ') // Remove extra whitespace
    .trim()
    .substring(0, 4000); // Limit prompt length
}
```

### Caching Strategy
```typescript
// Cache generated content to avoid regeneration
const contentCache = new Map<string, { content: string; timestamp: Date }>();

export async function getCachedContent(key: string): Promise<string | null> {
  const cached = contentCache.get(key);
  
  if (cached && Date.now() - cached.timestamp.getTime() < 86400000) { // 24 hours
    return cached.content;
  }
  
  return null;
}
```

## Future Enhancements

### Advanced Features
- **Fine-tuned Models**: Custom models trained on domain-specific content
- **Content Personalization**: User-specific content generation
- **Multi-modal Generation**: Include diagrams and visual content
- **Real-time Generation**: Streaming content generation

### Quality Improvements
- **Human Feedback Loop**: Allow admin to rate and improve content
- **A/B Testing**: Test different prompt strategies
- **Content Analytics**: Track engagement metrics per content type
- **Automated Fact-checking**: Verify technical accuracy