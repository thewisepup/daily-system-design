import { type InferSelectModel } from "drizzle-orm";
import type { topics } from "~/server/db/schema/topics";

export type Topic = InferSelectModel<typeof topics>;
