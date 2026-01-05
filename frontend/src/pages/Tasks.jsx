import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  getAllTasks,
  createTask,
  updateTask,
  deleteTask,
} from "../services/taskService";

import TaskModal from "../components/TaskModal";

export default function Tasks() {
  const { user, loading: authLoading } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [editingTask, setEditingTask] = useState(null); // null = nessun modal aperto

  const normalizeTasks = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.data)) return payload.data;
    return [];
  };

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const resp = await getAllTasks();
      const arr = normalizeTasks(resp);
      setTasks(arr);
    } catch (e) {
      console.error(e);
      setError("Errore nel caricamento delle attività");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      loadTasks();
    }
  }, [authLoading, user, loadTasks]);

  const handleSaveTask = async (taskData) => {
    try {
      if (taskData.id) {
        // UPDATE
        const payload = {
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority || "medium",
          due_date: taskData.due_date || null,
          status: taskData.status,
        };
        const updated = await updateTask(taskData.id, payload);
        setTasks((prev) => prev.map((t) => (t.id === taskData.id ? updated : t)));
      } else {
        // CREATE
        const payload = {
          title: taskData.title,
          description: taskData.description || null,
          priority: taskData.priority || "medium",
          due_date: taskData.due_date || null,
          status: taskData.status,
        };
        const created = await createTask(payload);
        setTasks((prev) => [created, ...prev]);
      }
      setEditingTask(null);
    } catch (err) {
      console.error(err);
      alert("Errore nel salvataggio della task");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Vuoi davvero eliminare questa attività?")) return;
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error(err);
      alert("Errore nell'eliminazione della task");
    }
  };

  const toggleStatus = async (task) => {
    const current = task.status || "todo";
    const newStatus = current === "done" ? "todo" : "done";
    try {
      const payload = {
        title: task.title,
        description: task.description,
        priority: task.priority || "medium",
        due_date: task.due_date || null,
        status: newStatus,
      };
      const updated = await updateTask(task.id, payload);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (err) {
      console.error(err);
      alert("Errore nell'aggiornamento dello stato");
    }
  };

  // --- UTIL per date & filtri ---
  const parseDate = (d) => {
    if (!d) return null;
    const date = new Date(d);
    return isNaN(date.getTime()) ? null : date;
  };

  const today = new Date();
  const startOfToday = new Date(today);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);

  const endOfWeek = new Date(today);
  endOfWeek.setDate(endOfWeek.getDate() + 7);
  endOfWeek.setHours(23, 59, 59, 999);

  const matchesSearch = (task) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (task.title || "").toLowerCase().includes(q) ||
      (task.description || "").toLowerCase().includes(q)
    );
  };

  const withStatus = tasks.map((t) => ({
    ...t,
    status: t.status || "todo",
  }));

  const filtered = withStatus.filter(matchesSearch);

  const overdueTasks = filtered.filter((t) => {
    const d = parseDate(t.due_date);
    if (!d) return false;
    return d < startOfToday && t.status !== "done";
  });

  const todayTasks = filtered.filter((t) => {
    const d = parseDate(t.due_date);
    if (!d) return false;
    return d >= startOfToday && d <= endOfToday && t.status !== "done";
  });

  const weekTasks = filtered.filter((t) => {
    const d = parseDate(t.due_date);
    if (!d) return false;
    return d > endOfToday && d <= endOfWeek && t.status !== "done";
  });

  const completedTasks = filtered.filter((t) => t.status === "done");

  const otherTasks = filtered.filter((t) => {
    const d = parseDate(t.due_date);
    const isOverdue = d && d < startOfToday;
    const isToday = d && d >= startOfToday && d <= endOfToday;
    const isWeek = d && d > endOfToday && d <= endOfWeek;
    return (
      t.status !== "done" &&
      !isOverdue &&
      !isToday &&
      !isWeek
    );
  });

  if (authLoading || loading)
    return (
      <div style={styles.loader}>
        <div style={styles.loaderCard}>
          <div style={styles.logo}>☁️</div>
          <h2 style={styles.text}>Caricamento delle attività...</h2>
          <div style={styles.spinner}></div>
        </div>
      </div>
    );

  if (error)
    return <p className="text-red-500 text-center mt-10">{error}</p>;

  return (
    <>
      {editingTask && (
        <TaskModal
          task={editingTask}
          onSave={handleSaveTask}
          onClose={() => setEditingTask(null)}
        />
      )}

      <div style={styles.page}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Le mie Attività</h1>
            <p style={styles.subtitle}>
              Organizza i tuoi impegni per oggi, la settimana e oltre.
            </p>
          </div>

          <div style={styles.headerRight}>
            <input
              type="text"
              placeholder="Cerca attività..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.search}
            />

            <button
              style={styles.newTaskBtn}
              onClick={() => setEditingTask(null) || setEditingTask({})}
            >
              Nuova Attività
            </button>
          </div>


        </div>

        {/* Sezioni */}
        <div style={styles.sectionsGrid}>
          {/* Scadute */}
          <SectionCard title="Scadute" highlight="danger" tasks={overdueTasks}>
            {overdueTasks.length === 0 ? (
              <EmptyText text="Nessuna attività in ritardo" />
            ) : (
              overdueTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onEdit={() => setEditingTask(task)}
                  onDelete={() => handleDelete(task.id)}
                  onToggleStatus={() => toggleStatus(task)}
                />
              ))
            )}
          </SectionCard>

          {/* Oggi */}
          <SectionCard title="Oggi" highlight="primary" tasks={todayTasks}>
            {todayTasks.length === 0 ? (
              <EmptyText text="Nessuna attività per oggi" />
            ) : (
              todayTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onEdit={() => setEditingTask(task)}
                  onDelete={() => handleDelete(task.id)}
                  onToggleStatus={() => toggleStatus(task)}
                />
              ))
            )}
          </SectionCard>

          {/* Settimana */}
          <SectionCard title="Questa settimana" tasks={weekTasks}>
            {weekTasks.length === 0 ? (
              <EmptyText text="Nessuna attività in programma" />
            ) : (
              weekTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onEdit={() => setEditingTask(task)}
                  onDelete={() => handleDelete(task.id)}
                  onToggleStatus={() => toggleStatus(task)}
                />
              ))
            )}
          </SectionCard>

          {/* Altre */}
          <SectionCard title="Altre attività" tasks={otherTasks}>
            {otherTasks.length === 0 ? (
              <EmptyText text="Tutte le attività sono già organizzate" />
            ) : (
              otherTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onEdit={() => setEditingTask(task)}
                  onDelete={() => handleDelete(task.id)}
                  onToggleStatus={() => toggleStatus(task)}
                />
              ))
            )}
          </SectionCard>

          {/* Completate */}
          <SectionCard title="Completate" tasks={completedTasks}>
            {completedTasks.length === 0 ? (
              <EmptyText text="Nessuna attività completata (ancora!)" />
            ) : (
              completedTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onEdit={() => setEditingTask(task)}
                  onDelete={() => handleDelete(task.id)}
                  onToggleStatus={() => toggleStatus(task)}
                  isCompleted
                />
              ))
            )}
          </SectionCard>
        </div>
      </div>
    </>
  );
}

