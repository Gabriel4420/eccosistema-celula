"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  GraduationCap,
  PauseCircle,
  Play,
  Save,
  ShieldCheck,
  Trash2,
  UserCog,
  UserRound
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { updateCellRequestSchema } from "@mission-atos/contracts";
import { Alert, ErrorState, EmptyState } from "@/src/shared/components";
import { ApiError } from "@/src/shared/api/api-error";
import { cacheStore } from "@/src/shared/cache/cache";
import { useRemoteQuery } from "@/src/shared/hooks/use-remote-query";
import { useSession } from "@/src/providers/session-provider";
import { toast } from "@/src/shared/toast/toast-store";
import { useI18n } from "@/src/shared/i18n/language-provider";
import type { TranslationKey, TranslationParams } from "@/src/shared/i18n/dictionaries";
import {
  getCell,
  updateCell,
  updateCellLeader,
  updateCellStatus,
  updateCellTraineeLeader
} from "@/src/features/cells/api/cells-api";
import type { CellMeetingDay } from "@/src/features/cells/api/cells-api";
import { formatCellDay, formatCellStatus, formatCellTimestamp } from "@/src/features/cells/lib/format";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  DescriptionItem,
  DescriptionList,
  DialogFooter,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Skeleton
} from "@/src/shared/ui";
import { AssignmentSelect } from "./assignment-select";
import { CellMembers } from "./cell-members";

const CELLS_CACHE = "cells";

type ConfirmAction = "none" | "status" | "leader" | "trainee" | "remove-trainee";

interface EditFormValues {
  code: string;
  name: string;
  meetingDay: CellMeetingDay;
  meetingTime: string;
  address: string;
}

