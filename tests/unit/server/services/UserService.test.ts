import { userService } from "~/server/services/UserService";
import { userRepo } from "~/server/db/repo/userRepo";
import { subscriptionService } from "~/server/services/SubscriptionService";
import { sendWelcomeEmail } from "~/server/email/transactional/welcomeEmail";
import { invalidateCache, CACHE_KEYS } from "~/server/redis";
import { UserFactory, SubscriptionFactory } from "tests/factories";
import { SYSTEM_DESIGN_SUBJECT_ID } from "~/lib/constants";

vi.mock("~/server/db/repo/userRepo", () => ({
  userRepo: {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    bulkCreate: vi.fn(),
    findUsersWithActiveSubscription: vi.fn(),
    getDailySignupStats: vi.fn(),
    getSignupStatistics: vi.fn(),
    deleteUserCascading: vi.fn(),
  },
}));

vi.mock("~/server/services/SubscriptionService", () => ({
  subscriptionService: {
    ensureSubscriptionExists: vi.fn(),
    bulkCreateSubscription: vi.fn(),
    getNumberOfUserUnsubscribes: vi.fn(),
    setActiveUsersCountCache: vi.fn(),
  },
}));

vi.mock("~/server/email/transactional/welcomeEmail", () => ({
  sendWelcomeEmail: vi.fn(),
}));

vi.mock("~/server/redis", () => ({
  invalidateCache: vi.fn(),
  CACHE_KEYS: {
    SUBSCRIBER_COUNT: "subscriber_count",
  },
}));

const mockedUserRepo = vi.mocked(userRepo);
const mockedSubscriptionService = vi.mocked(subscriptionService);
const mockedSendWelcomeEmail = vi.mocked(sendWelcomeEmail);
const mockedInvalidateCache = vi.mocked(invalidateCache);

