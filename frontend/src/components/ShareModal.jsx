import { useEffect, useState } from "react";
import { getNoteShares, removeShare } from "../services/noteService";
import api from "../api/http";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_ROLES = ["viewer", "editor"];

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
      const rows = Array.isArray(data) ? data : data?.rows || [];
      setShares(rows);
    } catch (err) {
      console.error("Errore caricamento condivisioni:", err);
      if (noteId) setError("Impossibile caricare la lista degli accessi.");
    }
  };

  useEffect(() => {
    if (noteId) loadShares();
  }, [noteId]);

  const normalizeEmail = (v) => (v || "").trim().toLowerCase();
  const shareEmailFromRow = (s) =>
    normalizeEmail(s.email || s.user_email || s.userEmail || s.userEmailAddress);


  const handleAdd = async () => {
    const emailTrim = email.trim().toLowerCase();

    if (!emailTrim) {
      setError("Inserisci un indirizzo email.");
      return;
    }

    if (!EMAIL_REGEX.test(emailTrim)) {
      setError("Inserisci un indirizzo email valido.");
      return;
    }

    if (!ALLOWED_ROLES.includes(role)) {
      setError("Ruolo non valido.");
      return;
    }

    const alreadyShared = shares.some((s) => shareEmailFromRow(s) === emailTrim);
      if (alreadyShared) {
        setError("Questo utente ha già accesso a questa nota.");
        return;
      }


    try {
      setLoading(true);
      setError("");

      const resUser = await api.get(
        `/users/by-email/${encodeURIComponent(emailTrim)}`
      );
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
    if (
      !window.confirm(
        "Sei sicuro di voler revocare l'accesso a questo utente?"
      )
    )
      return;

    try {
      await removeShare(noteId, sharedUserId);
      setShares((prev) =>
        prev.filter((s) => (s.user_id ?? s.id) !== sharedUserId)
      );
    } catch (err) {
      console.error("Errore rimozione:", err);
      alert("Errore durante la rimozione del permesso.");
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.modalTop}>
          <h2 style={styles.title}>Condivisione Nota</h2>
          <button
            onClick={onClose}
            style={styles.closeBtn}
            aria-label="Chiudi"
            disabled={loading}
            title="Chiudi"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <div>
          <label style={styles.fieldLabel}>Email utente</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            placeholder="utente@dominio.com"
            disabled={loading}
          />

          <label style={styles.fieldLabel}>Ruolo</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={styles.select}
            disabled={loading}
          >
            <option value="viewer" style={optionStyle}>
              Viewer
            </option>
            <option value="editor" style={optionStyle}>
              Editor
            </option>
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

            <button
              style={styles.secondaryBtn}
              onClick={() => {
                setError("");
                setEmail("");
                setRole("viewer");
                onClose();
              }}
              disabled={loading}
            >
              Chiudi
            </button>
          </div>
        </div>

        {/* Lista accessi */}
        <div style={styles.listContainer}>
          <div style={styles.subTitle}>Accessi attuali</div>

          {shares.length === 0 ? (
            <div style={styles.emptyText}>Nessun utente condiviso.</div>
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
                  <div key={sharedUserId} style={styles.listItem}>
                    <div style={styles.userInfo}>
                      <span style={styles.userName}>{label}</span>
                      <span style={styles.userRole}>Ruolo: {r}</span>
                    </div>

                    <button
                      style={styles.removeBtn}
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
    padding: "18px",
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

  modalTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
  },

  closeBtn: {
    background: "rgba(255,255,255,0.18)",
    border: "1px solid rgba(255,255,255,0.22)",
    borderRadius: "10px",
    width: "36px",
    height: "36px",
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    color: "white",
    fontSize: "16px",
    lineHeight: "1",
  },

  title: {
    fontSize: "1.3rem",
    fontWeight: 600,
    margin: 0,
  },

  subTitle: {
    fontSize: "1.05rem",
    fontWeight: 600,
    marginBottom: "10px",
  },

  fieldLabel: {
    display: "block",
    fontSize: "0.9rem",
    opacity: 0.9,
    marginBottom: "6px",
  },

  error: {
    background: "rgba(239,68,68,0.15)",
    color: "#fecaca",
    padding: "10px 14px",
    borderRadius: "8px",
    fontSize: "0.85rem",
    marginTop: "10px",
  },

  input: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(255,255,255,0.1)",
    color: "white",
    outline: "none",
    marginBottom: "14px",
    boxSizing: "border-box",
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
    marginTop: "14px",
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

  listContainer: {
    maxHeight: "220px",
    overflowY: "auto",
    marginTop: "4px",
    paddingTop: "10px",
    borderTop: "1px solid rgba(255,255,255,0.15)",
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
    gap: "3px",
    fontSize: "0.85rem",
  },

  userName: {
    fontWeight: 600,
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
    whiteSpace: "nowrap",
  },
};

const optionStyle = {
  backgroundColor: "#1e293b", 
  color: "white",
};
