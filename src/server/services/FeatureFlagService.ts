import { z } from "zod";
import { FEATURE_FLAGS, type FeatureFlag } from "~/lib/constants/featureFlags";
import { featureFlagRepo } from "../db/repo/FeatureFlagRepo";

const userIdSchema = z.string().uuid();

class FeatureFlagService {
  /** Missing or unknown flags are disabled; database errors propagate. */
  async isEnabled(flag: FeatureFlag, userId: string): Promise<boolean> {
    if (!Object.values(FEATURE_FLAGS).includes(flag)) return false;
    userIdSchema.parse(userId);
    return featureFlagRepo.isEnabled(flag, userId);
  }
}

export const featureFlagService = new FeatureFlagService();