export function CellDetail() {
  const { t, locale } = useI18n();
  const { api, capabilities, principal } = useSession();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const DAYS: ReadonlyArray<{ readonly value: CellMeetingDay; readonly label: string }> = [
    { value: "MONDAY", label: t("cells.day.monday") },
    { value: "TUESDAY", label: t("cells.day.tuesday") },
    { value: "WEDNESDAY", label: t("cells.day.wednesday") },
    { value: "THURSDAY", label: t("cells.day.thursday") },
    { value: "FRIDAY", label: t("cells.day.friday") },
    { value: "SATURDAY", label: t("cells.day.saturday") },
    { value: "SUNDAY", label: t("cells.day.sunday") }
  ];

  const { data: cell, loading, error, reload } = useRemoteQuery({
    fetcher: () => getCell(api, id),
    cacheName: CELLS_CACHE,
    cacheKey: `detail:${id}`,
    ttlMs: 20_000
  });

  const editForm = useForm<EditFormValues>({
    defaultValues: {
      code: "",
      name: "",
      meetingDay: "WEDNESDAY",
      meetingTime: "",
      address: ""
    }
  });

  useEffect(() => {
    if (!cell) return;
    editForm.reset({
      code: cell.code,
      name: cell.name,
      meetingDay: cell.meetingDay,
      meetingTime: cell.meetingTime,
      address: cell.address
    });
  }, [cell, editForm]);

  const [confirmAction, setConfirmAction] = useState<ConfirmAction>("none");
  const [leaderDraft, setLeaderDraft] = useState<string | null>(null);
  const [supervisorDraft, setSupervisorDraft] = useState<string | null>(null);
  const [traineeDraft, setTraineeDraft] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  if (loading && !cell) {
    return (
      <div className="space-y-4" aria-label={t("cells.detail.loading")}>
        <Skeleton className="h-9 w-2/3 max-w-md" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  if (error && !cell) {
    return (
      <ErrorState title={t("cells.error.load")} onRetry={() => void reload()}>
        {t("cells.error.retry")}
      </ErrorState>
    );
  }

  if (!cell) {
    return <EmptyState title={t("cells.detail.empty")}>{t("cells.detail.empty.desc")}</EmptyState>;
  }

  const me = principal?.userId;
  const canManage = capabilities.changeCellLeadership;
  const canEditGeneral = capabilities.editCellGeneralData;
  const canEditMeeting =
    capabilities.editCellSchedule &&
    (cell.leader?.id === me || cell.traineeLeader?.id === me || cell.supervisor?.id === me);
  const canEdit = canEditGeneral || canEditMeeting;

  const dirtyFields = editForm.formState.dirtyFields;
  const hasEdits =
    dirtyFields.code || dirtyFields.name || dirtyFields.meetingDay || dirtyFields.meetingTime || dirtyFields.address;

  const handleSaveEdits: SubmitHandler<EditFormValues> = async (values) => {
    setFeedback(null);
    const payload: Record<string, string> = {};
    if (dirtyFields.code) payload.code = values.code.trim();
    if (dirtyFields.name) payload.name = values.name.trim();
    if (dirtyFields.meetingDay) payload.meetingDay = values.meetingDay;
    if (dirtyFields.meetingTime) payload.meetingTime = values.meetingTime.trim();
    if (dirtyFields.address) payload.address = values.address.trim();
    if (Object.keys(payload).length === 0) return;
    const parsed = updateCellRequestSchema.safeParse(payload);
    if (!parsed.success) {
      setFeedback({ kind: "error", message: t("cells.detail.error.form") });
      return;
    }
    setBusy(true);
    try {
      await updateCell(api, id, parsed.data);
      cacheStore(CELLS_CACHE).invalidatePrefix("detail");
      cacheStore(CELLS_CACHE).invalidatePrefix("page");
      await reload();
      toast({
        kind: "success",
        title: t("cells.detail.toast.updated"),
        description: t("cells.detail.toast.saved.desc")
      });
    } catch (cause) {
      setFeedback({ kind: "error", message: messageForError(cause, t("cells.action.saveChanges"), t) });
    } finally {
      setBusy(false);
    }
  };

  const runStatusChange = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      const next = cell.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
      await updateCellStatus(api, id, next);
      cacheStore(CELLS_CACHE).invalidatePrefix("detail");
      cacheStore(CELLS_CACHE).invalidatePrefix("page");
      await reload();
      toast({
        kind: "success",
        title: next === "ACTIVE" ? t("cells.detail.toast.activated") : t("cells.detail.toast.suspended"),
        description: next === "ACTIVE" ? t("cells.detail.toast.activated.desc") : t("cells.detail.toast.suspended.desc")
      });
      setConfirmAction("none");
    } catch (cause) {
      setFeedback({ kind: "error", message: messageForError(cause, t("cells.action.changeStatus"), t) });
    } finally {
      setBusy(false);
    }
  };

  const runLeaderChange = async () => {
    if (!leaderDraft || !supervisorDraft) {
      setFeedback({ kind: "error", message: t("cells.detail.error.leaderRequired") });
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      await updateCellLeader(api, id, { leaderId: leaderDraft, supervisorId: supervisorDraft });
      cacheStore(CELLS_CACHE).invalidatePrefix("detail");
      cacheStore(CELLS_CACHE).invalidatePrefix("page");
      await reload();
      toast({
        kind: "success",
        title: t("cells.detail.toast.leadership"),
        description: t("cells.detail.toast.leadership.desc")
      });
      setConfirmAction("none");
    } catch (cause) {
      setFeedback({ kind: "error", message: messageForError(cause, t("cells.action.changeLeadership"), t) });
    } finally {
      setBusy(false);
    }
  };

  const runTraineeChange = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      await updateCellTraineeLeader(api, id, traineeDraft);
      cacheStore(CELLS_CACHE).invalidatePrefix("detail");
      cacheStore(CELLS_CACHE).invalidatePrefix("page");
      await reload();
      toast({
        kind: "success",
        title: t("cells.detail.toast.trainee"),
        description: t("cells.detail.toast.trainee.desc")
      });
      setConfirmAction("none");
    } catch (cause) {
      setFeedback({ kind: "error", message: messageForError(cause, t("cells.action.changeTrainee"), t) });
    } finally {
      setBusy(false);
    }
  };

  const statusTitle =
    cell.status === "ACTIVE"
      ? t("cells.detail.status.suspend")
      : cell.status === "FORMING"
        ? t("cells.detail.status.activate")
        : t("cells.detail.status.reactivate");
  const statusDescription =
    cell.status === "ACTIVE"
      ? t("cells.detail.status.suspend.desc")
      : t("cells.detail.status.activate.desc");

  const openLeaderDialog = () => {
    setLeaderDraft(cell.leader?.id ?? null);
    setSupervisorDraft(cell.supervisor?.id ?? null);
    setConfirmAction("leader");
  };

  const openTraineeDialog = () => {
    setTraineeDraft(cell.traineeLeader?.id ?? null);
    setConfirmAction("trainee");
  };

  const statusVariant =
    cell.status === "ACTIVE"
      ? ("success" as const)
      : cell.status === "FORMING"
        ? ("secondary" as const)
        : cell.status === "SUSPENDED"
          ? ("warning" as const)
          : ("destructive" as const);

  return (
    <section aria-labelledby="cell-title" className="space-y-6">
      <Link
        href="/cells"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {t("cells.detail.back")}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 id="cell-title" className="text-2xl font-bold tracking-tight text-foreground">
              {cell.name}
            </h1>
            <Badge variant={statusVariant}>{formatCellStatus(cell.status, t)}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{cell.code}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/cells/${id}/meetings`}>
            <CalendarDays className="size-4" aria-hidden="true" />
            {t("cells.detail.viewMeetings")}
          </Link>
        </Button>
      </div>

      {feedback ? (
        <Alert variant={feedback.kind} title={feedback.kind === "success" ? t("common.success") : t("common.failure")}>
          {feedback.message}
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-base">{t("cells.detail.section.info")}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DescriptionList>
                <DescriptionItem label={t("cells.column.code")} value={cell.code} />
                <DescriptionItem
                  label={t("common.status")}
                  value={<Badge variant={statusVariant}>{formatCellStatus(cell.status, t)}</Badge>}
                />
                <DescriptionItem
                  label={t("cells.column.leader")}
                  value={cell.leader?.name ?? <span className="text-muted-foreground">—</span>}
                />
                <DescriptionItem
                  label={t("cells.detail.label.supervisor")}
                  value={cell.supervisor?.name ?? <span className="text-muted-foreground">—</span>}
                />
                <DescriptionItem
                  label={t("cells.detail.label.trainee")}
                  value={cell.traineeLeader?.name ?? <span className="text-muted-foreground">—</span>}
                />
                <DescriptionItem
                  label={t("cells.detail.label.meeting")}
                  value={t("cells.detail.meetingAt", {
                    day: formatCellDay(cell.meetingDay, t),
                    time: cell.meetingTime
                  })}
                />
                <DescriptionItem
                  label={t("cells.detail.label.address")}
                  value={cell.address}
                />
                <DescriptionItem
                  label={t("cells.detail.label.created")}
                  value={formatCellTimestamp(cell.createdAt, locale)}
                />
                <DescriptionItem
                  label={t("cells.detail.label.updated")}
                  value={formatCellTimestamp(cell.updatedAt, locale)}
                />
              </DescriptionList>
            </CardContent>

            {canEdit ? (
              <>
                <Separator className="mt-0" />
                <Form {...editForm}>
                  <form onSubmit={editForm.handleSubmit(handleSaveEdits)}>
                    <div className="space-y-5 p-6">
                      <p className="text-sm font-semibold text-foreground">{t("cells.detail.edit")}</p>
                      {canEditGeneral ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                          <FormField
                            control={editForm.control}
                            name="code"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("cells.column.code")}</FormLabel>
                                <FormControl>
                                  <Input placeholder="CEL-001" {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={editForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("cells.detail.field.name")}</FormLabel>
                                <FormControl>
                                  <Input placeholder={t("cells.detail.field.name")} {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      ) : null}
                      {canEditMeeting ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                          <FormField
                            control={editForm.control}
                            name="meetingDay"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("cells.detail.field.meetingDay")}</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder={t("cells.detail.field.meetingDay")} />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {DAYS.map((day) => (
                                      <SelectItem key={day.value} value={day.value}>
                                        {day.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={editForm.control}
                            name="meetingTime"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("cells.detail.field.time")}</FormLabel>
                                <FormControl>
                                  <Input placeholder="19:30" {...field} />
                                </FormControl>
                                <FormDescription>{t("cells.detail.time.hint")}</FormDescription>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={editForm.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem className="sm:col-span-2">
                                <FormLabel>{t("cells.detail.field.address")}</FormLabel>
                                <FormControl>
                                  <Input placeholder={t("cells.detail.field.address")} {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      ) : null}
                      <Button type="submit" icon={Save} disabled={!hasEdits} loading={busy} loadingLabel={t("common.saving")}>
                        {t("cells.detail.saveChanges")}
                      </Button>
                    </div>
                  </form>
                </Form>
              </>
            ) : null}
          </Card>

          <CellMembers cellId={id} />
        </div>

        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-base">{t("cells.detail.section.actions")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 pt-6">
              {canManage ? (
                <>
                  {cell.status === "ACTIVE" ? (
                    <Button variant="destructive" icon={PauseCircle} className="w-full justify-start" onClick={() => setConfirmAction("status")}>
                      {t("cells.detail.status.suspend")}
                    </Button>
                  ) : (
                    <Button variant="outline" icon={Play} className="w-full justify-start" onClick={() => setConfirmAction("status")}>
                      {cell.status === "FORMING" ? t("cells.detail.status.activate") : t("cells.detail.status.reactivate")}
                    </Button>
                  )}
                  <Button variant="outline" icon={UserCog} className="w-full justify-start" onClick={openLeaderDialog}>
                    {t("cells.detail.changeLeader")}
                  </Button>
                  {cell.traineeLeader ? (
                    <>
                      <Button variant="outline" icon={UserCog} className="w-full justify-start" onClick={openTraineeDialog}>
                        {t("cells.detail.changeTrainee")}
                      </Button>
                      <Button variant="outline" icon={Trash2} className="w-full justify-start text-destructive hover:text-destructive" onClick={() => setConfirmAction("remove-trainee")}>
                        {t("cells.detail.removeTrainee")}
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" icon={UserCog} className="w-full justify-start" onClick={openTraineeDialog}>
                      {t("cells.detail.assignTrainee")}
                    </Button>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">{t("cells.detail.noManage")}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-base">{t("cells.detail.section.leader")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <LeadershipRow
                icon={UserRound}
                label={t("cells.column.leader")}
                name={cell.leader?.name}
              />
              <LeadershipRow
                icon={ShieldCheck}
                label={t("cells.detail.label.supervisor")}
                name={cell.supervisor?.name}
              />
              <LeadershipRow
                icon={GraduationCap}
                label={t("cells.detail.label.trainee")}
                name={cell.traineeLeader?.name}
              />
            </CardContent>
          </Card>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmAction === "status"}
        onOpenChange={(open) => {
          if (!open) setConfirmAction("none");
        }}
        title={statusTitle}
        description={statusDescription}
      >
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => setConfirmAction("none")} disabled={busy}>
            {t("common.cancel")}
          </Button>
          <Button
            variant={cell.status === "ACTIVE" ? "destructive" : "default"}
            disabled={busy}
            loading={busy}
            loadingLabel={t("cells.detail.dialog.confirming")}
            onClick={() => void runStatusChange()}
          >
            {t("cells.detail.dialog.confirm")}
          </Button>
        </DialogFooter>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmAction === "leader"}
        onOpenChange={(open) => {
          if (!open) setConfirmAction("none");
        }}
        title={t("cells.detail.dialog.changeLeader.title")}
        description={t("cells.detail.dialog.changeLeader.desc")}
      >
        <div className="space-y-4">
          <AssignmentSelect
            label={t("cells.column.leader")}
            kind="LEADER"
            value={leaderDraft}
            onChange={setLeaderDraft}
            currentLabel={cell.leader?.name}
            required
          />
          <AssignmentSelect
            label={t("cells.detail.label.supervisor")}
            kind="SUPERVISOR"
            value={supervisorDraft}
            onChange={setSupervisorDraft}
            currentLabel={cell.supervisor?.name}
            required
          />
        </div>
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => setConfirmAction("none")} disabled={busy}>
            {t("common.cancel")}
          </Button>
          <Button
            disabled={busy || !leaderDraft || !supervisorDraft}
            loading={busy}
            loadingLabel={t("cells.detail.dialog.confirming")}
            onClick={() => void runLeaderChange()}
          >
            {t("cells.detail.dialog.confirm")}
          </Button>
        </DialogFooter>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmAction === "trainee"}
        onOpenChange={(open) => {
          if (!open) setConfirmAction("none");
        }}
        title={t("cells.detail.dialog.trainee.title")}
        description={t("cells.detail.dialog.trainee.desc")}
      >
        <AssignmentSelect
          label={t("cells.detail.label.trainee")}
          kind="TRAINEE"
          value={traineeDraft}
          onChange={setTraineeDraft}
          currentLabel={cell.traineeLeader?.name}
        />
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => setConfirmAction("none")} disabled={busy}>
            {t("common.cancel")}
          </Button>
          <Button
            disabled={busy}
            loading={busy}
            loadingLabel={t("cells.detail.dialog.confirming")}
            onClick={() => void runTraineeChange()}
          >
            {t("cells.detail.dialog.confirm")}
          </Button>
        </DialogFooter>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmAction === "remove-trainee"}
        onOpenChange={(open) => {
          if (!open) setConfirmAction("none");
        }}
        title={t("cells.detail.dialog.removeTrainee.title")}
        description={t("cells.detail.dialog.removeTrainee.desc")}
      >
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => setConfirmAction("none")} disabled={busy}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            disabled={busy}
            loading={busy}
            loadingLabel={t("cells.detail.dialog.confirming")}
            onClick={() => {
              setTraineeDraft(null);
              void runTraineeChange();
            }}
          >
            {t("cells.detail.dialog.removeTrainee.confirm")}
          </Button>
        </DialogFooter>
      </ConfirmDialog>
    </section>
  );
}

function LeadershipRow({
  icon: Icon,
  label,
  name
}: {
  readonly icon: typeof UserRound;
  readonly label: string;
  readonly name: string | undefined | null;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{name ?? "—"}</p>
      </div>
    </div>
  );
}

function messageForError(cause: unknown, action: string, t: (key: TranslationKey, params?: TranslationParams) => string): string {
  if (!(cause instanceof ApiError)) {
    return t("cells.detail.error.tryAgain", { action });
  }
  switch (cause.code) {
    case "CELL_CODE_CONFLICT":
      return t("cells.detail.error.codeConflict");
    case "CELL_LEADER_NOT_ELIGIBLE":
      return t("cells.detail.error.leaderNotEligible");
    case "CELL_SUPERVISOR_CONFLICT":
      return t("cells.detail.error.supervisorConflict");
    case "CELL_SUPERVISOR_NOT_FOUND":
    case "CELL_LEADERSHIP_CANDIDATE_NOT_FOUND":
      return t("cells.detail.error.candidateNotFound");
    case "CELL_STATUS_TRANSITION_INVALID":
      return t("cells.detail.error.transitionInvalid");
    default:
      return t("cells.detail.error.generic", { action });
  }
}