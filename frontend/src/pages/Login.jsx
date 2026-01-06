import React from "react";

export default function Login() {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || window.location.origin;

  const handleLogin = () => {
    const postLoginRedirect = encodeURIComponent(`${FRONTEND_URL}/dashboard`);


    // L'URL finale deve esere: https://backend.com/.auth/login/aad?post_login_redirect_uri=https://frontend.com/dashboard
    window.location.href = `${BACKEND_URL}/.auth/login/aad?post_login_redirect_uri=${postLoginRedirect}`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1>Nimbus</h1>
        <p>Benvenuto nel progetto universitario Nimbus</p>
        
        <button onClick={handleLogin} style={styles.button}>
          Accedi con Microsoft
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
