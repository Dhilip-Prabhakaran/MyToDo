import { useCallback, useEffect, useState } from "react";
import { api } from "./api.js";
import { todayStr } from "./insights.js";
import Home from "./components/Home.jsx";
import TargetsPage from "./components/TargetsPage.jsx";
import HistoryPage from "./components/HistoryPage.jsx";
import HabitsPage from "./components/HabitsPage.jsx";
import Templates from "./components/Templates.jsx";

const TABS = [
  { id: "home", label: "Home" },
  { id: "targets", label: "Targets" },
  { id: "habits", label: "Habits" },
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
        {data && tab === "history" && <HistoryPage data={data} refresh={refresh} />}
        {data && tab === "templates" && <Templates data={data} refresh={refresh} />}
      </main>
    </div>
  );
}
