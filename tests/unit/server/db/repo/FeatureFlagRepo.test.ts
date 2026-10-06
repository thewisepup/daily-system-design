import { PgDialect } from "drizzle-orm/pg-core";
import { FEATURE_FLAGS } from "~/lib/constants/featureFlags";
import { featureFlagRepo } from "~/server/db/repo/FeatureFlagRepo";

const query = vi.hoisted(() => ({
  select: vi.fn(),
  from: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
}));
vi.mock("~/server/db", () => ({ db: { select: query.select } }));

beforeEach(() => {
  vi.resetAllMocks();
  query.select.mockReturnValue(query);
  query.from.mockReturnValue(query);
  query.where.mockReturnValue(query);
});

describe("FeatureFlagRepo", () => {
  it.each([
    { rows: [], expected: false },
    { rows: [{ enabled: false }], expected: false },
    { rows: [{ enabled: true }], expected: true },
  ])("returns $expected for $rows", async ({ rows, expected }) => {
    query.limit.mockResolvedValue(rows);
    expect(
      await featureFlagRepo.isEnabled(
        FEATURE_FLAGS.NEWSLETTER_PREVIEW,
        "00000000-0000-4000-8000-000000000001",
      ),
    ).toBe(expected);
  });

  it("scopes the query to both the requested user and flag", async () => {
    const userId = "00000000-0000-4000-8000-000000000002";
    query.limit.mockResolvedValue([]);
    await featureFlagRepo.isEnabled(FEATURE_FLAGS.NEWSLETTER_PREVIEW, userId);
    const predicate = query.where.mock.calls[0]![0];
    const sql = new PgDialect({ casing: "snake_case" }).sqlToQuery(predicate);
    expect(sql.sql).toBe(
      '(\"feature_flag\".\"user_id\" = $1 and \"feature_flag\".\"flag\" = $2)',
    );
    expect(sql.params).toEqual([userId, FEATURE_FLAGS.NEWSLETTER_PREVIEW]);
    expect(query.limit).toHaveBeenCalledWith(1);
  });
});
