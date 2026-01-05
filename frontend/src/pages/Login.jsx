import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMsalAuth } from "../hooks/useMsalAuth";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { signIn, statusText, isTransitioning } = useMsalAuth();
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  // 🔑 SE sei autenticato → vai in dashboard
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>☁️</div>

        <h1 style={styles.title}>Nimbus</h1>
        <p style={styles.subtitle}>
          Accedi con Microsoft per continuare
        </p>

        <button
          style={{
            ...styles.loginButton,
            opacity: isTransitioning ? 0.7 : 1,
            cursor: isTransitioning ? "not-allowed" : "pointer",
          }}
          onClick={signIn}
          disabled={isTransitioning}
        >
          {isTransitioning ? statusText : "Accedi con Microsoft"}
        </button>
      </div>
    </div>
  );
}
const styles = {
  container: {
    background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #312e81 100%)",
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  card: {
    backgroundColor: "#ffffff",
    padding: "3rem 4rem",
    borderRadius: "16px",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.08)",
    textAlign: "center",
    maxWidth: "420px",
    width: "90%",
  },
  logo: {
    fontSize: "3rem",
    marginBottom: "0.5rem",
  },
  title: {
    fontSize: "1.8rem",
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: "0.3rem",
  },
  subtitle: {
    fontSize: "1rem",
    color: "#64748b",
    marginBottom: "2rem",
  },
  loginButton: {
    backgroundColor: "#2563eb",
    color: "white",
    fontSize: "1rem",
    fontWeight: "500",
    padding: "0.8rem 1.2rem",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    width: "100%",
    transition: "background 0.2s ease",
    marginBottom: "1rem",
  },
  resetButton: {
    backgroundColor: "transparent",
    color: "#64748b",
    border: "1px solid #cbd5e1",
    padding: "0.6rem 1rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.9rem",
    width: "100%",
    transition: "background 0.2s ease",
  },
  footer: {
    marginTop: "2rem",
    fontSize: "0.8rem",
    color: "#94a3b8",
  },
};
