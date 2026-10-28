import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiClient, setAuthToken, getAuthToken } from "./api-client";

/**
 * Production Client Session Authentication Provider.
 * Persists active user session, organization workspace, and profile across page reloads.
 * Synchronizes with the Express/MongoDB backend (http://localhost:5000/api).
 */

const SESSION_STORAGE_KEY = "aapnacronjob_session";

export interface User {
  id?: string;
  name: string;
  email: string;
  workspace: string;
  role?: string;
  avatarUrl?: string;
  telegramChatId?: string;
  telegramNotificationsEnabled?: boolean;
}

export type AuthState = "unknown" | "signed-in" | "signed-out";

export interface SignInCredentials extends Partial<User> {
  password?: string;
  login?: string;
}

export interface SignUpData {
  name: string;
  email: string;
  password?: string;
  workspace?: string;
  telegramChatId?: string;
  username?: string;
}

export interface AuthContextValue {
  state: AuthState;
  user: User | null;
  signIn: (credentials?: SignInCredentials) => Promise<boolean>;
  signUp: (data: SignUpData) => Promise<boolean>;
  signOut: () => Promise<void>;
  updateProfile: (partial: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>("unknown");
  const [user, setUser] = useState<User | null>(null);

  // Initialize session and verify with live backend if token exists
  useEffect(() => {
    let mounted = true;

    async function initSession() {
      // 1. Process Google OAuth callback token in URL query if present
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get("token");
        const urlUsername = urlParams.get("username");
        if (urlToken) {
          setAuthToken(urlToken);
          if (urlUsername) {
            const initialUser: User = {
              name: urlUsername,
              email: `${urlUsername}@apnascheduler.local`,
              workspace: `${urlUsername}'s Workspace`,
              role: "user",
            };
            window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(initialUser));
          }
          try {
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch {}
        }
      }

      const token = getAuthToken();
      if (!token) {
        if (mounted) {
          setUser(null);
          setState("signed-out");
        }
        return;
      }

      let localUser: User | null = null;
      try {
        const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
        if (raw) {
          localUser = JSON.parse(raw) as User;
        }
      } catch {
        // ignore storage error
      }

      if (localUser && mounted) {
        setUser(localUser);
        setState("signed-in");
      }

      // Check with live backend /api/auth/me using real JWT token
      try {
        const res = await apiClient.auth.me();
        if (mounted) {
          if (res.success && res.user) {
            const backendUser: User = {
              id: res.user._id || res.user.id,
              name: res.user.username || res.user.name || localUser?.name || "User",
              email: res.user.email || localUser?.email || "",
              workspace: localUser?.workspace || "Production Workspace",
              role: res.user.role || localUser?.role || "user",
              telegramChatId: res.user.telegramChatId,
              telegramNotificationsEnabled: res.user.telegramNotificationsEnabled,
            };
            setUser(backendUser);
            window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(backendUser));
            setState("signed-in");
          } else {
            // Token expired or invalid
            setAuthToken(null);
            window.localStorage.removeItem(SESSION_STORAGE_KEY);
            setUser(null);
            setState("signed-out");
          }
        }
      } catch (err: any) {
        // If 401 Unauthorized or token invalid, clear session immediately
        const msg = String(err?.message || "").toLowerCase();
        if (
          msg.includes("401") ||
          msg.includes("unauthorized") ||
          msg.includes("invalid or expired") ||
          msg.includes("token")
        ) {
          setAuthToken(null);
          try {
            window.localStorage.removeItem(SESSION_STORAGE_KEY);
          } catch {}
          if (mounted) {
            setUser(null);
            setState("signed-out");
          }
        } else if (mounted && !localUser) {
          setState("signed-out");
        }
      }
    }

    initSession();
    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      state,
      user,
      signIn: async (credentials) => {
        const loginIdentifier = (credentials?.login || credentials?.email || "").trim();
        const password = (credentials?.password || "").trim();

        if (!loginIdentifier || !password) {
          throw new Error("Please enter your username/email and password.");
        }

        const res = await apiClient.auth.login(loginIdentifier, password);
        if (res.success && res.user && res.token) {
          const loggedUser: User = {
            id: res.user.id || res.user._id,
            name: res.user.username || res.user.name || loginIdentifier,
            email: res.user.email || loginIdentifier,
            workspace:
              credentials?.workspace || `${res.user.username || "AapnaCronJob"}'s Workspace`,
            role: res.user.role || "user",
            telegramChatId: res.user.telegramChatId,
            telegramNotificationsEnabled: res.user.telegramNotificationsEnabled,
          };

          try {
            window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(loggedUser));
          } catch {
            // ignore
          }
          setAuthToken(res.token);
          setUser(loggedUser);
          setState("signed-in");
          return true;
        }

        throw new Error(res.error || "Invalid username/email or password.");
      },

