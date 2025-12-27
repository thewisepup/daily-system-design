import type { subjects } from "~/server/db/schema/subjects";

type Subject = typeof subjects.$inferSelect;

/**
 * Factory for creating Subject-related test data.
 */
export class SubjectFactory {
  private static defaultSubject(): Subject {
    const now = new Date();
    return {
      id: 1,
      name: "Test Subject",
      description: "Test subject description",
      createdAt: now,
    };
  }

  /**
   * Creates a mock Subject with Date objects.
   * Used for database responses.
   */
  static createSubject(overrides?: Partial<Subject>): Subject {
    return {
      ...this.defaultSubject(),
      ...overrides,
    };
  }

  /**
   * Creates a mock Subject with string dates (ISO format).
   * Used to simulate Redis cached responses where dates are serialized as strings.
   */
  static createSubjectWithStringDates(
    overrides?: Partial<Subject>,
  ): Record<string, unknown> {
    const subject = this.createSubject(overrides);
    return {
      ...subject,
      createdAt: subject.createdAt.toISOString(),
    };
  }

  /**
   * Creates an array of mock Subject objects.
   */
  static createSubjects(count: number, overrides?: Partial<Subject>): Subject[] {
    return Array.from({ length: count }, (_, index) =>
      this.createSubject({
        id: index + 1,
        name: `Test Subject ${index + 1}`,
        ...overrides,
      }),
    );
  }
}
