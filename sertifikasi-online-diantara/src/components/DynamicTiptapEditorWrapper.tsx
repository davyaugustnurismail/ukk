"use client";

import dynamic from "next/dynamic";

const DynamicTiptapEditor = dynamic(() => import("./TiptapEditorNew"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[200px] rounded-lg border border-gray-300 bg-white p-4 dark:border-gray-600 dark:bg-[#122031]">
      <div className="h-8 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
    </div>
  ),
});

export default DynamicTiptapEditor;
