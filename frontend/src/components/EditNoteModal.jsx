import { useEffect, useState } from "react";
import {
  createNote,
  updateNote,
  getNoteHistory,
  restoreNoteVersion,
  updateNoteTags,
} from "../services/noteService";

const TAG_MAX_LEN = 24;
const TAG_MAX_COUNT = 20;
// Consenti lettere/numeri + _ e - (niente #, niente spazi)
const TAG_REGEX = /^[a-z0-9][a-z0-9_-]*$/i;

function normalizeTags(input) {
  if (!input || !input.trim()) return [];
  return input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function validateTags(tagList) {
  if (tagList.length > TAG_MAX_COUNT) {
    return `Troppi tag (max ${TAG_MAX_COUNT}).`;
  }

  const seen = new Set();
  for (const raw of tagList) {
    if (raw.startsWith("#")) {
      return `Il tag "${raw}" non è valido: non usare "#".`;
    }
    if (raw.length > TAG_MAX_LEN) {
      return `Il tag "${raw}" è troppo lungo (max ${TAG_MAX_LEN} caratteri).`;
    }
    if (!TAG_REGEX.test(raw)) {
      return `Il tag "${raw}" non è valido. Usa solo lettere/numeri, "_" e "-".`;
    }

    const key = raw.toLowerCase();
    if (seen.has(key)) {
      return `Hai inserito il tag "${raw}" più di una volta.`;
    }
    seen.add(key);
  }

  return null;
}

export default function EditNoteModal({ note, onClose, onSaved }) {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [tags, setTags] = useState(
    Array.isArray(note?.tags) ? note.tags.join(", ") : note?.tags || ""
  );
  const [loading, setLoading] = useState(false);

  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const isEditing = !!note?.id;

  useEffect(() => {
    if (isEditing && note?.id) {
      loadHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note?.id]);

  const loadHistory = async () => {
    try {
      const data = await getNoteHistory(note.id);
      if (Array.isArray(data)) setHistory(data);
      else if (data?.rows) setHistory(data.rows);
      else setHistory([]);
    } catch (err) {
      console.error("Errore storico:", err);
      setHistory([]);
    }
  };

  const handleSave = async () => {
    const titleTrim = title.trim();
    if (!titleTrim) {
      alert("Inserisci almeno un titolo");
      return;
    }

    const tagList = normalizeTags(tags);
    const tagErr = validateTags(tagList);
    if (tagErr) {
      alert(tagErr);
      return;
    }

    try {
      setLoading(true);

      const tagsNormalized = tagList.join(",");

      if (isEditing) {
        await updateNote(note.id, { title: titleTrim, content });
        await updateNoteTags(note.id, tagsNormalized);
      } else {
        const savedNote = await createNote({
          title: titleTrim,
          content,
          tags: tagsNormalized,
        });

        // FIX: qui prima usavi note.id (che è undefined quando crei)
        if (tagList.length > 0 && savedNote?.id) {
          await updateNoteTags(savedNote.id, tagsNormalized);
        }
      }

      onSaved?.();
      onClose();
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
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
          <h2 style={styles.title}>{isEditing ? "Modifica Nota" : "Nuova Nota"}</h2>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={styles.input}
            placeholder="Titolo"
            maxLength={120}
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
            placeholder="Tag (separati da virgola, senza #)"
          />

          <div style={styles.actions}>
            <button
              style={styles.primaryBtn}
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? "..." : "Salva Modifiche"}
            </button>

            {isEditing && (
              <button
                style={styles.historyBtn}
                onClick={() => setShowHistory(!showHistory)}
                disabled={loading}
              >
                {showHistory ? "Nascondi Storico" : "Cronologia"}
              </button>
            )}

            <button style={styles.secondaryBtn} onClick={onClose} disabled={loading}>
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
                  <small>{new Date(h.modified_at).toLocaleString()}</small>
                  <p style={{ margin: "6px 0 10px" }}>
                    <strong>{h.title}</strong>
                  </p>
                  <button
                    style={styles.restoreBtn}
                    onClick={() => handleRestore(h.id)}
                    disabled={loading}
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