      signUp: async ({ name, email, password, workspace, telegramChatId, username }) => {
        const trimmedName = (name || "").trim();
        const trimmedEmail = (email || "").trim();
        const trimmedPass = (password || "").trim();

        if (!trimmedName || !trimmedEmail || !trimmedPass) {
          throw new Error("Name, email, and password are required.");
        }

        if (trimmedPass.length < 6) {
          throw new Error("Password must be at least 6 characters.");
        }

        let cleanUsername = (username || trimmedName || trimmedEmail.split("@")[0] || "user")
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, "_")
          .slice(0, 20);
        if (cleanUsername.length < 3) cleanUsername = "user_" + cleanUsername;

        const res = await apiClient.auth.register({
          username: cleanUsername,
          email: trimmedEmail.toLowerCase(),
          password: trimmedPass,
          telegramChatId: telegramChatId || "",
        });

        if (res.success && res.user && res.token) {
          const createdUser: User = {
            id: res.user.id || res.user._id,
            name: res.user.username || trimmedName,
            email: res.user.email || trimmedEmail,
            workspace: workspace || `${trimmedName}'s Workspace`,
            role: res.user.role || "user",
            telegramChatId: res.user.telegramChatId,
          };

          try {
            window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(createdUser));
          } catch {
            // ignore
          }
          setAuthToken(res.token);
          setUser(createdUser);
          setState("signed-in");
          return true;
        }

        throw new Error(res.error || "Failed to create account. Please check your credentials.");
      },

      signOut: async () => {
        try {
          await apiClient.auth.logout();
        } catch {
          // ignore
        } finally {
          setAuthToken(null);
          try {
            window.localStorage.removeItem(SESSION_STORAGE_KEY);
            const keysToRemove: string[] = [];
            for (let i = 0; i < window.localStorage.length; i++) {
              const k = window.localStorage.key(i);
              if (k && (k.startsWith("aapnacronjob_") || k.startsWith("apnacronjob_"))) {
                keysToRemove.push(k);
              }
            }
            keysToRemove.forEach((k) => window.localStorage.removeItem(k));
          } catch {
            // ignore
          }
          setUser(null);
          setState("signed-out");
        }
      },

      updateProfile: async (partial) => {
        if (!user) return;
        try {
          if (
            partial.telegramChatId !== undefined ||
            partial.telegramNotificationsEnabled !== undefined
          ) {
            const profilePayload: {
              telegramChatId?: string;
              telegramNotificationsEnabled?: boolean;
            } = {};
            if (partial.telegramChatId !== undefined) {
              profilePayload.telegramChatId = partial.telegramChatId;
            }
            if (partial.telegramNotificationsEnabled !== undefined) {
              profilePayload.telegramNotificationsEnabled = partial.telegramNotificationsEnabled;
            }
            await apiClient.auth.updateProfile(profilePayload);
          }
        } catch (err: any) {
          console.warn("Backend profile update error:", err.message);
        }

        const nextUser = { ...user, ...partial };
        try {
          window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextUser));
        } catch {
          // ignore
        }
        setUser(nextUser);
      },
    }),
    [state, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
