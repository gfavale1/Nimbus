import { useState } from "react";

export default function TaskModal({ task, onSave, onClose }) {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [priority, setPriority] = useState(task?.priority || "medium");
  const [status, setStatus] = useState(task?.status || "todo");
  const [dueDate, setDueDate] = useState(
    task?.due_date ? task.due_date.split("T")[0] : ""
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...task,
      title,
      description,
      priority,
      status,
      due_date: dueDate,
    });
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>
          {task ? "Modifica Attività" : "Nuova Attività"}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Titolo */}
          <label style={styles.label}>Titolo</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={styles.input}
            required
          />

          {/* Descrizione */}
          <label style={styles.label}>Descrizione</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={styles.textarea}
          />

          {/* Scadenza */}
          <label style={styles.label}>Scadenza</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            style={styles.input}
          />

          {/* Priorità */}
          <label style={styles.label}>Priorità</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            style={styles.select}
          >
            <option value="low" style={optionStyle}>Bassa</option>
            <option value="medium" style={optionStyle}>Media</option>
            <option value="high" style={optionStyle}>Alta</option>
          </select>

          {/* Stato */}
          <label style={styles.label}>Stato</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={styles.select}
          >
            <option value="todo" style={optionStyle}>Da fare</option>
            <option value="in_progress" style={optionStyle}>In corso</option>
            <option value="done" style={optionStyle}>Completata</option>
          </select>

          {/* Azioni */}
          <div style={styles.actions}>
            <button type="submit" style={styles.primaryBtn}>
              Salva
            </button>
            <button type="button" onClick={onClose} style={styles.secondaryBtn}>
              Annulla
            </button>
          </div>
        </form>
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
    width: "94%",
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(255,255,255,0.1)",
    color: "white",
    marginBottom: "14px",
    outline: "none",
  },

  textarea: {
    width: "94%",
    height: "80px",
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(255,255,255,0.1)",
    color: "white",
    resize: "none",
    marginBottom: "14px",
    outline: "none",
  },

  select: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(255,255,255,0.1)",
    color: "white",
    marginBottom: "14px",
    outline: "none",
    cursor: "pointer",

    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",

    backgroundImage:
      "url(\"data:image/svg+xml;utf8,<svg fill='white' height='20' viewBox='0 0 24 24' width='20' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",

    colorScheme: "dark",
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
};

const optionStyle = {
  backgroundColor: "#1e293b",
  color: "white",
};
