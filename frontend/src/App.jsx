import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Notes from "./pages/Notes";
import Tasks from "./pages/Tasks";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

const styles = {
  loaderContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    background: "##294ab1", // slate-900
    color: "white",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  loaderCard: {
    textAlign: "center",
    background: "rgba(255,255,255,0.05)",
    padding: "3rem 4rem",
    borderRadius: "16px",
    boxShadow: "0 8px 25px rgba(0,0,0,0.2)",
    backdropFilter: "blur(6px)",
  },
  logo: { fontSize: "3.2rem", animation: "pulse 2s infinite" },
  text: { fontSize: "1.2rem", fontWeight: 500, marginTop: "1rem" },
  spinner: {
    margin: "1.8rem auto 0",
    border: "4px solid rgba(255,255,255,0.2)",
    borderTop: "4px solid #fff",
    borderRadius: "50%",
    width: "48px",
    height: "48px",
    animation: "spin 1s linear infinite",
  },
};

// Animazioni globali
if (typeof document !== "undefined" && document.styleSheets.length) {
  const sheet = document.styleSheets[0];
  sheet.insertRule(
    `@keyframes spin {0% {transform: rotate(0deg);}100% {transform: rotate(360deg);}}`,
    sheet.cssRules.length
  );
  sheet.insertRule(
    `@keyframes pulse {0%,100% {transform: scale(1);opacity: 1;}50% {transform: scale(1.2);opacity: 0.8;}}`,
    sheet.cssRules.length
  );
}
