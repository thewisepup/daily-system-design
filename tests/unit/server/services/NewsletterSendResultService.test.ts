import { newsletterSendResultService } from "~/server/services/NewsletterSendResultService";
import { newsletterSendResultRepo } from "~/server/db/repo/newsletterSendResultRepo";
import { NewsletterSendResultFactory } from "~/test/factories";

vi.mock("~/server/db/repo/newsletterSendResultRepo", () => ({
  newsletterSendResultRepo: {
    create: vi.fn(),
    updateCompletion: vi.fn(),
    findByIssueId: vi.fn(),
    findLatest: vi.fn(),
    findById: vi.fn(),
  },
}));

const mockedNewsletterSendResultRepo = vi.mocked(newsletterSendResultRepo);
const {
  create: mockCreate,
  updateCompletion: mockUpdateCompletion,
  findByIssueId: mockFindByIssueId,
  findLatest: mockFindLatest,
  findById: mockFindById,
} = mockedNewsletterSendResultRepo;

describe("NewsletterSendResultService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("recordSendStart", () => {
    it("successfully records send start and returns result", async () => {
      const data = {
        name: "System Design Issue #1",
        issueId: 1,
        startTime: new Date("2024-01-15T10:00:00Z"),
      };
      const expectedResult =
        NewsletterSendResultFactory.createNewsletterSendResult({
          name: data.name,
          issueId: data.issueId,
          startTime: data.startTime,
        });
      mockCreate.mockResolvedValue(expectedResult);

      const result = await newsletterSendResultService.recordSendStart(data);

      expect(mockCreate).toHaveBeenCalledWith({
        name: data.name,
        issueId: data.issueId,
        startTime: data.startTime,
      });
      expect(result).toEqual(expectedResult);
    });

      it("returns null when repo.create returns null", async () => {
        const data = {
          name: "System Design Issue #1",
          issueId: 1,
          startTime: new Date("2024-01-15T10:00:00Z"),
        };
        mockCreate.mockResolvedValue(undefined as unknown as Awaited<ReturnType<typeof newsletterSendResultRepo.create>>);

      const result = await newsletterSendResultService.recordSendStart(data);

      expect(mockCreate).toHaveBeenCalledWith({
        name: data.name,
        issueId: data.issueId,
        startTime: data.startTime,
      });
      expect(result).toBeNull();
    });

    it("returns null and handles error when repo throws", async () => {
      const data = {
        name: "System Design Issue #1",
        issueId: 1,
        startTime: new Date("2024-01-15T10:00:00Z"),
      };
      const error = new Error("Database connection failed");
      mockCreate.mockRejectedValue(error);

      const result = await newsletterSendResultService.recordSendStart(data);

      expect(mockCreate).toHaveBeenCalledWith({
        name: data.name,
        issueId: data.issueId,
        startTime: data.startTime,
      });
      expect(result).toBeNull();
    });
  });

  describe("recordSendCompletion", () => {
    it("successfully records completion with valid resultId", async () => {
      const resultId = 1;
      const data = {
        totalSent: 100,
        totalFailed: 2,
        failedUserIds: ["user-1", "user-2"],
      };
      const expectedResult =
        NewsletterSendResultFactory.createNewsletterSendResult({
          id: resultId,
          totalSent: data.totalSent,
          totalFailed: data.totalFailed,
          failedUserIds: data.failedUserIds,
        });
      mockUpdateCompletion.mockResolvedValue(expectedResult);

      const result = await newsletterSendResultService.recordSendCompletion(
        resultId,
        data,
      );

      expect(mockUpdateCompletion).toHaveBeenCalledWith(resultId, {
        totalSent: data.totalSent,
        totalFailed: data.totalFailed,
        failedUserIds: data.failedUserIds,
        completionTime: expect.any(Date),
      });
      expect(result).toEqual(expectedResult);
    });

    it("returns null when resultId is null (early return)", async () => {
      const resultId = null;
      const data = {
        totalSent: 100,
        totalFailed: 0,
        failedUserIds: [],
      };

      const result = await newsletterSendResultService.recordSendCompletion(
        resultId,
        data,
      );

      expect(mockUpdateCompletion).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

      it("returns null when repo.updateCompletion returns null", async () => {
        const resultId = 1;
        const data = {
          totalSent: 100,
          totalFailed: 0,
          failedUserIds: [],
        };
        mockUpdateCompletion.mockResolvedValue(undefined as unknown as Awaited<ReturnType<typeof newsletterSendResultRepo.updateCompletion>>);

      const result = await newsletterSendResultService.recordSendCompletion(
        resultId,
        data,
      );

      expect(mockUpdateCompletion).toHaveBeenCalledWith(resultId, {
        totalSent: data.totalSent,
        totalFailed: data.totalFailed,
        failedUserIds: data.failedUserIds,
        completionTime: expect.any(Date),
      });
      expect(result).toBeNull();
    });

    it("returns null and handles error when repo throws", async () => {
      const resultId = 1;
      const data = {
        totalSent: 100,
        totalFailed: 0,
        failedUserIds: [],
      };
      const error = new Error("Database update failed");
      mockUpdateCompletion.mockRejectedValue(error);

      const result = await newsletterSendResultService.recordSendCompletion(
        resultId,
        data,
      );

      expect(mockUpdateCompletion).toHaveBeenCalledWith(resultId, {
        totalSent: data.totalSent,
        totalFailed: data.totalFailed,
        failedUserIds: data.failedUserIds,
        completionTime: expect.any(Date),
      });
      expect(result).toBeNull();
    });
  });

  describe("getResultsByIssue", () => {
    it("returns results array for valid issueId", async () => {
      const issueId = 1;
      const expectedResults =
        NewsletterSendResultFactory.createNewsletterSendResults(3, {
          issueId,
        });
      mockFindByIssueId.mockResolvedValue(expectedResults);

      const result =
        await newsletterSendResultService.getResultsByIssue(issueId);

      expect(mockFindByIssueId).toHaveBeenCalledWith(issueId);
      expect(result).toEqual(expectedResults);
    });

    it("returns empty array when no results exist", async () => {
      const issueId = 999;
      mockFindByIssueId.mockResolvedValue([]);

      const result =
        await newsletterSendResultService.getResultsByIssue(issueId);

      expect(mockFindByIssueId).toHaveBeenCalledWith(issueId);
      expect(result).toEqual([]);
    });
  });

  describe("getLatestResults", () => {
    it("returns latest results with default limit (10)", async () => {
      const expectedResults =
        NewsletterSendResultFactory.createNewsletterSendResults(10);
      mockFindLatest.mockResolvedValue(expectedResults);

      const result = await newsletterSendResultService.getLatestResults();

      expect(mockFindLatest).toHaveBeenCalledWith(10);
      expect(result).toEqual(expectedResults);
    });

    it("returns latest results with custom limit", async () => {
      const customLimit = 5;
      const expectedResults =
        NewsletterSendResultFactory.createNewsletterSendResults(customLimit);
      mockFindLatest.mockResolvedValue(expectedResults);

      const result =
        await newsletterSendResultService.getLatestResults(customLimit);

      expect(mockFindLatest).toHaveBeenCalledWith(customLimit);
      expect(result).toEqual(expectedResults);
    });

    it("calls repo.findLatest with correct limit", async () => {
      const limit = 20;
      mockFindLatest.mockResolvedValue([]);

      await newsletterSendResultService.getLatestResults(limit);

      expect(mockFindLatest).toHaveBeenCalledWith(limit);
    });
  });

  describe("getResultById", () => {
    it("returns result for valid id", async () => {
      const id = 1;
      const expectedResult =
        NewsletterSendResultFactory.createNewsletterSendResult({ id });
      mockFindById.mockResolvedValue(expectedResult);

      const result = await newsletterSendResultService.getResultById(id);

      expect(mockFindById).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedResult);
    });

    it("returns undefined when result not found", async () => {
      const id = 999;
      mockFindById.mockResolvedValue(undefined);

      const result = await newsletterSendResultService.getResultById(id);

      expect(mockFindById).toHaveBeenCalledWith(id);
      expect(result).toBeUndefined();
    });
  });

  describe("Edge Cases", () => {
    describe("recordSendStart", () => {
      it("handles invalid/future dates", async () => {
        const futureDate = new Date("2099-12-31T23:59:59Z");
        const data = {
          name: "System Design Issue #1",
          issueId: 1,
          startTime: futureDate,
        };
        const expectedResult =
          NewsletterSendResultFactory.createNewsletterSendResult({
            name: data.name,
            issueId: data.issueId,
            startTime: data.startTime,
          });
        mockCreate.mockResolvedValue(expectedResult);

        const result = await newsletterSendResultService.recordSendStart(data);

        expect(mockCreate).toHaveBeenCalledWith({
          name: data.name,
          issueId: data.issueId,
          startTime: futureDate,
        });
        expect(result).toEqual(expectedResult);
      });

      it("handles negative issueId", async () => {
        const data = {
          name: "System Design Issue #1",
          issueId: -1,
          startTime: new Date("2024-01-15T10:00:00Z"),
        };
        const expectedResult =
          NewsletterSendResultFactory.createNewsletterSendResult({
            name: data.name,
            issueId: data.issueId,
            startTime: data.startTime,
          });
        mockCreate.mockResolvedValue(expectedResult);

        const result = await newsletterSendResultService.recordSendStart(data);

        expect(mockCreate).toHaveBeenCalledWith({
          name: data.name,
          issueId: data.issueId,
          startTime: data.startTime,
        });
        expect(result).toEqual(expectedResult);
      });
    });

    describe("recordSendCompletion", () => {
      it("handles negative totalSent", async () => {
        const resultId = 1;
        const data = {
          totalSent: -1,
          totalFailed: 0,
          failedUserIds: [],
        };
        const expectedResult =
          NewsletterSendResultFactory.createNewsletterSendResult({
            id: resultId,
            totalSent: data.totalSent,
            totalFailed: data.totalFailed,
            failedUserIds: data.failedUserIds,
          });
        mockUpdateCompletion.mockResolvedValue(expectedResult);

        const result = await newsletterSendResultService.recordSendCompletion(
          resultId,
          data,
        );

        expect(mockUpdateCompletion).toHaveBeenCalledWith(resultId, {
          totalSent: data.totalSent,
          totalFailed: data.totalFailed,
          failedUserIds: data.failedUserIds,
          completionTime: expect.any(Date),
        });
        expect(result).toEqual(expectedResult);
      });

      it("handles negative totalFailed", async () => {
        const resultId = 1;
        const data = {
          totalSent: 100,
          totalFailed: -1,
          failedUserIds: [],
        };
        const expectedResult =
          NewsletterSendResultFactory.createNewsletterSendResult({
            id: resultId,
            totalSent: data.totalSent,
            totalFailed: data.totalFailed,
            failedUserIds: data.failedUserIds,
          });
        mockUpdateCompletion.mockResolvedValue(expectedResult);

        const result = await newsletterSendResultService.recordSendCompletion(
          resultId,
          data,
        );

        expect(mockUpdateCompletion).toHaveBeenCalledWith(resultId, {
          totalSent: data.totalSent,
          totalFailed: data.totalFailed,
          failedUserIds: data.failedUserIds,
          completionTime: expect.any(Date),
        });
        expect(result).toEqual(expectedResult);
      });

      it("handles totalFailed > totalSent", async () => {
        const resultId = 1;
        const data = {
          totalSent: 50,
          totalFailed: 100,
          failedUserIds: Array.from({ length: 100 }, (_, i) => `user-${i}`),
        };
        const expectedResult =
          NewsletterSendResultFactory.createNewsletterSendResult({
            id: resultId,
            totalSent: data.totalSent,
            totalFailed: data.totalFailed,
            failedUserIds: data.failedUserIds,
          });
        mockUpdateCompletion.mockResolvedValue(expectedResult);

        const result = await newsletterSendResultService.recordSendCompletion(
          resultId,
          data,
        );

        expect(mockUpdateCompletion).toHaveBeenCalledWith(resultId, {
          totalSent: data.totalSent,
          totalFailed: data.totalFailed,
          failedUserIds: data.failedUserIds,
          completionTime: expect.any(Date),
        });
        expect(result).toEqual(expectedResult);
      });

      it("handles empty name string", async () => {
        const resultId = 1;
        const data = {
          totalSent: 100,
          totalFailed: 0,
          failedUserIds: [],
        };
        const expectedResult =
          NewsletterSendResultFactory.createNewsletterSendResult({
            id: resultId,
            name: "",
            totalSent: data.totalSent,
            totalFailed: data.totalFailed,
            failedUserIds: data.failedUserIds,
          });
        mockUpdateCompletion.mockResolvedValue(expectedResult);

        const result = await newsletterSendResultService.recordSendCompletion(
          resultId,
          data,
        );

        expect(result).toEqual(expectedResult);
      });
    });

    describe("getLatestResults", () => {
      it("handles limit = 0", async () => {
        const limit = 0;
        mockFindLatest.mockResolvedValue([]);

        const result = await newsletterSendResultService.getLatestResults(limit);

        expect(mockFindLatest).toHaveBeenCalledWith(limit);
        expect(result).toEqual([]);
      });

      it("handles negative limit", async () => {
        const limit = -1;
        mockFindLatest.mockResolvedValue([]);

        const result = await newsletterSendResultService.getLatestResults(limit);

        expect(mockFindLatest).toHaveBeenCalledWith(limit);
        expect(result).toEqual([]);
      });

      it("handles very large limit (>10000)", async () => {
        const limit = 10001;
        const expectedResults =
          NewsletterSendResultFactory.createNewsletterSendResults(10000);
        mockFindLatest.mockResolvedValue(expectedResults);

        const result = await newsletterSendResultService.getLatestResults(limit);

        expect(mockFindLatest).toHaveBeenCalledWith(limit);
        expect(result).toEqual(expectedResults);
      });
    });

    describe("getResultById", () => {
      it("handles negative id", async () => {
        const id = -1;
        mockFindById.mockResolvedValue(undefined);

        const result = await newsletterSendResultService.getResultById(id);

        expect(mockFindById).toHaveBeenCalledWith(id);
        expect(result).toBeUndefined();
      });

      it("handles zero id", async () => {
        const id = 0;
        mockFindById.mockResolvedValue(undefined);

        const result = await newsletterSendResultService.getResultById(id);

        expect(mockFindById).toHaveBeenCalledWith(id);
        expect(result).toBeUndefined();
      });
    });
  });

  describe("Error Cases", () => {
    describe("recordSendCompletion", () => {
      it("handles completionTime calculation failure", async () => {
        const resultId = 1;
        const data = {
          totalSent: 100,
          totalFailed: 0,
          failedUserIds: [],
        };
        // Mock Date constructor to throw error
        const originalDate = global.Date;
        global.Date = vi.fn(() => {
          throw new Error("Date construction failed");
        }) as unknown as typeof Date;

        await expect(
          newsletterSendResultService.recordSendCompletion(resultId, data),
        ).rejects.toThrow("Date construction failed");

        // Restore Date
        global.Date = originalDate;
      });
    });

    describe("getResultsByIssue", () => {
      it("handles repository throws error", async () => {
        const issueId = 1;
        const error = new Error("Database query failed");
        mockFindByIssueId.mockRejectedValue(error);

        await expect(
          newsletterSendResultService.getResultsByIssue(issueId),
        ).rejects.toThrow("Database query failed");

        expect(mockFindByIssueId).toHaveBeenCalledWith(issueId);
      });

      it("handles database constraint violations", async () => {
        const issueId = 1;
        const error = new Error("Foreign key constraint violation");
        mockFindByIssueId.mockRejectedValue(error);

        await expect(
          newsletterSendResultService.getResultsByIssue(issueId),
        ).rejects.toThrow("Foreign key constraint violation");
      });
    });

    describe("getLatestResults", () => {
      it("handles repository throws error", async () => {
        const limit = 10;
        const error = new Error("Database query failed");
        mockFindLatest.mockRejectedValue(error);

        await expect(
          newsletterSendResultService.getLatestResults(limit),
        ).rejects.toThrow("Database query failed");

        expect(mockFindLatest).toHaveBeenCalledWith(limit);
      });
    });

    describe("getResultById", () => {
      it("handles repository throws error", async () => {
        const id = 1;
        const error = new Error("Database query failed");
        mockFindById.mockRejectedValue(error);

        await expect(
          newsletterSendResultService.getResultById(id),
        ).rejects.toThrow("Database query failed");

        expect(mockFindById).toHaveBeenCalledWith(id);
      });
    });
  });
});
