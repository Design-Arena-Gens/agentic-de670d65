'use client';

import { useProjectPersistence } from "@/hooks/useProjectPersistence";
import { MapViewport } from "@/components/MapViewport";
import { TopToolbar } from "@/components/TopToolbar";
import { LeftSidebar } from "@/components/LeftSidebar";
import { RightSidebar } from "@/components/RightSidebar";
import { TimelineEditor } from "@/components/TimelineEditor";

export default function HomePage() {
  useProjectPersistence();

  return (
    <div className="app-grid">
      <TopToolbar />
      <LeftSidebar />
      <MapViewport />
      <RightSidebar />
      <TimelineEditor />
    </div>
  );
}
