import { AuthProvider, useAuth, type AuthContextValue, type User } from "./auth";

/**
 * Backward compatibility wrapper for authentication.
 * Backed by production Session AuthProvider.
 */

export type DemoUser = User;
export type DemoAuthValue = AuthContextValue;

export const DemoAuthProvider = AuthProvider;
export const useDemoAuth = useAuth;
