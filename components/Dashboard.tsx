"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Title, Tooltip, type Chart
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { ExecutiveFacts } from "./dashboard/ExecutiveFacts";
import { GroupExplorer } from "./dashboard/GroupExplorer";
import { KpiGrid } from "./dashboard/KpiGrid";
import { LoginPanel } from "./dashboard/LoginPanel";
import { PerformanceTable } from "./dashboard/PerformanceTable";
import { ReportHeader } from "./dashboard/ReportHeader";
import { SectionTitle } from "./dashboard/SectionTitle";
import { Watchlist } from "./dashboard/Watchlist";
import { percent, PREVIEW, type DashboardReport, type GroupField } from "@/lib/report";

const valueLabelsPlugin = {
  id: "valueLabels",
  afterDatasetsDraw(chart: Chart) {
    const { ctx } = chart;
    ctx.save();
    ctx.font = "700 11px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      if (meta.hidden) return;
      meta.data.forEach((element, index) => {
        const value = Number((dataset.data as number[])[index] || 0);
        if (!value) return;
        const position = element.tooltipPosition(true);
        if (position.x === null || position.y === null) return;
        const isDoughnut = (chart.config as { type?: string }).type === "doughnut";
        const label = value.toLocaleString();
        const width = ctx.measureText(label).width + 10;
        const height = 18;
        const chartArea = chart.chartArea;
        const x = Math.min(Math.max(position.x, chartArea.left + width / 2), chartArea.right - width / 2);
        const y = Math.min(Math.max(position.y, chartArea.top + height / 2), chartArea.bottom - height / 2);
        ctx.fillStyle = isDoughnut || datasetIndex === 2 ? "rgba(255,255,255,.86)" : "rgba(20,48,74,.82)";
        ctx.fillRect(x - width / 2, y - height / 2, width, height);
        ctx.fillStyle = isDoughnut || datasetIndex === 2 ? "#14304a" : "#ffffff";
        ctx.fillText(label, x, y);
      });
    });
    ctx.restore();
  }
};

ChartJS.register(BarElement, CategoryScale, LinearScale, ArcElement, Tooltip, Legend, Title, valueLabelsPlugin);

const COLORS = { ink: "#14304a", blue: "#3e6e96", green: "#4e7a5a", amber: "#c9962e", red: "#b0453a" };

const formatDate = (value: string) => new Date(value).toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric"
});

const formatDateTime = (value: string) => new Date(value).toLocaleString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit"
});

