"use client";

import { useParams } from "next/navigation";
import { MeetingsList } from "@/src/features/meetings/components/meetings-list";

export function MeetingsListPage() {
  const params = useParams<{ id: string }>();
  return <MeetingsList cellId={params.id} />;
}
