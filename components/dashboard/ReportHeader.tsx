type Props = {
  loading: boolean;
  message: string;
  messageGood: boolean;
  dataAsOf: string;
  reportCreatedAt: string;
  stale: boolean;
  pairingWarning: string | null;
  onRefresh: () => void;
};

export function ReportHeader({
  loading,
  message,
  messageGood,
  dataAsOf,
  reportCreatedAt,
  stale,
  pairingWarning,
  onRefresh
}: Props) {
  return <header>
    <div className="wrap headerWrap">
      <div className="mast">
        <div>
          <h1>Housing Stability Institute Performance Report</h1>
          <div className="sub">Learner progress, course completion, and certificate outcomes for board and investor review</div>
        </div>
        <div className="asOf">Results through <b>{dataAsOf}</b><br />Source report created <b>{reportCreatedAt}</b></div>
      </div>
      {(stale || pairingWarning) && <div className="sourceWarning" role="status">
        {stale && <span>The source report is more than 48 hours old.</span>}
        {pairingWarning && <span>{pairingWarning}</span>}
      </div>}
      <div className="toolbar">
        <button suppressHydrationWarning className="button primary" disabled={loading} onClick={onRefresh}>{loading ? "Updating..." : "Update Report"}</button>
        <button suppressHydrationWarning className="button light" onClick={() => window.print()}>Print / Save PDF</button>
        <span className={`fileState ${messageGood ? "good" : ""}`} role="status" aria-live="polite">{message}</span>
      </div>
    </div>
  </header>;
}
