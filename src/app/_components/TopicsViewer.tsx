"use client";

import { useState } from "react";
import { SYSTEM_DESIGN_SUBJECT_ID } from "~/lib/constants";
import TopicsList from "~/app/_components/TopicsList";
import NewsletterPreview from "~/app/_components/NewsletterPreview";

export default function TopicsViewer() {
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Topics Viewer</h2>
      
      <div className="flex h-[600px] space-x-4">
        {/* Left Pane - Topics List */}
        <div className="w-1/2 border border-gray-200 rounded-lg overflow-hidden">
          <TopicsList
            subjectId={SYSTEM_DESIGN_SUBJECT_ID}
            selectedTopicId={selectedTopicId}
            onTopicSelect={setSelectedTopicId}
          />
        </div>

        {/* Right Pane - Newsletter Preview */}
        <div className="w-1/2 border border-gray-200 rounded-lg overflow-hidden">
          <NewsletterPreview
            topicId={selectedTopicId}
          />
        </div>
      </div>
    </div>
  );
}