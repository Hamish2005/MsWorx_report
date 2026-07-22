import { aggregateRows, type DashboardReport, type Metrics, type Snapshot } from "./report";
import { getSavedReportSnapshot } from "./skyprep";

const CACHE_TTL_MS = 15 * 60 * 1000;
const STALE_AFTER_MS = 48 * 60 * 60 * 1000;
const PAIRING_WARNING_MS = 6 * 60 * 60 * 1000;

type RawSnapshot = Awaited<ReturnType<typeof getSavedReportSnapshot>>;

let cached: { report: DashboardReport; expiresAt: number } | null = null;
let pending: Promise<DashboardReport> | null = null;

const newestIso = (...values: Array<string | undefined>) => {
  const dates = values
    .filter(Boolean)
    .map(value => new Date(String(value)))
    .filter(date => !Number.isNaN(date.valueOf()))
    .sort((a, b) => b.valueOf() - a.valueOf());
  return dates[0]?.toISOString() || new Date().toISOString();
};

export function metricChanges(current: Metrics, previous: Metrics | null) {
  return {
    enrolled: previous ? current.enrolled - previous.enrolled : null,
    started: previous ? current.started - previous.started : null,
    passed1: previous ? current.passed1 - previous.passed1 : null,
    cert: previous ? current.cert - previous.cert : null,
    noActivity: previous ? current.noActivity - previous.noActivity : null
  };
}

export function reportPairingWarning(usersReportCreatedAt: string, coursesReportCreatedAt: string) {
  const usersDate = new Date(usersReportCreatedAt);
  const coursesDate = new Date(coursesReportCreatedAt);
  if (Number.isNaN(usersDate.valueOf()) || Number.isNaN(coursesDate.valueOf())) return null;
  const diff = Math.abs(usersDate.valueOf() - coursesDate.valueOf());
  if (diff <= PAIRING_WARNING_MS) return null;
  return "The user and course reports were created more than six hours apart. Review the source reports before sharing externally.";
}

export function isReportStale(reportCreatedAt: string, now = new Date()) {
  const created = new Date(reportCreatedAt);
  return Number.isNaN(created.valueOf()) ? true : now.valueOf() - created.valueOf() > STALE_AFTER_MS;
}

function buildReport(currentRaw: NonNullable<RawSnapshot>, previousRaw: RawSnapshot): DashboardReport {
  const current = aggregateRows(currentRaw.rows);
  const previous: Snapshot | null = previousRaw ? aggregateRows(previousRaw.rows) : null;
  const reportCreatedAt = newestIso(
    currentRaw.meta.usersReportCreatedAt,
    currentRaw.meta.coursesReportCreatedAt,
    currentRaw.meta.dataAsOf
  );
  const previousReportCreatedAt = previousRaw ? newestIso(
    previousRaw.meta.usersReportCreatedAt,
    previousRaw.meta.coursesReportCreatedAt,
    previousRaw.meta.dataAsOf
  ) : null;

  return {
    current,
    previous,
    changes: metricChanges(current.metrics, previous?.metrics || null),
    source: {
      dataAsOf: currentRaw.meta.dataAsOf,
      reportCreatedAt,
      usersReportId: currentRaw.meta.usersReportId,
      coursesReportId: currentRaw.meta.coursesReportId,
      previousReportCreatedAt,
      stale: isReportStale(reportCreatedAt),
      pairingWarning: reportPairingWarning(
        currentRaw.meta.usersReportCreatedAt,
        currentRaw.meta.coursesReportCreatedAt
      ),
      rowCount: currentRaw.meta.rowsReceived,
      previousRowCount: previousRaw?.meta.rowsReceived || null
    }
  };
}

export async function getDashboardReport(force = false) {
  if (!force && cached && cached.expiresAt > Date.now()) return cached.report;
  if (!force && pending) return pending;

  pending = Promise.all([
    getSavedReportSnapshot(0),
    getSavedReportSnapshot(1)
  ]).then(([currentRaw, previousRaw]) => {
    if (!currentRaw) throw new Error("No matching HSI saved SkyPrep report was found.");
    const report = buildReport(currentRaw, previousRaw);
    cached = { report, expiresAt: Date.now() + CACHE_TTL_MS };
    return report;
  }).finally(() => {
    pending = null;
  });

  return pending;
}