describe("UserService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findByEmail", () => {
    it("successfully finds user by email", async () => {
      const email = "test@example.com";
      const mockUser = UserFactory.createUser({ email });
      mockedUserRepo.findByEmail.mockResolvedValue(mockUser);

      const result = await userService.findByEmail(email);

      expect(mockedUserRepo.findByEmail).toHaveBeenCalledWith(email);
      expect(result).toEqual(mockUser);
    });

    it("returns undefined when user not found", async () => {
      mockedUserRepo.findByEmail.mockResolvedValue(undefined);

      const result = await userService.findByEmail("nonexistent@example.com");

      expect(result).toBeUndefined();
    });

    it("handles email with special characters", async () => {
      const email = "user+tag@example.com";
      const mockUser = UserFactory.createUser({ email });
      mockedUserRepo.findByEmail.mockResolvedValue(mockUser);

      await userService.findByEmail(email);

      expect(mockedUserRepo.findByEmail).toHaveBeenCalledWith(email);
    });
  });

  describe("findByUserId", () => {
    it("successfully finds user by ID", async () => {
      const userId = "00000000-0000-0000-0000-000000000001";
      const mockUser = UserFactory.createUser({ id: userId });
      mockedUserRepo.findById.mockResolvedValue(mockUser);

      const result = await userService.findByUserId(userId);

      expect(mockedUserRepo.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });

    it("returns undefined when user not found", async () => {
      mockedUserRepo.findById.mockResolvedValue(undefined);

      const result = await userService.findByUserId(
        "00000000-0000-0000-0000-000000000999",
      );

      expect(result).toBeUndefined();
    });
  });

  describe("createUser", () => {
    it("successfully creates user with all side effects", async () => {
      const email = "newuser@example.com";
      const mockUser = UserFactory.createUser({ email });
      const mockSubscription = SubscriptionFactory.createSubscription({
        userId: mockUser.id,
        subjectId: SYSTEM_DESIGN_SUBJECT_ID,
      });
      mockedUserRepo.create.mockResolvedValue(mockUser);
      mockedSubscriptionService.ensureSubscriptionExists.mockResolvedValue(
        mockSubscription,
      );
      mockedSendWelcomeEmail.mockResolvedValue({
        status: "sent",
        messageId: "test-message-id",
        userId: mockUser.id,
      });
      mockedSubscriptionService.setActiveUsersCountCache.mockResolvedValue(1);

      const result = await userService.createUser(email);

      expect(mockedUserRepo.create).toHaveBeenCalledWith({ email });
      expect(
        mockedSubscriptionService.ensureSubscriptionExists,
      ).toHaveBeenCalledWith(mockUser.id, SYSTEM_DESIGN_SUBJECT_ID);
      expect(mockedInvalidateCache).toHaveBeenCalledWith(
        CACHE_KEYS.SUBSCRIBER_COUNT,
      );
      expect(mockedSendWelcomeEmail).toHaveBeenCalledWith(mockUser.id);
      expect(
        mockedSubscriptionService.setActiveUsersCountCache,
      ).toHaveBeenCalledWith(SYSTEM_DESIGN_SUBJECT_ID);
      expect(result).toEqual(mockUser);
    });

    it("throws error when user creation fails", async () => {
      const email = "test@example.com";
      mockedUserRepo.create.mockResolvedValue(undefined);

      await expect(userService.createUser(email)).rejects.toThrow(
        `Failed to create user with email: ${email}`,
      );

      expect(mockedUserRepo.create).toHaveBeenCalledWith({ email });
      expect(
        mockedSubscriptionService.ensureSubscriptionExists,
      ).not.toHaveBeenCalled();
      expect(mockedSendWelcomeEmail).not.toHaveBeenCalled();
    });

    it("throws error when subscription creation fails", async () => {
      const email = "test@example.com";
      const mockUser = UserFactory.createUser({ email });
      mockedUserRepo.create.mockResolvedValue(mockUser);
      mockedSubscriptionService.ensureSubscriptionExists.mockRejectedValue(
        new Error("Subscription creation failed"),
      );

      await expect(userService.createUser(email)).rejects.toThrow(
        "Subscription creation failed",
      );

      expect(mockedUserRepo.create).toHaveBeenCalledWith({ email });
      expect(
        mockedSubscriptionService.ensureSubscriptionExists,
      ).toHaveBeenCalledWith(mockUser.id, SYSTEM_DESIGN_SUBJECT_ID);
    });

    it("handles email with special characters", async () => {
      const email = "user+tag@subdomain.example.com";
      const mockUser = UserFactory.createUser({ email });
      const mockSubscription = SubscriptionFactory.createSubscription({
        userId: mockUser.id,
        subjectId: SYSTEM_DESIGN_SUBJECT_ID,
      });
      mockedUserRepo.create.mockResolvedValue(mockUser);
      mockedSubscriptionService.ensureSubscriptionExists.mockResolvedValue(
        mockSubscription,
      );
      mockedSendWelcomeEmail.mockResolvedValue({
        status: "sent",
        messageId: "test-message-id",
        userId: mockUser.id,
      });
      mockedSubscriptionService.setActiveUsersCountCache.mockResolvedValue(1);

      await userService.createUser(email);

      expect(mockedUserRepo.create).toHaveBeenCalledWith({ email });
    });
  });

  describe("bulkCreateUsers", () => {
    it("successfully creates multiple users", async () => {
      const emails = ["user1@example.com", "user2@example.com"];
      const mockUsers = UserFactory.createUsers(2);
      const subjectId = SYSTEM_DESIGN_SUBJECT_ID;
      const mockSubscriptions = SubscriptionFactory.createSubscriptions(2, {
        subjectId,
      });
      mockedUserRepo.bulkCreate.mockResolvedValue(mockUsers);
      mockedSubscriptionService.bulkCreateSubscription.mockResolvedValue(
        mockSubscriptions,
      );

      const result = await userService.bulkCreateUsers(emails, subjectId);

      expect(mockedUserRepo.bulkCreate).toHaveBeenCalledWith([
        { email: emails[0] },
        { email: emails[1] },
      ]);
      expect(
        mockedSubscriptionService.bulkCreateSubscription,
      ).toHaveBeenCalledWith(
        mockUsers.map((u) => u.id),
        subjectId,
      );
      expect(mockedInvalidateCache).toHaveBeenCalledWith(
        CACHE_KEYS.SUBSCRIBER_COUNT,
      );
      expect(result).toEqual(mockUsers);
    });

    it("returns empty array when emails array is empty", async () => {
      const result = await userService.bulkCreateUsers(
        [],
        SYSTEM_DESIGN_SUBJECT_ID,
      );

      expect(result).toEqual([]);
      expect(mockedUserRepo.bulkCreate).not.toHaveBeenCalled();
      expect(
        mockedSubscriptionService.bulkCreateSubscription,
      ).not.toHaveBeenCalled();
    });

    it("handles large batch of users", async () => {
      const emails = Array.from({ length: 100 }, (_, i) => `user${i}@test.com`);
      const mockUsers = UserFactory.createUsers(100);
      const mockSubscriptions = SubscriptionFactory.createSubscriptions(100, {
        subjectId: SYSTEM_DESIGN_SUBJECT_ID,
      });
      mockedUserRepo.bulkCreate.mockResolvedValue(mockUsers);
      mockedSubscriptionService.bulkCreateSubscription.mockResolvedValue(
        mockSubscriptions,
      );

      const result = await userService.bulkCreateUsers(
        emails,
        SYSTEM_DESIGN_SUBJECT_ID,
      );

      expect(result.length).toBe(100);
      expect(mockedUserRepo.bulkCreate).toHaveBeenCalledTimes(1);
    });

    it("throws error when bulk create fails", async () => {
      const emails = ["user1@example.com", "user2@example.com"];
      mockedUserRepo.bulkCreate.mockRejectedValue(
        new Error("Bulk insert failed"),
      );

      await expect(
        userService.bulkCreateUsers(emails, SYSTEM_DESIGN_SUBJECT_ID),
      ).rejects.toThrow("Bulk insert failed");
    });
  });

  describe("getUsersWithActiveSubscription", () => {
    it("successfully retrieves users with default pagination", async () => {
      const mockUsers = UserFactory.createUsers(25);
      mockedUserRepo.findUsersWithActiveSubscription.mockResolvedValue(
        mockUsers,
      );

      const result = await userService.getUsersWithActiveSubscription();

      expect(
        mockedUserRepo.findUsersWithActiveSubscription,
      ).toHaveBeenCalledWith(1, 25);
      expect(result).toEqual(mockUsers);
    });

    it("successfully retrieves users with custom pagination", async () => {
      const mockUsers = UserFactory.createUsers(10);
      mockedUserRepo.findUsersWithActiveSubscription.mockResolvedValue(
        mockUsers,
      );

      const result = await userService.getUsersWithActiveSubscription(2, 10);

      expect(
        mockedUserRepo.findUsersWithActiveSubscription,
      ).toHaveBeenCalledWith(2, 10);
      expect(result).toEqual(mockUsers);
    });

    it("handles empty result set", async () => {
      mockedUserRepo.findUsersWithActiveSubscription.mockResolvedValue([]);

      const result = await userService.getUsersWithActiveSubscription(10, 25);

      expect(result).toEqual([]);
    });

    it("handles large page size", async () => {
      const mockUsers = UserFactory.createUsers(100);
      mockedUserRepo.findUsersWithActiveSubscription.mockResolvedValue(
        mockUsers,
      );

      await userService.getUsersWithActiveSubscription(1, 100);

      expect(
        mockedUserRepo.findUsersWithActiveSubscription,
      ).toHaveBeenCalledWith(1, 100);
    });
  });

  describe("getDailySignupStats", () => {
    it("successfully retrieves daily signup stats", async () => {
      const days = 7;
      const mockStats = [
        { date: "2025-12-28", count: 5 },
        { date: "2025-12-27", count: 3 },
      ];
      mockedUserRepo.getDailySignupStats.mockResolvedValue(mockStats);

      const result = await userService.getDailySignupStats(days);

      expect(mockedUserRepo.getDailySignupStats).toHaveBeenCalledWith(days);
      expect(result).toEqual(mockStats);
    });

    it("handles zero days", async () => {
      mockedUserRepo.getDailySignupStats.mockResolvedValue([]);

      const result = await userService.getDailySignupStats(0);

      expect(result).toEqual([]);
    });

    it("handles large day range", async () => {
      const days = 365;
      const mockStats = Array.from({ length: 365 }, (_, i) => ({
        date: `2025-${String((i % 12) + 1).padStart(2, "0")}-01`,
        count: i,
      }));
      mockedUserRepo.getDailySignupStats.mockResolvedValue(mockStats);

      const result = await userService.getDailySignupStats(days);

      expect(result.length).toBe(365);
    });
  });

  describe("getSignupStatistics", () => {
    it("successfully retrieves combined signup statistics", async () => {
      const subjectId = SYSTEM_DESIGN_SUBJECT_ID;
      const days = 30;
      const mockSignupStats = {
        today: 5,
        week: 35,
        month: 150,
        total: 1000,
        avgDaily: 5.5,
      };
      const numberOfUnsubscribes = 10;

      mockedSubscriptionService.getNumberOfUserUnsubscribes.mockResolvedValue(
        numberOfUnsubscribes,
      );
      mockedUserRepo.getSignupStatistics.mockResolvedValue(mockSignupStats);

      const result = await userService.getSignupStatistics(subjectId, days);

      expect(
        mockedSubscriptionService.getNumberOfUserUnsubscribes,
      ).toHaveBeenCalledWith(subjectId, days);
      expect(mockedUserRepo.getSignupStatistics).toHaveBeenCalled();
      expect(result).toEqual({
        ...mockSignupStats,
        numberOfUnsubscribes,
      });
    });

    it("handles zero unsubscribes", async () => {
      const mockSignupStats = {
        today: 5,
        week: 35,
        month: 150,
        total: 1000,
        avgDaily: 5.5,
      };
      mockedSubscriptionService.getNumberOfUserUnsubscribes.mockResolvedValue(
        0,
      );
      mockedUserRepo.getSignupStatistics.mockResolvedValue(mockSignupStats);

      const result = await userService.getSignupStatistics(
        SYSTEM_DESIGN_SUBJECT_ID,
        30,
      );

      expect(result.numberOfUnsubscribes).toBe(0);
    });

    it("calls both data sources in parallel", async () => {
      const mockSignupStats = {
        today: 5,
        week: 35,
        month: 150,
        total: 1000,
        avgDaily: 5.5,
      };
      mockedSubscriptionService.getNumberOfUserUnsubscribes.mockResolvedValue(
        10,
      );
      mockedUserRepo.getSignupStatistics.mockResolvedValue(mockSignupStats);

      await userService.getSignupStatistics(SYSTEM_DESIGN_SUBJECT_ID, 30);

      expect(
        mockedSubscriptionService.getNumberOfUserUnsubscribes,
      ).toHaveBeenCalledTimes(1);
      expect(mockedUserRepo.getSignupStatistics).toHaveBeenCalledTimes(1);
    });
  });

  describe("getUserById", () => {
    it("successfully retrieves user by ID", async () => {
      const userId = "00000000-0000-0000-0000-000000000001";
      const mockUser = UserFactory.createUser({ id: userId });
      mockedUserRepo.findById.mockResolvedValue(mockUser);

      const result = await userService.getUserById(userId);

      expect(mockedUserRepo.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });

    it("returns undefined when user not found", async () => {
      mockedUserRepo.findById.mockResolvedValue(undefined);

      const result = await userService.getUserById(
        "00000000-0000-0000-0000-000000000999",
      );

      expect(result).toBeUndefined();
    });
  });

  describe("deleteUser", () => {
    it("successfully deletes user cascading", async () => {
      const userId = "00000000-0000-0000-0000-000000000001";
      const mockResult = { success: true };
      mockedUserRepo.deleteUserCascading.mockResolvedValue(mockResult);

      const result = await userService.deleteUser(userId);

      expect(mockedUserRepo.deleteUserCascading).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockResult);
    });

    it("handles deletion failure", async () => {
      const userId = "00000000-0000-0000-0000-000000000001";
      mockedUserRepo.deleteUserCascading.mockRejectedValue(
        new Error("Deletion failed"),
      );

      await expect(userService.deleteUser(userId)).rejects.toThrow(
        "Deletion failed",
      );
    });

    it("handles non-existent user deletion", async () => {
      const userId = "00000000-0000-0000-0000-000000000999";
      mockedUserRepo.deleteUserCascading.mockResolvedValue({ success: true });

      const result = await userService.deleteUser(userId);

      expect(result).toEqual({ success: true });
    });
  });

  describe("Error Cases", () => {
    it("handles repository error in findByEmail", async () => {
      mockedUserRepo.findByEmail.mockRejectedValue(
        new Error("Database connection failed"),
      );

      await expect(userService.findByEmail("test@example.com")).rejects.toThrow(
        "Database connection failed",
      );
    });

    it("handles repository error in createUser", async () => {
      mockedUserRepo.create.mockRejectedValue(
        new Error("Constraint violation"),
      );

      await expect(userService.createUser("test@example.com")).rejects.toThrow(
        "Constraint violation",
      );
    });

    it("handles welcome email failure gracefully", async () => {
      const email = "test@example.com";
      const mockUser = UserFactory.createUser({ email });
      const mockSubscription = SubscriptionFactory.createSubscription({
        userId: mockUser.id,
        subjectId: SYSTEM_DESIGN_SUBJECT_ID,
      });
      mockedUserRepo.create.mockResolvedValue(mockUser);
      mockedSubscriptionService.ensureSubscriptionExists.mockResolvedValue(
        mockSubscription,
      );
      mockedSendWelcomeEmail.mockRejectedValue(new Error("Email service down"));

      await expect(userService.createUser(email)).rejects.toThrow(
        "Email service down",
      );
    });
  });
});
