import { useEffect, useState } from "react";
import {
  getNoteShares,    // Carica la lista delle persone con accesso
  removeShare,      // Esegue la DELETE sul backend
} from "../services/noteService";
import api from "../api/http";

export default function ShareModal({ noteId, onClose }) {
  const [shares, setShares] = useState([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Funzione per caricare la lista utenti
  const loadShares = async () => {
    try {
      const data = await getNoteShares(noteId);
      console.log("Condivisioni ricevute:", data);
      setShares(data || []);
    } catch (err) {
      console.error("Errore caricamento condivisioni:", err);
      // Evitiamo l'alert se il modale si sta chiudendo
      if (noteId) setError("Impossibile caricare la lista degli accessi.");
    }
  };

  useEffect(() => {
    if (noteId) loadShares();
  }, [noteId]);

  const handleAdd = async () => {
    if (!email.trim()) return;

    try {
      setLoading(true);
      setError("");

      // 1. Trova l'utente tramite email
      const resUser = await api.get(`/users/by-email/${email}`);
      const user = resUser.data;

      if (!user?.id) {
        setError("Utente non trovato.");
        return;
      }

      // 2. Crea la condivisione
      await api.post(`/notes/${noteId}/shares`, {
        user_id: user.id,
        role,
      });

      // 3. Reset e ricarica lista
      setEmail("");
      setRole("viewer");
      loadShares(); // Ricarichiamo dal server per avere i nomi aggiornati
    } catch (err) {
      if (err.response?.status === 404) setError("L'utente non esiste.");
      else if (err.response?.status === 403) setError("Non hai i permessi di proprietario.");
      else setError("Errore durante la condivisione.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (sharedUserId) => {
    if (!window.confirm("Sei sicuro di voler revocare l'accesso a questo utente?")) return;

    try {
      await removeShare(noteId, sharedUserId);
      // Aggiorna la UI rimuovendo l'utente filtrando la lista locale
      setShares((prev) => prev.filter((s) => (s.user_id || s.id) !== sharedUserId));
    } catch (err) {
      console.error("Errore rimozione:", err);
      alert("Errore durante la rimozione del permesso.");
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>Gestisci Accessi</h2>

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.addSection}>
          <input
            type="email"
            placeholder="Email dell'utente..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={styles.select}
          >
            <option value="viewer" style={optionStyle}>
              Visualizzatore (Viewer)
            </option>
            <option value="editor" style={optionStyle}>
              Editor
            </option>
          </select>

          <div style={styles.actions}>
            <button
              onClick={handleAdd}
              style={styles.primaryBtn}
              disabled={loading}
            >
              {loading ? "Aggiunta..." : "Aggiungi"}
            </button>
            <button onClick={onClose} style={styles.secondaryBtn}>
              Chiudi
            </button>
          </div>
        </div>

        <hr style={styles.divider} />

        <h3 style={styles.subTitle}>Utenti con accesso</h3>

        <div style={styles.listContainer}>
          {shares.length === 0 ? (
            <p style={styles.emptyText}>Questa nota non è ancora condivisa con nessuno.</p>
          ) : (
            <ul style={styles.list}>
              {shares.map((s) => {
                const userId = s.user_id || s.id;
                return (
                  <li key={userId} style={styles.listItem}>
                    <div style={styles.userInfo}>
                      <span style={styles.userName}>{s.display_name || s.name || "Utente"}</span>
                      <span style={styles.userEmail}>{s.email}</span>
                      <span style={styles.userRole}>— {s.role}</span>
                    </div>
                    <button
                      style={styles.removeBtn}
                      onClick={() => handleRemove(userId)}
                      title="Revoca Accesso"
                    >
                      Revoca
                    </button>
                  </li>
                );
              })}
            </ul>
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
