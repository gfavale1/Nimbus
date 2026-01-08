import { useEffect, useState } from "react";
import { getNoteShares, removeShare } from "../services/noteService";
import api from "../api/http";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_ROLES = ["viewer", "editor"]; // mantieni solo quelli che supporti davvero

export default function ShareModal({ noteId, onClose }) {
  const [shares, setShares] = useState([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadShares = async () => {
    try {
      setError("");
      const data = await getNoteShares(noteId);
      setShares(Array.isArray(data) ? data : data?.rows || []);
    } catch (err) {
      console.error("Errore caricamento condivisioni:", err);
      if (noteId) setError("Impossibile caricare la lista degli accessi.");
    }
  };

  useEffect(() => {
    if (noteId) loadShares();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId]);

  const handleAdd = async () => {
    const emailTrim = email.trim().toLowerCase();

    if (!emailTrim) return;

    if (!EMAIL_REGEX.test(emailTrim)) {
      setError("Inserisci un indirizzo email valido.");
      return;
    }

    if (!ALLOWED_ROLES.includes(role)) {
      setError("Ruolo non valido.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const resUser = await api.get(`/users/by-email/${encodeURIComponent(emailTrim)}`);
      const user = resUser.data;

      if (!user?.id) {
        setError("Utente non trovato.");
        return;
      }

      await api.post(`/notes/${noteId}/shares`, {
        user_id: user.id,
        role,
      });

      setEmail("");
      setRole("viewer");
      await loadShares();
    } catch (err) {
      if (err.response?.status === 404) setError("L'utente non esiste.");
      else if (err.response?.status === 403)
        setError("Non hai i permessi di proprietario.");
      else setError("Errore durante la condivisione.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (sharedUserId) => {
    if (!window.confirm("Sei sicuro di voler revocare l'accesso a questo utente?"))
      return;

    try {
      await removeShare(noteId, sharedUserId);
      setShares((prev) => prev.filter((s) => (s.user_id ?? s.id) !== sharedUserId));
    } catch (err) {
      console.error("Errore rimozione:", err);
      alert("Errore durante la rimozione del permesso.");
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Condivisione Nota</h2>
          <button onClick={onClose} style={styles.closeBtn} aria-label="Chiudi">
            ✕
          </button>
        </div>

        <div style={styles.section}>
          <label style={styles.label}>Email utente</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            placeholder="utente@dominio.com"
            disabled={loading}
          />

          <label style={styles.label}>Ruolo</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={styles.select}
            disabled={loading}
          >
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
          </select>

          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.actions}>
            <button
              style={styles.primaryBtn}
              onClick={handleAdd}
              disabled={loading}
            >
              {loading ? "..." : "Condividi"}
            </button>
            <button style={styles.secondaryBtn} onClick={onClose} disabled={loading}>
              Chiudi
            </button>
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.subtitle}>Accessi attuali</h3>

          {shares.length === 0 ? (
            <p style={styles.empty}>Nessun utente condiviso.</p>
          ) : (
            <div style={styles.list}>
              {shares.map((s) => {
                const sharedUserId = s.user_id ?? s.id;
                const label =
                  s.email ||
                  s.user_email ||
                  s.userEmail ||
                  s.name ||
                  s.username ||
                  s.user_name ||
                  `User #${sharedUserId}`;
                const r = s.role || "viewer";

                return (
                  <div key={sharedUserId} style={styles.item}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={styles.itemMain}>{label}</span>
                      <small style={styles.itemSub}>Ruolo: {r}</small>
                    </div>

                    <button
                      style={styles.dangerBtn}
                      onClick={() => handleRemove(sharedUserId)}
                      disabled={loading}
                    >
                      Revoca
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    backdropFilter: "blur(6px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },

  modal: {
    background: "rgba(255,255,255,0.1)",
    padding: "30px",
    borderRadius: "16px",
    width: "460px",
    maxWidth: "90vw",
    color: "white",
    boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
    animation: "fadeIn 0.3s ease-out",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  title: {
    fontSize: "1.3rem",
    fontWeight: 600,
    marginBottom: "6px",
  },

  subTitle: {
    fontSize: "1.05rem",
    fontWeight: 600,
    marginTop: "6px",
  },

  error: {
    background: "rgba(239,68,68,0.15)",
    color: "#fecaca",
    padding: "10px 14px",
    borderRadius: "8px",
    fontSize: "0.85rem",
  },

  input: {
    width: "93.5%",
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(255,255,255,0.1)",
    color: "white",
    outline: "none",
  },

  select: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(255,255,255,0.1)",
    color: "white",
    outline: "none",
    cursor: "pointer",

    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",

    backgroundImage:
      "url(\"data:image/svg+xml;utf8,<svg fill='white' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",

    colorScheme: "dark",
  },

  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "10px",
  },

  primaryBtn: {
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    border: "none",
    borderRadius: "8px",
    padding: "10px 18px",
    color: "white",
    cursor: "pointer",
    fontWeight: 500,
  },

  secondaryBtn: {
    background: "rgba(255,255,255,0.2)",
    border: "none",
    borderRadius: "8px",
    padding: "10px 18px",
    color: "white",
    cursor: "pointer",
  },

  divider: {
    border: "none",
    borderTop: "1px solid rgba(255,255,255,0.15)",
    margin: "8px 0",
  },

  listContainer: {
    maxHeight: "220px",
    overflowY: "auto",
    marginTop: "4px",
  },

  emptyText: {
    opacity: 0.7,
    fontStyle: "italic",
    fontSize: "0.9rem",
  },

  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  listItem: {
    background: "rgba(255,255,255,0.08)",
    padding: "10px 12px",
    borderRadius: "10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
  },

  userInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    fontSize: "0.85rem",
  },

  userName: {
    fontWeight: 600,
  },

  userEmail: {
    opacity: 0.75,
    fontSize: "0.8rem",
  },

  userRole: {
    opacity: 0.8,
    fontStyle: "italic",
  },

  removeBtn: {
    background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
    border: "none",
    borderRadius: "6px",
    padding: "6px 10px",
    color: "white",
    cursor: "pointer",
    fontSize: "0.8rem",
    fontWeight: 500,
  },
};

const optionStyle = {
  backgroundColor: "#1e293b", // slate-800
  color: "white",
};
