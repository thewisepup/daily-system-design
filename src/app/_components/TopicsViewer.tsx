"use client";

import { useState } from "react";
import { SYSTEM_DESIGN_SUBJECT_ID } from "~/lib/constants";
import TopicsList from "~/app/_components/TopicsList";
import NewsletterPreview from "~/app/_components/NewsletterPreview";

export default function TopicsViewer() {
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);

  return (
    <div className="flex h-[1000px] w-full flex-shrink-0 flex-col space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Topics Viewer</h2>

      <div className="flex min-h-0 flex-1 flex-col space-y-6">
        {/* Topics List - Compact */}
        <div className="h-[250px] w-full flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <TopicsList
            subjectId={SYSTEM_DESIGN_SUBJECT_ID}
            selectedTopicId={selectedTopicId}
            onTopicSelect={setSelectedTopicId}
          />
        </div>

        {/* Newsletter Preview - Fixed dimensions with scrollable content */}
        <div className="min-h-0 w-full flex-1 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 shadow-sm">
          <div className="h-full w-full flex-shrink-0 bg-white">
            <NewsletterPreview topicId={selectedTopicId} />
          </div>
        </div>
      </div>
    </div>
  );
}
