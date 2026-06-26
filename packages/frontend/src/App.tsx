import { useState, useEffect, useCallback, useRef } from "react";
import "./style.css";
import type { Profile, TraceSummary, RunTrace } from "./types";
import { fetchProfiles, fetchTraces, fetchTrace, fetchHealth } from "./api";
import ProfileSelector from "./components/ProfileSelector";
import StatusIndicator from "./components/StatusIndicator";
import TraceSidebar from "./components/TraceSidebar";
import MainContent from "./components/MainContent";

function App() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [profilesError, setProfilesError] = useState<string | null>(null);

  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    () => localStorage.getItem("aiflows-profile")
  );

  const [traces, setTraces] = useState<TraceSummary[]>([]);
  const [tracesLoading, setTracesLoading] = useState(false);
  const [tracesError, setTracesError] = useState<string | null>(null);

  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);
  const [selectedTrace, setSelectedTrace] = useState<RunTrace | null>(null);
  const [traceLoading, setTraceLoading] = useState(false);
  const [traceError, setTraceError] = useState<string | null>(null);

  const [backendOnline, setBackendOnline] = useState(true);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingRef = useRef(false);

  const loadProfiles = useCallback(async () => {
    setProfilesLoading(true);
    setProfilesError(null);
    try {
      const data = await fetchProfiles();
      setProfiles(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setProfilesError(message);
    } finally {
      setProfilesLoading(false);
    }
  }, []);

  const loadTraces = useCallback(async () => {
    if (!selectedProfileId) return;
    if (pendingRef.current) return;
    pendingRef.current = true;
    setTracesLoading(true);
    setTracesError(null);
    try {
      const data = await fetchTraces(selectedProfileId);
      setTraces(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setTracesError(message);
    } finally {
      setTracesLoading(false);
      pendingRef.current = false;
    }
  }, [selectedProfileId]);

  const loadTraceDetail = useCallback(async () => {
    if (!selectedTraceId) return;
    setTraceLoading(true);
    setTraceError(null);
    try {
      const data = await fetchTrace(selectedTraceId);
      setSelectedTrace(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setTraceError(message);
    } finally {
      setTraceLoading(false);
    }
  }, [selectedTraceId]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  useEffect(() => {
    if (selectedProfileId) {
      localStorage.setItem("aiflows-profile", selectedProfileId);
      loadTraces();

      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => {
        loadTraces();
      }, 2000);
    } else {
      localStorage.removeItem("aiflows-profile");
      setTraces([]);
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [selectedProfileId, loadTraces]);

  useEffect(() => {
    loadTraceDetail();
  }, [selectedTraceId, loadTraceDetail]);

  useEffect(() => {
    const check = async () => {
      const ok = await fetchHealth().catch(() => false);
      setBackendOnline(ok);
    };
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectProfile = (profileId: string) => {
    setSelectedProfileId(profileId);
    setSelectedTraceId(null);
    setSelectedTrace(null);
  };

  const handleSelectTrace = (traceId: string) => {
    setSelectedTraceId(traceId);
  };

  const handleRetryProfiles = () => loadProfiles();
  const handleRetryTraces = () => loadTraces();
  const handleRetryTrace = () => loadTraceDetail();

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">AIFlows</h1>
        <ProfileSelector
          profiles={profiles}
          selectedProfileId={selectedProfileId}
          onSelect={handleSelectProfile}
          loading={profilesLoading}
          error={profilesError}
          onRetry={handleRetryProfiles}
        />
        <StatusIndicator
          selectedProfileId={selectedProfileId}
          backendOnline={backendOnline}
        />
      </header>

      <div className="app-body">
        <aside className="app-sidebar">
          <TraceSidebar
            traces={traces}
            selectedTraceId={selectedTraceId}
            onSelect={handleSelectTrace}
            loading={tracesLoading}
            error={tracesError}
            onRetry={handleRetryTraces}
          />
        </aside>

        <main className="app-main">
          <MainContent
            selectedTrace={selectedTrace}
            selectedTraceId={selectedTraceId}
            loading={traceLoading}
            error={traceError}
            onRetry={handleRetryTrace}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
