import { redirect } from "next/navigation";
import { api } from "~/trpc/server";
import { SYSTEM_DESIGN_SUBJECT_ID } from "~/lib/constants";

function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string" &&
    error.digest.startsWith("NEXT_REDIRECT")
  );
}

export default async function NewsletterIndexPage() {
  try {
    const latestIssue = await api.issue.getLatestSentIssue({
      subjectId: SYSTEM_DESIGN_SUBJECT_ID,
    });

    if (!latestIssue) {
      throw new Error("No latest issue found");
    }

    redirect(`/newsletter/${latestIssue.id}`);
  } catch (error) {
    // Re-throw redirect errors so Next.js can handle them
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
