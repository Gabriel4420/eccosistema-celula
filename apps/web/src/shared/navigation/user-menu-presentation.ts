interface UserMenuIdentity {
  readonly displayName: string;
  readonly initials: string;
}

export function formatUserMenuIdentity(
  firstName: string,
  lastName: string
): UserMenuIdentity {
  const normalizedFirstName = firstName.trim();
  const normalizedLastName = lastName.trim();
  const firstInitial = Array.from(normalizedFirstName)[0] ?? "";
  const lastInitial = Array.from(normalizedLastName)[0] ?? "";
  const displayName = lastInitial
    ? `${normalizedFirstName} ${lastInitial.toLocaleUpperCase("pt-BR")}.`
    : normalizedFirstName;

  return {
    displayName: displayName || "Usuário",
    initials: `${firstInitial}${lastInitial}`.toLocaleUpperCase("pt-BR") || "U"
  };
}