function SectionCard({ title, highlight, tasks, children }) {
  const borderColor =
    highlight === "danger"
      ? "0 0 0 1px rgba(248,113,113,0.8)"
      : highlight === "primary"
        ? "0 0 0 1px rgba(59,130,246,0.7)"
        : "0 0 0 1px rgba(255,255,255,0.15)";

  return (
    <div style={{ ...styles.sectionCard, boxShadow: borderColor }}>
      <h2 style={styles.sectionTitle}>{title}</h2>
      <div>{children}</div>
    </div>
  );
}

function EmptyText({ text }) {
  return <p style={styles.emptyText}>{text}</p>;
}

function TaskRow({ task, onEdit, onDelete, onToggleStatus, isCompleted }) {
  const priorityLabel =
    task.priority === "high"
      ? "Alta"
      : task.priority === "medium"
        ? "Media"
        : "Bassa";

  const priorityColor =
    task.priority === "high"
      ? "#fca5a5"
      : task.priority === "medium"
        ? "#facc15"
        : "#6ee7b7";

  const status = task.status || "todo";

  return (
    <div style={styles.taskRow}>
      {/* Blocco sinistro: titolo + descrizione */}
      <div style={{ flex: 1 }}>
        <div style={styles.taskMain}>
          <button
            onClick={onToggleStatus}
            style={{
              ...styles.statusCircle,
              borderColor: isCompleted || status === "done" ? "#22c55e" : "#e5e7eb",
              background:
                isCompleted || status === "done"
                  ? "radial-gradient(circle, #22c55e 40%, transparent 41%)"
                  : "transparent",
            }}
          />
          <div>
            <span
              style={{
                ...styles.taskTitle,
                textDecoration:
                  isCompleted || status === "done" ? "line-through" : "none",
                opacity: isCompleted || status === "done" ? 0.7 : 1,
              }}
            >
              {task.title || "Senza titolo"}
            </span>

            <p style={styles.taskDescription}>
              {task.description || "Nessuna descrizione"}
            </p>
          </div>
        </div>

        {/* BLOCCO DA ALLINEARE */}
        <div style={styles.metaActionsRow}>
          <div style={styles.metaLeft}>
            <span style={{ ...styles.chip, borderColor: priorityColor }}>
              Priorità: <strong>{priorityLabel}</strong>
            </span>

            <span style={styles.chip}>
              Scadenza:{" "}
              <strong>
                {task.due_date
                  ? new Date(task.due_date).toLocaleDateString()
                  : "Nessuna"}
              </strong>
            </span>
          </div>

          <div style={styles.metaRight}>
            <button style={styles.linkBtn} onClick={onEdit}>
              Modifica
            </button>
            <button style={styles.linkBtnDanger} onClick={onDelete}>
              Elimina
            </button>
          </div>
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
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    gap: "16px",
    flexWrap: "wrap",
  },
  title: {
    fontSize: "2rem",
    fontWeight: 700,
    marginBottom: "4px",
  },
  subtitle: {
    fontSize: "0.95rem",
    opacity: 0.9,
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    alignSelf: "flex-end",
  },

  search: {
    height: "44px",
    padding: "0 14px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.3)",
    background: "rgba(255,255,255,0.9)",
    fontSize: "0.9rem",
    color: "#1e3a8a",
    lineHeight: "44px",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
  },


  primaryBtn: {
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    border: "none",
    padding: "9px 16px",
    borderRadius: "8px",
    color: "white",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: 500,
  },
  sectionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "20px",
  },
  sectionCard: {
    background: "rgba(15,23,42,0.4)",
    backdropFilter: "blur(12px)",
    borderRadius: "16px",
    padding: "18px 18px 14px",
    boxShadow: "0 6px 20px rgba(15,23,42,0.7)",
    minHeight: "140px",
  },
  sectionTitle: {
    fontSize: "1.1rem",
    fontWeight: 600,
    marginBottom: "10px",
  },
  emptyText: {
    fontSize: "0.9rem",
    opacity: 0.8,
  },
  taskRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    padding: "10px 8px",
    borderRadius: "10px",
    background: "rgba(15,23,42,0.55)",
    marginBottom: "8px",
  },
  taskMain: {
    display: "flex",
    gap: "10px",
  },
  statusCircle: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    border: "2px solid #e5e7eb",
    background: "transparent",
    cursor: "pointer",
    marginTop: "4px",
  },
  taskTitleWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  taskTitle: {
    fontSize: "0.98rem",
    fontWeight: 500,
  },
  taskDescription: {
    fontSize: "0.85rem",
    opacity: 0.85,
    marginTop: "2px",
    marginBottom: "4px",
  },
  taskMeta: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginTop: "4px",
  },
  chip: {
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.25)",
    padding: "2px 8px",
    fontSize: "0.75rem",
    opacity: 0.9,
  },
  taskActions: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  linkBtn: {
    background: "none",
    border: "none",
    color: "#bfdbfe",
    cursor: "pointer",
    fontSize: "0.8rem",
  },
  linkBtnDanger: {
    background: "none",
    border: "none",
    color: "#fecaca",
    cursor: "pointer",
    fontSize: "0.8rem",
  },
  loader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    background:
      "linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #312e81 100%)",
  },
  loaderCard: {
    textAlign: "center",
    background: "rgba(255,255,255,0.05)",
    padding: "3rem 4rem",
    borderRadius: "16px",
    boxShadow: "0 8px 25px rgba(0,0,0,0.2)",
    backdropFilter: "blur(6px)",
  },
  logo: { fontSize: "3rem" },
  text: { fontSize: "1.2rem", marginTop: "1rem" },
  spinner: {
    margin: "1.8rem auto 0",
    border: "4px solid rgba(255,255,255,0.2)",
    borderTop: "4px solid #fff",
    borderRadius: "50%",
    width: "48px",
    height: "48px",
    animation: "spin 1s linear infinite",
  },
  select: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.08)",
    color: "white",
    marginBottom: "16px",
  },
  newTaskBtn: {
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    border: "none",
    padding: "0 18px",
    height: "42px",
    borderRadius: "8px",
    color: "white",
    fontSize: "0.9rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  metaActionsRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "6px",
    paddingTop: "6px",
    borderTop: "1px solid rgba(255,255,255,0.1)",
  },

  metaLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    alignItems: "flex-start",
  },

  metaRight: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    alignItems: "flex-end",
  },
};
