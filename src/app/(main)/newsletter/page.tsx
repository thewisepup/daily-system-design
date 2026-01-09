import { redirect } from "next/navigation";
import { SYSTEM_DESIGN_SUBJECT_ID } from "~/lib/constants";
import { issueService } from "~/server/services/IssueService";

/**
 * Determine whether a value represents a Next.js redirect error.
 *
 * @param error - The value to inspect; may be any type.
 * @returns `true` if `error` is a non-null object with a string `digest` property that starts with `"NEXT_REDIRECT"`, `false` otherwise.
 */
function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string" &&
    error.digest.startsWith("NEXT_REDIRECT")
  );
}

/**
 * Loads the latest sent newsletter for the system design subject and navigates to that issue's page if found.
 *
 * If a Next.js redirect error is encountered, it is re-thrown so the framework can handle it; for other failures it logs the error and renders a fallback UI indicating no newsletters are available.
 *
 * @returns A redirect to the latest newsletter issue page when one exists; otherwise, a fallback JSX element informing the user that no newsletters are available.
 */
export default async function NewsletterIndexPage() {
  try {
    const latestIssue = await issueService.getLatestSentIssue(
      SYSTEM_DESIGN_SUBJECT_ID,
    );

    if (!latestIssue) {
      throw new Error("No latest issue found");
    }

    redirect(`/newsletter/${latestIssue.id}`);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    console.error("Error loading latest newsletter:", error);
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-foreground text-2xl font-bold">
            No Newsletters Available
          </h1>
          <p className="text-muted-foreground mt-2">
            Check back soon for our latest newsletter!
          </p>
        </div>
      </div>
    );
  }
}
