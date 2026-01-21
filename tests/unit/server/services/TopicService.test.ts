import { topicService } from "~/server/services/TopicService";
import { topicRepo } from "~/server/db/repo/topicRepo";
import { subjectRepo } from "~/server/db/repo/subjectRepo";
import { complete } from "~/server/llm/openRouterClient";
import {
  SubjectFactory,
  TopicFactory,
  TopicsResponseFactory,
} from "tests/factories";

vi.mock("~/server/db/repo/topicRepo", () => ({
  topicRepo: {
    findBySubjectIdAndSequence: vi.fn(),
    getExistingTitles: vi.fn(),
    getHighestSequenceOrder: vi.fn(),
    createMany: vi.fn(),
  },
}));

vi.mock("~/server/db/repo/subjectRepo", () => ({
  subjectRepo: {
    findById: vi.fn(),
  },
}));

vi.mock("~/server/llm/openRouterClient", () => ({
  complete: vi.fn(),
}));

const mockedTopicRepo = vi.mocked(topicRepo);
const mockedSubjectRepo = vi.mocked(subjectRepo);
const mockedComplete = vi.mocked(complete);

describe("TopicService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateTopics", () => {
    const subjectId = 1;
    const batchSize = 5;

    const mockSubject = SubjectFactory.createSubject({
      id: subjectId,
      name: "System Design",
    });

    const mockLLMResponse = TopicsResponseFactory.createTopicsResponse(2);

    const setupSuccessMocks = () => {
      mockedSubjectRepo.findById.mockResolvedValue(mockSubject);
      mockedTopicRepo.getExistingTitles.mockResolvedValue([]);
      mockedTopicRepo.getHighestSequenceOrder.mockResolvedValue(0);
      mockedComplete.mockResolvedValue(mockLLMResponse);
      mockedTopicRepo.createMany.mockResolvedValue(
        TopicFactory.createTopics(mockLLMResponse.topics.length),
      );
    };

    it("successfully generates topics and saves to database", async () => {
      setupSuccessMocks();

      const result = await topicService.generateTopics(subjectId, batchSize);

      expect(result.success).toBe(true);
      expect(result.topicsCreated).toBe(mockLLMResponse.topics.length);
      expect(result.totalBatches).toBe(1);
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(mockedSubjectRepo.findById).toHaveBeenCalledWith(subjectId);
      expect(mockedTopicRepo.createMany).toHaveBeenCalled();
    });

    it("throws error when subject does not exist", async () => {
      mockedSubjectRepo.findById.mockResolvedValue(null);

      await expect(
        topicService.generateTopics(subjectId, batchSize),
      ).rejects.toThrow(`Subject with ID ${subjectId} does not exist`);

      expect(mockedTopicRepo.createMany).not.toHaveBeenCalled();
    });

    it("throws error when LLM returns no topics", async () => {
      mockedSubjectRepo.findById.mockResolvedValue(mockSubject);
      mockedTopicRepo.getExistingTitles.mockResolvedValue([]);
      mockedTopicRepo.getHighestSequenceOrder.mockResolvedValue(0);
      mockedComplete.mockResolvedValue({ topics: [] });

      await expect(
        topicService.generateTopics(subjectId, batchSize),
      ).rejects.toThrow("AI returned no topics");

      expect(mockedTopicRepo.createMany).not.toHaveBeenCalled();
    });

    it("throws error when database insert fails", async () => {
      mockedSubjectRepo.findById.mockResolvedValue(mockSubject);
      mockedTopicRepo.getExistingTitles.mockResolvedValue([]);
      mockedTopicRepo.getHighestSequenceOrder.mockResolvedValue(0);
      mockedComplete.mockResolvedValue(mockLLMResponse);
      mockedTopicRepo.createMany.mockResolvedValue([]);

      await expect(
        topicService.generateTopics(subjectId, batchSize),
      ).rejects.toThrow("Failed to create topics in database");
    });

    it("correctly calculates starting sequence order from existing topics", async () => {
      const existingHighestOrder = 50;
      const expectedStartSequence = existingHighestOrder + 1; // 51
      mockedSubjectRepo.findById.mockResolvedValue(mockSubject);
      mockedTopicRepo.getExistingTitles.mockResolvedValue([
        "Topic 1",
        "Topic 2",
      ]);
      mockedTopicRepo.getHighestSequenceOrder.mockResolvedValue(
        existingHighestOrder,
      );
      mockedComplete.mockResolvedValue(mockLLMResponse);
      mockedTopicRepo.createMany.mockResolvedValue(
        TopicFactory.createTopics(mockLLMResponse.topics.length),
      );

      await topicService.generateTopics(subjectId, batchSize);

      expect(mockedTopicRepo.getHighestSequenceOrder).toHaveBeenCalledWith(
        subjectId,
      );

      const promptArg = mockedComplete.mock.calls[0]?.[0]?.prompt as string;
      expect(promptArg).toContain(
        `starting sequence number is provided as \`${expectedStartSequence}\``,
      );
      expect(promptArg).toContain(
        `sequenceOrder must start from ${expectedStartSequence}`,
      );
    });

    it("passes existing topic titles to prompt for context", async () => {
      const existingTitles = ["Load Balancing Basics", "Caching Strategies"];
      mockedSubjectRepo.findById.mockResolvedValue(mockSubject);
      mockedTopicRepo.getExistingTitles.mockResolvedValue(existingTitles);
      mockedTopicRepo.getHighestSequenceOrder.mockResolvedValue(2);
      mockedComplete.mockResolvedValue(mockLLMResponse);
      mockedTopicRepo.createMany.mockResolvedValue(
        TopicFactory.createTopics(mockLLMResponse.topics.length),
      );

      await topicService.generateTopics(subjectId, batchSize);

      expect(mockedTopicRepo.getExistingTitles).toHaveBeenCalledWith(subjectId);

      const promptArg = mockedComplete.mock.calls[0]?.[0]?.prompt as string;
      expect(promptArg).toContain("Previously Generated Titles");
      expect(promptArg).toContain("Load Balancing Basics");
      expect(promptArg).toContain("Caching Strategies");
    });

    it("uses default batchSize when not provided", async () => {
      setupSuccessMocks();

      const result = await topicService.generateTopics(subjectId);

      expect(result.success).toBe(true);
    });

    it("maps topics correctly for database insertion", async () => {
      setupSuccessMocks();

      await topicService.generateTopics(subjectId, batchSize);

      expect(mockedTopicRepo.createMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            title: "Load Balancing",
            subjectId,
            sequenceOrder: 1,
            topicData: mockLLMResponse.topics[0],
          }),
        ]),
      );
    });
  });

  describe("ensureTopicExists", () => {
    const subjectId = 1;
    const sequenceOrder = 5;

    const mockSubject = SubjectFactory.createSubject({
      id: subjectId,
      name: "System Design",
    });

    const mockTopic = TopicFactory.createTopic({
      id: 10,
      subjectId,
      sequenceOrder,
      title: "Load Balancing",
    });

    const mockLLMResponse = TopicsResponseFactory.createTopicsResponse(10);

    it("returns existing topic without generating when topic exists", async () => {
      mockedTopicRepo.findBySubjectIdAndSequence.mockResolvedValue(mockTopic);

      const result = await topicService.ensureTopicExists(
        subjectId,
        sequenceOrder,
      );

      expect(result.topic).toEqual(mockTopic);
      expect(result.wasAutoGenerated).toBe(false);
      expect(mockedSubjectRepo.findById).not.toHaveBeenCalled();
      expect(mockedTopicRepo.createMany).not.toHaveBeenCalled();
    });

    it("generates topics and returns the requested one when topic does not exist", async () => {
      const newTopic = TopicFactory.createTopic({
        id: 100,
        subjectId,
        sequenceOrder,
        title: "Auto-Generated Topic",
      });

      mockedTopicRepo.findBySubjectIdAndSequence
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(newTopic);

      mockedSubjectRepo.findById.mockResolvedValue(mockSubject);
      mockedTopicRepo.getExistingTitles.mockResolvedValue([]);
      mockedTopicRepo.getHighestSequenceOrder.mockResolvedValue(0);
      mockedComplete.mockResolvedValue(mockLLMResponse);
      mockedTopicRepo.createMany.mockResolvedValue(
        TopicFactory.createTopics(mockLLMResponse.topics.length),
      );

      const result = await topicService.ensureTopicExists(
        subjectId,
        sequenceOrder,
      );

      expect(result.topic).toEqual(newTopic);
      expect(result.wasAutoGenerated).toBe(true);
      expect(mockedTopicRepo.createMany).toHaveBeenCalled();
    });

    it("throws error when topic generation fails", async () => {
      mockedTopicRepo.findBySubjectIdAndSequence.mockResolvedValue(null);
      mockedSubjectRepo.findById.mockResolvedValue(null);

      await expect(
        topicService.ensureTopicExists(subjectId, sequenceOrder),
      ).rejects.toThrow(`Subject with ID ${subjectId} does not exist`);
    });

    it("throws error when generated topic is not found at requested sequence", async () => {
      mockedTopicRepo.findBySubjectIdAndSequence
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      mockedSubjectRepo.findById.mockResolvedValue(mockSubject);
      mockedTopicRepo.getExistingTitles.mockResolvedValue([]);
      mockedTopicRepo.getHighestSequenceOrder.mockResolvedValue(0);
      mockedComplete.mockResolvedValue(mockLLMResponse);
      mockedTopicRepo.createMany.mockResolvedValue(
        TopicFactory.createTopics(mockLLMResponse.topics.length),
      );

      await expect(
        topicService.ensureTopicExists(subjectId, sequenceOrder),
      ).rejects.toThrow(
        `Failed to generate topic for subject ${subjectId} at sequence ${sequenceOrder}`,
      );
    });

    it("uses custom batch size when provided", async () => {
      const customBatchSize = 20;
      const newTopic = TopicFactory.createTopic({
        id: 100,
        subjectId,
        sequenceOrder,
      });

      mockedTopicRepo.findBySubjectIdAndSequence
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(newTopic);

      mockedSubjectRepo.findById.mockResolvedValue(mockSubject);
      mockedTopicRepo.getExistingTitles.mockResolvedValue([]);
      mockedTopicRepo.getHighestSequenceOrder.mockResolvedValue(0);
      mockedComplete.mockResolvedValue(mockLLMResponse);
      mockedTopicRepo.createMany.mockResolvedValue(
        TopicFactory.createTopics(mockLLMResponse.topics.length),
      );

      await topicService.ensureTopicExists(
        subjectId,
        sequenceOrder,
        customBatchSize,
      );

      const promptArg = mockedComplete.mock.calls[0]?.[0]?.prompt as string;
      expect(promptArg).toContain(`${customBatchSize} topics`);
    });
  });
});
