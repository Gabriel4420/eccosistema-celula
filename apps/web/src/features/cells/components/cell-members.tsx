"use client";

import Link from "next/link";
import { MoreVertical, UserMinus, UserPlus, UsersRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { CellMemberResponse, PersonResponse } from "@mission-atos/contracts";
import { Alert, Pagination } from "@/src/shared/components";
import { ApiError } from "@/src/shared/api/api-error";
import { cacheStore } from "@/src/shared/cache/cache";
import { useRemoteQuery } from "@/src/shared/hooks/use-remote-query";
import { useSession } from "@/src/providers/session-provider";
import { toast } from "@/src/shared/toast/toast-store";
import { useI18n } from "@/src/shared/i18n/language-provider";
import type { TranslationKey, TranslationParams } from "@/src/shared/i18n/dictionaries";
import {
  addCellMember,
  listCellMembers,
  removeCellMember
} from "@/src/features/cells/api/cells-api";
import type { CellMemberStatus } from "@/src/features/cells/api/cells-api";
import { listPeople } from "@/src/features/people/api/people-api";
import { formatCellTimestamp } from "@/src/features/cells/lib/format";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/src/shared/ui";

const CELLS_CACHE = "cells";
const PEOPLE_CACHE = "people";
const MEMBERS_PAGE_SIZE = 10;
const CANDIDATES_PAGE_SIZE = 20;
const DEBOUNCE_MS = 300;

interface CellMembersProps {
  readonly cellId: string;
}

type MemberStatusFilter = CellMemberStatus | "ALL";

const STATUS_FILTERS: ReadonlyArray<{ readonly value: MemberStatusFilter; readonly labelKey: TranslationKey }> = [
  { value: "ALL", labelKey: "cells.members.status.all" },
  { value: "ACTIVE", labelKey: "cells.members.status.active" },
  { value: "INACTIVE", labelKey: "cells.members.status.inactive" },
  { value: "TRANSFERRED", labelKey: "cells.members.status.transferred" }
];

export function CellMembers({ cellId }: CellMembersProps) {
  const { t, locale } = useI18n();
  const { api, capabilities } = useSession();
  const canManage = capabilities.manageCellMembers;
  const requiresReason = capabilities.requiresCellMemberReason;

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<MemberStatusFilter>("ACTIVE");
  const [addOpen, setAddOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<CellMemberResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [query, setQuery] = useState("");
  const [addReason, setAddReason] = useState("");
  const [addReasonError, setAddReasonError] = useState<string | undefined>(undefined);
  const [removeReason, setRemoveReason] = useState("");
  const [removeReasonError, setRemoveReasonError] = useState<string | undefined>(undefined);
  const [candidates, setCandidates] = useState<readonly PersonResponse[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidatesFailed, setCandidatesFailed] = useState(false);
  const searchTimer = useRef<number | null>(null);

  const {
    data: membersPage,
    loading,
    error,
    reload
  } = useRemoteQuery({
    fetcher: () =>
      listCellMembers(api, cellId, {
        page,
        pageSize: MEMBERS_PAGE_SIZE,
        status: status === "ALL" ? undefined : status
      }),
    cacheName: CELLS_CACHE,
    cacheKey: `members:${cellId}:status:${status}:page:${page}`,
    ttlMs: 20_000
  });

  const rows = membersPage?.data ?? [];

  useEffect(
    () => () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current);
    },
    []
  );

  const loadCandidates = (search: string) => {
    setCandidatesLoading(true);
    setCandidatesFailed(false);
    void listPeople(api, {
      page: 1,
      pageSize: CANDIDATES_PAGE_SIZE,
      search: search.trim() || undefined,
      status: "ACTIVE"
    })
      .then((result) => setCandidates(result.data))
      .catch(() => {
        setCandidates([]);
        setCandidatesFailed(true);
      })
      .finally(() => setCandidatesLoading(false));
  };

  const openAdd = () => {
    setQuery("");
    setAddReason("");
    setAddReasonError(undefined);
    setCandidates([]);
    setFeedback(null);
    setAddOpen(true);
    loadCandidates("");
  };

  const openRemove = (member: CellMemberResponse) => {
    setRemoveReason("");
    setRemoveReasonError(undefined);
    setFeedback(null);
    setRemoveTarget(member);
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => loadCandidates(value), DEBOUNCE_MS);
  };

  const invalidateCellData = () => {
    cacheStore(CELLS_CACHE).invalidatePrefix("members");
    cacheStore(CELLS_CACHE).invalidatePrefix("detail");
    cacheStore(CELLS_CACHE).invalidatePrefix("page");
    cacheStore(PEOPLE_CACHE).invalidatePrefix("detail");
  };

  const runAdd = async (event: FormEvent, person: PersonResponse) => {
    event.preventDefault();
    const isTransfer = person.currentCell !== null && person.currentCell.id !== cellId;
    if (requiresReason && isTransfer && !addReason.trim()) {
      setAddReasonError(t("cells.members.reason.required"));
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      await addCellMember(api, cellId, person.id, addReason.trim() || undefined);
      invalidateCellData();
      await reload();
      setAddOpen(false);
      toast({
        kind: "success",
        title: t("cells.members.toast.added"),
        description: t("cells.members.toast.added.desc", { name: person.fullName })
      });
    } catch (cause) {
      setFeedback({
        kind: "error",
        message: messageForError(cause, t("cells.members.add"), t)
      });
    } finally {
      setBusy(false);
    }
  };

  const runRemove = async () => {
    if (!removeTarget) return;
    if (requiresReason && !removeReason.trim()) {
      setRemoveReasonError(t("cells.members.reason.required"));
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      await removeCellMember(api, cellId, removeTarget.personId, removeReason.trim() || undefined);
      invalidateCellData();
      await reload();
      setRemoveTarget(null);
      toast({
        kind: "success",
        title: t("cells.members.toast.removed"),
        description: t("cells.members.toast.removed.desc", { name: removeTarget.fullName })
      });
    } catch (cause) {
      setFeedback({
        kind: "error",
        message: messageForError(cause, t("cells.members.remove"), t)
      });
    } finally {
      setBusy(false);
    }
  };

  const activeMemberIds = new Set(
    rows.filter((member) => member.status === "ACTIVE").map((member) => member.personId)
  );
  const availableCandidates = candidates.filter((person) => !activeMemberIds.has(person.id));

  return (
    <section aria-labelledby="cell-members-title">
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-4 sm:px-6">
          <h2 id="cell-members-title" className="text-base font-semibold tracking-tight text-foreground">
            {t("cells.detail.section.members")}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={status} onValueChange={(value) => { setPage(1); setStatus(value as MemberStatusFilter); }}>
              <SelectTrigger className="h-9 w-full min-w-[9.5rem] sm:w-auto" aria-label={t("common.status")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {canManage ? (
              <Button icon={UserPlus} onClick={openAdd} disabled={busy}>
                {t("cells.members.add")}
              </Button>
            ) : null}
          </div>
        </div>

        {feedback || error ? (
          <div className="px-4 py-4 sm:px-6">
            <Alert variant={feedback?.kind ?? "error"} title={feedback ? (feedback.kind === "success" ? t("common.success") : t("common.failure")) : t("cells.members.error.load")}>
              {feedback?.message ?? (error !== null ? t("cells.members.error.load") : null)}
            </Alert>
          </div>
        ) : null}

        {loading && rows.length === 0 ? (
          <div className="space-y-2 p-4 sm:p-6" aria-label={t("cells.members.loading")}>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : null}

        {!loading && rows.length === 0 && !error ? (
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <UsersRound className="size-6" aria-hidden="true" />
            </span>
            <div className="space-y-1">
              <p className="text-base font-medium text-foreground">{t("cells.members.empty")}</p>
              <p className="text-sm text-muted-foreground">{t("cells.members.empty.desc")}</p>
            </div>
            {canManage ? (
              <Button icon={UserPlus} size="sm" onClick={openAdd}>
                {t("cells.members.add")}
              </Button>
            ) : null}
          </div>
        ) : null}

        {rows.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("people.column.name")}</TableHead>
                    <TableHead>{t("people.column.phone")}</TableHead>
                    <TableHead>{t("cells.members.column.joined")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                    <TableHead className="w-12 text-right">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((member) => (
                    <TableRow key={member.personId}>
                      <TableCell>
                        <div className="min-w-0">
                          <Link
                            href={`/people/${member.personId}`}
                            className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                          >
                            {member.fullName}
                          </Link>
                          {member.reason ? (
                            <p className="mt-0.5 text-xs text-muted-foreground [overflow-wrap:anywhere]">
                              {member.reason}
                            </p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{member.phone ?? "—"}</TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatCellTimestamp(member.joinedAt, locale)}
                      </TableCell>
                      <TableCell>
                        <MemberStatusBadge status={member.status} t={t} />
                      </TableCell>
                      <TableCell className="text-right">
                        {canManage && member.status === "ACTIVE" ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                aria-label={t("cells.members.rowActions", { name: member.fullName })}
                              >
                                <MoreVertical className="size-4" aria-hidden="true" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => openRemove(member)}
                              >
                                <UserMinus className="size-4" aria-hidden="true" />
                                {t("cells.members.remove")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="border-t px-4 py-3 sm:px-6">
              <Pagination
                page={page}
                pageSize={MEMBERS_PAGE_SIZE}
                totalItems={membersPage?.meta.totalItems ?? 0}
                totalPages={membersPage?.meta.totalPages ?? 0}
                onPageChange={setPage}
              />
            </div>
          </>
        ) : null}
      </Card>

      <Dialog open={addOpen} onOpenChange={(open) => setAddOpen(open)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("cells.members.add.title")}</DialogTitle>
            <DialogDescription>{t("cells.members.add.desc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="candidate-search">{t("cells.members.search")}</Label>
              <Input
                id="candidate-search"
                name="candidateSearch"
                value={query}
                onChange={(event) => handleQueryChange(event.target.value)}
                autoComplete="off"
                placeholder={t("cells.members.search")}
              />
              <p className="text-sm text-muted-foreground">{t("cells.members.search.hint")}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="candidate-reason">{t("cells.members.reason")}</Label>
              <Input
                id="candidate-reason"
                name="candidateReason"
                value={addReason}
                onChange={(event) => {
                  setAddReason(event.target.value);
                  if (addReasonError) setAddReasonError(undefined);
                }}
                aria-invalid={addReasonError ? true : undefined}
              />
              {addReasonError ? (
                <p className="text-sm font-medium text-destructive" role="alert">
                  {addReasonError}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">{t("cells.members.reason.hint")}</p>
              )}
            </div>
            <div className="selection-list" role="list" aria-label={t("cells.members.search")}>
              {candidatesLoading ? (
                <div aria-label={t("cells.members.loading")}>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="mt-2 h-10 w-full" />
                </div>
              ) : candidatesFailed ? (
                <Alert variant="error">{t("cells.members.searchFailed")}</Alert>
              ) : availableCandidates.length === 0 ? (
                <p className="selection-list__empty">{t("cells.members.noCandidates")}</p>
              ) : (
                availableCandidates.map((person) => (
                  <div key={person.id} className="selection-list__item" role="listitem">
                    <div className="selection-list__info">
                      <span className="selection-list__title">{person.fullName}</span>
                      <span className="selection-list__subtitle">
                        {person.currentCell
                          ? t("cells.members.transferHint", { cell: person.currentCell.name })
                          : person.phone ?? ""}
                      </span>
                    </div>
                    <form onSubmit={(event) => void runAdd(event, person)}>
                      <Button type="submit" icon={UserPlus} size="sm" loading={busy} loadingLabel={t("common.saving")} disabled={busy}>
                        {t("cells.members.add")}
                      </Button>
                    </form>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={removeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
        title={t("cells.members.remove.title")}
        description={t("cells.members.remove.desc", { name: removeTarget?.fullName ?? "" })}
      >
        <div className="space-y-2">
          <Label htmlFor="remove-reason">{t("cells.members.reason")}</Label>
          <Input
            id="remove-reason"
            name="removeReason"
            value={removeReason}
            onChange={(event) => {
              setRemoveReason(event.target.value);
              if (removeReasonError) setRemoveReasonError(undefined);
            }}
            aria-invalid={removeReasonError ? true : undefined}
          />
          {removeReasonError ? (
            <p className="text-sm font-medium text-destructive" role="alert">
              {removeReasonError}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">{t("cells.members.reason.hint")}</p>
          )}
        </div>
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => setRemoveTarget(null)} disabled={busy}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            icon={UserMinus}
            loading={busy}
            loadingLabel={t("cells.detail.dialog.confirming")}
            onClick={() => void runRemove()}
          >
            {t("cells.members.remove")}
          </Button>
        </DialogFooter>
      </ConfirmDialog>
    </section>
  );
}

function MemberStatusBadge({
  status,
  t
}: {
  readonly status: CellMemberResponse["status"];
  readonly t: (key: TranslationKey, params?: TranslationParams) => string;
}) {
  const variant =
    status === "ACTIVE" ? ("success" as const) : status === "INACTIVE" ? ("secondary" as const) : ("warning" as const);
  const label =
    status === "ACTIVE"
      ? t("cells.members.status.active")
      : status === "INACTIVE"
        ? t("cells.members.status.inactive")
        : t("cells.members.status.transferred");
  return <Badge variant={variant}>{label}</Badge>;
}

function messageForError(cause: unknown, action: string, t: (key: TranslationKey, params?: TranslationParams) => string): string {
  if (!(cause instanceof ApiError)) {
    return t("cells.members.error.generic", { action });
  }
  switch (cause.code) {
    case "CELL_MEMBER_ALREADY_ASSOCIATED":
      return t("cells.members.error.alreadyMember");
    case "CELL_MEMBER_REASON_REQUIRED":
      return t("cells.members.error.reasonRequired");
    default:
      return t("cells.members.error.generic", { action });
  }
}