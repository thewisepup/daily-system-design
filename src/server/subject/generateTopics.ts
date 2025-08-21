import { llmClient } from "~/server/llm/client";
import { topicRepo } from "~/server/db/repo/topicRepo";

//TODO: Do we need this? is there a better way to pass in params or no.
export interface GenerateTopicsParams {
  subjectId: number;
  subjectName: string;
  count?: number;
  replaceExisting?: boolean;
}

export interface GenerateTopicsResult {
  success: boolean;
  topicsCreated: number;
  error?: string;
}

export async function generateTopics({
  subjectId,
  subjectName,
  count = 150,
  replaceExisting = false,
}: GenerateTopicsParams): Promise<GenerateTopicsResult> {
  try {
    // Check if topics already exist for this subject
    const existingCount = await topicRepo.countBySubjectId(subjectId);

    if (existingCount > 0 && !replaceExisting) {
      return {
        success: false,
        topicsCreated: 0,
        error: `Subject already has ${existingCount} topics. Use replaceExisting=true to overwrite.`,
      };
    }

    // Delete existing topics if replacing
    if (replaceExisting && existingCount > 0) {
      await topicRepo.deleteBySubjectId(subjectId);
    }

    //TODO: Grab Subject object from db
    //TODO: Create system prompt for generating topics here

    // Generate topics using LLM
    //TODO: No need to pass in a count here, embed that in the prompt
    const topics = await llmClient.generateTopics(subjectName, count);

    // TODO: create validator that verifies the count, format, etc is valid

    // Prepare topics data for database insertion
    // TODO: figure out how to ensure we get the exact format back from the AI
    // const topics = llmResponse.topics.map((topic, index) => ({
    //   title: topic.title,
    //   description: topic.description,
    //   subjectId,
    //   sequenceOrder: index + 1,
    // }));

    // Insert topics into database
    const createdTopics = await topicRepo.createMany(topics);

    return {
      success: true,
      topicsCreated: createdTopics.length,
    };
  } catch (error) {
    console.error("Error generating topics:", error);
    return {
      success: false,
      topicsCreated: 0,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
