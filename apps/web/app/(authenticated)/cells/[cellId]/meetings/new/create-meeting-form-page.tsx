"use client";

import { useParams } from "next/navigation";
import { CreateMeetingForm } from "@/src/features/meetings/components/create-meeting-form";

export function CreateMeetingFormPage() {
  const params = useParams<{ cellId: string }>();
  return <CreateMeetingForm cellId={params.cellId} />;
}
