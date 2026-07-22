import assert from "node:assert/strict";
import test from "node:test";
import { aggregateRows, FOUNDATION } from "../lib/report";
import { isReportStale, metricChanges, reportPairingWarning } from "../lib/dashboard-service";
import { parseSkyPrepCsv, selectSavedReportPair, type SavedReport } from "../lib/skyprep";

function row(overrides: Record<string, string>) {
  return Object.fromEntries([
    ["Name", "Private Learner"],
    ["Email", "learner@example.org"],
    ["Diocese", "North"],
    ["Region", "East"],
    ["Council", "Council A"],
    ["Conference", "Conference A"],
    ...FOUNDATION.map(course => [course, "Not-started"] as const),
    ...Object.entries(overrides)
  ]);
}

test("aggregateRows returns report-safe counts without learner records", () => {
  const snapshot = aggregateRows([
    row({ [FOUNDATION[0]]: "Passed" }),
    row({ Diocese: "South", [FOUNDATION[0]]: "Passed", [FOUNDATION[1]]: "In-progress" }),
    row(Object.fromEntries(FOUNDATION.map(course => [course, "Passed"]))),
    row({})
  ]);

  assert.deepEqual(snapshot.metrics, {
    enrolled: 4,
    started: 3,
    passed1: 3,
    cert: 1,
    noActivity: 1
  });
  assert.equal(snapshot.courses[0].passed, 3);
  assert.equal(snapshot.groups.Diocese[0].name, "North");
  assert.equal(snapshot.groups.Diocese[0].enrolled, 3);
  assert.doesNotMatch(JSON.stringify(snapshot), /learner@example\.org|Private Learner/);
});

test("parseSkyPrepCsv handles quoted fields and BOM headers", () => {
  const rows = parseSkyPrepCsv('\uFEFFName,Notes\n"Smith, Jane","Line one\nLine two"\n');
  assert.equal(rows[0].Name, "Smith, Jane");
  assert.equal(rows[0].Notes, "Line one\nLine two");
});

test("selectSavedReportPair selects the newest matching saved reports", () => {
  const reports: SavedReport[] = [
    { saved_advanced_report_id: 1, name: "HSI Courses - All in (Users)", updated_at: "2026-07-15T10:00:00Z", saved_report_type: "saved_report_with_data" },
    { saved_advanced_report_id: 2, name: "HSI Courses - All in (Users)", updated_at: "2026-07-16T10:00:00Z", saved_report_type: "saved_report_with_data" },
    { saved_advanced_report_id: 3, name: "HSI Courses - All in (Courses)", updated_at: "2026-07-15T10:00:00Z", saved_report_type: "saved_report_with_data" },
    { saved_advanced_report_id: 4, name: "HSI Courses - All in (Courses)", updated_at: "2026-07-16T10:00:00Z", saved_report_type: "saved_report_with_data" },
    { saved_advanced_report_id: 5, name: "HSI Courses - All in (Users)", updated_at: "2026-07-17T10:00:00Z", saved_report_type: "saved_report" }
  ];

  assert.deepEqual(selectSavedReportPair(reports, 0), {
    usersReportId: "2",
    coursesReportId: "4",
    usersReportCreatedAt: "2026-07-16T10:00:00Z",
    coursesReportCreatedAt: "2026-07-16T10:00:00Z"
  });
  assert.deepEqual(selectSavedReportPair(reports, 1), {
    usersReportId: "1",
    coursesReportId: "3",
    usersReportCreatedAt: "2026-07-15T10:00:00Z",
    coursesReportCreatedAt: "2026-07-15T10:00:00Z"
  });
});

test("dashboard service helpers calculate changes and source warnings", () => {
  assert.deepEqual(
    metricChanges(
      { enrolled: 10, started: 7, passed1: 4, cert: 2, noActivity: 3 },
      { enrolled: 8, started: 5, passed1: 3, cert: 1, noActivity: 3 }
    ),
    { enrolled: 2, started: 2, passed1: 1, cert: 1, noActivity: 0 }
  );
  assert.equal(
    reportPairingWarning("2026-07-16T08:00:00Z", "2026-07-16T20:30:00Z")?.includes("six hours"),
    true
  );
  assert.equal(isReportStale("2026-07-14T00:00:00Z", new Date("2026-07-17T01:00:00Z")), true);
});

