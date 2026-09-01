/**
 * Centralized query keys shared by TanStack Query hooks and mutations that
 * must invalidate data after a write. Each key maps 1:1 to the legacy
 * (cacheName, cacheKey) pairs used across the web app.
 */
export const queryKeys = {
  profile: {
    all: ["profile"] as const,
    me: () => [...queryKeys.profile.all, "me"] as const
  },
  profilePhoto: {
    all: ["profile-photo"] as const,
    me: () => [...queryKeys.profilePhoto.all, "me"] as const
  },
  users: {
    all: ["users"] as const,
    detail: (id: string) => [...queryKeys.users.all, `detail:${id}`] as const
  },
  managedRoles: {
    all: ["managedRoles"] as const,
    catalog: () => [...queryKeys.managedRoles.all, "catalog"] as const
  },
  people: {
    all: ["people"] as const,
    detail: (id: string) => [...queryKeys.people.all, `detail:${id}`] as const
  },
  cells: {
    all: ["cells"] as const,
    detail: (id: string) => [...queryKeys.cells.all, `detail:${id}`] as const
  },
  meetings: {
    all: ["meetings"] as const,
    detail: (cellId: string, meetingId: string) =>
      [...queryKeys.meetings.all, `detail:${cellId}:${meetingId}`] as const
  },
  attendance: {
    all: ["attendance"] as const,
    detail: (cellId: string, meetingId: string) =>
      [...queryKeys.attendance.all, `${cellId}:${meetingId}`] as const
  },
  analytics: {
    all: ["analytics"] as const
  },
  church: {
    all: ["church"] as const
  }
} as const;