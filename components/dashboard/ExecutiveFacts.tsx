import { percent, type MetricChanges, type Metrics } from "@/lib/report";

type Drop = { from: number; to: number; drop: number };

export function ExecutiveFacts({
  metrics,
  changes,
  courseOnePassed,
  courseSevenPassed,
  largestDrop
}: {
  metrics: Metrics;
  changes: MetricChanges;
  courseOnePassed: number;
  courseSevenPassed: number;
  largestDrop: Drop;
}) {
  const certificateChange = changes.cert === null
    ? "No prior report is available for comparison."
    : `${changes.cert > 0 ? "+" : ""}${changes.cert} certificates compared with the previous matching report.`;

  return <section className="facts">
    <article className="fact positive">
      <div className="eyebrow">Demonstrated progress</div>
      <strong>{metrics.passed1} passed at least one course</strong>
      <p>{percent(metrics.passed1, metrics.enrolled)}% of enrolled learners have achieved a passing result.</p>
    </article>
    <article className="fact risk">
      <div className="eyebrow">Largest sequence drop</div>
      <strong>Course {String(largestDrop.from).padStart(2, "0")} to {String(largestDrop.to).padStart(2, "0")}: {largestDrop.drop} learners</strong>
      <p>This is the largest decline in passed counts between adjacent courses.</p>
    </article>
    <article className="fact">
      <div className="eyebrow">Certificate momentum</div>
      <strong>{percent(courseSevenPassed, courseOnePassed)}% reached a Course 07 pass</strong>
      <p>{certificateChange}</p>
    </article>
  </section>;
}

