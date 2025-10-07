import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { postRouter } from "~/server/api/routers/post";
import { userRouter } from "~/server/api/routers/user";
import { topicsRouter } from "~/server/api/routers/topics";
import { authRouter } from "~/server/api/routers/auth";
import { newsletterRouter } from "~/server/api/routers/newsletter";
import { emailSubscriptionRouter } from "~/server/api/routers/emailSubscription";
import { marketingRouter } from "~/server/api/routers/marketing";
import { feedbackRouter } from "./routers/feedback";
import { issueRouter } from "./routers/issue";
import { companyRouter } from "./routers/company";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  user: userRouter,
  topics: topicsRouter,
  auth: authRouter,
  newsletter: newsletterRouter,
  emailSubscription: emailSubscriptionRouter,
  marketing: marketingRouter,
  feedback: feedbackRouter,
  issue: issueRouter,
  company: companyRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
