"use client";

import { useParams } from "next/navigation";
import { MeetingsList } from "@/src/features/meetings/components/meetings-list";

export function MeetingsListPage() {
  const params = useParams<{ cellId: string }>();
  return <MeetingsList cellId={params.cellId} />;
}
