import { topicRepo } from "~/server/db/repo/topicRepo";
import { SYSTEM_DESIGN_SUBJECT_ID } from "~/lib/constants";
import { subjectRepo } from "../db/repo/subjectRepo";
import { syllabusBatchPrompt } from "~/server/llm/prompts.ts/syllabusPrompt";
import { generateSyllabus } from "../llm/requests/generateSyllabus";

export async function generateTopics(batchSize = 10) {
  const startTime = Date.now();

  try {
    // Step 1: Fetch subject
    const subject = await subjectRepo.findById(SYSTEM_DESIGN_SUBJECT_ID);
    if (!subject) {
      throw new Error(
        `Subject with ID ${SYSTEM_DESIGN_SUBJECT_ID} does not exist`,
      );
    }

    // Step 2: Get existing topics to provide context
    const existingTitles = await topicRepo.getExistingTitles(
      SYSTEM_DESIGN_SUBJECT_ID,
    );
    const highestSequenceOrder = await topicRepo.getHighestSequenceOrder(
      SYSTEM_DESIGN_SUBJECT_ID,
    );

    const startSequenceOrder = highestSequenceOrder + 1;

    console.log(
      `Generating ${batchSize} topics starting from sequence order ${startSequenceOrder}...`,
    );
    console.log(
      `Including context from ${existingTitles.length} existing topics`,
    );

    // Step 3: Generate the batch
    const syllabusStartTime = Date.now();
    const prompt = syllabusBatchPrompt(
      subject.name,
      startSequenceOrder,
      batchSize,
      existingTitles,
    );
    console.log(prompt);

    const response = await generateSyllabus({
      prompt,
    });

    console.log("--AI Response: --");
    console.log(JSON.stringify(response, null, 2));
    console.log("--End AI Response: --");

    const syllabusDuration = Date.now() - syllabusStartTime;
    console.log(`Batch generation completed (${syllabusDuration}ms)`);

    // Step 4: Validate response
    if (!response.topics || response.topics.length === 0) {
      throw new Error("AI returned no topics");
    }

    if (response.topics.length !== batchSize) {
      console.warn(
        `Expected ${batchSize} topics, got ${response.topics.length}`,
      );
    }

    // Step 5: Prepare topics for database
    const topicsForDb = response.topics.map((topic) => ({
      title: topic.title,
      topicData: topic, // Store complete topic JSON in topicData
      subjectId: SYSTEM_DESIGN_SUBJECT_ID,
      sequenceOrder: topic.sequenceOrder,
    }));

    // Step 6: Save topics to database
    console.log(`Saving ${topicsForDb.length} topics to database...`);
    const createdTopics = await topicRepo.createMany(topicsForDb);

    if (!createdTopics || createdTopics.length === 0) {
      throw new Error("Failed to create topics in database");
    }

    const endTime = Date.now();
    const duration = endTime - startTime;
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
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.error(`Failed after ${duration}ms:`, error);
    throw error;
  }
}
