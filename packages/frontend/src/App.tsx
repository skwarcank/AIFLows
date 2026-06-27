import { useEffect, useMemo, useState } from "react";
import "./style.css";
import { fetchHealth } from "./api";
import MissionControlHome from "./components/MissionControlHome";
import HermesProfilesPage from "./components/HermesProfilesPage";
import HermesFlowsPage from "./components/HermesFlowsPage";
import FlowReplayPage from "./components/FlowReplayPage";

type Route =
  | { kind: "home" }
  | { kind: "hermesProfiles" }
  | { kind: "hermesFlows"; profileId: string }
  | { kind: "flowReplay"; profileId: string; flowId: string }
  | { kind: "notFound" };

function parseRoute(pathname: string): Route {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return { kind: "home" };
  if (segments[0] !== "adapters") return { kind: "notFound" };
  if (segments.length === 2 && segments[1] === "hermes") return { kind: "hermesProfiles" };
  if (segments.length === 4 && segments[1] === "hermes" && segments[2] === "profiles") {
    return { kind: "hermesFlows", profileId: decodeURIComponent(segments[3]) };
  }
  if (
    segments.length === 6 &&
    segments[1] === "hermes" &&
    segments[2] === "profiles" &&
    segments[4] === "flows"
  ) {
    return {
      kind: "flowReplay",
      profileId: decodeURIComponent(segments[3]),
      flowId: decodeURIComponent(segments[5]),
    };
  }

  return { kind: "notFound" };
}

function App() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("aiflows-theme") === "dark");
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [backendOnline, setBackendOnline] = useState(true);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    localStorage.setItem("aiflows-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const check = async () => {
      const ok = await fetchHealth().catch(() => false);
      setBackendOnline(ok);
    };
    check();
    const interval = window.setInterval(check, 5000);
    return () => window.clearInterval(interval);
  }, []);

  const route = useMemo(() => parseRoute(pathname), [pathname]);
  const navigate = (path: string) => {
    if (path === window.location.pathname) return;
    window.history.pushState({}, "", path);
    setPathname(path);
  };

  let content;
  switch (route.kind) {
    case "home":
      content = <MissionControlHome onNavigate={navigate} />;
      break;
    case "hermesProfiles":
      content = <HermesProfilesPage onNavigate={navigate} />;
      break;
    case "hermesFlows":
      content = <HermesFlowsPage profileId={route.profileId} onNavigate={navigate} />;
      break;
    case "flowReplay":
      content = (
        <FlowReplayPage
          profileId={route.profileId}
          flowId={route.flowId}
          onNavigate={navigate}
        />
      );
      break;
    case "notFound":
      content = (
        <section className="page-shell">
          <div className="page-empty page-error">
            <h3>Route not found</h3>
            <p>The requested Mission Control page does not exist.</p>
          </div>
        </section>
      );
      break;
    default:
      content = null;
  }

  return (
    <div className="app">
      <header className="app-header">
        <button className="app-brand" onClick={() => navigate("/")}>AIFlows</button>
        <div className="app-header-meta">
          <span className={`status-dot ${backendOnline ? "is-online" : "is-offline"}`}>
            {backendOnline ? "Backend online" : "Backend offline"}
          </span>
          <button className="theme-toggle" onClick={() => setDarkMode((prev) => !prev)}>
            {darkMode ? "☀" : "🌙"}
          </button>
        </div>
      </header>
      <main className="app-main">{content}</main>
    </div>
  );
}

export default App;
