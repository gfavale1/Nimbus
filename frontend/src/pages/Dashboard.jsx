import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { getAllNotes, getSharedNotes } from "../services/noteService";
import { getAllTasks, createTask } from "../services/taskService";
import EditNoteModal from "../components/EditNoteModal";
import TaskModal from "../components/TaskModal";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import apiClient from "../api/http";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();

  const [notes, setNotes] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [dailyBrief, setDailyBrief] = useState(null);
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [briefError, setBriefError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const notesData = await getAllNotes();
      const sharedData = await getSharedNotes();

      setNotes([...notesData, ...sharedData]);

      const taskResp = await getAllTasks();
      const tasksData = Array.isArray(taskResp?.data)
        ? taskResp.data
        : Array.isArray(taskResp)
          ? taskResp
          : [];

      // setNotes(Array.isArray(notesData) ? notesData : []);
      setTasks(tasksData);

      console.log("Task con scadenza:", tasks.filter(t => t.due_date).map(t => ({
        title: t.title,
        due: t.due_date,
        parsedDue: new Date(t.due_date).toLocaleString(),
        now: new Date().toLocaleString(),
        diff: (new Date(t.due_date) - new Date()) / 36e5
      })));
    } catch (err) {
      console.error("Errore caricamento dashboard:", err);
      setNotes([]);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDailyBrief = async (force = false) => {
    try {
      setLoadingBrief(true);
      setBriefError(null);

      const url = force
        ? "/ai/daily-brief?force=1"
        : "/ai/daily-brief";

      const res = await apiClient.get(url);

      if (res.data?.limitReached) {
        setBriefError("Limite giornaliero di rigenerazioni raggiunto.");
        return;
      }

      setDailyBrief(res.data?.summary || "Nessun riassunto disponibile.");
    } catch (err) {
      setBriefError("Errore nella generazione del riassunto.");
    } finally {
      setLoadingBrief(false);
    }
  };



  useEffect(() => {
    if (!authLoading && user) {
      loadData();
      loadDailyBrief();
    }
  }, [authLoading, user, loadData]);

  // --- Normalizzazione stato task ---
  const normalizeStatus = (task) => {
    const s = (task.status || "").toLowerCase();
    if (["done", "completed"].includes(s)) return "done";
    if (["in_progress", "progress", "doing"].includes(s)) return "in_progress";
    return "todo";
  };

  // --- Conteggi Task ---
  const totalTasks = tasks.length || 0;
  const tasksDone = tasks.filter((t) => normalizeStatus(t) === "done").length;
  const tasksInProgress = tasks.filter(
    (t) => normalizeStatus(t) === "in_progress"
  ).length;
  const tasksTodo = tasks.filter((t) => normalizeStatus(t) === "todo").length;

  const completionRate = totalTasks
    ? Math.round((tasksDone / totalTasks) * 100)
    : 0;

  // --- Promemoria Imminenti (entro 24 ore) ---
  const upcomingReminders = tasks.filter((t) => {
    if (!t.due_date || normalizeStatus(t) === "done") return false;

    const due = new Date(t.due_date);
    const now = new Date();
    const diffHours = (due - now) / 36e5;

    // Accettiamo task scadute da massimo 24 ore (diff > -24) 
    // o che scadono nelle prossime 24 ore (diff <= 24)
    return diffHours >= -24 && diffHours <= 24;
  });

  // --- Configurazione Grafico ---
  const chartData = {
    labels: ["Da fare", "In corso", "Completate"],
    datasets: [
      {
        data: [tasksTodo, tasksInProgress, tasksDone],
        backgroundColor: ["#f87171", "#facc15", "#34d399"],
        borderColor: "transparent",
        borderWidth: 2,
      },
    ],
  };

  if (authLoading || loading)
    return (
      <div style={styles.loader}>
        <div style={styles.loaderCard}>
          <div style={styles.logo}>☁️</div>
          <h2 style={styles.text}>Caricamento Dashboard...</h2>
          <div style={styles.spinner}></div>
        </div>
      </div>
    );

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Dashboard Nimbus</h1>
        <div style={styles.actions}>
          <button style={styles.addBtn} onClick={() => setShowNoteModal(true)}>
            Nuova Nota
          </button>
          <button style={styles.addBtn} onClick={() => setShowTaskModal(true)}>
            Nuova Task
          </button>
        </div>
      </div>

      {/* Statistiche principali */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}><h3>Totale Note</h3><p>{notes.length}</p></div>
        <div style={styles.statCard}><h3>Totale Task</h3><p>{totalTasks}</p></div>
        <div style={styles.statCard}><h3>Da Fare</h3><p>{tasksTodo}</p></div>
        <div style={styles.statCard}><h3>In Corso</h3><p>{tasksInProgress}</p></div>
        <div style={styles.statCard}><h3>Completate</h3><p>{tasksDone}</p></div>
      </div>

      {/* Distribuzione delle Task */}
      <div style={styles.chartSection}>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Distribuzione delle Task per Stato</h3>
          <div style={styles.chartRow}>
            <div style={styles.chartWrapper}>
              <Doughnut
                data={chartData}
                options={{ cutout: "70%", plugins: { legend: { display: false } } }}
              />
            </div>

            {/* Legenda */}
            <div style={styles.legend}>
              {[
                ["#f87171", "Da fare"],
                ["#facc15", "In corso"],
                ["#34d399", "Completate"],
              ].map(([color, label]) => (
                <div key={label} style={styles.legendItem}>
                  <span style={{ ...styles.legendDot, background: color }}></span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Efficienza */}
      <div style={styles.progressCard}>
        <h3 style={styles.progressTitle}>Efficienza Attuale</h3>
        <div style={styles.progressBarContainer}>
          <div style={{ ...styles.progressBarFill, width: `${completionRate}%` }}></div>
        </div>
        <p style={styles.progressText}>
          Hai completato il <strong>{completionRate}%</strong> delle tue task
        </p>
      </div>

      <div style={styles.aiCard}>
        <h3 style={styles.aiTitle}>Riassunto della giornata</h3>

        {loadingBrief && (
          <p style={styles.aiPlaceholder}>Generazione del riassunto in corso…</p>
        )}

        {briefError && (
          <p style={{ ...styles.aiPlaceholder, color: "#f87171" }}>
            {briefError}
          </p>
        )}

        {!loadingBrief && !briefError && (
          <p style={styles.aiContent}>
            {dailyBrief || "Nessun riassunto disponibile."}
          </p>
        )}

        <button style={styles.aiBtn} onClick={() => loadDailyBrief(true)}>
          Rigenera riassunto
        </button>
      </div>

      {/* Attività recenti */}
      <div style={styles.recentSection}>
        <div style={styles.recentBlock}>
          <h2 style={styles.subTitle}>Ultime Note</h2>
          {notes.length ? (
            <ul style={styles.list}>
              {notes.slice(0, 5).map((note) => (
                <li key={note.id} style={styles.listItem}>
                  <strong>{note.title}</strong>
                  <p style={styles.textSmall}>
                    {note.content?.slice(0, 80) || "—"}
                  </p>
                  <p style={{ ...styles.textSmall, color: "#94a3b8", marginTop: "4px", fontSize: "0.75rem" }}>
                    Ultima modifica: {note.updated_at
                      ? new Date(note.updated_at).toLocaleString()
                      : (note.created_at ? new Date(note.created_at).toLocaleString() : "Data N/D")}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p style={styles.empty}>Nessuna nota trovata</p>
          )}
        </div>

        <div style={styles.recentBlock}>
          <h2 style={styles.subTitle}>Ultime Task</h2>
          {tasks.length ? (
            <ul style={styles.list}>
              {tasks.slice(0, 5).map((t) => {
                const technicalStatus = normalizeStatus(t);

                let displayStatus = "";
                let statusColor = "";

                switch (technicalStatus) {
                  case "done":
                    displayStatus = "Completata!";
                    statusColor = "#34d399"; 
                    break;
                  case "in_progress":
                    displayStatus = "In corso!";
                    statusColor = "#facc15"; 
                    break;
                  default:
                    displayStatus = "Da fare!";
                    statusColor = "#f87171"; 
                }

                return (
                  <li key={t.id} style={styles.listItem}>
                    <strong>{t.title}</strong>
                    <p style={styles.textSmall}>
                      Stato: <span style={{ color: statusColor, fontWeight: "bold" }}>{displayStatus}</span> | Scadenza:{" "}
                      {t.due_date ? new Date(t.due_date).toLocaleDateString() : "N/D"}
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p style={styles.empty}>Nessuna task trovata</p>
          )}
        </div>

        <div style={styles.recentBlock}>
          <h2 style={styles.subTitle}>Promemoria Imminenti</h2>
          {upcomingReminders.length ? (
            <ul style={styles.list}>
              {upcomingReminders.map((r) => (
                <li key={r.id} style={styles.listItem}>
                  <strong>{r.title}</strong>
                  <p style={styles.textSmall}>
                    Scadenza: {new Date(r.due_date).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p style={styles.empty}>Nessun promemoria imminente</p>
          )}
        </div>
      </div>

      {/* Modali */}
      {showTaskModal && (
        <TaskModal
          onClose={() => setShowTaskModal(false)}
          onSave={async (taskData) => {
            try {
              await createTask(taskData);
              await loadData();
            } catch (err) {
              console.error("Errore nella creazione della task:", err);
              alert("Errore durante la creazione della task.");
            } finally {
              setShowTaskModal(false);
            }
          }}
        />
      )}
      {showNoteModal && (
        <EditNoteModal
          note={null} // Indica che è una NUOVA nota
          onClose={() => setShowNoteModal(false)}
          onSaved={async () => {
            await loadData();
            setShowNoteModal(false);
          }}
        />
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: "40px 60px",
    minHeight: "100vh",
    color: "white",
    fontFamily: "Inter, system-ui, sans-serif",
    animation: "fadeIn 0.6s ease-out",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
  },
  title: { fontSize: "2rem", fontWeight: 700 },
  actions: { display: "flex", gap: "10px" },
  addBtn: {
    backgroundColor: "#3b82f6",
    border: "none",
    color: "white",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "background 0.3s",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "20px",
    marginBottom: "40px",
  },
  statCard: {
    background: "rgba(255,255,255,0.08)",
    borderRadius: "16px",
    textAlign: "center",
    padding: "20px",
    boxShadow: "0 8px 25px rgba(0,0,0,0.3)",
    backdropFilter: "blur(10px)",
  },
  chartSection: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "50px",
  },
  chartCard: {
    background: "rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 8px 25px rgba(0,0,0,0.3)",
  },
  chartTitle: {
    textAlign: "center",
    marginBottom: "15px",
    fontSize: "1.1rem",
    fontWeight: 600,
  },
  chartRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "30px",
  },
  chartWrapper: {
    position: "relative",
    width: "220px",
    height: "220px",
  },
  chartCenter: {
    position: "absolute",
    top: "55%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    textAlign: "center",
  },
  chartValue: { fontSize: "1.8rem", fontWeight: "700" },
  chartLabel: { fontSize: "0.9rem", opacity: 0.8 },
  legend: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    background: "rgba(255,255,255,0.08)",
    padding: "10px 16px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.95rem",
  },
  legendDot: {
    width: "14px",
    height: "14px",
    borderRadius: "50%",
    display: "inline-block",
  },
  progressCard: {
    background: "rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "25px",
    boxShadow: "0 8px 25px rgba(0,0,0,0.3)",
    marginBottom: "40px",
  },
  progressTitle: { fontSize: "1.2rem", fontWeight: "600", marginBottom: "10px" },
  progressBarContainer: {
    width: "100%",
    height: "14px",
    borderRadius: "8px",
    background: "rgba(255,255,255,0.15)",
    overflow: "hidden",
    marginBottom: "10px",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: "8px",
    background: "linear-gradient(90deg, #3b82f6, #22c55e)",
    transition: "width 0.8s ease",
  },
  progressText: { fontSize: "0.95rem", opacity: 0.9 },
  recentSection: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "25px",
  },
  recentBlock: {
    background: "rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 8px 25px rgba(0,0,0,0.3)",
  },
  subTitle: { fontSize: "1.1rem", fontWeight: 600, marginBottom: "10px" },
  list: { listStyle: "none", padding: 0, margin: 0 },
  listItem: {
    background: "rgba(255,255,255,0.1)",
    borderRadius: "8px",
    padding: "10px",
    marginBottom: "8px",
  },
  textSmall: { fontSize: "0.9rem", color: "rgba(255,255,255,0.8)" },
  empty: { opacity: 0.7 },
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
  logo: { fontSize: "3.2rem", animation: "pulse 2s infinite" },
  text: { fontSize: "1.2rem", fontWeight: 500, marginTop: "1rem", color: "white" },
  spinner: {
    margin: "1.8rem auto 0",
    border: "4px solid rgba(255,255,255,0.2)",
    borderTop: "4px solid #fff",
    borderRadius: "50%",
    width: "48px",
    height: "48px",
    animation: "spin 1s linear infinite",
  },

  aiCard: {
    background: "rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "25px",
    boxShadow: "0 8px 25px rgba(0,0,0,0.3)",
    marginBottom: "40px",
  },

  aiTitle: {
    fontSize: "1.2rem",
    fontWeight: 600,
    marginBottom: "12px",
  },

  aiContent: {
    fontSize: "0.95rem",
    lineHeight: 1.6,
    color: "rgba(255,255,255,0.9)",
    marginBottom: "16px",
    whiteSpace: "pre-line",
  },

  aiPlaceholder: {
    fontSize: "0.95rem",
    opacity: 0.8,
    marginBottom: "16px",
  },

  aiBtn: {
    backgroundColor: "#3b82f6",
    border: "none",
    color: "white",
    padding: "8px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.9rem",
    transition: "background 0.3s",
  },

};

// Animazioni globali
if (typeof document !== "undefined" && document.styleSheets.length) {
  const sheet = document.styleSheets[0];
  sheet.insertRule(
    `@keyframes spin {0% {transform: rotate(0deg);}100% {transform: rotate(360deg);}}`,
    sheet.cssRules.length
  );
  sheet.insertRule(
    `@keyframes pulse {0%,100% {transform: scale(1);opacity: 1;}50% {transform: scale(1.2);opacity: 0.8;}}`,
    sheet.cssRules.length
  );
  sheet.insertRule(
    `@keyframes fadeIn {from {opacity: 0; transform: translateY(10px);} to {opacity: 1; transform: translateY(0);}}`,
    sheet.cssRules.length
  );
}
