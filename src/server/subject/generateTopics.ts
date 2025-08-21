import { llmClient } from "~/server/llm/client";
import { topicRepo } from "~/server/db/repo/topicRepo";
import { SYSTEM_DESIGN_SUBJECT_ID } from "~/lib/constants";
import { subjectRepo } from "../db/repo/subjectRepo";
import { syllabusPrompt } from "~/server/llm/prompts.ts/syllabusPrompt";

//TODO: Do we need this? is there a better way to pass in params or no.

export async function generateTopics() {
  await topicRepo.deleteBySubjectId(SYSTEM_DESIGN_SUBJECT_ID);
  const subject = await subjectRepo.findById(SYSTEM_DESIGN_SUBJECT_ID);
  if (!subject) {
    throw new Error(
      `Subject with ID ${SYSTEM_DESIGN_SUBJECT_ID} does not exist`,
    );
  }
  const prompt = syllabusPrompt(subject?.name);
  // Generate topics using LLM
  //TODO: No need to pass in a count here, embed that in the prompt
  // const topics = await llmClient.generateTopics(subjectName, count);

  // TODO: create validator that verifies the count, format, etc is valid

  // Prepare topics data for database insertion
  // TODO: figure out how to ensure we get the exact format back from the AI
  const topics = Array.from({ length: 25 }, (_, i) => ({
    title: `Topic ${i + 1}`,
    description: null,
    subjectId: SYSTEM_DESIGN_SUBJECT_ID,
    sequenceOrder: i + 1,
  }));
  // Insert topics into database
  const createdTopics = await topicRepo.createMany(topics);
  //If num createdTopics == 0, throw error
}
