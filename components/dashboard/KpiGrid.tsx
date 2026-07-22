import { percent, type MetricChanges, type Metrics } from "@/lib/report";

const COLORS = { ink: "#14304a", green: "#4e7a5a", amber: "#c9962e", red: "#b0453a" };

function deltaText(value: number | null) {
  if (value === null) return "No prior report";
  if (value === 0) return "No change";
  return `${value > 0 ? "+" : ""}${value.toLocaleString()} vs previous report`;
}

export function KpiGrid({
  metrics,
  changes,
  enrollTarget,
  certTarget
}: {
  metrics: Metrics;
  changes: MetricChanges;
  enrollTarget: number;
  certTarget: number;
}) {
  const tiles = [
    { label: "Certificate Completers", value: metrics.cert, suffix: `/ ${certTarget.toLocaleString()} target`, note: deltaText(changes.cert), ratio: metrics.cert / certTarget, color: COLORS.amber, gate: true },
    { label: "Enrolled", value: metrics.enrolled, suffix: `/ ${enrollTarget.toLocaleString()} target`, note: `${percent(metrics.enrolled, enrollTarget)}% of target`, ratio: metrics.enrolled / enrollTarget, color: COLORS.ink },
    { label: "Passed at Least One", value: metrics.passed1, suffix: `/ ${metrics.enrolled.toLocaleString()}`, note: deltaText(changes.passed1), ratio: metrics.passed1 / metrics.enrolled, color: COLORS.green },
    { label: "No Course Activity", value: metrics.noActivity, suffix: `/ ${metrics.enrolled.toLocaleString()}`, note: deltaText(changes.noActivity), ratio: metrics.noActivity / metrics.enrolled, color: COLORS.red }
  ];

  return <section className="scoreGrid">
    {tiles.map(tile => <article className={`score ${tile.gate ? "gate" : ""}`} key={tile.label}>
      <div className="label">{tile.label}</div>
      <div className="value">{tile.value.toLocaleString()} <small>{tile.suffix}</small></div>
      <div className="note">{tile.note}</div>
      <div className="bar"><span style={{ width: `${Math.max(1, Math.min(100, tile.ratio * 100))}%`, background: tile.color }} /></div>
    </article>)}
  </section>;
}

