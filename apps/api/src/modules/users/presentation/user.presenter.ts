import type { ManagedUser, UserPage } from "../application/user-management.types";

export function presentUser(user: ManagedUser) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    status: user.status,
    hasProfilePhoto: user.hasProfilePhoto,
    profilePhotoUpdatedAt: user.profilePhotoUpdatedAt?.toISOString() ?? null,
    roles: user.roles.map((role) => ({ id: role.id, name: role.name })),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  };
}

export function presentUserPage(page: UserPage, pageNumber: number, pageSize: number) {
  return {
    data: page.items.map(presentUser),
    meta: {
      page: pageNumber,
      pageSize,
      totalItems: page.totalItems,
      totalPages: Math.ceil(page.totalItems / pageSize)
    }
  };
}