export default function Dashboard() {
  const [report, setReport] = useState<DashboardReport>(PREVIEW);
  const [groupField, setGroupField] = useState<GroupField>("Diocese");
  const [enrollTarget, setEnrollTarget] = useState(1000);
  const [certTarget, setCertTarget] = useState(600);
  const [message, setMessage] = useState("Showing preview data until the latest SkyPrep report loads.");
  const [messageGood, setMessageGood] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [authenticated, setAuthenticated] = useState(true);

  const metrics = report.current.metrics;
  const courses = report.current.courses;
  const groups = useMemo(() => report.current.groups[groupField] || [], [report, groupField]);
  const risks = [metrics.noActivity, metrics.started - metrics.passed1, metrics.passed1 - metrics.cert];

  async function refresh(force = false) {
    setLoading(true);
    setMessage(force ? "Updating with the newest saved SkyPrep reports..." : "Loading the latest saved SkyPrep reports...");
    try {
      const response = await fetch(`/api/skyprep/refresh${force ? "?force=true" : ""}`, { method: "POST" });
      const payload = await response.json();
      if (response.status === 401) {
        setAuthRequired(true);
        setAuthenticated(false);
        setMessage("Enter the dashboard access code to load live report data.");
        return;
      }
      if (!response.ok) throw new Error(payload.error || `Server returned ${response.status}`);
      setReport(payload);
      setMessage(`Report loaded: ${payload.source.rowCount.toLocaleString()} learners included.`);
      setMessageGood(true);
    } catch (error) {
      setMessage(`Report update failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      setMessageGood(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetch("/api/auth").then(response => response.json()).then(data => {
      setAuthRequired(data.required);
      setAuthenticated(data.authenticated);
      if (!data.required || data.authenticated) refresh(false);
      else setMessage("Enter the dashboard access code to load live report data.");
    }).catch(() => refresh(false));
  }, []);

  const courseOnePassed = courses[0]?.passed || 0;
  const courseSevenPassed = courses[6]?.passed || 0;
  const courseDrops = courses.slice(0, -1).map((course, index) => ({
    from: index + 1,
    to: index + 2,
    drop: Math.max(0, course.passed - (courses[index + 1]?.passed || 0))
  }));
  const largestDrop = courseDrops.sort((a, b) => b.drop - a.drop)[0] || { from: 1, to: 2, drop: 0 };

  const milestoneData = {
    labels: ["Passed Course 01", "Passed Course 04", "Passed Course 07", "Certificate Complete"],
    datasets: [{
      data: [courses[0]?.passed || 0, courses[3]?.passed || 0, courses[6]?.passed || 0, metrics.cert],
      backgroundColor: [COLORS.blue, "#477a85", COLORS.green, COLORS.amber],
      borderRadius: 3
    }]
  };
  const distributionData = {
    labels: ["Certificate complete", "Partial completers", "Active, no pass yet", "No course activity"],
    datasets: [{
      data: [metrics.cert, metrics.passed1 - metrics.cert, metrics.started - metrics.passed1, metrics.noActivity],
      backgroundColor: [COLORS.amber, COLORS.green, COLORS.blue, "#d4dce2"],
      borderColor: "#fff",
      borderWidth: 2
    }]
  };
  const courseData = {
    labels: courses.map(course => course.name.replace(/^\d+\s*\|\s*/, "")),
    datasets: [
      { label: "Passed", data: courses.map(course => course.passed), backgroundColor: COLORS.green, borderRadius: 2 },
      { label: "In progress", data: courses.map(course => course.progress), backgroundColor: COLORS.amber, borderRadius: 2 },
      { label: "Not started", data: courses.map(course => course.notStarted), backgroundColor: "#d4dce2", borderRadius: 2 }
    ]
  };
  const riskData = {
    labels: ["No course activity", "Active, no pass yet", "Partial completers"],
    datasets: [{ data: risks, backgroundColor: [COLORS.red, COLORS.amber, COLORS.green], borderRadius: 3 }]
  };
  const horizontalOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y" as const,
    plugins: { legend: { display: false } },
    scales: { x: { beginAtZero: true, grid: { color: "#e8ecef" } }, y: { grid: { display: false } } }
  };
  const stackedOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y" as const,
    plugins: { legend: { position: "bottom" as const } },
    scales: { x: { stacked: true, grid: { color: "#e8ecef" } }, y: { stacked: true, grid: { display: false } } }
  };

  const liveBlocked = authRequired && !authenticated;

  return <>
    <ReportHeader
      loading={loading}
      message={message}
      messageGood={messageGood}
      onRefresh={() => refresh(true)}
      dataAsOf={formatDate(report.source.dataAsOf)}
      reportCreatedAt={formatDateTime(report.source.reportCreatedAt)}
      stale={report.source.stale}
      pairingWarning={report.source.pairingWarning}
    />

    <main className="wrap" aria-busy={loading}>
      {liveBlocked && <LoginPanel onAuthenticated={() => { setAuthenticated(true); refresh(false); }} />}

      <div className="controls">
        <label className="control">View stats by<select suppressHydrationWarning value={groupField} onChange={event => setGroupField(event.target.value as GroupField)}><option>Diocese</option><option>Region</option><option>Council</option><option>Conference</option></select></label>
        <label className="control">Enrollment target<input suppressHydrationWarning type="number" min="1" value={enrollTarget} onChange={event => setEnrollTarget(Number(event.target.value) || 1)} /></label>
        <label className="control">Certificate target<input suppressHydrationWarning type="number" min="1" value={certTarget} onChange={event => setCertTarget(Number(event.target.value) || 1)} /></label>
        <div className="controlSpacer" />
        <div className="status">{report.source.usersReportId === "preview" ? "Preview data" : "Live data"} - {metrics.enrolled.toLocaleString()} learners</div>
      </div>

      <KpiGrid metrics={metrics} changes={report.changes} enrollTarget={enrollTarget} certTarget={certTarget} />

      <SectionTitle title="Executive Facts">Plain-language findings generated from the current report data.</SectionTitle>
      <ExecutiveFacts
        metrics={metrics}
        changes={report.changes}
        courseOnePassed={courseOnePassed}
        courseSevenPassed={courseSevenPassed}
        largestDrop={largestDrop}
      />

      <SectionTitle title="Learning Progress">Course milestones and mutually exclusive learner outcome groups.</SectionTitle>
      <div className="columns">
        <div className="panel chartBox" role="img" aria-label="Bar chart showing key course completion milestones."><Bar data={milestoneData} options={horizontalOptions} /></div>
        <div className="panel chartBox" role="img" aria-label="Doughnut chart showing learner outcome distribution."><Doughnut data={distributionData} options={{ responsive: true, maintainAspectRatio: false, cutout: "58%", plugins: { legend: { position: "bottom" as const } } }} /></div>
      </div>

      <SectionTitle title="Course Pipeline">Status across the seven-course Foundation Track. Attrition makes sequence bottlenecks visible.</SectionTitle>
      <div className="panel courseChart" role="img" aria-label="Stacked bar chart showing passed, in progress, and not started by course."><Bar data={courseData} options={stackedOptions} /></div>

      <SectionTitle title={`${groupField} Performance Explorer`}>Compare how every {groupField} is doing across enrollment, progress, certificates, and course completion.</SectionTitle>
      <GroupExplorer groupField={groupField} groups={groups} />

      <SectionTitle title={`Performance by ${groupField}`}>Switch among the SkyPrep Region, Diocese, Council, and Conference profile fields.</SectionTitle>
      <PerformanceTable groupField={groupField} groups={groups} />

      <SectionTitle title="Early-Intervention Watchlist">Counts useful for outreach planning. No learner names or email addresses are displayed.</SectionTitle>
      <Watchlist risks={risks} largestDrop={largestDrop} riskData={riskData} />

      <footer><b>Reading Notes.</b> Enrolled means a learner is enrolled in the seven-course Foundation Track. Started means at least one course is In-progress, Passed, or Failed. "No course activity" means every Foundation course remains Not-started. Certificate completers passed all seven courses. Personally identifiable details are excluded from this dashboard.</footer>
    </main>
  </>;
}
