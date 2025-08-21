import { topicRepo } from "~/server/db/repo/topicRepo";
import { SYSTEM_DESIGN_SUBJECT_ID } from "~/lib/constants";
import { subjectRepo } from "../db/repo/subjectRepo";
import { syllabusPrompt } from "~/server/llm/prompts.ts/syllabusPrompt";
import { generateSyllabus } from "../llm/requests/generateSyllabus";

//TODO: Do we need this? is there a better way to pass in params or no.

export async function generateTopics() {
  const startTime = Date.now();

  try {
    // Step 1: Cleaning up old subjects
    console.log("Cleaning up old subjects...");
    await topicRepo.deleteBySubjectId(SYSTEM_DESIGN_SUBJECT_ID);

    // Step 2: Fetch subject
    const subject = await subjectRepo.findById(SYSTEM_DESIGN_SUBJECT_ID);
    if (!subject) {
      throw new Error(
        `Subject with ID ${SYSTEM_DESIGN_SUBJECT_ID} does not exist`,
      );
    }

    // Step 3: Generate syllabus
    const syllabusStartTime = Date.now();
    console.log("Generating syllabus...");
    const prompt = syllabusPrompt(subject.name);
    const response = await generateSyllabus({
      prompt,
    });
    const syllabusDuration = Date.now() - syllabusStartTime;
    console.log(`Generating syllabus completed (${syllabusDuration}ms)`);
    console.log("Response:", response);
    // Step 4: Validate response
    if (!response.topics || response.topics.length === 0) {
      throw new Error("AI returned no topics");
    }

    // Step 5: Adding to database
    console.log("Adding to database...");
    const topicsForDb = response.topics.map((topic) => ({
      title: topic.title,
      description: topic.description || null,
      subjectId: SYSTEM_DESIGN_SUBJECT_ID,
      sequenceOrder: topic.sequenceOrder,
    }));

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
      duration,
    };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.error(`Failed after ${duration}ms:`, error);
    throw error;
  }
}
