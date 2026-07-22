import { FOUNDATION, type ReportRow } from "./report";

const API_ROOT = "https://api.skyprep.io/admin/api";
const DEFAULT_USERS_REPORT_ID = "576212";
const DEFAULT_COURSES_REPORT_ID = "576211";
const USERS_REPORT_NAME = "HSI Courses - All in (Users)";
const COURSES_REPORT_NAME = "HSI Courses - All in (Courses)";

export type SavedReport = {
  id?: number;
  saved_advanced_report_id?: number;
  name?: string;
  created_at?: string;
  updated_at?: string;
  saved_report_type?: string;
};

function credentials() {
  const apiKey = process.env.SKYPREP_API_KEY;
  const accountKey = process.env.SKYPREP_ACCOUNT_KEY || process.env.SKYPREP_ACCT_KEY;
  if (!apiKey || !accountKey) {
    throw new Error("SkyPrep is not configured. Add the API and account keys to the deployment environment.");
  }
  return { apiKey, accountKey };
}

export function parseSkyPrepCsv(text: string): ReportRow[] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") { record.push(field); field = ""; }
    else if (char === "\n") { record.push(field.replace(/\r$/, "")); records.push(record); record = []; field = ""; }
    else field += char;
  }
  if (field || record.length) { record.push(field.replace(/\r$/, "")); records.push(record); }
  const columns = (records.shift() || []).map((value, index) =>
    (index === 0 ? value.replace(/^\uFEFF/, "") : value).trim()
  );
  if (!columns.length) throw new Error("The saved SkyPrep report was empty.");
  return records.filter(row => row.some(value => value.trim())).map(row =>
    Object.fromEntries(columns.map((column, index) => [column, row[index] ?? ""]))
  );
}

async function downloadSavedReport(id: string) {
  if (!/^\d+$/.test(id)) throw new Error(`Invalid SkyPrep saved report ID: ${id}`);
  const { apiKey, accountKey } = credentials();
  const response = await fetch(`${API_ROOT}/get_saved_advanced_report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "text/csv",
      "X-SkyPrep-API-Key": apiKey,
      "X-SkyPrep-Acct-Key": accountKey
    },
    body: new URLSearchParams({ saved_advanced_report_id: id, format: "csv" }),
    cache: "no-store"
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`SkyPrep report ${id} returned ${response.status}: ${text.slice(0, 250)}`);
  if (/^\s*<!doctype html/i.test(text)) {
    throw new Error(`SkyPrep report ${id} returned the website instead of report data. Check the API key and account key.`);
  }
  return parseSkyPrepCsv(text);
}

export function selectSavedReportPair(reports: SavedReport[], snapshotIndex = 0) {
  function selected(name: string) {
    return reports
      .filter(report =>
        report.name?.trim().toLowerCase() === name.toLowerCase() &&
        report.saved_report_type === "saved_report_with_data"
      )
      .sort((a, b) =>
        Date.parse(b.updated_at || b.created_at || "") -
        Date.parse(a.updated_at || a.created_at || "")
      )[snapshotIndex];
  }

  const users = selected(USERS_REPORT_NAME);
  const courses = selected(COURSES_REPORT_NAME);
  if (!users || !courses) return null;
  return {
    usersReportId: String(users.saved_advanced_report_id || users.id),
    coursesReportId: String(courses.saved_advanced_report_id || courses.id),
    usersReportCreatedAt: users.updated_at || users.created_at || "",
    coursesReportCreatedAt: courses.updated_at || courses.created_at || ""
  };
}

async function discoverReportIds(snapshotIndex = 0) {
  const { apiKey, accountKey } = credentials();
  const now = new Date();
  const start = new Date(now);
  start.setFullYear(start.getFullYear() - 1);
  const response = await fetch(`${API_ROOT}/get_saved_advanced_reports`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "X-SkyPrep-API-Key": apiKey,
      "X-SkyPrep-Acct-Key": accountKey
    },
    body: new URLSearchParams({
      start_date: start.toISOString(),
      end_date: now.toISOString()
    }),
    cache: "no-store"
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`SkyPrep report listing returned ${response.status}: ${text.slice(0, 250)}`);
  const payload = JSON.parse(text) as SavedReport[] | { data?: SavedReport[]; reports?: SavedReport[] };
  const reports = Array.isArray(payload) ? payload : payload.data || payload.reports || [];

  return selectSavedReportPair(reports, snapshotIndex);
}

function decodeEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function normalizeRows(rows: ReportRow[]) {
  return rows.map(row => Object.fromEntries(
    Object.entries(row).map(([key, value]) => [decodeEntities(key), decodeEntities(value)])
  ));
}

function validateUsersReport(rows: ReportRow[]) {
  if (!rows.length) throw new Error("The HSI Users report contains no learner rows.");
  const headers = Object.keys(rows[0]);
  const courseCount = FOUNDATION.filter(course =>
    headers.some(header => header.trim().startsWith(course.slice(0, 2)))
  ).length;
  if (courseCount !== FOUNDATION.length) {
    throw new Error(`The HSI Users report contains ${courseCount} of the 7 required Foundation course columns.`);
  }
}

function latestCourseDate(rows: ReportRow[]) {
  const values = rows.flatMap(row => [
    row["Completion Date"],
    row["Start Date"],
    row["Last Login"],
    row["User Created At"]
  ]).filter(Boolean);
  const dates = values.map(value => new Date(value.replace(" at ", " ")))
    .filter(date => !Number.isNaN(date.valueOf()))
    .sort((a, b) => b.valueOf() - a.valueOf());
  return dates[0]?.toISOString() || new Date().toISOString();
}

export async function getSavedReportSnapshot(snapshotIndex = 0) {
  const discovered = await discoverReportIds(snapshotIndex) || (snapshotIndex === 0 ? {
    usersReportId: process.env.SKYPREP_USERS_REPORT_ID || DEFAULT_USERS_REPORT_ID,
    coursesReportId: process.env.SKYPREP_COURSES_REPORT_ID || DEFAULT_COURSES_REPORT_ID,
    usersReportCreatedAt: "",
    coursesReportCreatedAt: ""
  } : null);
  if (!discovered) return null;
  const { usersReportId, coursesReportId } = discovered;
  const [rawUsers, rawCourses] = await Promise.all([
    downloadSavedReport(usersReportId),
    downloadSavedReport(coursesReportId)
  ]);
  const rows = normalizeRows(rawUsers);
  const courses = normalizeRows(rawCourses);
  validateUsersReport(rows);
  return {
    rows,
    meta: {
      dataAsOf: latestCourseDate(courses),
      reportType: "saved_advanced_reports",
      usersReportName: USERS_REPORT_NAME,
      coursesReportName: COURSES_REPORT_NAME,
      usersReportId,
      coursesReportId,
      usersReportCreatedAt: discovered.usersReportCreatedAt,
      coursesReportCreatedAt: discovered.coursesReportCreatedAt,
      rowsReceived: rows.length,
      progressRowsReceived: courses.length
    }
  };
}
