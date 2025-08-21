export function syllabusPrompt(subject: string): string {
  return `You are an expert system design engineer and teacher.
    Create a structured syllabus for learning system design.
    
    Rules:
    - At least 300 unique topics
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
    - Confirm the JSON is valid and complete before returning`;
}
