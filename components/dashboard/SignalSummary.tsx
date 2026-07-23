import { percent, type GroupField, type GroupMetric, type Metrics } from "@/lib/report";

const signals = [
  { key: "cert", label: "Certificates", className: "positive" },
  { key: "passed1", label: "Passed 1+", className: "positive" },
  { key: "started", label: "Started", className: "neutral" },
  { key: "noActivity", label: "No activity", className: "risk" }
] as const;

export function SignalSummary({
  metrics,
  groups,
  groupField,
  context
}: {
  metrics: Metrics;
  groups: GroupMetric[];
  groupField: GroupField;
  context: string;
}) {
  const topGroup = groups[0];
  const watchGroup = [...groups].sort((a, b) => b.noActivity - a.noActivity)[0];
  const max = Math.max(metrics.enrolled, 1);

  return <section className="panel signalPanel">
    <div className="signalCopy">
      <div className="eyebrow">Running summary</div>
      <strong>{groupField}{context ? context : " overall"} engagement signals</strong>
      <p>This summarizes the current report view using learner activity and completion data. Open-text feedback is not included in the current SkyPrep reports.</p>
      <ul>
        <li>{percent(metrics.started, metrics.enrolled)}% of enrolled learners have started at least one course.</li>
        <li>{percent(metrics.cert, metrics.enrolled)}% have completed all seven courses.</li>
        {topGroup && <li>Largest visible group: {topGroup.name} with {topGroup.enrolled.toLocaleString()} enrolled.</li>}
        {watchGroup && <li>Highest no-activity count: {watchGroup.name} with {watchGroup.noActivity.toLocaleString()} learners.</li>}
      </ul>
    </div>
    <div className="signalCloud" aria-label="Engagement signal graphic">
      {signals.map(signal => {
        const value = metrics[signal.key];
        const scale = 1 + Math.min(1.7, value / max * 2.2);
        return <span className={signal.className} style={{ fontSize: `${scale}rem` }} key={signal.key}>
          {signal.label} <b>{value.toLocaleString()}</b>
        </span>;
      })}
    </div>
  </section>;
}

