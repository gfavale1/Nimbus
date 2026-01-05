import { useEffect, useState } from "react";
import { getNoteAttachments } from "../services/noteService";

export default function NoteCard({
  note,
  onEdit,
  onDelete,
  onShare,
  onUpload,
  onDeleteAttachment,
  onTagClick, // Riceve la funzione per filtrare dalla pagina principale
}) {
  const [attachments, setAttachments] = useState([]);
  const readOnly = note.readOnly || note.role === "viewer";
  const canDelete = note.role === "editor" || note.role === "owner";

  useEffect(() => {
    if (!note.id) return;

    const fetchAttachments = async () => {
      try {
        const fetched = await getNoteAttachments(note.id);
        setAttachments(fetched);
      } catch (err) {
        console.error("Errore nel recupero degli allegati:", err);
      }
    };

    fetchAttachments();
  }, [note.id, note.cacheBuster]);

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.headerRow}>
        <h3 style={styles.title}>{note.title || "Senza titolo"}</h3>
        {readOnly && <span style={styles.readOnlyBadge}>Solo lettura</span>}
      </div>

      <p style={styles.content}>
        {note.content
          ? note.content.slice(0, 160) + (note.content.length > 160 ? "..." : "")
          : "— Nessun contenuto —"}
      </p>

      {/* SEZIONE TAGS - CLICCABILI */}
      <div style={styles.tagsWrapper}>
        {note.tags && note.tags.length > 0 ? (
          <div style={styles.tagsContainer}>
            {(Array.isArray(note.tags) ? note.tags : note.tags.split(",")).map((tag, idx) => {
              const tagName = typeof tag === 'object' ? tag.name : tag;
              if (!tagName) return null;
              const cleanTagName = tagName.trim();

              return (
                <span
                  key={idx}
                  style={styles.tagBadge}
                  onClick={() => onTagClick && onTagClick(cleanTagName)}
                  title={`Filtra per #${cleanTagName}`}
                >
                  <span style={styles.hashSymbol}>#</span>
                  {cleanTagName}
                </span>
              );
            })}
          </div>
        ) : (
          <div style={styles.noTagsText}>Nessun tag presente</div>
        )}
      </div>

      {/* ALLEGATI */}
      <div style={styles.attachments}>
        <h4 style={styles.sectionTitle}>Allegati</h4>

        {!readOnly && (
          <label style={styles.fileLabel}>
            <input
              type="file"
              onChange={(e) => e.target.files?.[0] && onUpload(e)}
              style={styles.hiddenInput}
            />
            Seleziona file
          </label>
        )}

        {attachments.length > 0 ? (
          <ul style={styles.attachmentList}>
            {attachments.map((att) => (
              <li key={att.id} style={styles.attachmentItem}>
                {att.sas_url ? (
                  <a
                    href={att.sas_url}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.attachmentDownloadLink}
                  >
                    {att.file_name}
                  </a>
                ) : (
                  <span style={styles.noAttachmentLink}>Link non disponibile</span>
                )}

                {canDelete && (
                  <button
                    onClick={() => onDeleteAttachment(att.id)}
                    style={styles.deleteAttachmentBtn}
                  >
                    Elimina
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p style={styles.noAttachment}>Nessun allegato</p>
        )}
      </div>

      {/* FOOTER */}
      <div style={styles.footer}>
        <small style={styles.date}>
          Ultima modifica:{" "}
          {note.updated_at
            ? new Date(note.updated_at).toLocaleString()
            : "—"}
        </small>

        <div style={styles.actions}>
          {!readOnly && (
            <button style={styles.actionBtn} onClick={onEdit}>
              Modifica
            </button>
          )}

          {onShare && (
            <button
              style={{
                ...styles.actionBtn,
                opacity: readOnly ? 0.6 : 1,
                cursor: readOnly ? "not-allowed" : "pointer",
              }}
              onClick={!readOnly ? () => onShare(note.id) : undefined}
              disabled={readOnly}
            >
              Condividi
            </button>
          )}

          {!readOnly && (
            <button style={styles.deleteBtn} onClick={onDelete}>
              Elimina Nota
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: "rgba(255,255,255,0.12)",
    backdropFilter: "blur(12px)",
    borderRadius: "16px",
    padding: "20px",
    color: "white",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "260px",
    animation: "fadeIn 0.4s ease-out",
    overflow: "hidden",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.5rem",
  },
  title: {
    fontSize: "1.2rem",
    fontWeight: 600,
    margin: 0,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  readOnlyBadge: {
    background: "rgba(255,255,255,0.2)",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "0.75rem",
    color: "rgba(255,255,255,0.8)",
  },
  content: {
    color: "rgba(255,255,255,0.9)",
    fontSize: "0.95rem",
    marginBottom: "1rem",
  },
  attachments: { marginTop: "10px" },
  sectionTitle: { fontSize: "0.9rem", marginBottom: "6px" },

  fileLabel: {
    display: "inline-block",
    background: "linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)",
    padding: "7px 14px",
    borderRadius: "8px",
    marginBottom: "8px",
    cursor: "pointer",
    textAlign: "center",
    fontSize: "0.85rem",
    fontWeight: "600",
    color: "white",
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
  },

  hiddenInput: { display: "none" },
  attachmentList: { listStyle: "none", padding: 0, margin: 0 },
  attachmentItem: {
    background: "rgba(255,255,255,0.08)",
    padding: "8px 15px",
    borderRadius: "8px",
    marginBottom: "8px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "0.9rem",
    gap: '10px',
  },
  attachmentDownloadLink: {
    color: "white",
    backgroundColor: "rgba(59,130,246,0.5)",
    padding: "6px 10px",
    borderRadius: "6px",
    textDecoration: "none",
    flexGrow: 1,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  noAttachmentLink: {
    color: "rgba(255,255,255,0.6)",
    flexGrow: 1,
    fontStyle: "italic",
  },
  deleteAttachmentBtn: {
    background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
    border: "none",
    color: "white",
    cursor: "pointer",
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "0.85rem",
    fontWeight: "bold",
  },
  footer: {
    marginTop: "16px",
    borderTop: "1px solid rgba(255,255,255,0.15)",
    paddingTop: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  date: { fontSize: "0.75rem", opacity: 0.8 },
  actions: { display: "flex", gap: "8px", justifyContent: "flex-end" },

  actionBtn: {
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    padding: "8px 16px",
    borderRadius: "8px",
    border: "none",
    color: "white",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "600",
  },
  deleteBtn: {
    background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
    padding: "6px 10px",
    borderRadius: "6px",
    border: "none",
    color: "white",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "600",
  },

  noAttachment: {
    color: "rgba(255,255,255,0.7)",
    fontSize: "0.9rem",
    fontStyle: "italic",
  },
  tagsWrapper: {
    marginTop: "14px",
    marginBottom: "10px",
  },
  tagsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  tagBadge: {
    background: "#3955a6",
    color: "#ffffff",
    padding: "5px 12px",
    borderRadius: "8px",
    fontSize: "0.9rem",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
    border: "none",
    cursor: "pointer",
  },
  hashSymbol: {
    marginRight: "4px",
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: "1rem",
  },
  noTagsText: {
    fontSize: "0.9rem",
    color: "rgba(255, 255, 255, 0.5)",
    fontStyle: "italic",
    marginTop: "5px",
  },
};