import {
  sendCampaignToActiveUsers,
  type MarketingCampaignConfig,
} from "~/server/email/campaigns/MarketingCampaignSender";
import { userService } from "~/server/services/UserService";
import { transactionalEmailRepo } from "~/server/db/repo/transactionalEmailRepo";
import { emailService } from "~/server/email/emailService";
import { UserFactory } from "tests/factories";
import { DB_FETCH_SIZE } from "~/server/email/constants/bulkEmailConstants";

vi.mock("~/server/services/UserService", () => ({
  userService: {
    getUsersWithActiveSubscription: vi.fn(),
  },
}));

vi.mock("~/server/db/repo/transactionalEmailRepo", () => ({
  transactionalEmailRepo: {
    getUsersWhoReceivedCampaign: vi.fn(),
  },
}));

vi.mock("~/server/email/emailService", () => ({
  emailService: {
    sendMarketingCampaign: vi.fn(),
  },
}));

vi.mock("~/env", () => ({
  env: {
    AWS_SES_FROM_EMAIL: "noreply@test.com",
    AWS_SES_TRANSACTIONAL_CONFIG_SET: "test-config-set",
  },
}));

const mockedUserService = vi.mocked(userService);
const mockedTransactionalEmailRepo = vi.mocked(transactionalEmailRepo);
const mockedEmailService = vi.mocked(emailService);

