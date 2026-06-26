interface Props {
  selectedProfileId: string | null;
  backendOnline: boolean;
}

function StatusIndicator({ selectedProfileId, backendOnline }: Props) {
  return (
    <div className="status-indicator">
      {!backendOnline && (
        <span className="status-badge status-error">Backend offline</span>
      )}
      {backendOnline && !selectedProfileId && (
        <span className="status-badge status-idle">Select a profile</span>
      )}
      {backendOnline && selectedProfileId && (
        <span className="status-badge status-watching">
          Watching: {selectedProfileId}
        </span>
      )}
    </div>
  );
}

export default StatusIndicator;
