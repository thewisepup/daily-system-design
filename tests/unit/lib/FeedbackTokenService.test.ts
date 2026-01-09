import {
  generateFeedbackToken,
  generateMarketingFeedbackToken,
  validateFeedbackToken,
  generateFeedbackPageUrl,
  generateMarketingFeedbackPageUrl,
} from "~/lib/jwt/FeedbackTokenService";
import jwt from "jsonwebtoken";
import { env } from "~/env";

vi.mock("~/env", () => ({
  env: {
    JWT_SECRET: "test-secret-key-that-is-at-least-32-chars",
    NEXT_PUBLIC_APP_URL: "https://example.com",
  },
}));

describe("FeedbackTokenService", () => {
  const testUserId = "00000000-0000-0000-0000-000000000001";
  const testIssueId = 123;
  const testCampaignId = "launch_announcement_2026_01";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateFeedbackToken", () => {
    it("generates a valid JWT token with userId and issueId", () => {
      const token = generateFeedbackToken(testUserId, testIssueId);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");

      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        userId: string;
        issueId: number;
      };
      expect(decoded.userId).toBe(testUserId);
      expect(decoded.issueId).toBe(testIssueId);
    });

    it("generates different tokens for different issue IDs", () => {
      const token1 = generateFeedbackToken(testUserId, 1);
      const token2 = generateFeedbackToken(testUserId, 2);

      expect(token1).not.toBe(token2);
    });

    it("generates different tokens for different user IDs", () => {
      const token1 = generateFeedbackToken(testUserId, testIssueId);
      const token2 = generateFeedbackToken(
        "00000000-0000-0000-0000-000000000002",
        testIssueId,
      );

      expect(token1).not.toBe(token2);
    });
  });

  describe("generateMarketingFeedbackToken", () => {
    it("generates a valid JWT token with userId and campaignId", () => {
      const token = generateMarketingFeedbackToken(testUserId, testCampaignId);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");

      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        userId: string;
        campaignId: string;
      };
      expect(decoded.userId).toBe(testUserId);
      expect(decoded.campaignId).toBe(testCampaignId);
    });

    it("generates different tokens for different campaign IDs", () => {
      const token1 = generateMarketingFeedbackToken(testUserId, "campaign_1");
      const token2 = generateMarketingFeedbackToken(testUserId, "campaign_2");

      expect(token1).not.toBe(token2);
    });
  });

  describe("validateFeedbackToken", () => {
    describe("Issue Feedback Tokens", () => {
      it("returns payload for valid issue feedback token", () => {
        const token = generateFeedbackToken(testUserId, testIssueId);

        const result = validateFeedbackToken(token);

        expect(result).not.toBeNull();
        expect(result?.userId).toBe(testUserId);
        expect(result?.issueId).toBe(testIssueId);
        expect(result?.campaignId).toBeUndefined();
      });
    });

    describe("Marketing Feedback Tokens", () => {
      it("returns payload for valid marketing feedback token", () => {
        const token = generateMarketingFeedbackToken(
          testUserId,
          testCampaignId,
        );

        const result = validateFeedbackToken(token);

        expect(result).not.toBeNull();
        expect(result?.userId).toBe(testUserId);
        expect(result?.campaignId).toBe(testCampaignId);
        expect(result?.issueId).toBeUndefined();
      });
    });

    describe("Invalid Tokens", () => {
      it("returns null for invalid token", () => {
        const result = validateFeedbackToken("invalid-token");

        expect(result).toBeNull();
      });

      it("returns null for empty string", () => {
        const result = validateFeedbackToken("");

        expect(result).toBeNull();
      });

      it("returns null for token signed with different secret", () => {
        const token = jwt.sign(
          { userId: testUserId, issueId: testIssueId },
          "different-secret",
        );

        const result = validateFeedbackToken(token);

        expect(result).toBeNull();
      });

      it("returns null for malformed JWT", () => {
        const result = validateFeedbackToken("not.a.valid.jwt");

        expect(result).toBeNull();
      });
    });
  });

  describe("generateFeedbackPageUrl", () => {
    it("generates URL with encoded token for issue feedback", () => {
      const url = generateFeedbackPageUrl(testUserId, testIssueId);

      expect(url).toContain("https://example.com/feedback?token=");
      expect(url).toContain(encodeURIComponent("ey"));
    });

    it("generates URL with valid token that can be decoded", () => {
      const url = generateFeedbackPageUrl(testUserId, testIssueId);

      const tokenMatch = url.match(/token=(.+)$/);
      expect(tokenMatch).not.toBeNull();

      const token = decodeURIComponent(tokenMatch![1]!);
      const result = validateFeedbackToken(token);

      expect(result?.userId).toBe(testUserId);
      expect(result?.issueId).toBe(testIssueId);
    });
  });

  describe("generateMarketingFeedbackPageUrl", () => {
    it("generates URL with encoded token for marketing feedback", () => {
      const url = generateMarketingFeedbackPageUrl(testUserId, testCampaignId);

      expect(url).toContain("https://example.com/feedback?token=");
      expect(url).toContain(encodeURIComponent("ey"));
    });

    it("generates URL with valid token that can be decoded", () => {
      const url = generateMarketingFeedbackPageUrl(testUserId, testCampaignId);

      const tokenMatch = url.match(/token=(.+)$/);
      expect(tokenMatch).not.toBeNull();

      const token = decodeURIComponent(tokenMatch![1]!);
      const result = validateFeedbackToken(token);

      expect(result?.userId).toBe(testUserId);
      expect(result?.campaignId).toBe(testCampaignId);
    });
  });
});

