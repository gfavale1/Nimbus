import React from "react";

export default function Login() {
  const handleLogin = () => {
    // Reindirizzamento al flusso EasyAuth di Azure
    window.location.href =
      "/.auth/login/aad?post_login_redirect_uri=/dashboard";
  };

  const handleReset = () => {
    sessionstorage.clear();
    alert("Cache pulita correttamente");
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>☁️</div>
        <h1 style={styles.title}>Nimbus</h1>
        <p style={styles.subtitle}>
          Il tuo hub intelligente per note e attività
        </p>

        <button 
          onClick={handleLogin} 
          style={styles.loginButton}
          onMouseOver={(e) => e.target.style.backgroundColor = "#1d4ed8"}
          onMouseOut={(e) => e.target.style.backgroundColor = "#2563eb"}
        >
          Accedi con Microsoft
        </button>

        <button 
          onClick={handleReset} 
          style={styles.resetButton}
          onMouseOver={(e) => e.target.style.backgroundColor = "#f1f5f9"}
          onMouseOut={(e) => e.target.style.backgroundColor = "transparent"}
        >
          Pulisci Cache
        </button>

        <div style={styles.footer}>
          Progetto Nimbus &copy; 2026 - Unisa
        </div>
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
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
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
    margin: "0.3rem 0",
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