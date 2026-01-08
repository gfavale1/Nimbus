import { useState, useEffect } from "react";
import {
  createNote,
  updateNote,
  getNoteHistory,
  restoreNoteVersion,
  updateNoteTags,
} from "../services/noteService";

export default function EditNoteModal({ note, onClose, onSaved }) {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [tags, setTags] = useState(note?.tags || "");
  const [loading, setLoading] = useState(false);

  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const isEditing = !!note?.id;

  useEffect(() => {
    if (isEditing && note?.id) {
      loadHistory();
    }
  }, [note?.id]);

  const loadHistory = async () => {
    try {
      const data = await getNoteHistory(note.id);
      if (Array.isArray(data)) setHistory(data);
      else if (data?.rows) setHistory(data.rows);
    } catch (err) {
      console.error("Errore storico:", err);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert("Inserisci almeno un titolo");
      return;
    }

    try {
      setLoading(true);

      if (isEditing) {
        await updateNote(note.id, { title, content });
        await updateNoteTags(note.id, tags);
      } else {
        new note = await createNote({ title, content, tags });

        if(tags && tags.trim() !== "") {
          await updateNoteTags(note.id, tags);
        }
      }

      onSaved?.();
      onClose();
    } catch (err) {
      alert("Errore durante il salvataggio");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (historyId) => {
    if (!window.confirm("Vuoi ripristinare questa versione?")) return;

    try {
      setLoading(true);
      await restoreNoteVersion(note.id, historyId);
      onSaved?.();
      onClose();
    } catch {
      alert("Errore durante il ripristino");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div
        style={{
          ...styles.modal,
          width: showHistory ? "860px" : "560px", 
          transition: "width 0.25s ease",
          display: "flex",
        }}
      >
        <div style={styles.formColumn}>
          <h2 style={styles.title}>
            {isEditing ? "Modifica Nota" : "Nuova Nota"}
          </h2>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={styles.input}
            placeholder="Titolo"
          />

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={styles.textarea}
            placeholder="Contenuto"
          />

          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            style={styles.input}
            placeholder="Tag (separati da virgola)"
          />

          <div style={styles.actions}>
            <button style={styles.primaryBtn} onClick={handleSave} disabled={loading}>
              {loading ? "..." : "Salva Modifiche"}
            </button>

            {isEditing && (
              <button
                style={styles.historyBtn}
                onClick={() => setShowHistory(!showHistory)}
              >
                {showHistory ? "Nascondi Storico" : "Cronologia"}
              </button>
            )}

            <button style={styles.secondaryBtn} onClick={onClose}>
              Annulla
            </button>
          </div>
        </div>

        {showHistory && (
          <div style={styles.historyColumn}>
            <h3 style={styles.historyTitle}>Storico Versioni</h3>

            {history.length === 0 ? (
              <p style={styles.emptyHistory}>Nessuna versione disponibile</p>
            ) : (
              history.map((h) => (
                <div key={h.id} style={styles.historyItem}>
                  <small>
                    {new Date(h.modified_at).toLocaleString()}
                  </small>
                  <p><strong>{h.title}</strong></p>
                  <button
                    style={styles.restoreBtn}
                    onClick={() => handleRestore(h.id)}
                  >
                    Ripristina
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
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
    color: "white",
    boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
    animation: "fadeIn 0.3s ease-out",
  },

  title: {
    fontSize: "1.3rem",
    fontWeight: 600,
    marginBottom: "18px",
  },

  label: {
    fontSize: "0.9rem",
    marginBottom: "6px",
    display: "block",
    opacity: 0.9,
  },

  input: {
    width: "100%",
    padding: "10px 14px",
    maxWidth: "520px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(255,255,255,0.1)",
    color: "white",
    marginBottom: "14px",
    outline: "none",
  },

  textarea: {
    width: "100%",
    height: "80px",
    padding: "10px 14px",
    maxWidth: "520px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(255,255,255,0.1)",
    color: "white",
    resize: "none",
    marginBottom: "14px",
    outline: "none",
  },

  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "20px",
  },

  primaryBtn: {
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    border: "none",
    borderRadius: "8px",
    padding: "10px 18px",
    color: "white",
    cursor: "pointer",
  },

  secondaryBtn: {
    background: "rgba(255,255,255,0.2)",
    border: "none",
    borderRadius: "8px",
    padding: "10px 18px",
    color: "white",
    cursor: "pointer",
  },

  historyBtn: {
    background: "#6366f1",
    color: "white",
    padding: "8px 12px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
  },

  restoreBtn: {
    background: "#10b981",
    color: "white",
    border: "none",
    padding: "4px 8px",
    borderRadius: "4px",
    cursor: "pointer",
    marginTop: "5px",
  },
};

