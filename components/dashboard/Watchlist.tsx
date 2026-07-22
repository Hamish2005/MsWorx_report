import { Bar } from "react-chartjs-2";

type Drop = { from: number; to: number; drop: number };

export function Watchlist({
  risks,
  largestDrop,
  riskData
}: {
  risks: number[];
  largestDrop: Drop;
  riskData: {
    labels: string[];
    datasets: Array<{ data: number[]; backgroundColor: string[]; borderRadius: number }>;
  };
}) {
  return <div className="columns">
    <div className="panel riskChart" role="img" aria-label="Bar chart showing the main outreach watchlist groups.">
      <Bar data={riskData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: "#e8ecef" } }, x: { grid: { display: false } } } }} />
    </div>
    <div className="panel actions">
      <strong>Suggested Report Notes</strong>
      <ul>
        <li><b>{risks[0]} learners show no course activity</b> - prioritize activation outreach.</li>
        <li><b>{risks[1]} started but have not passed</b> - review Course 01 progress and support needs.</li>
        <li><b>{risks[2]} passed 1-6 courses</b> - focus completion nudges on this certificate pipeline.</li>
        <li><b>The largest sequence loss is {largestDrop.drop} learners between Courses {String(largestDrop.from).padStart(2, "0")} and {String(largestDrop.to).padStart(2, "0")}</b> - review that transition for friction.</li>
      </ul>
    </div>
  </div>;
}

