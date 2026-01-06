import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { getAllNotes } from "../services/noteService";
import { getAllTasks } from "../services/taskService";
import http from "../api/http";

export default function Profile() {
  const { user } = useAuth(); 
  const signOut = () => { window.location.href = "/.auth/logout"; };

  const [recentNotes, setRecentNotes] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [settings, setSettings] = useState({
    notify_email: true,
    notify_push: false,
    notify_reminders: true,
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const normalizeTasks = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (payload?.data && Array.isArray(payload.data)) return payload.data;
    return [];
  };

  // Carica dati recenti e impostazioni utente
  useEffect(() => {
    const loadData = async () => {
      try {
        const notes = await getAllNotes();
        const taskResp = await getAllTasks();

        const tasks = normalizeTasks(taskResp);

        setRecentNotes(Array.isArray(notes) ? notes.slice(0, 3) : []);
        setRecentTasks(tasks.slice(0, 3));

        const res = await http.get("/settings/me");
        await http.put("/settings/me", settings);
      } catch (err) {
        console.error("Errore caricamento dati profilo:", err);
      }
    };
    loadData();
  }, []);

  // Salva preferenze
  const handleSave = async () => {
    try {
      setLoading(true);
      await http.put("/settings/me", settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Errore salvataggio preferenze:", err);
      alert("Errore durante il salvataggio delle preferenze");
    } finally {
      setLoading(false);
    }
  };

  if (!user)
    return (
      <div style={styles.message}>
        <h2>Utente non autenticato</h2>
      </div>
    );

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Profilo Utente</h1>

        {/* --- Sezione Profilo --- */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Informazioni Account</h3>
          <div style={styles.infoGrid}>
            <div><strong>Nome:</strong> {user.name}</div>
            <div><strong>Email:</strong> {user.email}</div>
            <div><strong>ID Entra:</strong> {user.external_id}</div>
            <div><strong>Accesso:</strong> {new Date().toLocaleString()}</div>
          </div>
        </div>

        {/* --- Sezione Preferenze --- */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Impostazioni & Preferenze</h3>

          <div style={styles.toggleGroup}>
            {[
              ["Notifiche Email", "notify_email"],
              ["Notifiche Push", "notify_push"],
              ["Promemoria Attività", "notify_reminders"],
            ].map(([label, key]) => (
              <label key={key} style={styles.toggleRow}>
                <span>{label}</span>
                <div
                  style={{
                    ...styles.toggleSwitch,
                    background: settings[key] ? "#3b82f6" : "rgba(255,255,255,0.2)",
                  }}
                  onClick={() =>
                    setSettings({ ...settings, [key]: !settings[key] })
                  }
                >
                  <div
                    style={{
                      ...styles.toggleCircle,
                      transform: settings[key]
                        ? "translateX(22px)"
                        : "translateX(0)",
                    }}
                  />
                </div>
              </label>
            ))}
          </div>

          <button
            onClick={handleSave}
            style={styles.saveBtn}
            disabled={loading}
          >
            {loading ? "Salvataggio..." : "Salva Preferenze"}
          </button>
          {saved && <p style={styles.savedMsg}>Preferenze salvate</p>}
        </div>

        {/* --- Attività Recenti --- */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Attività Recenti</h3>
          <div style={styles.activityGrid}>
            <div>
              <h4 style={styles.subtitle}>Ultime Note</h4>
              {recentNotes.length ? (
                <div style={styles.cardGrid}>
                  {recentNotes.map((n) => (
                    <div key={n.id} style={styles.miniCard}>
                      <h4 style={styles.miniTitle}>{n.title}</h4>
                      <p style={styles.miniText}>
                        {n.content?.slice(0, 100) || "Nessun contenuto"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={styles.empty}>Nessuna nota recente</p>
              )}
            </div>

            <div>
              <h4 style={styles.subtitle}>Ultime Attività</h4>
              {recentTasks.length ? (
                <div style={styles.cardGrid}>
                  {recentTasks.map((t) => (
                    <div key={t.id} style={styles.miniCard}>
                      <h4 style={styles.miniTitle}>{t.title}</h4>
                      <p style={styles.miniText}>
                        Scadenza:{" "}
                        {t.due_date
                          ? new Date(t.due_date).toLocaleDateString()
                          : "N/D"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={styles.empty}>Nessuna attività recente</p>
              )}
            </div>
          </div>
        </div>

        {/* --- Azioni --- */}
        <div style={styles.actions}>
          <button onClick={signOut} style={styles.logoutBtn}>Disconnetti</button>
          <button onClick={resetCache} style={styles.secondaryBtn}>Pulisci Cache</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "40px 60px",
    fontFamily: "Inter, system-ui, sans-serif",
    color: "white",
  },
  card: {
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(12px)",
    borderRadius: "20px",
    padding: "35px 40px",
    boxShadow: "0 8px 25px rgba(0,0,0,0.3)",
    animation: "fadeIn 0.6s ease-out",
  },
  title: { fontSize: "2rem", fontWeight: "700", marginBottom: "20px" },
  section: { marginBottom: "40px" },
  sectionTitle: { fontSize: "1.2rem", fontWeight: "600", marginBottom: "15px" },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px 20px",
  },
  toggleGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  toggleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "rgba(255,255,255,0.1)",
    padding: "12px 18px",
    borderRadius: "12px",
  },
  toggleSwitch: {
    width: "44px",
    height: "22px",
    borderRadius: "22px",
    position: "relative",
    cursor: "pointer",
    transition: "background 0.3s ease",
  },
  toggleCircle: {
    position: "absolute",
    top: "3px",
    left: "3px",
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    background: "#fff",
    transition: "transform 0.3s ease",
  },
  saveBtn: {
    marginTop: "20px",
    backgroundColor: "#3b82f6",
    border: "none",
    color: "white",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  savedMsg: {
    marginTop: "8px",
    color: "#22c55e",
    fontSize: "0.9rem",
  },
  subtitle: { marginBottom: "8px", fontWeight: "600" },
  cardGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  miniCard: {
    background: "rgba(255,255,255,0.1)",
    borderRadius: "12px",
    padding: "14px 16px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
  },
  miniTitle: { fontSize: "1rem", fontWeight: "600", marginBottom: "4px" },
  miniText: { fontSize: "0.9rem", color: "rgba(255,255,255,0.8)" },
  empty: { opacity: 0.7, fontSize: "0.9rem" },
  activityGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "30px",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "20px",
  },
  logoutBtn: {
    backgroundColor: "#ef4444",
    border: "none",
    color: "white",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  secondaryBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    border: "none",
    color: "white",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  message: {
    textAlign: "center",
    color: "white",
    marginTop: "50px",
    fontSize: "1.1rem",
  },
};

// 🔹 Animazione globale
if (typeof document !== "undefined" && document.styleSheets.length) {
  const sheet = document.styleSheets[0];
  sheet.insertRule(
    `@keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }`,
    sheet.cssRules.length
  );
}
