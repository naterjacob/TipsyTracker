import { useEffect, useRef } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useAuthedFetch } from "../lib/api";

function AuthSync() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  const authedFetch = useAuthedFetch();

  const didRun = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user || didRun.current) {
      return;
    }

    didRun.current = true;

    void authedFetch("/api/auth/sync", {
      method: "POST",
    });
  }, [isLoaded, isSignedIn, user, authedFetch]);

  return null;
}

export default AuthSync;