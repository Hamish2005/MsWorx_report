export const FOUNDATION = [
  "01 | The Vincentian Encounter",
  "02 | Recognizing Crisis & Responding with Care",
  "03 | Safety Across Service Settings",
  "04 | Mandatory Reporting",
  "05 | Understanding the Housing Crisis and SVdP's Role in Prevention",
  "06 | The Diversion Conversation",
  "07 | The Prevention Toolkit"
] as const;

export const GROUP_FIELDS = ["Diocese", "Region", "Council", "Conference"] as const;

export type GroupField = typeof GROUP_FIELDS[number];
export type ReportRow = Record<string, string>;
export type Metrics = {
  enrolled: number;
  started: number;
  passed1: number;
  cert: number;
  noActivity: number;
};
export type CourseMetric = {
  name: string;
  passed: number;
  progress: number;
  notStarted: number;
};
export type GroupMetric = Metrics & { name: string; courses: CourseMetric[] };
export type Snapshot = {
  metrics: Metrics;
  courses: CourseMetric[];
  groups: Record<GroupField, GroupMetric[]>;
};
export type MetricChanges = Record<keyof Metrics, number | null>;
export type DashboardReport = {
  current: Snapshot;
  previous: Snapshot | null;
  changes: MetricChanges;
  source: {
    dataAsOf: string;
    reportCreatedAt: string;
    usersReportId: string;
    coursesReportId: string;
    previousReportCreatedAt: string | null;
    stale: boolean;
    pairingWarning: string | null;
    rowCount: number;
    previousRowCount: number | null;
  };
};

const clean = (value: unknown) => String(value ?? "").trim();
const norm = (value: unknown) => clean(value).replace(/\s+/g, " ").toLowerCase();

export const percent = (n: number, d: number) => d ? Math.round((n / d) * 100) : 0;
export const findHeader = (row: ReportRow, wanted: string) =>
  Object.keys(row).find(key => norm(key) === norm(wanted)) ||
  Object.keys(row).find(key => norm(key).startsWith(norm(wanted))) ||
  "";

const isStarted = (value: unknown) => ["passed", "in-progress", "failed"].includes(norm(value));

export function aggregateRows(rows: ReportRow[]): Snapshot {
  if (!rows.length) throw new Error("The users report did not contain any data rows.");

  const courseKeys = FOUNDATION.map((name, index) =>
    Object.keys(rows[0]).find(key => norm(key) === norm(name)) ||
    Object.keys(rows[0]).find(key => norm(key).startsWith(`${String(index + 1).padStart(2, "0")} |`))
  ).filter((key): key is string => Boolean(key));

  if (courseKeys.length !== FOUNDATION.length) {
    throw new Error(`Only ${courseKeys.length} of ${FOUNDATION.length} Foundation course columns were found.`);
  }

  const enrolled = rows.filter(row => courseKeys.some(key => clean(row[key]) && norm(row[key]) !== "not-enrolled"));
  const stats = (subset: ReportRow[]): Metrics => {
    const started = subset.filter(row => courseKeys.some(key => isStarted(row[key]))).length;
    return {
      enrolled: subset.length,
      started,
      passed1: subset.filter(row => courseKeys.some(key => norm(row[key]) === "passed")).length,
      cert: subset.filter(row => courseKeys.every(key => norm(row[key]) === "passed")).length,
      noActivity: subset.length - started
    };
  };
  const courseStats = (subset: ReportRow[]): CourseMetric[] => courseKeys.map((key, index) => ({
    name: FOUNDATION[index],
    passed: subset.filter(row => norm(row[key]) === "passed").length,
    progress: subset.filter(row => norm(row[key]) === "in-progress").length,
    notStarted: subset.filter(row => !isStarted(row[key])).length
  }));

  const groups = Object.fromEntries(GROUP_FIELDS.map(field => {
    const key = findHeader(rows[0], field);
    const grouped = new Map<string, ReportRow[]>();
    enrolled.forEach(row => {
      const name = clean(row[key]) || "Not reported";
      grouped.set(name, [...(grouped.get(name) || []), row]);
    });
    const values = [...grouped].map(([name, subset]) => ({ name, ...stats(subset), courses: courseStats(subset) }))
      .sort((a, b) => b.enrolled - a.enrolled || a.name.localeCompare(b.name));
    return [field, values];
  })) as Record<GroupField, GroupMetric[]>;

  return {
    metrics: stats(enrolled),
    courses: courseStats(enrolled),
    groups
  };
}

export const PREVIEW: DashboardReport = {
  current: {
    metrics: { enrolled: 589, started: 241, passed1: 144, cert: 30, noActivity: 348 },
    courses: [
      { name: FOUNDATION[0], passed: 138, progress: 102, notStarted: 349 },
      { name: FOUNDATION[1], passed: 91, progress: 35, notStarted: 463 },
      { name: FOUNDATION[2], passed: 65, progress: 21, notStarted: 503 },
      { name: FOUNDATION[3], passed: 53, progress: 12, notStarted: 524 },
      { name: FOUNDATION[4], passed: 46, progress: 8, notStarted: 535 },
      { name: FOUNDATION[5], passed: 35, progress: 9, notStarted: 545 },
      { name: FOUNDATION[6], passed: 32, progress: 5, notStarted: 552 }
    ],
    groups: { Diocese: [], Region: [], Council: [], Conference: [] }
  },
  previous: null,
  changes: { enrolled: null, started: null, passed1: null, cert: null, noActivity: null },
  source: {
    dataAsOf: "2026-07-15T00:00:00-04:00",
    reportCreatedAt: "2026-07-15T00:00:00-04:00",
    usersReportId: "preview",
    coursesReportId: "preview",
    previousReportCreatedAt: null,
    stale: false,
    pairingWarning: null,
    rowCount: 589,
    previousRowCount: null
  }
};
