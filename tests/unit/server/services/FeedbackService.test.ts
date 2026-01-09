import { feedbackService } from "~/server/services/FeedbackService";
import { feedbackRepo } from "~/server/db/repo/FeedbackRepo";
import { sanitizeInput } from "~/lib/sanitize";
import { FeedbackFactory } from "tests/factories";
import { ZodError } from "zod";

vi.mock("~/server/db/repo/FeedbackRepo", () => ({
  feedbackRepo: {
    submitFeedback: vi.fn(),
  },
}));

vi.mock("~/lib/sanitize", () => ({
  sanitizeInput: vi.fn((input: string) => input),
}));

const mockedFeedbackRepo = vi.mocked(feedbackRepo);
const mockedSanitizeInput = vi.mocked(sanitizeInput);

describe("FeedbackService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("submitFeedback", () => {
    describe("Happy Paths", () => {
      it("successfully submits feedback with all required fields", async () => {
        const feedbackData = {
          userId: "00000000-0000-0000-0000-000000000001",
          issueId: 1,
          feedback: "This is great feedback!",
        };
        const expectedFeedback = FeedbackFactory.createFeedback(feedbackData);
        mockedSanitizeInput.mockReturnValue(feedbackData.feedback);
        mockedFeedbackRepo.submitFeedback.mockResolvedValue([expectedFeedback]);

        const result = await feedbackService.submitFeedback(feedbackData);

        expect(mockedSanitizeInput).toHaveBeenCalledWith(feedbackData.feedback);
        expect(mockedFeedbackRepo.submitFeedback).toHaveBeenCalledWith({
          ...feedbackData,
          feedback: feedbackData.feedback,
        });
        expect(result).toEqual([expectedFeedback]);
      });

      it("successfully submits feedback with optional rating", async () => {
        const feedbackData = {
          userId: "00000000-0000-0000-0000-000000000001",
          issueId: 1,
          feedback: "This is great feedback!",
          rating: 4.5,
        };
        const expectedFeedback = FeedbackFactory.createFeedback(feedbackData);
        mockedSanitizeInput.mockReturnValue(feedbackData.feedback);
        mockedFeedbackRepo.submitFeedback.mockResolvedValue([expectedFeedback]);

        const result = await feedbackService.submitFeedback(feedbackData);

        expect(mockedSanitizeInput).toHaveBeenCalledWith(feedbackData.feedback);
        expect(mockedFeedbackRepo.submitFeedback).toHaveBeenCalledWith({
          ...feedbackData,
          feedback: feedbackData.feedback,
        });
        expect(result).toEqual([expectedFeedback]);
      });

      it("successfully submits feedback without rating (undefined)", async () => {
        const feedbackData = {
          userId: "00000000-0000-0000-0000-000000000001",
          issueId: 1,
          feedback: "This is great feedback!",
          rating: undefined,
        };
        const expectedFeedback = FeedbackFactory.createFeedback(feedbackData);
        mockedSanitizeInput.mockReturnValue(feedbackData.feedback);
        mockedFeedbackRepo.submitFeedback.mockResolvedValue([expectedFeedback]);

        const result = await feedbackService.submitFeedback(feedbackData);

        expect(mockedSanitizeInput).toHaveBeenCalledWith(feedbackData.feedback);
        expect(mockedFeedbackRepo.submitFeedback).toHaveBeenCalledWith({
          userId: feedbackData.userId,
          issueId: feedbackData.issueId,
          feedback: feedbackData.feedback,
        });
        expect(result).toEqual([expectedFeedback]);
      });

      it("sanitizes feedback content before passing to repo", async () => {
        const rawFeedback = "<script>alert('xss')</script>Great content!";
        const sanitizedFeedback = "Great content!";
        const feedbackData = {
          userId: "00000000-0000-0000-0000-000000000001",
          issueId: 1,
          feedback: rawFeedback,
        };
        const expectedFeedback = FeedbackFactory.createFeedback({
          ...feedbackData,
          feedback: sanitizedFeedback,
        });
        mockedSanitizeInput.mockReturnValue(sanitizedFeedback);
        mockedFeedbackRepo.submitFeedback.mockResolvedValue([expectedFeedback]);

        await feedbackService.submitFeedback(feedbackData);

        expect(mockedSanitizeInput).toHaveBeenCalledWith(rawFeedback);
        expect(mockedFeedbackRepo.submitFeedback).toHaveBeenCalledWith({
          ...feedbackData,
          feedback: sanitizedFeedback,
        });
      });
    });

    describe("Zod Validation Errors", () => {
      it("throws on missing userId", async () => {
        const invalidData = {
          issueId: 1,
          feedback: "Test feedback",
        } as unknown as {
          userId: string;
          issueId: number;
          feedback: string;
        };

        await expect(
          feedbackService.submitFeedback(invalidData),
        ).rejects.toThrow(ZodError);
        expect(mockedSanitizeInput).not.toHaveBeenCalled();
        expect(mockedFeedbackRepo.submitFeedback).not.toHaveBeenCalled();
      });

      it("throws on missing issueId", async () => {
        const invalidData = {
          userId: "00000000-0000-0000-0000-000000000001",
          feedback: "Test feedback",
        } as unknown as {
          userId: string;
          issueId: number;
          feedback: string;
        };

        await expect(
          feedbackService.submitFeedback(invalidData),
        ).rejects.toThrow(ZodError);
        expect(mockedSanitizeInput).not.toHaveBeenCalled();
        expect(mockedFeedbackRepo.submitFeedback).not.toHaveBeenCalled();
      });

      it("throws on missing feedback string", async () => {
        const invalidData = {
          userId: "00000000-0000-0000-0000-000000000001",
          issueId: 1,
        } as unknown as {
          userId: string;
          issueId: number;
          feedback: string;
        };

        await expect(
          feedbackService.submitFeedback(invalidData),
        ).rejects.toThrow(ZodError);
        expect(mockedSanitizeInput).not.toHaveBeenCalled();
        expect(mockedFeedbackRepo.submitFeedback).not.toHaveBeenCalled();
      });

      it("throws on rating < 0", async () => {
        const invalidData = {
          userId: "00000000-0000-0000-0000-000000000001",
          issueId: 1,
          feedback: "Test feedback",
          rating: -1,
        };

        await expect(
          feedbackService.submitFeedback(invalidData),
        ).rejects.toThrow(ZodError);
        expect(mockedSanitizeInput).not.toHaveBeenCalled();
        expect(mockedFeedbackRepo.submitFeedback).not.toHaveBeenCalled();
      });

      it("throws on rating > 5", async () => {
        const invalidData = {
          userId: "00000000-0000-0000-0000-000000000001",
          issueId: 1,
          feedback: "Test feedback",
          rating: 6,
        };

        await expect(
          feedbackService.submitFeedback(invalidData),
        ).rejects.toThrow(ZodError);
        expect(mockedSanitizeInput).not.toHaveBeenCalled();
        expect(mockedFeedbackRepo.submitFeedback).not.toHaveBeenCalled();
      });
    });

    describe("Edge Cases", () => {
      it("sanitizes XSS content (e.g., <script>alert('xss')</script>)", async () => {
        const xssContent = "<script>alert('xss')</script>Malicious content";
        const sanitizedContent = "Malicious content";
        const feedbackData = {
          userId: "00000000-0000-0000-0000-000000000001",
          issueId: 1,
          feedback: xssContent,
        };
        const expectedFeedback = FeedbackFactory.createFeedback({
          ...feedbackData,
          feedback: sanitizedContent,
        });
        mockedSanitizeInput.mockReturnValue(sanitizedContent);
        mockedFeedbackRepo.submitFeedback.mockResolvedValue([expectedFeedback]);

        await feedbackService.submitFeedback(feedbackData);

        expect(mockedSanitizeInput).toHaveBeenCalledWith(xssContent);
        expect(mockedFeedbackRepo.submitFeedback).toHaveBeenCalledWith({
          ...feedbackData,
          feedback: sanitizedContent,
        });
      });

      it("handles empty feedback string after sanitization", async () => {
        const rawFeedback = "<script></script>";
        const sanitizedFeedback = "";
        const feedbackData = {
          userId: "00000000-0000-0000-0000-000000000001",
          issueId: 1,
          feedback: rawFeedback,
        };
        const expectedFeedback = FeedbackFactory.createFeedback({
          ...feedbackData,
          feedback: sanitizedFeedback,
        });
        mockedSanitizeInput.mockReturnValue(sanitizedFeedback);
        mockedFeedbackRepo.submitFeedback.mockResolvedValue([expectedFeedback]);

        const result = await feedbackService.submitFeedback(feedbackData);

        expect(mockedSanitizeInput).toHaveBeenCalledWith(rawFeedback);
        expect(mockedFeedbackRepo.submitFeedback).toHaveBeenCalledWith({
          ...feedbackData,
          feedback: sanitizedFeedback,
        });
        expect(result).toEqual([expectedFeedback]);
      });
    });

    describe("Additional Edge Cases", () => {
      it("handles rating boundary value exactly 0", async () => {
        const feedbackData = {
          userId: "00000000-0000-0000-0000-000000000001",
          issueId: 1,
          feedback: "Test feedback",
          rating: 0,
        };
        const expectedFeedback = FeedbackFactory.createFeedback(feedbackData);
        mockedSanitizeInput.mockReturnValue(feedbackData.feedback);
        mockedFeedbackRepo.submitFeedback.mockResolvedValue([expectedFeedback]);

        const result = await feedbackService.submitFeedback(feedbackData);

        expect(result).toEqual([expectedFeedback]);
      });

      it("handles rating boundary value exactly 5", async () => {
        const feedbackData = {
          userId: "00000000-0000-0000-0000-000000000001",
          issueId: 1,
          feedback: "Test feedback",
          rating: 5,
        };
        const expectedFeedback = FeedbackFactory.createFeedback(feedbackData);
        mockedSanitizeInput.mockReturnValue(feedbackData.feedback);
        mockedFeedbackRepo.submitFeedback.mockResolvedValue([expectedFeedback]);

        const result = await feedbackService.submitFeedback(feedbackData);

        expect(result).toEqual([expectedFeedback]);
      });

      it("handles rating with many decimal places (4.999999999)", async () => {
        const feedbackData = {
          userId: "00000000-0000-0000-0000-000000000001",
          issueId: 1,
          feedback: "Test feedback",
          rating: 4.999999999,
        };
        const expectedFeedback = FeedbackFactory.createFeedback(feedbackData);
        mockedSanitizeInput.mockReturnValue(feedbackData.feedback);
        mockedFeedbackRepo.submitFeedback.mockResolvedValue([expectedFeedback]);

        const result = await feedbackService.submitFeedback(feedbackData);

        expect(result).toEqual([expectedFeedback]);
      });

      it("handles invalid userId format (not a valid UUID string)", async () => {
        const invalidData = {
          userId: "not-a-uuid",
          issueId: 1,
          feedback: "Test feedback",
        };

        await expect(
          feedbackService.submitFeedback(invalidData),
        ).rejects.toThrow(ZodError);
      });

      it("handles negative issueId", async () => {
        const invalidData = {
          userId: "00000000-0000-0000-0000-000000000001",
          issueId: -1,
          feedback: "Test feedback",
        };

        // Note: Zod doesn't validate number range by default, so this might pass
        // But we test the behavior anyway
        const expectedFeedback = FeedbackFactory.createFeedback(invalidData);
        mockedSanitizeInput.mockReturnValue(invalidData.feedback);
        mockedFeedbackRepo.submitFeedback.mockResolvedValue([expectedFeedback]);

        const result = await feedbackService.submitFeedback(invalidData);

        expect(result).toEqual([expectedFeedback]);
      });

      it("handles zero issueId", async () => {
        const invalidData = {
          userId: "00000000-0000-0000-0000-000000000001",
          issueId: 0,
          feedback: "Test feedback",
        };

        const expectedFeedback = FeedbackFactory.createFeedback(invalidData);
        mockedSanitizeInput.mockReturnValue(invalidData.feedback);
        mockedFeedbackRepo.submitFeedback.mockResolvedValue([expectedFeedback]);

        const result = await feedbackService.submitFeedback(invalidData);

        expect(result).toEqual([expectedFeedback]);
      });

      it("handles very long feedback strings (>10000 chars)", async () => {
        const longFeedback = "A".repeat(10001);
        const feedbackData = {
          userId: "00000000-0000-0000-0000-000000000001",
          issueId: 1,
          feedback: longFeedback,
        };
        // sanitizeInput truncates to 10000 chars
        const sanitizedFeedback = longFeedback.slice(0, 10000);
        const expectedFeedback = FeedbackFactory.createFeedback({
          ...feedbackData,
          feedback: sanitizedFeedback,
        });
        mockedSanitizeInput.mockReturnValue(sanitizedFeedback);
        mockedFeedbackRepo.submitFeedback.mockResolvedValue([expectedFeedback]);

        const result = await feedbackService.submitFeedback(feedbackData);

        expect(mockedSanitizeInput).toHaveBeenCalledWith(longFeedback);
        expect(result).toEqual([expectedFeedback]);
      });
    });

    describe("Error Cases", () => {
      it("handles repository throws error", async () => {
        const feedbackData = {
          userId: "00000000-0000-0000-0000-000000000001",
          issueId: 1,
          feedback: "Test feedback",
        };
        const error = new Error("Database connection failed");
        mockedSanitizeInput.mockReturnValue(feedbackData.feedback);
        mockedFeedbackRepo.submitFeedback.mockRejectedValue(error);

        await expect(
          feedbackService.submitFeedback(feedbackData),
        ).rejects.toThrow("Database connection failed");

        expect(mockedSanitizeInput).toHaveBeenCalledWith(feedbackData.feedback);
        expect(mockedFeedbackRepo.submitFeedback).toHaveBeenCalled();
      });

      it("handles sanitizeInput throws error", async () => {
        const feedbackData = {
          userId: "00000000-0000-0000-0000-000000000001",
          issueId: 1,
          feedback: "Test feedback",
        };
        const error = new Error("Sanitization failed");
        mockedSanitizeInput.mockImplementation(() => {
          throw error;
        });

        await expect(
          feedbackService.submitFeedback(feedbackData),
        ).rejects.toThrow("Sanitization failed");

        expect(mockedSanitizeInput).toHaveBeenCalledWith(feedbackData.feedback);
        expect(mockedFeedbackRepo.submitFeedback).not.toHaveBeenCalled();
      });

      it("handles sanitizeInput returns malformed data", async () => {
        const feedbackData = {
          userId: "00000000-0000-0000-0000-000000000001",
          issueId: 1,
          feedback: "Test feedback",
        };
        // Mock sanitizeInput to return empty string (malformed)
        mockedSanitizeInput.mockReturnValue("");
        mockedFeedbackRepo.submitFeedback.mockResolvedValue([]);

        await feedbackService.submitFeedback(feedbackData);

        expect(mockedSanitizeInput).toHaveBeenCalledWith(feedbackData.feedback);
        expect(mockedFeedbackRepo.submitFeedback).toHaveBeenCalledWith({
          ...feedbackData,
          feedback: "",
        });
      });

      it("handles database constraint violations", async () => {
        const feedbackData = {
          userId: "00000000-0000-0000-0000-000000000001",
          issueId: 1,
          feedback: "Test feedback",
        };
        const error = new Error("Foreign key constraint violation");
        mockedSanitizeInput.mockReturnValue(feedbackData.feedback);
        mockedFeedbackRepo.submitFeedback.mockRejectedValue(error);

        await expect(
          feedbackService.submitFeedback(feedbackData),
        ).rejects.toThrow("Foreign key constraint violation");
      });
    });
  });
});
