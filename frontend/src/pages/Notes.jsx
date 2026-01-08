import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../hooks/useAuth";

import {
  getAllNotes,
  getSharedNotes,
  createNote,
  updateNote,
  deleteNote,
  updateNoteTags,
} from "../services/noteService";

import { uploadAttachment, deleteAttachment } from "../services/attachmentService";

import NoteCard from "../components/NoteCard";
import EditNoteModal from "../components/EditNoteModal";
import ShareModal from "../components/ShareModal";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const NOTE_TITLE_MAX = 80;
const NOTE_CONTENT_MAX = 20000; // opzionale: evita contenuti enormi
const TAG_MAX_LEN = 24;
const MAX_TAGS = 15;

// Tag consentiti: lettere/numeri/underscore/trattino (niente #, niente spazi)
const TAG_REGEX = /^[a-zA-Z0-9_-]+$/;

function parseAndValidateTags(raw) {
  const input = (raw ?? "").trim();

  if (!input) return { ok: true, tags: [] };

  // Split su virgole
  const parts = input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (parts.length > MAX_TAGS) {
    return { ok: false, error: `Troppi tag: massimo ${MAX_TAGS}.` };
  }

  const normalized = [];
  const seen = new Set();

  for (const t of parts) {
    // vieta #tag
    if (t.startsWith("#")) {
      return {
        ok: false,
        error:
          "Formato tag non valido: non inserire '#'. Scrivi ad esempio 'lavoro, casa'.",
      };
    }

    // no spazi dentro tag
    if (/\s/.test(t)) {
      return {
        ok: false,
        error: `Tag non valido "${t}": i tag non possono contenere spazi.`,
      };
    }

    if (t.length > TAG_MAX_LEN) {
      return {
        ok: false,
        error: `Tag troppo lungo "${t}": massimo ${TAG_MAX_LEN} caratteri.`,
      };
    }

    if (!TAG_REGEX.test(t)) {
      return {
        ok: false,
        error: `Tag non valido "${t}": usa solo lettere, numeri, "_" e "-".`,
      };
    }

    const lower = t.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      normalized.push(lower);
    }
  }

  return { ok: true, tags: normalized };
}

function validateNoteForm({ title, content, tags }) {
  const t = (title ?? "").trim();
  const c = (content ?? "").trim();

  if (!t) return { ok: false, error: "Inserisci almeno un titolo." };
  if (t.length > NOTE_TITLE_MAX)
    return { ok: false, error: `Titolo troppo lungo (max ${NOTE_TITLE_MAX}).` };

  if (c.length > NOTE_CONTENT_MAX)
    return { ok: false, error: `Contenuto troppo lungo (max ${NOTE_CONTENT_MAX}).` };

  const tagCheck = parseAndValidateTags(tags);
  if (!tagCheck.ok) return { ok: false, error: tagCheck.error };

  return { ok: true, title: t, content: c, tagsArr: tagCheck.tags };
}

