import { userService } from "~/server/services/UserService";
import { userRepo } from "~/server/db/repo/userRepo";
import { subscriptionService } from "~/server/services/SubscriptionService";
import { sendWelcomeEmail } from "~/server/email/transactional/welcomeEmail";
import { invalidateCache, CACHE_KEYS } from "~/server/redis";
import { SYSTEM_DESIGN_SUBJECT_ID } from "~/lib/constants";
import { UserFactory } from "~/test/factories";

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
    SUBSCRIBER_COUNT: "test:daily-system-design:subscriber-count",
  },
}));

vi.mock("~/lib/constants", () => ({
  SYSTEM_DESIGN_SUBJECT_ID: 1,
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
    it("returns user for valid email", async () => {
      const email = "test@example.com";
      const user = UserFactory.createUser({ email });
      mockedUserRepo.findByEmail.mockResolvedValue(user);

      const result = await userService.findByEmail(email);

      expect(mockedUserRepo.findByEmail).toHaveBeenCalledWith(email);
      expect(result).toEqual(user);
    });

    it("returns undefined when user not found", async () => {
      const email = "nonexistent@example.com";
      mockedUserRepo.findByEmail.mockResolvedValue(undefined);

      const result = await userService.findByEmail(email);

      expect(mockedUserRepo.findByEmail).toHaveBeenCalledWith(email);
      expect(result).toBeUndefined();
    });
  });

  describe("findByUserId", () => {
    it("returns user for valid userId", async () => {
      const userId = "00000000-0000-0000-0000-000000000001";
      const user = UserFactory.createUser({ id: userId });
      mockedUserRepo.findById.mockResolvedValue(user);

      const result = await userService.findByUserId(userId);

      expect(mockedUserRepo.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(user);
    });

    it("returns undefined when user not found", async () => {
      const userId = "00000000-0000-0000-0000-000000000999";
      mockedUserRepo.findById.mockResolvedValue(undefined);

      const result = await userService.findByUserId(userId);

      expect(mockedUserRepo.findById).toHaveBeenCalledWith(userId);
      expect(result).toBeUndefined();
    });
  });

  describe("createUser", () => {
    const email = "newuser@example.com";

    it("successfully creates user", async () => {
      const user = UserFactory.createUser({ email });
      mockedUserRepo.create.mockResolvedValue(user);
      mockedSubscriptionService.ensureSubscriptionExists.mockResolvedValue({
        id: "sub-id",
        userId: user.id,
        subjectId: SYSTEM_DESIGN_SUBJECT_ID,
        status: "active",
        createdAt: new Date(),
      } as never);
      mockedSendWelcomeEmail.mockResolvedValue(undefined);
      mockedSubscriptionService.setActiveUsersCountCache.mockResolvedValue(100);

      const result = await userService.createUser(email);

      expect(mockedUserRepo.create).toHaveBeenCalledWith({ email });
      expect(result).toEqual(user);
    });

    it("creates subscription for new user (ensureSubscriptionExists)", async () => {
      const user = UserFactory.createUser({ email });
      mockedUserRepo.create.mockResolvedValue(user);
      mockedSubscriptionService.ensureSubscriptionExists.mockResolvedValue({
        id: "sub-id",
        userId: user.id,
        subjectId: SYSTEM_DESIGN_SUBJECT_ID,
        status: "active",
        createdAt: new Date(),
      } as never);
      mockedSendWelcomeEmail.mockResolvedValue(undefined);
      mockedSubscriptionService.setActiveUsersCountCache.mockResolvedValue(100);

      await userService.createUser(email);

      expect(
        mockedSubscriptionService.ensureSubscriptionExists,
      ).toHaveBeenCalledWith(user.id, SYSTEM_DESIGN_SUBJECT_ID);
    });

    it("sends welcome email", async () => {
      const user = UserFactory.createUser({ email });
      mockedUserRepo.create.mockResolvedValue(user);
      mockedSubscriptionService.ensureSubscriptionExists.mockResolvedValue({
        id: "sub-id",
        userId: user.id,
        subjectId: SYSTEM_DESIGN_SUBJECT_ID,
        status: "active",
        createdAt: new Date(),
      } as never);
      mockedSendWelcomeEmail.mockResolvedValue(undefined);
      mockedSubscriptionService.setActiveUsersCountCache.mockResolvedValue(100);

      await userService.createUser(email);

      expect(mockedSendWelcomeEmail).toHaveBeenCalledWith(user.id);
    });

    it("invalidates subscriber count cache", async () => {
      const user = UserFactory.createUser({ email });
      mockedUserRepo.create.mockResolvedValue(user);
      mockedSubscriptionService.ensureSubscriptionExists.mockResolvedValue({
        id: "sub-id",
        userId: user.id,
        subjectId: SYSTEM_DESIGN_SUBJECT_ID,
        status: "active",
        createdAt: new Date(),
      } as never);
      mockedSendWelcomeEmail.mockResolvedValue(undefined);
      mockedSubscriptionService.setActiveUsersCountCache.mockResolvedValue(100);

      await userService.createUser(email);

      expect(mockedInvalidateCache).toHaveBeenCalledWith(
        CACHE_KEYS.SUBSCRIBER_COUNT,
      );
    });

    it("updates active users count cache (fire-and-forget void call)", async () => {
      const user = UserFactory.createUser({ email });
      mockedUserRepo.create.mockResolvedValue(user);
      mockedSubscriptionService.ensureSubscriptionExists.mockResolvedValue({
        id: "sub-id",
        userId: user.id,
        subjectId: SYSTEM_DESIGN_SUBJECT_ID,
        status: "active",
        createdAt: new Date(),
      } as never);
      mockedSendWelcomeEmail.mockResolvedValue(undefined);
      mockedSubscriptionService.setActiveUsersCountCache.mockResolvedValue(100);

      await userService.createUser(email);

      expect(
        mockedSubscriptionService.setActiveUsersCountCache,
      ).toHaveBeenCalledWith(SYSTEM_DESIGN_SUBJECT_ID);
    });

    it("throws error if user creation fails", async () => {
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
  });

  describe("bulkCreateUsers", () => {
    const emails = ["user1@example.com", "user2@example.com", "user3@example.com"];
    const subjectId = SYSTEM_DESIGN_SUBJECT_ID;

    it("successfully creates multiple users", async () => {
      const users = UserFactory.createUsers(emails.length, {
        email: emails[0],
      }).map((user, index) => ({
        ...user,
        email: emails[index] ?? "",
      }));
      mockedUserRepo.bulkCreate.mockResolvedValue(users);
      mockedSubscriptionService.bulkCreateSubscription.mockResolvedValue(
        undefined,
      );

      const result = await userService.bulkCreateUsers(emails, subjectId);

      expect(mockedUserRepo.bulkCreate).toHaveBeenCalledWith(
        emails.map((email) => ({ email })),
      );
      expect(result).toEqual(users);
    });

    it("creates bulk subscriptions for all users", async () => {
      const users = UserFactory.createUsers(emails.length, {
        email: emails[0],
      }).map((user, index) => ({
        ...user,
        email: emails[index] ?? "",
      }));
      mockedUserRepo.bulkCreate.mockResolvedValue(users);
      mockedSubscriptionService.bulkCreateSubscription.mockResolvedValue(
        undefined,
      );

      await userService.bulkCreateUsers(emails, subjectId);

      expect(
        mockedSubscriptionService.bulkCreateSubscription,
      ).toHaveBeenCalledWith(
        users.map((user) => user.id),
        subjectId,
      );
    });

    it("invalidates subscriber count cache", async () => {
      const users = UserFactory.createUsers(emails.length, {
        email: emails[0],
      }).map((user, index) => ({
        ...user,
        email: emails[index] ?? "",
      }));
      mockedUserRepo.bulkCreate.mockResolvedValue(users);
      mockedSubscriptionService.bulkCreateSubscription.mockResolvedValue(
        undefined,
      );

      await userService.bulkCreateUsers(emails, subjectId);

      expect(mockedInvalidateCache).toHaveBeenCalledWith(
        CACHE_KEYS.SUBSCRIBER_COUNT,
      );
    });

    it("returns empty array for empty emails array", async () => {
      const result = await userService.bulkCreateUsers([], subjectId);

      expect(mockedUserRepo.bulkCreate).not.toHaveBeenCalled();
      expect(
        mockedSubscriptionService.bulkCreateSubscription,
      ).not.toHaveBeenCalled();
      expect(mockedInvalidateCache).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe("getUsersWithActiveSubscription", () => {
    it("returns paginated users with default values (page=1, size=25)", async () => {
      const users = UserFactory.createUsers(25);
      mockedUserRepo.findUsersWithActiveSubscription.mockResolvedValue(users);

      const result = await userService.getUsersWithActiveSubscription();

      expect(
        mockedUserRepo.findUsersWithActiveSubscription,
      ).toHaveBeenCalledWith(1, 25);
      expect(result).toEqual(users);
    });

    it("returns paginated users with custom page and size", async () => {
      const page = 2;
      const size = 10;
      const users = UserFactory.createUsers(size);
      mockedUserRepo.findUsersWithActiveSubscription.mockResolvedValue(users);

      const result = await userService.getUsersWithActiveSubscription(page, size);

      expect(
        mockedUserRepo.findUsersWithActiveSubscription,
      ).toHaveBeenCalledWith(page, size);
      expect(result).toEqual(users);
    });

    it("calls repo with correct pagination parameters", async () => {
      const page = 3;
      const size = 50;
      mockedUserRepo.findUsersWithActiveSubscription.mockResolvedValue([]);

      await userService.getUsersWithActiveSubscription(page, size);

      expect(
        mockedUserRepo.findUsersWithActiveSubscription,
      ).toHaveBeenCalledWith(page, size);
    });
  });

  describe("getDailySignupStats", () => {
    it("returns daily stats for specified days", async () => {
      const days = 7;
      const stats = [
        { date: "2024-01-01", count: 5 },
        { date: "2024-01-02", count: 10 },
        { date: "2024-01-03", count: 3 },
      ];
      mockedUserRepo.getDailySignupStats.mockResolvedValue(stats);

      const result = await userService.getDailySignupStats(days);

      expect(mockedUserRepo.getDailySignupStats).toHaveBeenCalledWith(days);
      expect(result).toEqual(stats);
    });

    it("calls repo with correct days parameter", async () => {
      const days = 30;
      mockedUserRepo.getDailySignupStats.mockResolvedValue([]);

      await userService.getDailySignupStats(days);

      expect(mockedUserRepo.getDailySignupStats).toHaveBeenCalledWith(days);
    });
  });

  describe("getSignupStatistics", () => {
    const subjectId = SYSTEM_DESIGN_SUBJECT_ID;
    const days = 7;

    it("returns combined signup stats with unsubscribe count", async () => {
      const signupStats = {
        today: 5,
        week: 25,
        month: 100,
        total: 500,
        avgDaily: 3.6,
      };
      const numberOfUnsubscribes = 10;
      mockedUserRepo.getSignupStatistics.mockResolvedValue(signupStats);
      mockedSubscriptionService.getNumberOfUserUnsubscribes.mockResolvedValue(
        numberOfUnsubscribes,
      );

      const result = await userService.getSignupStatistics(subjectId, days);

      expect(result).toEqual({
        ...signupStats,
        numberOfUnsubscribes,
      });
    });

    it("calls subscriptionService.getNumberOfUserUnsubscribes", async () => {
      const signupStats = {
        today: 5,
        week: 25,
        month: 100,
        total: 500,
        avgDaily: 3.6,
      };
      mockedUserRepo.getSignupStatistics.mockResolvedValue(signupStats);
      mockedSubscriptionService.getNumberOfUserUnsubscribes.mockResolvedValue(
        10,
      );

      await userService.getSignupStatistics(subjectId, days);

      expect(
        mockedSubscriptionService.getNumberOfUserUnsubscribes,
      ).toHaveBeenCalledWith(subjectId, days);
    });

    it("calls userRepo.getSignupStatistics", async () => {
      const signupStats = {
        today: 5,
        week: 25,
        month: 100,
        total: 500,
        avgDaily: 3.6,
      };
      mockedUserRepo.getSignupStatistics.mockResolvedValue(signupStats);
      mockedSubscriptionService.getNumberOfUserUnsubscribes.mockResolvedValue(
        10,
      );

      await userService.getSignupStatistics(subjectId, days);

      expect(mockedUserRepo.getSignupStatistics).toHaveBeenCalled();
    });

    it("verifies Promise.all parallel execution", async () => {
      const signupStats = {
        today: 5,
        week: 25,
        month: 100,
        total: 500,
        avgDaily: 3.6,
      };
      mockedUserRepo.getSignupStatistics.mockResolvedValue(signupStats);
      mockedSubscriptionService.getNumberOfUserUnsubscribes.mockResolvedValue(
        10,
      );

      await userService.getSignupStatistics(subjectId, days);

      // Both calls should have been made (Promise.all executes in parallel)
      expect(
        mockedSubscriptionService.getNumberOfUserUnsubscribes,
      ).toHaveBeenCalled();
      expect(mockedUserRepo.getSignupStatistics).toHaveBeenCalled();
    });
  });

  describe("getUserById", () => {
    it("returns user for valid id", async () => {
      const userId = "00000000-0000-0000-0000-000000000001";
      const user = UserFactory.createUser({ id: userId });
      mockedUserRepo.findById.mockResolvedValue(user);

      const result = await userService.getUserById(userId);

      expect(mockedUserRepo.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(user);
    });

    it("returns undefined when user not found", async () => {
      const userId = "00000000-0000-0000-0000-000000000999";
      mockedUserRepo.findById.mockResolvedValue(undefined);

      const result = await userService.getUserById(userId);

      expect(mockedUserRepo.findById).toHaveBeenCalledWith(userId);
      expect(result).toBeUndefined();
    });
  });

  describe("deleteUser", () => {
    it("successfully deletes user via cascading delete", async () => {
      const userId = "00000000-0000-0000-0000-000000000001";
      const deleteResult = { success: true };
      mockedUserRepo.deleteUserCascading.mockResolvedValue(deleteResult);

      const result = await userService.deleteUser(userId);

      expect(mockedUserRepo.deleteUserCascading).toHaveBeenCalledWith(userId);
      expect(result).toEqual(deleteResult);
    });

    it("returns success result object", async () => {
      const userId = "00000000-0000-0000-0000-000000000001";
      const deleteResult = { success: true };
      mockedUserRepo.deleteUserCascading.mockResolvedValue(deleteResult);

      const result = await userService.deleteUser(userId);

      expect(result).toEqual({ success: true });
    });
  });

  describe("Edge Cases", () => {
    describe("findByEmail", () => {
      it("handles invalid email format", async () => {
        const invalidEmail = "not-an-email";
        mockedUserRepo.findByEmail.mockResolvedValue(undefined);

        const result = await userService.findByEmail(invalidEmail);

        expect(mockedUserRepo.findByEmail).toHaveBeenCalledWith(invalidEmail);
        expect(result).toBeUndefined();
      });

      it("handles empty string email", async () => {
        const emptyEmail = "";
        mockedUserRepo.findByEmail.mockResolvedValue(undefined);

        const result = await userService.findByEmail(emptyEmail);

        expect(mockedUserRepo.findByEmail).toHaveBeenCalledWith(emptyEmail);
        expect(result).toBeUndefined();
      });
    });

    describe("findByUserId", () => {
      it("handles invalid UUID format", async () => {
        const invalidUserId = "not-a-uuid";
        mockedUserRepo.findById.mockResolvedValue(undefined);

        const result = await userService.findByUserId(invalidUserId);

        expect(mockedUserRepo.findById).toHaveBeenCalledWith(invalidUserId);
        expect(result).toBeUndefined();
      });
    });

    describe("createUser", () => {
      it("handles invalid email format", async () => {
        const invalidEmail = "not-an-email";
        mockedUserRepo.create.mockResolvedValue(undefined);

        await expect(userService.createUser(invalidEmail)).rejects.toThrow(
          `Failed to create user with email: ${invalidEmail}`,
        );

        expect(mockedUserRepo.create).toHaveBeenCalledWith({
          email: invalidEmail,
        });
      });

      it("handles duplicate email", async () => {
        const email = "duplicate@example.com";
        const existingUser = UserFactory.createUser({ email });
        mockedUserRepo.create.mockResolvedValue(existingUser);
        mockedSubscriptionService.ensureSubscriptionExists.mockResolvedValue({
          id: "sub-id",
          userId: existingUser.id,
          subjectId: SYSTEM_DESIGN_SUBJECT_ID,
          status: "active",
          createdAt: new Date(),
        } as never);
        mockedSendWelcomeEmail.mockResolvedValue(undefined);
        mockedSubscriptionService.setActiveUsersCountCache.mockResolvedValue(100);

        // Service doesn't check for duplicates, so it will proceed
        const result = await userService.createUser(email);

        expect(result).toEqual(existingUser);
      });
    });

    describe("bulkCreateUsers", () => {
      it("handles empty emails in array", async () => {
        const emails = ["user1@example.com", "", "user3@example.com"];
        const subjectId = SYSTEM_DESIGN_SUBJECT_ID;
        const users = UserFactory.createUsers(emails.length, {
          email: emails[0] ?? "",
        }).map((user, index) => ({
          ...user,
          email: emails[index] ?? "",
        }));
        mockedUserRepo.bulkCreate.mockResolvedValue(users);
        mockedSubscriptionService.bulkCreateSubscription.mockResolvedValue(
          undefined,
        );

        const result = await userService.bulkCreateUsers(emails, subjectId);

        expect(mockedUserRepo.bulkCreate).toHaveBeenCalledWith(
          emails.map((email) => ({ email })),
        );
        expect(result).toEqual(users);
      });

      it("handles duplicate emails", async () => {
        const emails = [
          "duplicate@example.com",
          "duplicate@example.com",
          "unique@example.com",
        ];
        const subjectId = SYSTEM_DESIGN_SUBJECT_ID;
        const users = UserFactory.createUsers(emails.length, {
          email: emails[0] ?? "",
        }).map((user, index) => ({
          ...user,
          email: emails[index] ?? "",
        }));
        mockedUserRepo.bulkCreate.mockResolvedValue(users);
        mockedSubscriptionService.bulkCreateSubscription.mockResolvedValue(
          undefined,
        );

        const result = await userService.bulkCreateUsers(emails, subjectId);

        expect(mockedUserRepo.bulkCreate).toHaveBeenCalledWith(
          emails.map((email) => ({ email })),
        );
        expect(result).toEqual(users);
      });

      it("handles invalid email formats", async () => {
        const emails = ["invalid-email", "also-invalid", "valid@example.com"];
        const subjectId = SYSTEM_DESIGN_SUBJECT_ID;
        const users = UserFactory.createUsers(emails.length, {
          email: emails[0] ?? "",
        }).map((user, index) => ({
          ...user,
          email: emails[index] ?? "",
        }));
        mockedUserRepo.bulkCreate.mockResolvedValue(users);
        mockedSubscriptionService.bulkCreateSubscription.mockResolvedValue(
          undefined,
        );

        const result = await userService.bulkCreateUsers(emails, subjectId);

        expect(mockedUserRepo.bulkCreate).toHaveBeenCalledWith(
          emails.map((email) => ({ email })),
        );
        expect(result).toEqual(users);
      });

      it("handles very large array (>10000)", async () => {
        const emails = Array.from(
          { length: 10001 },
          (_, i) => `user${i}@example.com`,
        );
        const subjectId = SYSTEM_DESIGN_SUBJECT_ID;
        const users = UserFactory.createUsers(emails.length, {
          email: emails[0] ?? "",
        }).map((user, index) => ({
          ...user,
          email: emails[index] ?? "",
        }));
        mockedUserRepo.bulkCreate.mockResolvedValue(users);
        mockedSubscriptionService.bulkCreateSubscription.mockResolvedValue(
          undefined,
        );

        const result = await userService.bulkCreateUsers(emails, subjectId);

        expect(mockedUserRepo.bulkCreate).toHaveBeenCalledWith(
          emails.map((email) => ({ email })),
        );
        expect(result).toEqual(users);
      });
    });

    describe("getUsersWithActiveSubscription", () => {
      it("handles page = 0", async () => {
        const page = 0;
        const size = 25;
        mockedUserRepo.findUsersWithActiveSubscription.mockResolvedValue([]);

        await userService.getUsersWithActiveSubscription(page, size);

        expect(
          mockedUserRepo.findUsersWithActiveSubscription,
        ).toHaveBeenCalledWith(page, size);
      });

      it("handles negative page", async () => {
        const page = -1;
        const size = 25;
        mockedUserRepo.findUsersWithActiveSubscription.mockResolvedValue([]);

        await userService.getUsersWithActiveSubscription(page, size);

        expect(
          mockedUserRepo.findUsersWithActiveSubscription,
        ).toHaveBeenCalledWith(page, size);
      });

      it("handles negative size", async () => {
        const page = 1;
        const size = -10;
        mockedUserRepo.findUsersWithActiveSubscription.mockResolvedValue([]);

        await userService.getUsersWithActiveSubscription(page, size);

        expect(
          mockedUserRepo.findUsersWithActiveSubscription,
        ).toHaveBeenCalledWith(page, size);
      });
    });

    describe("getDailySignupStats", () => {
      it("handles days = 0", async () => {
        const days = 0;
        mockedUserRepo.getDailySignupStats.mockResolvedValue([]);

        const result = await userService.getDailySignupStats(days);

        expect(mockedUserRepo.getDailySignupStats).toHaveBeenCalledWith(days);
        expect(result).toEqual([]);
      });

      it("handles negative days", async () => {
        const days = -1;
        mockedUserRepo.getDailySignupStats.mockResolvedValue([]);

        const result = await userService.getDailySignupStats(days);

        expect(mockedUserRepo.getDailySignupStats).toHaveBeenCalledWith(days);
        expect(result).toEqual([]);
      });
    });

    describe("getSignupStatistics", () => {
      it("handles negative days", async () => {
        const subjectId = SYSTEM_DESIGN_SUBJECT_ID;
        const days = -1;
        const signupStats = {
          today: 5,
          week: 25,
          month: 100,
          total: 500,
          avgDaily: 3.6,
        };
        mockedUserRepo.getSignupStatistics.mockResolvedValue(signupStats);
        mockedSubscriptionService.getNumberOfUserUnsubscribes.mockResolvedValue(
          10,
        );

        const result = await userService.getSignupStatistics(subjectId, days);

        expect(result).toEqual({
          ...signupStats,
          numberOfUnsubscribes: 10,
        });
      });
    });

    describe("deleteUser", () => {
      it("handles non-existent user", async () => {
        const userId = "00000000-0000-0000-0000-000000000999";
        const deleteResult = { success: true };
        mockedUserRepo.deleteUserCascading.mockResolvedValue(deleteResult);

        const result = await userService.deleteUser(userId);

        expect(mockedUserRepo.deleteUserCascading).toHaveBeenCalledWith(userId);
        expect(result).toEqual(deleteResult);
      });
    });
  });

  describe("Error Cases", () => {
    describe("createUser", () => {
      it("handles subscription creation fails but user created", async () => {
        const email = "newuser@example.com";
        const user = UserFactory.createUser({ email });
        mockedUserRepo.create.mockResolvedValue(user);
        const subscriptionError = new Error("Subscription creation failed");
        mockedSubscriptionService.ensureSubscriptionExists.mockRejectedValue(
          subscriptionError,
        );

        await expect(userService.createUser(email)).rejects.toThrow(
          "Subscription creation failed",
        );

        expect(mockedUserRepo.create).toHaveBeenCalledWith({ email });
        expect(
          mockedSubscriptionService.ensureSubscriptionExists,
        ).toHaveBeenCalled();
      });

      it("handles welcome email fails but user created", async () => {
        const email = "newuser@example.com";
        const user = UserFactory.createUser({ email });
        mockedUserRepo.create.mockResolvedValue(user);
        mockedSubscriptionService.ensureSubscriptionExists.mockResolvedValue({
          id: "sub-id",
          userId: user.id,
          subjectId: SYSTEM_DESIGN_SUBJECT_ID,
          status: "active",
          createdAt: new Date(),
        } as never);
        const emailError = new Error("Email service unavailable");
        mockedSendWelcomeEmail.mockRejectedValue(emailError);
        mockedSubscriptionService.setActiveUsersCountCache.mockResolvedValue(100);

        await expect(userService.createUser(email)).rejects.toThrow(
          "Email service unavailable",
        );

        expect(mockedUserRepo.create).toHaveBeenCalledWith({ email });
        expect(mockedSendWelcomeEmail).toHaveBeenCalledWith(user.id);
      });

      it("handles cache operations fail", async () => {
        const email = "newuser@example.com";
        const user = UserFactory.createUser({ email });
        mockedUserRepo.create.mockResolvedValue(user);
        mockedSubscriptionService.ensureSubscriptionExists.mockResolvedValue({
          id: "sub-id",
          userId: user.id,
          subjectId: SYSTEM_DESIGN_SUBJECT_ID,
          status: "active",
          createdAt: new Date(),
        } as never);
        mockedSendWelcomeEmail.mockResolvedValue(undefined);
        mockedInvalidateCache.mockImplementation(() => {
          throw new Error("Cache invalidation failed");
        });
        mockedSubscriptionService.setActiveUsersCountCache.mockResolvedValue(100);

        await expect(userService.createUser(email)).rejects.toThrow(
          "Cache invalidation failed",
        );

        expect(mockedInvalidateCache).toHaveBeenCalled();
      });
    });

    describe("bulkCreateUsers", () => {
      it("handles partial success (some users created, some fail)", async () => {
        const emails = ["user1@example.com", "user2@example.com"];
        const subjectId = SYSTEM_DESIGN_SUBJECT_ID;
        // Only one user created successfully
        const partialUsers = UserFactory.createUsers(1, {
          email: emails[0] ?? "",
        });
        mockedUserRepo.bulkCreate.mockResolvedValue(partialUsers);
        mockedSubscriptionService.bulkCreateSubscription.mockResolvedValue(
          undefined,
        );

        const result = await userService.bulkCreateUsers(emails, subjectId);

        expect(result).toEqual(partialUsers);
        expect(result.length).toBeLessThan(emails.length);
      });

      it("handles bulk subscription creation fails", async () => {
        const emails = ["user1@example.com", "user2@example.com"];
        const subjectId = SYSTEM_DESIGN_SUBJECT_ID;
        const users = UserFactory.createUsers(emails.length, {
          email: emails[0] ?? "",
        }).map((user, index) => ({
          ...user,
          email: emails[index] ?? "",
        }));
        mockedUserRepo.bulkCreate.mockResolvedValue(users);
        const subscriptionError = new Error("Bulk subscription creation failed");
        mockedSubscriptionService.bulkCreateSubscription.mockRejectedValue(
          subscriptionError,
        );

        await expect(
          userService.bulkCreateUsers(emails, subjectId),
        ).rejects.toThrow("Bulk subscription creation failed");

        expect(mockedUserRepo.bulkCreate).toHaveBeenCalled();
      });
    });

    describe("getUsersWithActiveSubscription", () => {
      it("handles repository throws error", async () => {
        const page = 1;
        const size = 25;
        const error = new Error("Database query failed");
        mockedUserRepo.findUsersWithActiveSubscription.mockRejectedValue(error);

        await expect(
          userService.getUsersWithActiveSubscription(page, size),
        ).rejects.toThrow("Database query failed");

        expect(
          mockedUserRepo.findUsersWithActiveSubscription,
        ).toHaveBeenCalledWith(page, size);
      });
    });

    describe("getDailySignupStats", () => {
      it("handles repository throws error", async () => {
        const days = 7;
        const error = new Error("Database query failed");
        mockedUserRepo.getDailySignupStats.mockRejectedValue(error);

        await expect(
          userService.getDailySignupStats(days),
        ).rejects.toThrow("Database query failed");

        expect(mockedUserRepo.getDailySignupStats).toHaveBeenCalledWith(days);
      });
    });

    describe("getSignupStatistics", () => {
      it("handles one of the parallel calls fails", async () => {
        const subjectId = SYSTEM_DESIGN_SUBJECT_ID;
        const days = 7;
        const signupStats = {
          today: 5,
          week: 25,
          month: 100,
          total: 500,
          avgDaily: 3.6,
        };
        mockedUserRepo.getSignupStatistics.mockResolvedValue(signupStats);
        const unsubscribeError = new Error("Unsubscribe query failed");
        mockedSubscriptionService.getNumberOfUserUnsubscribes.mockRejectedValue(
          unsubscribeError,
        );

        await expect(
          userService.getSignupStatistics(subjectId, days),
        ).rejects.toThrow("Unsubscribe query failed");

        expect(
          mockedSubscriptionService.getNumberOfUserUnsubscribes,
        ).toHaveBeenCalledWith(subjectId, days);
      });
    });

    describe("deleteUser", () => {
      it("handles cascading delete fails partially", async () => {
        const userId = "00000000-0000-0000-0000-000000000001";
        const error = new Error("Cascading delete failed");
        mockedUserRepo.deleteUserCascading.mockRejectedValue(error);

        await expect(userService.deleteUser(userId)).rejects.toThrow(
          "Cascading delete failed",
        );

        expect(mockedUserRepo.deleteUserCascading).toHaveBeenCalledWith(userId);
      });
    });
  });
});


