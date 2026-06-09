import { createContext } from "react";

export type ProfileState = {
  /** Still determining sync/profile status. */
  isLoading: boolean;
  /** True once the user has completed onboarding (has a username). */
  hasProfile: boolean;
  /** True if the initial sync request failed. */
  syncError: boolean;
  /** Mark the profile complete locally (e.g. right after onboarding). */
  markProfileComplete: () => void;
  /** Re-run the sync (e.g. to recover from an error). */
  refresh: () => void;
};

export const ProfileContext = createContext<ProfileState | null>(null);