describe("MarketingCampaignSender", () => {
  const mockCampaignConfig: MarketingCampaignConfig = {
    campaignId: "test-campaign-2025",
    getContent: () => ({
      subject: "Test Campaign Subject",
      htmlContent: "<p>Test HTML content</p>",
      textContent: "Test text content",
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("sendCampaignToActiveUsers", () => {
    it("successfully sends campaign to all eligible users", async () => {
      const mockUsers = UserFactory.createUsers(3);
      mockedUserService.getUsersWithActiveSubscription
        .mockResolvedValueOnce(mockUsers)
        .mockResolvedValueOnce([]);
      mockedTransactionalEmailRepo.getUsersWhoReceivedCampaign.mockResolvedValue(
        new Set(),
      );
      mockedEmailService.sendMarketingCampaign.mockResolvedValue({
        success: true,
        totalSent: 3,
        totalFailed: 0,
        failedUserIds: [],
      });

      const result = await sendCampaignToActiveUsers(mockCampaignConfig);

      expect(result.success).toBe(true);
      expect(result.totalSent).toBe(3);
      expect(result.totalFailed).toBe(0);
      expect(mockedEmailService.sendMarketingCampaign).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            to: mockUsers[0]!.email,
            from: "noreply@test.com",
            subject: "Test Campaign Subject",
            html: "<p>Test HTML content</p>",
            text: "Test text content",
          }),
        ]),
        "marketing",
        "test-campaign-2025",
      );
    });

    it("returns early with zero sent when no users have active subscriptions", async () => {
      mockedUserService.getUsersWithActiveSubscription.mockResolvedValue([]);

      const result = await sendCampaignToActiveUsers(mockCampaignConfig);

      expect(result).toEqual({
        success: true,
        totalSent: 0,
        totalFailed: 0,
        failedUserIds: [],
      });
      expect(mockedEmailService.sendMarketingCampaign).not.toHaveBeenCalled();
    });

    it("filters out users who already received the campaign", async () => {
      const mockUsers = UserFactory.createUsers(5);
      const alreadyReceivedUserIds = new Set([
        mockUsers[0]!.id,
        mockUsers[2]!.id,
      ]);

      mockedUserService.getUsersWithActiveSubscription
        .mockResolvedValueOnce(mockUsers)
        .mockResolvedValueOnce([]);
      mockedTransactionalEmailRepo.getUsersWhoReceivedCampaign.mockResolvedValue(
        alreadyReceivedUserIds,
      );
      mockedEmailService.sendMarketingCampaign.mockResolvedValue({
        success: true,
        totalSent: 3,
        totalFailed: 0,
        failedUserIds: [],
      });

      await sendCampaignToActiveUsers(mockCampaignConfig);

      const emailRequests =
        mockedEmailService.sendMarketingCampaign.mock.calls[0]![0];
      expect(emailRequests).toHaveLength(3);
      expect(emailRequests.map((r) => r.to)).toEqual([
        mockUsers[1]!.email,
        mockUsers[3]!.email,
        mockUsers[4]!.email,
      ]);
    });

    it("handles multiple batches of users with pagination", async () => {
      const firstBatch = UserFactory.createUsers(DB_FETCH_SIZE);
      const secondBatch = UserFactory.createUsers(10).map((u, i) => ({
        ...u,
        id: `00000000-0000-0000-0001-${String(i + 1).padStart(12, "0")}`,
        email: `secondbatch${i + 1}@example.com`,
      }));

      mockedUserService.getUsersWithActiveSubscription
        .mockResolvedValueOnce(firstBatch)
        .mockResolvedValueOnce(secondBatch)
        .mockResolvedValueOnce([]);
      mockedTransactionalEmailRepo.getUsersWhoReceivedCampaign.mockResolvedValue(
        new Set(),
      );
      mockedEmailService.sendMarketingCampaign
        .mockResolvedValueOnce({
          success: true,
          totalSent: DB_FETCH_SIZE,
          totalFailed: 0,
          failedUserIds: [],
        })
        .mockResolvedValueOnce({
          success: true,
          totalSent: 10,
          totalFailed: 0,
          failedUserIds: [],
        });

      const result = await sendCampaignToActiveUsers(mockCampaignConfig);

      expect(
        mockedUserService.getUsersWithActiveSubscription,
      ).toHaveBeenCalledTimes(3);
      expect(
        mockedUserService.getUsersWithActiveSubscription,
      ).toHaveBeenNthCalledWith(1, 1, DB_FETCH_SIZE);
      expect(
        mockedUserService.getUsersWithActiveSubscription,
      ).toHaveBeenNthCalledWith(2, 2, DB_FETCH_SIZE);
      expect(
        mockedUserService.getUsersWithActiveSubscription,
      ).toHaveBeenNthCalledWith(3, 3, DB_FETCH_SIZE);

      expect(mockedEmailService.sendMarketingCampaign).toHaveBeenCalledTimes(
        2,
      );
      const firstBatchRequests =
        mockedEmailService.sendMarketingCampaign.mock.calls[0]![0];
      const secondBatchRequests =
        mockedEmailService.sendMarketingCampaign.mock.calls[1]![0];
      expect(firstBatchRequests).toHaveLength(DB_FETCH_SIZE);
      expect(secondBatchRequests).toHaveLength(10);

      expect(result.totalSent).toBe(DB_FETCH_SIZE + 10);
      expect(result.totalFailed).toBe(0);
    });

    it("applies personalization when personalizeContent is provided", async () => {
      const mockUsers = UserFactory.createUsers(2);
      const configWithPersonalization: MarketingCampaignConfig = {
        campaignId: "personalized-campaign",
        getContent: () => ({
          subject: "Hello {{name}}!",
          htmlContent: "<p>Dear {{name}},</p>",
          textContent: "Dear {{name}},",
        }),
        personalizeContent: (content, user) => ({
          subject: content.subject.replace(
            "{{name}}",
            user.email.split("@")[0]!,
          ),
          htmlContent: content.htmlContent.replace(
            "{{name}}",
            user.email.split("@")[0]!,
          ),
          textContent: content.textContent.replace(
            "{{name}}",
            user.email.split("@")[0]!,
          ),
        }),
      };

      mockedUserService.getUsersWithActiveSubscription
        .mockResolvedValueOnce(mockUsers)
        .mockResolvedValueOnce([]);
      mockedTransactionalEmailRepo.getUsersWhoReceivedCampaign.mockResolvedValue(
        new Set(),
      );
      mockedEmailService.sendMarketingCampaign.mockResolvedValue({
        success: true,
        totalSent: 2,
        totalFailed: 0,
        failedUserIds: [],
      });

      await sendCampaignToActiveUsers(configWithPersonalization);

      const emailRequests =
        mockedEmailService.sendMarketingCampaign.mock.calls[0]![0];
      expect(emailRequests[0]!.subject).toBe("Hello test1!");
      expect(emailRequests[0]!.html).toBe("<p>Dear test1,</p>");
      expect(emailRequests[1]!.subject).toBe("Hello test2!");
      expect(emailRequests[1]!.html).toBe("<p>Dear test2,</p>");
    });

    it("includes correct message tags in email requests", async () => {
      const mockUsers = UserFactory.createUsers(1);
      mockedUserService.getUsersWithActiveSubscription
        .mockResolvedValueOnce(mockUsers)
        .mockResolvedValueOnce([]);
      mockedTransactionalEmailRepo.getUsersWhoReceivedCampaign.mockResolvedValue(
        new Set(),
      );
      mockedEmailService.sendMarketingCampaign.mockResolvedValue({
        success: true,
        totalSent: 1,
        totalFailed: 0,
        failedUserIds: [],
      });

      await sendCampaignToActiveUsers(mockCampaignConfig);

      const emailRequests =
        mockedEmailService.sendMarketingCampaign.mock.calls[0]![0];
      expect(emailRequests[0]!.tags).toEqual([
        { name: "transactional_email_type", value: "marketing" },
        { name: "campaign_id", value: "test-campaign-2025" },
        { name: "user_id", value: mockUsers[0]!.id },
      ]);
    });

    it("uses correct delivery configuration from env", async () => {
      const mockUsers = UserFactory.createUsers(1);
      mockedUserService.getUsersWithActiveSubscription
        .mockResolvedValueOnce(mockUsers)
        .mockResolvedValueOnce([]);
      mockedTransactionalEmailRepo.getUsersWhoReceivedCampaign.mockResolvedValue(
        new Set(),
      );
      mockedEmailService.sendMarketingCampaign.mockResolvedValue({
        success: true,
        totalSent: 1,
        totalFailed: 0,
        failedUserIds: [],
      });

      await sendCampaignToActiveUsers(mockCampaignConfig);

      const emailRequests =
        mockedEmailService.sendMarketingCampaign.mock.calls[0]![0];
      expect(emailRequests[0]!.deliveryConfiguration).toBe("test-config-set");
    });

    it("handles partial failures from email service", async () => {
      const mockUsers = UserFactory.createUsers(10);
      mockedUserService.getUsersWithActiveSubscription
        .mockResolvedValueOnce(mockUsers)
        .mockResolvedValueOnce([]);
      mockedTransactionalEmailRepo.getUsersWhoReceivedCampaign.mockResolvedValue(
        new Set(),
      );
      mockedEmailService.sendMarketingCampaign.mockResolvedValue({
        success: false,
        totalSent: 7,
        totalFailed: 3,
        failedUserIds: [mockUsers[1]!.id, mockUsers[4]!.id, mockUsers[7]!.id],
      });

      const result = await sendCampaignToActiveUsers(mockCampaignConfig);

      expect(result.success).toBe(false);
      expect(result.totalSent).toBe(7);
      expect(result.totalFailed).toBe(3);
      expect(result.failedUserIds).toHaveLength(3);
    });

    it("returns empty result when all users filtered out", async () => {
      const mockUsers = UserFactory.createUsers(3);
      const allUserIds = new Set(mockUsers.map((u) => u.id));

      mockedUserService.getUsersWithActiveSubscription
        .mockResolvedValueOnce(mockUsers)
        .mockResolvedValueOnce([]);
      mockedTransactionalEmailRepo.getUsersWhoReceivedCampaign.mockResolvedValue(
        allUserIds,
      );

      const result = await sendCampaignToActiveUsers(mockCampaignConfig);

      expect(result).toEqual({
        success: true,
        totalSent: 0,
        totalFailed: 0,
        failedUserIds: [],
      });
      expect(mockedEmailService.sendMarketingCampaign).not.toHaveBeenCalled();
    });

    it("throws when userService.getUsersWithActiveSubscription fails", async () => {
      mockedUserService.getUsersWithActiveSubscription.mockRejectedValue(
        new Error("Database connection failed"),
      );

      await expect(
        sendCampaignToActiveUsers(mockCampaignConfig),
      ).rejects.toThrow("Database connection failed");

      expect(mockedEmailService.sendMarketingCampaign).not.toHaveBeenCalled();
    });

    it("throws when transactionalEmailRepo.getUsersWhoReceivedCampaign fails", async () => {
      const mockUsers = UserFactory.createUsers(3);
      mockedUserService.getUsersWithActiveSubscription.mockResolvedValueOnce(
        mockUsers,
      );
      mockedTransactionalEmailRepo.getUsersWhoReceivedCampaign.mockRejectedValue(
        new Error("Failed to query campaign recipients"),
      );

      await expect(
        sendCampaignToActiveUsers(mockCampaignConfig),
      ).rejects.toThrow("Failed to query campaign recipients");

      expect(mockedEmailService.sendMarketingCampaign).not.toHaveBeenCalled();
    });

    it("throws when emailService.sendMarketingCampaign fails", async () => {
      const mockUsers = UserFactory.createUsers(3);
      mockedUserService.getUsersWithActiveSubscription
        .mockResolvedValueOnce(mockUsers)
        .mockResolvedValueOnce([]);
      mockedTransactionalEmailRepo.getUsersWhoReceivedCampaign.mockResolvedValue(
        new Set(),
      );
      mockedEmailService.sendMarketingCampaign.mockRejectedValue(
        new Error("SES rate limit exceeded"),
      );

      await expect(
        sendCampaignToActiveUsers(mockCampaignConfig),
      ).rejects.toThrow("SES rate limit exceeded");
    });
  });
});
