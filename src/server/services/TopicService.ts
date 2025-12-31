import { complete } from "../llm/openRouterClient";
import { topicRepo } from "../db/repo/topicRepo";
import { subjectRepo } from "../db/repo/subjectRepo";
import { syllabusBatchPrompt } from "../llm/prompts.ts/syllabusPrompt";
import { TopicsResponseSchema } from "../llm/schemas/topics";

interface GenerateTopicsResult {
  success: boolean;
  topicsCreated: number;
  totalBatches: number;
  duration: number;
}

class TopicService {
  /**
   * Generates a batch of topics for a subject using LLM and saves them to the database.
   *
   * @param subjectId - The subject ID to generate topics for
   * @param batchSize - Number of topics to generate (default: 10)
   * @returns Result containing success status, topics created count, and duration
   *
   * @throws {Error} When subject does not exist
   * @throws {Error} When AI returns no topics
   * @throws {Error} When database insert fails
   */
  async generateTopics(
    subjectId: number,
    batchSize = 10,
  ): Promise<GenerateTopicsResult> {
    const startTime = Date.now();

    try {
      const subject = await subjectRepo.findById(subjectId);
      if (!subject) {
        throw new Error(`Subject with ID ${subjectId} does not exist`);
      }

      const existingTitles = await topicRepo.getExistingTitles(subjectId);
      const highestSequenceOrder =
        await topicRepo.getHighestSequenceOrder(subjectId);
      const startSequenceOrder = highestSequenceOrder + 1;

      console.log(
        `Generating ${batchSize} topics starting from sequence order ${startSequenceOrder}...`,
      );
      console.log(
        `Including context from ${existingTitles.length} existing topics`,
      );

      const syllabusStartTime = Date.now();
      const prompt = syllabusBatchPrompt(
        subject.name,
        startSequenceOrder,
        batchSize,
        existingTitles,
      );
      console.log(prompt);

      const response = await complete({
        prompt,
        schema: TopicsResponseSchema,
        schemaName: "topics_response",
      });

      console.log("--AI Response: --");
      console.log(JSON.stringify(response, null, 2));
      console.log("--End AI Response: --");

      const syllabusDuration = Date.now() - syllabusStartTime;
      console.log(`Batch generation completed (${syllabusDuration}ms)`);

      if (!response.topics || response.topics.length === 0) {
        throw new Error("AI returned no topics");
      }

      if (response.topics.length !== batchSize) {
        console.warn(
          `Expected ${batchSize} topics, got ${response.topics.length}`,
        );
      }

      const topicsForDb = response.topics.map((topic) => ({
        title: topic.title,
        topicData: topic,
        subjectId,
        sequenceOrder: topic.sequenceOrder,
      }));

      console.log(`Saving ${topicsForDb.length} topics to database...`);
      const createdTopics = await topicRepo.createMany(topicsForDb);

      if (!createdTopics || createdTopics.length === 0) {
        throw new Error("Failed to create topics in database");
      }

      const duration = Date.now() - startTime;
      console.log(
        `Done. Generated ${createdTopics.length} topics in ${duration}ms total`,
      );

      return {
        success: true,
        topicsCreated: createdTopics.length,
        totalBatches: 1,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`Failed after ${duration}ms:`, error);
      throw error;
    }
  }
}

export const topicService = new TopicService();
