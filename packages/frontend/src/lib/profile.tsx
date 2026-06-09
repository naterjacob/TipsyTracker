import {
  useCallback,
  useEffect,
  useState,
  type ReactNode
} from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useAuthedFetch } from "./api";
import { ProfileContext } from "./profileContext";

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const authedFetch = useAuthedFetch();

  const [isLoading, setIsLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!isLoaded) return;

    // Signed-out users have nothing to sync.
    if (!isSignedIn || !user) {
      return;
    }

    let isMounted = true;

    void (async () => {
      setIsLoading(true);
      setSyncError(false);
      try {
        const res = await authedFetch("/api/auth/sync", { method: "POST" });
        if (!res.ok) throw new Error(`sync failed: ${res.status}`);
        const data = (await res.json()) as { hasProfile?: boolean };
        if (isMounted) {
          setHasProfile(Boolean(data.hasProfile));
          setIsLoading(false);
        }
      } catch {
        if (isMounted) {
          setSyncError(true);
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isLoaded, isSignedIn, user, authedFetch, attempt]);

  // Derive state for signed-out / not-yet-loaded users without setState in
  // the effect body.
  const signedOut = isLoaded && (!isSignedIn || !user);
  const effectiveLoading = signedOut ? false : isLoading;
  const effectiveHasProfile = signedOut ? false : hasProfile;
  const effectiveSyncError = signedOut ? false : syncError;

  const markProfileComplete = useCallback(() => setHasProfile(true), []);
  const refresh = useCallback(() => setAttempt((value) => value + 1), []);

  return (
    <ProfileContext.Provider
      value={{
        isLoading: effectiveLoading,
        hasProfile: effectiveHasProfile,
        syncError: effectiveSyncError,
        markProfileComplete,
        refresh
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}
