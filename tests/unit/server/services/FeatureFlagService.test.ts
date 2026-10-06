import { FEATURE_FLAGS, type FeatureFlag } from "~/lib/constants/featureFlags";
import { featureFlagRepo } from "~/server/db/repo/FeatureFlagRepo";
import { featureFlagService } from "~/server/services/FeatureFlagService";

vi.mock("~/server/db/repo/FeatureFlagRepo", () => ({
  featureFlagRepo: { isEnabled: vi.fn() },
}));

const lookup = vi.mocked(featureFlagRepo.isEnabled);
const userId = "00000000-0000-4000-8000-000000000001";
const flag = FEATURE_FLAGS.NEWSLETTER_PREVIEW;

beforeEach(() => vi.resetAllMocks());

describe("FeatureFlagService", () => {
  it.each([true, false])("returns per-user enablement %s", async (enabled) => {
    lookup.mockResolvedValue(enabled);
    expect(await featureFlagService.isEnabled(flag, userId)).toBe(enabled);
    expect(lookup).toHaveBeenCalledWith(flag, userId);
  });

  it("rejects malformed user IDs before querying", async () => {
    await expect(
      featureFlagService.isEnabled(flag, "invalid"),
    ).rejects.toThrow();
    expect(lookup).not.toHaveBeenCalled();
  });

  it("disables unknown runtime flag keys without querying", async () => {
    expect(
      await featureFlagService.isEnabled("unknown" as FeatureFlag, userId),
    ).toBe(false);
    expect(lookup).not.toHaveBeenCalled();
  });

  it("propagates database failures", async () => {
    lookup.mockRejectedValue(new Error("Database unavailable"));
    await expect(featureFlagService.isEnabled(flag, userId)).rejects.toThrow(
      "Database unavailable",
    );
  });
});
