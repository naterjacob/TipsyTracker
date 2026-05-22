import { Routes, Route, Navigate } from "react-router-dom";

import LogIn from "./pages/logIn";
import SignUpPage from "./pages/signUp";
import Home from "./pages/home";
import Onboarding from "./pages/onboarding";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthSync from "./components/AuthSync";

function App() {
  return (
    <>
      <AuthSync />

      <Routes>
        <Route path="/" element={<Navigate to="/sign-in" replace />} />
        <Route path="/sign-in/*" element={<LogIn />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />

        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;