import type { Topic } from "lib/types";

//TODO: Figure out if we want this to just be light layer that makes the call to an LLM? we want this to be extensible to call OpenAI, Claude, etc.
export class LLMClient {
  async generateTopics(subject: string, count = 150): Promise<Topic[]> {
    // TODO: Replace with actual LLM API call (OpenAI/Claude)
    console.log(`Generating ${count} topics for subject: ${subject}`);

    // Stubbed response - return mock topics for now
    const mockTopics: Topic[] = [];

    for (let i = 1; i <= count; i++) {
      mockTopics.push({
        id: i,
        title: `Topic ${i}`,
        description: `Description for topic ${i}`,
        subjectId: 1,
        sequenceOrder: i,
        createdAt: new Date(),
      });
    }

    return mockTopics;
  }
}

export const llmClient = new LLMClient();
