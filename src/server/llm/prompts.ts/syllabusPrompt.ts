//TODO: Pass TopicsResponseResponse Zod type into the prompt itself alongside the description for AI
export function syllabusBatchPrompt(
  _subject: string,
  startNumber = 1,
  batchSize = 50,
  priorTitles: string[] = [],
): string {
  const priorTitlesSection =
    priorTitles.length > 0
      ? `### Previously Generated Titles (avoid repeating or close duplicate titles):\n${JSON.stringify(priorTitles, null, 2)}\n\n`
      : "";

  return `You are an expert system design engineer and teacher.
You are designing a flat, ordered syllabus for preparing software engineers for real-world system design interviews.

### Goals
- Help software engineers learn pragmatic industry concepts tested in interviews.
- Maintain a ratio of ~70% high-level architecture topics (scalability, tradeoffs, patterns) and ~30% low-level implementation details (algorithms, protocols, specific mechanisms).
- Include Infrastructure & DevOps topics naturally throughout, not isolated in one section.
- Present topics in a logical sequence, progressing from beginner → intermediate → advanced → expert.

### Batching Context
- The syllabus is being generated in multiple **batches**.
- Each batch continues where the last left off. The starting sequence number is provided as \`${startNumber}\`.
- Prior generated titles are passed in to ensure **no duplicates or semantic overlap** across batches.
- Each batch must independently satisfy the constraints, while contributing to the global syllabus.

### Requirements
- Generate exactly ${batchSize} topics in this batch.
- Each topic must be atomic = learnable in ~1 day, not a bundle of multiple concepts.
- Output a **flat, incremented list** in JSON array format only.
- JSON schema for each item:
  {
    "sequenceOrder": <number>,
    "title": "<short topic title>",
    "description": "<2 sentence syllabus description>",
    "learningObjective": "<what the learner should understand>",
    "exampleFocus": "<primary example case the topic should highlight>",
    "commonPitfalls": "<common mistakes learners or engineers make with this concept>"
  }
- sequenceOrder must start from ${startNumber} and increase sequentially without gaps.
- Ensure uniqueness: titles cannot duplicate or semantically overlap with any from prior batches.
- Assume learner already knows programming and web basics.
- Use plain English, concise, industry-standard phrasing.

### Constraints
- Balance 70:30 (high-level vs low-level) across this batch.
- Sprinkle Infra/DevOps topics (reliability, monitoring, deployment, CI/CD, scaling) throughout.
- Confirm JSON is valid and complete before returning.
- Do not include any explanation, commentary, or text outside the JSON code block.

${priorTitlesSection}
### Expected JSON Response Format
Return a JSON object with "topics" array containing exactly ${batchSize} topic objects matching the schema above.`;
}

/*
`Think very hard on this. You are an expert system design engineer and teacher.
    Create a structured syllabus for learning system design.
    
    Rules:
    - Create 365 unique topics
    - Each topic = atomic concept, not bundled and should be able to learn in 1 day
    - Topics should focus on system design concepts that can come up in a technical interview
    - Ordered from beginner → advanced
    - Output format: valid JSON array
    - Each entry must be:
      {
        "sequenceOrder": <number>,
        "title": "<short title>",
        "description": "<1–2 sentences explaining importance>"
      }
    - sequenceOrder should be the newsletter number the topic should be released by
    - title is the topic of the newsletter
    - The topic and description will be fed to another AI agent that will generate the newsletter. Give enough context about what we should focus on in the description for the newsletter.
    - No duplicates or near-duplicates
    - Assume learner knows programming + web basics
    - Write in plain English, concise, industry-standard
    - Confirm the JSON is valid and complete before returning`
*/
