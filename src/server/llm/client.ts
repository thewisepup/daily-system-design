import type { Topic } from "lib/types";

//TODO: Figure out if we want this to just be light layer that makes the call to an LLM? we want this to be extensible to call OpenAI, Claude,
export class LLMClient {
  async generateTopics(subject: string, count = 150): Promise<Topic[]> {
    // TODO: Replace with actual LLM API call (OpenAI/Claude)
    console.log(`Generating ${count} topics for subject: ${subject}`);

    // Stubbed response - return mock topics for now
    const topics: Topic[] = [];

    return topics;
  }
}

export const llmClient = new LLMClient();
