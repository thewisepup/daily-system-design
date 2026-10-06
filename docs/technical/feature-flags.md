# Feature flags

Use the server-side service with a constant and an existing user's UUID:

```ts
import { FEATURE_FLAGS } from "~/lib/constants/featureFlags";
import { featureFlagService } from "~/server/services/FeatureFlagService";

const showPreview = await featureFlagService.isEnabled(
  FEATURE_FLAGS.NEWSLETTER_PREVIEW,
  userId,
);
```

`NEWSLETTER_PREVIEW` is an initial example key; this change does not gate any existing functionality. Add stable keys to `FEATURE_FLAGS` as features need them.

The `featureFlag` Drizzle table maps to `feature_flag` in PostgreSQL. Each row stores one user's enablement for one flag. The composite primary key `(user_id, flag)` enforces uniqueness and indexes lookups by user and flag. Rows reference `users.id` and are removed when that user is deleted. `enabled` defaults to false. Missing rows, unknown keys, and explicit false values return false; other users' rows have no effect. Evaluation is read-only and uncached. Invalid UUIDs reject before querying; database errors propagate so an unavailable database is observable rather than silently hiding failures.

After the migration is applied through the normal deployment process, an authorized operator can set enablement using a parameterized upsert:

```sql
INSERT INTO feature_flag (user_id, flag, enabled)
VALUES ($1, $2, $3)
ON CONFLICT (user_id, flag) DO UPDATE SET enabled = EXCLUDED.enabled;
```

Use the user's UUID, a registered constant value, and a boolean as parameters. Delete a row or set `enabled = false` to disable it. No global defaults, percentage rollouts, administration UI, or public mutation endpoint are provided.
