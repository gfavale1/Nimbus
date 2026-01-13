import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useMsalAuth } from "../hooks/useMsalAuth";

export default function MainLayout() {
  const { user, signOut } = useMsalAuth();
  const location = useLocation();

  if (location.pathname === "/login") {
    return <Outlet />;
  }

  const getPageTitle = () => {
    if (location.pathname.includes("dashboard")) return "Dashboard";
    if (location.pathname.includes("notes")) return "Le mie Note";
    if (location.pathname.includes("tasks")) return "Le mie Attività";
    if (location.pathname.includes("profile")) return "Profilo Utente";
    return "Nimbus";
  };

  return (
    <div style={styles.layout}>
      <Sidebar />
      <div style={styles.main}>
        <header style={styles.topbar}>
          <h1 style={styles.pageTitle}>Nimbus</h1>
          {user && (
            <div style={styles.userSection}>
              <span style={styles.username}>{user.name}</span>
              <button onClick={signOut} style={styles.logoutBtn}>
                Disconnetti
              </button>
            </div>
          )}
        </header>
        <main style={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const styles = {
  layout: {
    display: "flex",
    height: "100vh",
    width: "100vw",
    overflow: "hidden",
    fontFamily: "Inter, system-ui, sans-serif",
    background:
      "linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #312e81 100%)",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    position: "relative",
    overflow: "hidden",
    zIndex: 0,
  },
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 32px",
    background: "rgba(255,255,255,0.05)",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    backdropFilter: "blur(6px)",
    position: "sticky",
    top: 0,
    zIndex: 5,
  },
  pageTitle: {
    fontSize: "1.3rem",
    fontWeight: 600,
    color: "white",
  },
  userSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  username: { fontWeight: 500, color: "white" },
  logoutBtn: {
    background: "rgba(255,255,255,0.15)",
    border: "none",
    borderRadius: "8px",
    padding: "8px 14px",
    color: "white",
    cursor: "pointer",
  },
  content: {
    flex: 1,
    overflowY: "auto",
    position: "relative",
    zIndex: 1,
    padding: "30px 50px",
    minHeight: "calc(100vh - 80px)",
    color: "white",
  },
};
