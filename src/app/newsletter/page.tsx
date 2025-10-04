"use client";
import { useState } from "react";
import IssueContent from "./IssueContent";
import IssueSideBar from "./IssueSideBar";

export default function Newsletter() {
  //currentNewsletterId useState

  // pass IssueSummaries into SideBar
  // pass currentNewsletterId NewsletterContent

  // onNewsletterSideBarClick()
  //update currentNewsletterId, which will update the newsletter contents
  const [issueId, setIssueId] = useState<number>();

  return (
    <>
      <IssueSideBar onSideBarClick={setIssueId} />
      {issueId !== undefined && <IssueContent issueId={issueId} />}
    </>
  );
}
