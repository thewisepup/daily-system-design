import { and, eq } from "drizzle-orm";
import { type FeatureFlag } from "~/lib/constants/featureFlags";
import { db } from "..";
import { featureFlag } from "../schema/featureFlag";

class FeatureFlagRepo {
  async isEnabled(flag: FeatureFlag, userId: string): Promise<boolean> {
    const [row] = await db
      .select({ enabled: featureFlag.enabled })
      .from(featureFlag)
      .where(and(eq(featureFlag.userId, userId), eq(featureFlag.flag, flag)))
      .limit(1);

    return row?.enabled === true;
  }
}

export const featureFlagRepo = new FeatureFlagRepo();