export default function Notes() {
  const { user, loading: authLoading } = useAuth();

  const [notes, setNotes] = useState([]);
  const [sharedNotes, setSharedNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [search, setSearch] = useState("");
  const [editingNote, setEditingNote] = useState(null);
  const [sharingNoteId, setSharingNoteId] = useState(null);

  const [form, setForm] = useState({ title: "", content: "", tags: "" });

  // errori “form create”
  const [formError, setFormError] = useState("");

  const loadNotes = async () => {
    try {
      setLoading(true);
      const [myNotes, shared] = await Promise.all([getAllNotes(), getSharedNotes()]);
      setNotes(Array.isArray(myNotes) ? myNotes : []);
      setSharedNotes(Array.isArray(shared) ? shared : []);
    } catch (err) {
      console.error("Errore caricamento note:", err);
      setError("Errore nel caricamento delle note");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) loadNotes();
  }, [authLoading, user, refreshKey]);

  const handleTagClick = (tagName) => {
    setSearch(tagName);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const check = validateNoteForm(form);
    if (!check.ok) {
      setFormError(check.error);
      return;
    }

    try {
      let savedNote;

      // ricostruisco tags come stringa “pulita” per updateNoteTags
      const cleanTagsString = check.tagsArr.join(", ");

      if (editingNote) {
        savedNote = await updateNote(editingNote.id, {
          title: check.title,
          content: check.content,
        });

        // tags: ok anche vuoto 
        await updateNoteTags(editingNote.id, cleanTagsString);
      } else {
        savedNote = await createNote({
          title: check.title,
          content: check.content,
        });

        if (cleanTagsString) {
          await updateNoteTags(savedNote.id, cleanTagsString);
        }
      }

      await sleep(200);
      setRefreshKey((prev) => prev + 1);
      resetForm();
    } catch (err) {
      console.error("Errore nel salvataggio:", err);
      alert("Errore nel salvataggio dei dati o dei tag");
    }
  };

  const resetForm = () => {
    setEditingNote(null);
    setForm({ title: "", content: "", tags: "" });
    setFormError("");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Eliminare questa nota?")) return;
    try {
      await deleteNote(id);
      await sleep(100);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error(err);
      alert("Errore nell'eliminazione");
    }
  };

  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  const handleFileChange = async (noteId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      alert("File troppo grande: massimo 10 MB.");
      e.target.value = "";
      return;
    }

    try {
      await uploadAttachment(noteId, file);
      await sleep(100);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error(err);
      alert("Errore upload allegato");
    }
  };

  const handleDeleteAttachment = async (noteId, attId) => {
    try {
      await deleteAttachment(attId);
      await sleep(100);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error(err);
      alert("Errore rimozione allegato");
    }
  };

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const searchTerm = search.toLowerCase();
      const matchesText =
        n.title.toLowerCase().includes(searchTerm) ||
        n.content.toLowerCase().includes(searchTerm);

      let matchesTags = false;
      if (n.tags) {
        const tagsToSearch = Array.isArray(n.tags)
          ? n.tags.map((t) => (typeof t === "object" ? t.name : t).toLowerCase())
          : n.tags.toLowerCase().split(",").map((t) => t.trim());
        matchesTags = tagsToSearch.some((tag) => tag.includes(searchTerm));
      }
      return matchesText || matchesTags;
    });
  }, [notes, search]);

  const filteredShared = useMemo(() => {
    return sharedNotes.filter((n) => {
      const searchTerm = search.toLowerCase();
      const matchesText =
        n.title.toLowerCase().includes(searchTerm) ||
        n.content.toLowerCase().includes(searchTerm) ||
        n.owner_name?.toLowerCase().includes(searchTerm);

      let matchesTags = false;
      if (n.tags) {
        const tagsToSearch = Array.isArray(n.tags)
          ? n.tags.map((t) => (typeof t === "object" ? t.name : t).toLowerCase())
          : n.tags.toLowerCase().split(",").map((t) => t.trim());
        matchesTags = tagsToSearch.some((tag) => tag.includes(searchTerm));
      }
      return matchesText || matchesTags;
    });
  }, [sharedNotes, search]);

  if (authLoading || loading)
    return (
      <div style={styles.loader}>
        <div style={styles.loaderCard}>
          <div style={styles.logo}>☁️</div>
          <h2 style={styles.text}>Caricamento delle note...</h2>
          <div style={styles.spinner}></div>
        </div>
      </div>
    );

  if (error)
    return (
      <p style={{ color: "red", textAlign: "center", marginTop: "40px" }}>{error}</p>
    );

  return (
    <div key={refreshKey}>
      {editingNote && (
        <EditNoteModal
          note={editingNote}
          onSaved={async () => {
            await sleep(150);
            setRefreshKey((prev) => prev + 1);
            setEditingNote(null);
          }}
          onClose={() => setEditingNote(null)}
        />
      )}

      {sharingNoteId && (
        <ShareModal noteId={sharingNoteId} onClose={() => setSharingNoteId(null)} />
      )}

      <div style={styles.page}>
        <div style={styles.header}>
          <h1 style={styles.title}>Le mie Note</h1>
          <div style={styles.searchWrapper}>
            <input
              type="text"
              placeholder="Cerca per titolo, contenuto o #tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.search}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} style={styles.formCard}>
          <h3 style={styles.formTitle}>{editingNote ? "Modifica Nota" : "Crea una nuova Nota"}</h3>

          <input
            type="text"
            placeholder="Titolo..."
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            style={styles.input}
          />

          <textarea
            placeholder="Contenuto..."
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            style={styles.textarea}
          />

          <input
            type="text"
            placeholder="Tag (es: lavoro, casa, importante)"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            style={styles.input}
          />

          {/*errore form */}
          {formError && <div style={styles.formError}>{formError}</div>}

          <div style={styles.formActions}>
            <button type="submit" style={styles.primaryBtn}>
              {editingNote ? "Aggiorna" : "Crea"}
            </button>

            {editingNote && (
              <button type="button" onClick={resetForm} style={styles.secondaryBtn}>
                Annulla
              </button>
            )}
          </div>
        </form>

        <div style={styles.grid}>
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={{ ...note, role: "owner" }}
              onTagClick={handleTagClick}
              onEdit={() => setEditingNote(note)}
              onDelete={() => handleDelete(note.id)}
              onShare={(id) => setSharingNoteId(id)}
              onUpload={(e) => handleFileChange(note.id, e)}
              onDeleteAttachment={(attId) => handleDeleteAttachment(note.id, attId)}
            />
          ))}
        </div>

        <h2 style={styles.sectionTitle}>Condivise con me</h2>
        <div style={styles.grid}>
          {filteredShared.length === 0 ? (
            <p style={{ opacity: 0.7 }}>Nessuna nota trovata</p>
          ) : (
            filteredShared.map((n) => (
              <NoteCard
                key={n.note_id}
                note={{
                  ...n,
                  id: n.note_id,
                  readOnly: n.role === "viewer",
                }}
                onTagClick={handleTagClick}
                onEdit={
                  n.role === "editor"
                    ? () => setEditingNote({ ...n, id: n.note_id })
                    : undefined
                }
                onUpload={(e) => handleFileChange(n.note_id, e)}
                onDeleteAttachment={(attId) => handleDeleteAttachment(n.note_id, attId)}
                onShare={undefined}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
    page: {
        padding: "40px 60px",
        color: "white",
        fontFamily: "Inter, system-ui, sans-serif",
        minHeight: "100vh",
        boxSizing: "border-box",
        overflowX: "hidden",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "30px",
    },
    title: { fontSize: "2rem", fontWeight: "700" },
    searchWrapper: {
        display: "flex",
        alignItems: "center",
    },
    search: {
        padding: "10px 14px",
        borderRadius: "8px",
        border: "none",
        width: "300px",
        fontSize: "0.9rem",
        boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
        outline: "none",
    },
    formCard: {
        background: "rgba(255,255,255,0.10)",
        backdropFilter: "blur(12px)",
        borderRadius: "16px",
        padding: "25px",
        marginBottom: "40px",
        boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
    },
    formTitle: { fontSize: "1.2rem", marginBottom: "10px" },
    input: {
        width: "100%",
        padding: "10px 14px",
        borderRadius: "8px",
        border: "1px solid rgba(255,255,255,0.2)",
        background: "white",
        color: "#1f2937",
        marginBottom: "12px",
        boxSizing: "border-box",
    },
    textarea: {
        width: "100%",
        height: "100px",
        padding: "10px 14px",
        borderRadius: "8px",
        border: "1px solid rgba(255,255,255,0.2)",
        background: "white",
        color: "#1f2937",
        marginBottom: "12px",
        resize: "none",
        boxSizing: "border-box",
    },
    formActions: { display: "flex", justifyContent: "flex-end", gap: "10px" },
    primaryBtn: { backgroundColor: "#3b82f6", border: "none", padding: "10px 16px", borderRadius: "8px", color: "white", cursor: "pointer", fontWeight: "600" },
    secondaryBtn: { background: "rgba(255,255,255,0.2)", border: "none", padding: "10px 16px", borderRadius: "8px", color: "white", cursor: "pointer" },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" },
    sectionTitle: { fontSize: "1.5rem", marginTop: "40px", marginBottom: "20px" },
    loader: { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #312e81 100%)" },
    loaderCard: { background: "rgba(255,255,255,0.05)", padding: "3rem 4rem", borderRadius: "16px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" },
    logo: { fontSize: "3rem" },
    text: { fontSize: "1.2rem", marginTop: "1rem" },
    spinner: { margin: "1.8rem auto 0", border: "4px solid rgba(255,255,255,0.2)", borderTop: "4px solid #fff", borderRadius: "50%", width: "48px", height: "48px", animation: "spin 1s linear infinite" },
};