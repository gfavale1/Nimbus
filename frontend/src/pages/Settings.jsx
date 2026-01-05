import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import http from "../api/http"; // usa l'interceptor MSAL già configurato

export default function Settings() {
  const { user, loading: authLoading } = useAuth();
  const [prefs, setPrefs] = useState({
    notify_email: false,
    notify_push: false,
    notify_reminders: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!authLoading && user) loadSettings();
  }, [authLoading, user]);

  async function loadSettings() {
    try {
      setLoading(true);
      const { data } = await http.get("/api/settings/me");
      setPrefs(data);
    } catch (err) {
      console.error("Errore nel caricamento impostazioni:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      await http.put("/api/settings/me", prefs);
      setMessage("Impostazioni salvate correttamente!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Errore nel salvataggio:", err);
      setMessage("Errore durante il salvataggio.");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading)
    return <p className="text-gray-500 text-center mt-10">Caricamento...</p>;

  return (
    <div className="max-w-lg mx-auto p-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Impostazioni</h2>

      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 space-y-4">
        <Toggle
          label="Notifiche via Email"
          checked={prefs.notify_email}
          onChange={(v) => setPrefs((p) => ({ ...p, notify_email: v }))}
        />
        <Toggle
          label="Promemoria Attività"
          checked={prefs.notify_reminders}
          onChange={(v) => setPrefs((p) => ({ ...p, notify_reminders: v }))}
        />

        {message && <p className="text-center text-sm mt-2">{message}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full mt-4 px-4 py-2 text-white rounded-md ${
            saving ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {saving ? "Salvataggio..." : "Salva impostazioni"}
        </button>
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-gray-700 font-medium">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 accent-blue-600"
      />
    </label>
  );
}
