import { useAuth } from "../context/AuthContext";
import { useMsalAuth } from "../hooks/useMsalAuth";
import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  const { user } = useAuth();
  const { signOut } = useMsalAuth();

  if (!user) return null;

  return (
    <div style={styles.wrapper}>
      <aside style={styles.sidebar}>
        <div style={styles.logo}>Nimbus</div>
        <Sidebar />
      </aside>

      <div style={styles.main}>
        <header style={styles.navbar}>
          <div style={styles.userInfo}>
            <span style={styles.greeting}>Ciao,</span>
            <strong style={styles.username}>
              {user.display_name || user.email}
            </strong>
          </div>
          <button style={styles.logoutBtn} onClick={signOut}>
            Logout
          </button>
        </header>

        <main style={styles.content}>{children}</main>
      </div>
    </div>
  );
}


const styles = {
  wrapper: {
    display: "flex",
    height: "100vh",
    width: "100vw",
    overflow: "hidden",
    fontFamily: "Inter, system-ui, sans-serif",
    backgroundColor: "#f9fafb",
    color: "#111827",
  },
  sidebar: {
    width: "240px",
    minWidth: "240px",
    backgroundColor: "#1f2937",
    display: "flex",
    flexDirection: "column",
    color: "white",
    margin: 0,
    padding: 0,       
    border: "none",    
    boxShadow: "2px 0 6px rgba(0,0,0,0.1)",
  },

  logo: {
    fontSize: "1.4rem",
    fontWeight: 700,
    padding: "1.2rem 1.5rem",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    overflow: "hidden",
  },
  navbar: {
    height: "60px",
    backgroundColor: "#ffffff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 1.8rem",
    borderBottom: "1px solid #e5e7eb",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
  },
  greeting: {
    color: "#4b5563",
    fontSize: "0.95rem",
  },
  username: {
    color: "#111827",
    fontWeight: "600",
  },
  logoutBtn: {
    backgroundColor: "#ef4444",
    border: "none",
    borderRadius: "8px",
    padding: "0.4rem 1rem",
    color: "white",
    cursor: "pointer",
    fontWeight: 500,
    fontSize: "0.9rem",
    transition: "background 0.2s ease",
  },
  content: {
    flex: 1,
    overflowY: "auto",
    padding: "2rem",
    backgroundColor: "#f9fafb",
  },
};
