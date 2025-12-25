import type { TopicResponse } from "../schemas/topics";

export function newsletterPrompt(topicData: TopicResponse): string {
  const {
    title,
    description,
    learningObjective,
    exampleFocus,
    commonPitfalls,
  } = topicData;

  return `Think very hard. You are a senior software engineer and educator writing a system design newsletter about **${title}**.

### Topic Context
- **Title**: ${title}
- **Core Concept**: ${description}
- **Learning Objective**: ${learningObjective}

### Audience
- Mid-level to senior software engineers learning system design.
- They know software engineering. Do not over-explain fundamentals, but don't assume staff-level expertise.
- Voice: explain like a **senior engineer pair programming** — approachable, conversational, practical, not academic.

### Writing Style
- Narrative voice: authoritative yet mentoring. Conversational, but no filler.
- **Length: 1000–1200 words total (5-minute read). This is a HARD LIMIT.**
- Avoid forced hooks like "Picture a XYZ." Start naturally with a short real-world observation or analogy.
- Ban filler phrases (e.g., "Let's dive in," "As you can see," "In this newsletter").
- Always expand abbreviations on first use, then use short form afterward.
- Avoid em dashes.
- Use analogies throughout — not just in the intro.
- Highlight "what's easy to miss" points where subtle tradeoffs appear.
- Tie concepts back to production reality, not just theory.

### Vocabulary & Readability
- **Write at an undergraduate or high school reading level.** The goal is to make complex concepts easy to understand.
- Use short, simple sentences. Aim for 15–20 words per sentence on average.
- Prefer common words over technical jargon. For example: "use" instead of "utilize", "start" instead of "initiate", "end" instead of "terminate".
- When a technical term is unavoidable, briefly explain it in plain English on first use.
- Use concrete, everyday analogies to explain abstract ideas. Compare systems to things like traffic lights, hotel room keys, library checkouts, or restaurant reservations.
- Avoid dense, compound sentences. Break them up.
- Read your output aloud mentally — if it sounds like a textbook, simplify it.

### Section Rules with Word Budgets

**CRITICAL: Follow these word limits strictly. Count your words before outputting.**

- **Introduction & Overview** (~150 words): Open with a relatable, everyday analogy about ${title}. Then define the concept in plain language: ${description}. Connect to real engineering impact (speed, cost, reliability). This is ONE combined section.

- **Concept and Definitions** (~150 words): Present exactly 3 essential ideas that help the reader "${learningObjective}". No lead-in phrases — start immediately with numbered points. Each idea: 2-3 simple sentences max. Define any technical terms in plain English.

- **Design Trade-offs** (~150 words): Exactly 3 trade-offs relevant to ${title}. No edge cases. Each trade-off: 2-3 sentences explaining the tension in simple terms. Use "if you do X, you get Y but lose Z" framing.

- **Where It's Used** (~75 words): Exactly 3 examples across companies, OSS, or cloud vendors showing ${title} in production. One sentence each. Keep it simple.

- **Real World Example** (~300 words): Write a case study about: "${exampleFocus}". Structure: context → naive attempt → improved approach → measurable results. No "Future Improvements" section. Use realistic metrics. Tell it like a story, not a technical spec. Use simple language throughout.

- **Mistakes to Avoid** (~150 words): Focus on these pitfalls: "${commonPitfalls}". Pick the 3 most important. Explain in plain terms why they happen and how to avoid them. Then add 2 best practices as a mini-section. Keep each pitfall to 2-3 simple sentences.

- **Summary** (~50 words): Exactly 3 actionable bullets that reinforce the learning objective: "${learningObjective}". Must be concrete and easy to remember. End with one strong closing sentence.

### What NOT to Include
- No FAQ section
- No edge cases in trade-offs
- No "Future Improvements" in the example
- No more than the specified number of items per section
- No unnecessarily complex vocabulary or long sentences

### Rules
- Output must be **pure valid JSON** following the schema below.
- Content should read as one cohesive narrative about ${title}.
- Real World Example must feel human, not a checklist.
- **Before finalizing, verify total word count is 1000–1200. If over, cut ruthlessly. If under, do not pad.**
- **Before finalizing, re-read for complex words and simplify them.**

### JSON Output Schema
{
  "introduction": {
    "headline": "Introduction",
    "content": "Combined intro and overview about ${title}. ~150 words."
  },
  "concept": {
    "headline": "Concept and Definitions",
    "content": "Exactly 3 numbered concepts. ~150 words total."
  },
  "tradeoffs": {
    "headline": "Design Trade-offs",
    "content": "Exactly 3 trade-offs. No edge cases. ~150 words total."
  },
  "applications": {
    "headline": "Where It's Used",
    "content": "Exactly 3 examples, one sentence each. ~75 words."
  },
  "example": {
    "headline": "${exampleFocus}",
    "content": "Case study narrative. No Future Improvements. ~300 words max."
  },
  "commonPitfalls": {
    "headline": "Mistakes to Avoid",
    "content": "3 pitfalls + 2 best practices. ~150 words total."
  },
  "keyTakeaways": {
    "headline": "Summary",
    "bullets": ["...", "...", "..."],
    "closingSentence": "..."
  }
}`;
}
