"use client";

import {
  GenerateTopicsButton,
  DeleteAllTopicsButton,
} from "./TopicsManagement/";

export default function TopicsManagement() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Topics Management</h2>

      <GenerateTopicsButton />
      <DeleteAllTopicsButton />
    </div>
  );
}
