import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api.js";
import { todayStr } from "./insights.js";
import Home from "./components/Home.jsx";
import TargetsPage from "./components/TargetsPage.jsx";
import HistoryPage from "./components/HistoryPage.jsx";
import HabitsPage from "./components/HabitsPage.jsx";
import ReportsPage from "./components/ReportsPage.jsx";
import Templates from "./components/Templates.jsx";

const TABS = [
  { id: "home", label: "Home" },
  { id: "targets", label: "Targets" },
  { id: "habits", label: "Habits" },
  { id: "reports", label: "Reports" },
  { id: "history", label: "History" },
  { id: "templates", label: "Templates" },
];

export default function App() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("home");
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setData(await api.getState());
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const exportData = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mytodo-backup-${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import = the other half of Export: pick a backup JSON, confirm what it
  // holds, and REPLACE the current state with it (server keeps a pre-restore
  // safety snapshot).
  const fileInput = useRef(null);

  const importData = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file later
    if (!file) return;
    try {
      const backup = JSON.parse(await file.text());
      const n = (k) => (Array.isArray(backup[k]) ? backup[k].length : 0);
      const summary = `${n("targets")} targets, ${n("milestones")} milestones, ${n("subtasks")} tasks, ${n("habits")} habits`;
      if (!confirm(`Replace ALL current data with "${file.name}"?\n\nBackup contains: ${summary}.`))
        return;
      await api.restore(backup);
      refresh();
    } catch (err) {
      alert(`Import failed: ${err.message}`);
    }
  };

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <h1 className="wordmark">
              <span className="wm-1">M</span>
              <span className="wm-2">y</span>
              <span className="wm-3">T</span>
              <span className="wm-4">o</span>
              <span className="wm-5">D</span>
              <span className="wm-6">o</span>
            </h1>
          </div>
          <div className="topbar-right">
            <nav className="tabs">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  className={`tab ${tab === t.id ? "active" : ""}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </nav>
            <button
              className="btn-icon"
              title="Download all your data as a JSON backup"
              onClick={exportData}
              disabled={!data}
            >
              ⬇ Export
            </button>
            <button
              className="btn-icon"
              title="Replace all data with a previously exported backup"
              onClick={() => fileInput.current?.click()}
              disabled={!data}
            >
              ⬆ Import
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              style={{ display: "none" }}
              onChange={importData}
            />
          </div>
        </div>
      </header>

      <main className="app-main">
        {error && (
          <div className="error-banner">
            ⚠️ {error} — is the server running? <button onClick={refresh}>Retry</button>
          </div>
        )}
        {!data && !error && <div className="loading">Loading your goals…</div>}
        {data && tab === "home" && <Home data={data} refresh={refresh} />}
        {data && tab === "targets" && <TargetsPage data={data} refresh={refresh} />}
        {data && tab === "habits" && <HabitsPage data={data} refresh={refresh} />}
        {data && tab === "reports" && <ReportsPage data={data} />}
        {data && tab === "history" && <HistoryPage data={data} refresh={refresh} />}
        {data && tab === "templates" && <Templates data={data} refresh={refresh} />}
      </main>
    </div>
  );
}
