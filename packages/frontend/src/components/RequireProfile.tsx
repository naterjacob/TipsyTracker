import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Alert, Box, Button } from "@mui/material";
import { useProfile } from "../lib/useProfile";
import Loading from "./ui/Loading";

/**
 * Guards app pages that require a completed profile. Assumes it is rendered
 * inside ProtectedRoute (user is already signed in).
 */
export default function RequireProfile({ children }: { children: ReactNode }) {
  const { isLoading, hasProfile, syncError, refresh } = useProfile();

  if (isLoading) {
    return <Loading fullPage label="Loading…" />;
  }

  if (syncError) {
    return (
      <Box sx={{ maxWidth: 480, mx: "auto", mt: 8, px: 2 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={refresh}>
              Retry
            </Button>
          }
        >
          We couldn't load your account. Check your connection and try again.
        </Alert>
      </Box>
    );
  }

  if (!hasProfile) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
