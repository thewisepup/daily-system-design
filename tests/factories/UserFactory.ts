import type { User } from "~/server/db/schema/users";

/**
 * Factory for creating User-related test data.
 */
export class UserFactory {
  private static defaultUser(): User {
    const now = new Date();
    return {
      id: "00000000-0000-0000-0000-000000000001",
      email: "test@example.com",
      createdAt: now,
    };
  }

  /**
   * Creates a mock User with Date objects.
   * Used for database responses.
   */
  static createUser(overrides?: Partial<User>): User {
    return {
      ...this.defaultUser(),
      ...overrides,
    };
  }

  /**
   * Creates a mock User with string dates (ISO format).
   * Used to simulate Redis cached responses where dates are serialized as strings.
   */
  static createUserWithStringDates(
    overrides?: Partial<User>,
  ): Record<string, unknown> {
    const user = this.createUser(overrides);
    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
    };
  }

  /**
   * Creates an array of mock User objects.
   */
  static createUsers(count: number, overrides?: Partial<User>): User[] {
    return Array.from({ length: count }, (_, index) =>
      this.createUser({
        id: `00000000-0000-0000-0000-${String(index + 1).padStart(12, "0")}`,
        email: `test${index + 1}@example.com`,
        ...overrides,
      }),
    );
  }
}
