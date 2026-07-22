"use client";

import { useMemo, useState } from "react";
import { percent, type GroupField, type GroupMetric } from "@/lib/report";

type SortKey = "name" | "enrolled" | "started" | "passed1" | "cert" | "passRate" | "noActivity";
type SortDirection = "asc" | "desc";

const columns: Array<{ key: SortKey; label: string; numeric?: boolean }> = [
  { key: "name", label: "Group" },
  { key: "enrolled", label: "Enrolled", numeric: true },
  { key: "started", label: "Started", numeric: true },
  { key: "passed1", label: "Passed 1+", numeric: true },
  { key: "cert", label: "Certificates", numeric: true },
  { key: "passRate", label: "Pass Rate", numeric: true },
  { key: "noActivity", label: "No Activity", numeric: true }
];

function valueFor(row: GroupMetric, key: SortKey) {
  if (key === "passRate") return percent(row.passed1, row.enrolled);
  return row[key];
}

export function PerformanceTable({ groupField, groups }: { groupField: GroupField; groups: GroupMetric[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("enrolled");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const missing = groups.find(row => row.name === "Not reported");
  const sortedGroups = useMemo(() => {
    return [...groups].sort((a, b) => {
      const aValue = valueFor(a, sortKey);
      const bValue = valueFor(b, sortKey);
      const result = typeof aValue === "string" || typeof bValue === "string"
        ? String(aValue).localeCompare(String(bValue))
        : Number(aValue) - Number(bValue);
      return sortDirection === "asc" ? result : -result;
    });
  }, [groups, sortDirection, sortKey]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      return;
    }
    setSortKey(key);
    setSortDirection(key === "name" ? "asc" : "desc");
  }

  return <div className="panel">
    <div className="tableTools">
      <span>Sorted by {columns.find(column => column.key === sortKey)?.label} ({sortDirection === "asc" ? "low to high" : "high to low"})</span>
    </div>
    <div className="tableScroll">
      <table>
        <caption className="srOnly">Performance summary grouped by {groupField}</caption>
        <thead>
          <tr>
            {columns.map(column => <th scope="col" className={column.numeric ? "num" : ""} key={column.key}>
              <button
                type="button"
                className={`sortButton ${sortKey === column.key ? "active" : ""}`}
                onClick={() => toggleSort(column.key)}
                aria-sort={sortKey === column.key ? (sortDirection === "asc" ? "ascending" : "descending") : undefined}
              >
                {column.key === "name" ? groupField : column.label}
                <span aria-hidden="true">{sortKey === column.key ? (sortDirection === "asc" ? "^" : "v") : "-"}</span>
              </button>
            </th>)}
          </tr>
        </thead>
        <tbody>
          {sortedGroups.slice(0, 15).map(row => {
            const rate = percent(row.passed1, row.enrolled);
            return <tr key={row.name}>
              <td>{row.name} {row.name === "Not reported" && <span className="tag">missing value</span>}</td>
              <td className="num">{row.enrolled}</td>
              <td className="num">{row.started}</td>
              <td className="num">{row.passed1}</td>
              <td className="num"><b>{row.cert}</b></td>
              <td><span className="miniBar"><span style={{ width: `${rate}%` }} /></span> {rate}%</td>
              <td className={`num ${row.noActivity >= 20 ? "flag" : ""}`}>{row.noActivity}</td>
            </tr>;
          })}
        </tbody>
      </table>
    </div>
    <div className="callout"><b>Data-quality note:</b> {missing ? `${missing.enrolled} learners have no ${groupField} value. ` : `No blank ${groupField} values were found. `}{groups.length > 15 ? `The first 15 of ${groups.length} groups are shown using the current sort.` : "All groups are shown."}</div>
  </div>;
}
