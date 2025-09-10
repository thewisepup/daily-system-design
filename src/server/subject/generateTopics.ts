import { topicRepo } from "~/server/db/repo/topicRepo";
import { SYSTEM_DESIGN_SUBJECT_ID } from "~/lib/constants";
import { subjectRepo } from "../db/repo/subjectRepo";
import { syllabusBatchPrompt } from "~/server/llm/prompts.ts/syllabusPrompt";
import { generateSyllabus } from "../llm/requests/generateSyllabus";

const TOPICS_PER_BATCH = 365;
const TOTAL_TOPICS = 365;
const TOTAL_BATCHES = Math.ceil(TOTAL_TOPICS / TOPICS_PER_BATCH);

export async function generateTopics() {
  const startTime = Date.now();

  try {
    // Step 1: Cleaning up old topics
    console.log("Cleaning up old topics...");
    await topicRepo.deleteBySubjectId(SYSTEM_DESIGN_SUBJECT_ID);

    // Step 2: Fetch subject
    const subject = await subjectRepo.findById(SYSTEM_DESIGN_SUBJECT_ID);
    if (!subject) {
      throw new Error(
        `Subject with ID ${SYSTEM_DESIGN_SUBJECT_ID} does not exist`,
      );
    }

    const allTopics: Array<{
      title: string;
      topicData: object;
      subjectId: number;
      sequenceOrder: number;
    }> = [];
    const priorTitles: string[] = [];

    // Step 3: Generate topics in batches
    for (let batch = 1; batch <= TOTAL_BATCHES; batch++) {
      const startNumber = (batch - 1) * TOPICS_PER_BATCH + 1;
      const isLastBatch = batch === TOTAL_BATCHES;
      const topicsInThisBatch = isLastBatch
        ? TOTAL_TOPICS - (batch - 1) * TOPICS_PER_BATCH
        : TOPICS_PER_BATCH;

      console.log(
        `Generating batch ${batch}/${TOTAL_BATCHES} (topics ${startNumber}-${startNumber + topicsInThisBatch - 1})...`,
      );

      const syllabusStartTime = Date.now();
      const prompt = syllabusBatchPrompt(
        subject.name,
        startNumber,
        topicsInThisBatch,
        priorTitles,
      );
      console.log(prompt);
      const response = await generateSyllabus({
        prompt,
      });
      console.log("--AI Response: --");
      console.log(JSON.stringify(response, null, 2));
      console.log("--End AI Response: --");
      const syllabusDuration = Date.now() - syllabusStartTime;
      console.log(
        `Batch ${batch} generation completed (${syllabusDuration}ms)`,
      );

      // Step 4: Validate response
      if (!response.topics || response.topics.length === 0) {
        throw new Error(`AI returned no topics for batch ${batch}`);
      }

      if (response.topics.length !== topicsInThisBatch) {
        console.warn(
          `Expected ${topicsInThisBatch} topics in batch ${batch}, got ${response.topics.length}`,
        );
      }

      // Step 5: Prepare topics for database
      const topicsForDb = response.topics.map((topic) => ({
        title: topic.title,
        topicData: topic, // Store complete topic JSON in topicData
        subjectId: SYSTEM_DESIGN_SUBJECT_ID,
        sequenceOrder: topic.sequenceOrder,
      }));

      allTopics.push(...topicsForDb);

      // Track titles for next batch
      priorTitles.push(...response.topics.map((topic) => topic.title));

      // Add small delay between batches to avoid rate limits
      if (batch < TOTAL_BATCHES) {
        console.log("Waiting 2 seconds before next batch...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    // Step 6: Save all topics to database
    console.log(`Saving ${allTopics.length} topics to database...`);
    const createdTopics = await topicRepo.createMany(allTopics);

    if (!createdTopics || createdTopics.length === 0) {
      throw new Error("Failed to create topics in database");
    }

    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(
      `Done. Generated ${createdTopics.length} topics in ${TOTAL_BATCHES} batches over ${duration}ms total`,
    );

    return {
      success: true,
      topicsCreated: createdTopics.length,
      totalBatches: TOTAL_BATCHES,
      duration,
    };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.error(`Failed after ${duration}ms:`, error);
    throw error;
  }
}
