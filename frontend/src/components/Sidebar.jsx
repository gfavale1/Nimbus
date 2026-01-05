import { NavLink } from "react-router-dom";
import { useState } from "react";
import {
  Cloud,
  LayoutDashboard,
  StickyNote,
  CheckSquare,
  User,
  ChevronLeft,
} from "lucide-react";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const toggleSidebar = () => setCollapsed((v) => !v);

  return (
    <div
      style={{
        ...styles.sidebar,
        width: collapsed ? "78px" : "240px",
      }}
    >
      {/* Header */}
      <div style={styles.header}>
        <div
          style={{
            ...styles.logoContainer,
            justifyContent: collapsed ? "center" : "flex-start",
            cursor: collapsed ? "pointer" : "default",
          }}
          onClick={collapsed ? toggleSidebar : undefined}
          title={collapsed ? "Espandi menu" : undefined}
        >
          <Cloud size={30} color="white" style={styles.cloudIcon} />
        </div>

        {!collapsed && (
          <button onClick={toggleSidebar} style={styles.toggleBtn}>
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={styles.nav}>
        {links.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            title={collapsed ? label : undefined}
            style={({ isActive }) => ({
              ...styles.link,
              background: isActive
                ? "linear-gradient(90deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))"
                : "transparent",
              borderLeft: isActive
                ? "3px solid #93c5fd"
                : "3px solid transparent",
            })}
          >
            <Icon size={20} />
            {!collapsed && <span style={styles.label}>{label}</span>}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

const links = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/notes", label: "Note", icon: StickyNote },
  { path: "/tasks", label: "Attività", icon: CheckSquare },
  { path: "/profile", label: "Profilo", icon: User },
];

const styles = {
  sidebar: {
    height: "100%",
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(12px)",
    borderRight: "1px solid rgba(255,255,255,0.1)",
    display: "flex",
    flexDirection: "column",
    transition: "width 0.3s ease",
    color: "white",
    boxShadow: "0 0 25px rgba(0,0,0,0.2)",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px",
    height: "75.5px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
    flexGrow: 1,
  },
  cloudIcon: {
    flexShrink: 0,
  },
  toggleBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "6px",
    borderRadius: "8px",
    color: "white",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    padding: "12px 8px",
    flex: 1,
    gap: "4px",
  },
  link: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 16px",
    color: "white",
    textDecoration: "none",
    fontSize: "0.95rem",
    fontWeight: 500,
    borderRadius: "10px",
    transition: "all 0.2s ease",
  },
  label: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
};
