import { Routes, Route } from "react-router-dom";

import LogIn from "./pages/logIn";
import SignUpPage from "./pages/signUp";
import Home from "./pages/home";
import Onboarding from "./pages/onboarding";
import Account from "./pages/account";
import NotFound from "./pages/notFound";
import ProtectedRoute from "./components/ProtectedRoute";
import RootRedirect from "./components/RootRedirect";
import RequireProfile from "./components/RequireProfile";
import { ProfileProvider } from "./lib/profile";

function App() {
  return (
    <ProfileProvider>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/sign-in/*" element={<LogIn />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />

        {/* Onboarding: must be signed in, but NOT yet have a profile. */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />

        {/* Everything below requires a completed profile. */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <RequireProfile>
                <Home />
              </RequireProfile>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/:username"
          element={
            <ProtectedRoute>
              <RequireProfile>
                <Account />
              </RequireProfile>
            </ProtectedRoute>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <RequireProfile>
                <Account />
              </RequireProfile>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </ProfileProvider>
  );
}

export default App;
