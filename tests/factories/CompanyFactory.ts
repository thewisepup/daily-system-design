import type { Company } from "~/server/db/schema/company";

/**
 * Factory for creating Company-related test data.
 */
export class CompanyFactory {
  private static defaultCompany(): Company {
    const now = new Date();
    return {
      id: 1,
      name: "Test Company",
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Creates a mock Company with Date objects.
   * Used for database responses.
   */
  static createCompany(overrides?: Partial<Company>): Company {
    return {
      ...this.defaultCompany(),
      ...overrides,
    };
  }

  /**
   * Creates a mock Company with string dates (ISO format).
   * Used to simulate Redis cached responses where dates are serialized as strings.
   */
  static createCompanyWithStringDates(
    overrides?: Partial<Company>,
  ): Record<string, unknown> {
    const company = this.createCompany(overrides);
    return {
      ...company,
      createdAt: company.createdAt.toISOString(),
      updatedAt: company.updatedAt.toISOString(),
    };
  }

  /**
   * Creates an array of mock Company objects.
   */
  static createCompanies(
    count: number,
    overrides?: Partial<Company>,
  ): Company[] {
    return Array.from({ length: count }, (_, index) =>
      this.createCompany({
        id: index + 1,
        name: `Test Company ${index + 1}`,
        ...overrides,
      }),
    );
  }
}
