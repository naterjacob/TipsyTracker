import { Routes, Route } from 'react-router-dom';

import LogIn from "./pages/logIn";
import Home from "./pages/home";
import SignUpPage from "./pages/signUp";
import ProtectedRoute from "./components/ProtectedRoute";
import Onboarding from "./pages/onboarding";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LogIn />} />
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