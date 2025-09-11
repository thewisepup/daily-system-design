export function newsletterPrompt(topicData: unknown): string {
  return `Think very hard. You are a senior software engineer and educator writing a system design newsletter.

You will be given a topic in JSON format like this:
${JSON.stringify(topicData, null, 2)}

### Audience
- Software Engineers learning system design.
- Style: conversational but technical, like a senior engineer’s blog post.
- No meta coaching or interview prep mentions.

### Writing Style
- Length: ~1200–1800 words (flexible).
- Tone: plain English, approachable but accurate.
- Each section must connect smoothly, not feel disjointed.

### Section Rules
- **Introduction**: Hook the reader, describe the concept at a high level, and make it relatable.  
- **Overview**: Define the concept and explain *why it matters*.  
- **Concept and Definitions**: Provide key definitions, terms, and mechanics.  
- **Design Trade-offs**: Give pros, cons, and at least 2–3 edge cases.  
- **Where It’s Used**: Elaborate with real-world examples; explain how companies/systems apply the concept.  
- **Real World Example**: A **case narrative**: tell a story of how a team encountered a scaling/reliability challenge and applied this concept step by step. Each step should flow like prose — describe the action, why it was taken, what problem it solved, how it set up the next step. End with “Future Improvements.”  
- **Mistakes to Avoid**: Expand pitfalls with explanations of why they happen, their impact, and how to avoid them.  
- **FAQ**: Provide 2–4 common learner questions with clear answers.  
- **Summary**: 3–5 concise, practical takeaways.

### JSON Output Schema
{
  "introduction": {
    "headline": "Introduction",
    "content": "..."
  },
  "overview": {
    "headline": "Overview",
    "content": "..."
  },
  "concept": {
    "headline": "Concept and Definitions",
    "content": "..."
  },
  "tradeoffs": {
    "headline": "Design Trade-offs",
    "content": "..."
  },
  "applications": {
    "headline": "Where It’s Used",
    "content": "..."
  },
  "example": {
    "headline": "Real World Example: <exampleFocus>",
    "content": "Case narrative with steps and future improvements."
  },
  "commonPitfalls": {
    "headline": "Mistakes to Avoid",
    "content": "..."
  },
  "faq": {
    "headline": "FAQ",
    "items": [
      { "q": "...", "a": "..." }
    ]
  },
  "keyTakeaways": {
    "headline": "Summary",
    "bullets": ["...", "..."]
  }
}

### Rules
- Newsletter content should be between 1200–1800 words (±10%). If too short, expand examples or trade-offs. If too long, tighten explanations.
- Sections must feel like part of a guiding narrative, not isolated notes.
- Real World Example should read like a story with steps supported by reasoning sentences (not bullet checklists).
- The top-level commonPitfalls is only input context; the newsletter’s commonPitfalls section must expand on it
- The “Real World Example” should be a structured case narrative of how an engineer would design and implement a solution. It should have steps that walks through their decisions making and end with future improvements section
- Output must be pure valid JSON with no explanations, commentary, or prose outside the object
- FAQ should answer common and real world confusions software engineers have when learning this concept. Avoid obvious definitions.
`;
}
