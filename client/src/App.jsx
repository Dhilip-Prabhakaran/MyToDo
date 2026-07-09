import { useCallback, useEffect, useState } from "react";
import { api } from "./api.js";
import Logo from "./components/Logo.jsx";
import Home from "./components/Home.jsx";
import TargetsPage from "./components/TargetsPage.jsx";
import Templates from "./components/Templates.jsx";

const TABS = [
  { id: "home", label: "Home" },
  { id: "targets", label: "Targets" },
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

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <Logo size={30} />
            <h1>MyToDo</h1>
          </div>
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
        {data && tab === "templates" && <Templates data={data} refresh={refresh} />}
      </main>
    </div>
  );
}
