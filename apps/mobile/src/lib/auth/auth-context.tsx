import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import type { StoredUser } from "./session";
import { loadSession, saveSession, clearSession } from "./session";
import { login as apiLogin } from "../api/auth";
import { configureApiClient } from "../api/client";

type AuthState =
  | { status: "loading" }
  | { status: "signedOut" }
  | { status: "signedIn"; accessToken: string; user: StoredUser };

type AuthContextValue = {
  state: AuthState;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getToken: () => string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    loadSession()
      .then((session) => {
        if (session) {
          setState({
            status: "signedIn",
            accessToken: session.accessToken,
            user: session.user
          });
        } else {
          setState({ status: "signedOut" });
        }
      })
      .catch(() => {
        setState({ status: "signedOut" });
      });
  }, []);

  const getToken = useCallback(() => {
    if (state.status === "signedIn") return state.accessToken;
    return null;
  }, [state]);

  useEffect(() => {
    configureApiClient({
      tokenProvider: getToken,
      onUnauthorized: () => {
        setState({ status: "signedOut" });
      }
    });
  }, [getToken]);

  const signIn = useCallback(async (email: string, password: string) => {
    const response = await apiLogin(email, password);
    const { accessToken, user } = response.data;

    const storedUser: StoredUser = {
      id: user.id,
      churchId: user.churchId,
      roles: user.roles,
      firstName: "",
      lastName: ""
    };

    await saveSession({ accessToken, user: storedUser });
    setState({ status: "signedIn", accessToken, user: storedUser });
  }, []);

  const signOut = useCallback(async () => {
    setState({ status: "signedOut" });
    await clearSession();
  }, []);

  const value = useMemo(
    () => ({ state, signIn, signOut, getToken }),
    [state, signIn, signOut, getToken]
  );

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}