import { Navigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import Loading from "./ui/Loading";

/** Send signed-in users to the app, signed-out users to sign-in. */
export default function RootRedirect() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <Loading fullPage label="Loading…" />;
  }

  return <Navigate to={isSignedIn ? "/home" : "/sign-in"} replace />;
}
