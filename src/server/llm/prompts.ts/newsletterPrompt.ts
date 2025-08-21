export function newsletterPrompt(topic: string): string {
  return `You are a senior software engineer and educator. 
Generate a newsletter article about the topic: ${topic}.

Requirements:
- Audience: Early-career software engineers learning system design.
- Length: 1,500–2,000 words (~10 min read).
- Style: Clear, engaging, and practical. Use plain English, avoid academic jargon.
- Tone: Conversational, like a newsletter writer who explains complex ideas simply but with technical accuracy.

Structure:
1. Introduction (hook + why this topic matters)
2. Concept Breakdown (step-by-step explanation of the core idea)
3. Trade-offs (pros, cons, and edge cases)
4. Real-World Applications (where this is used in industry)
5. Analogy or Story (to make the concept memorable)
6. Key Takeaways (3–5 bullet points that summarize the lesson)
7. Suggested Resources (further reading, links, or keywords)

Rules:
- Keep explanations concrete with examples (e.g., “Load balancer algorithms like round-robin vs least-connections”).
- Do not skip the analogy section — always include a relatable story or metaphor.
- Ensure the newsletter is coherent and structured, not just a raw essay.
- Output only the newsletter content (no preamble or commentary).
`;
}
