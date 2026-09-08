import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "access_token";
const USER_KEY = "user";

export type StoredUser = {
  id: string;
  churchId: string;
  roles: string[];
  firstName: string;
  lastName: string;
};

export async function saveSession(opts: {
  accessToken: string;
  user: StoredUser;
}): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, opts.accessToken),
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(opts.user))
  ]);
}

export async function loadSession(): Promise<{
  accessToken: string;
  user: StoredUser;
} | null> {
  const [token, userJson] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(USER_KEY)
  ]);

  if (!token || !userJson) return null;

  try {
    return { accessToken: token, user: JSON.parse(userJson) as StoredUser };
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(USER_KEY)
  ]);
}

export function getTokenSync(): string | null {
  return SecureStore.getItem(ACCESS_TOKEN_KEY);
}