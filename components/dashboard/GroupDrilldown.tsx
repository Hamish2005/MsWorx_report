import { Bar } from "react-chartjs-2";
import { percent, type GroupField, type GroupMetric } from "@/lib/report";

type ChartData = {
  labels: string[];
  datasets: Array<{ label: string; data: number[]; backgroundColor: string; borderRadius: number }>;
};

const stackedOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: "y" as const,
  plugins: { legend: { position: "bottom" as const } },
  scales: {
    x: { stacked: true, grid: { color: "#e8ecef" } },
    y: { stacked: true, grid: { display: false } }
  }
};

export function GroupDrilldown({
  groupField,
  selectedGroup,
  onSelectedGroupChange,
  groups,
  courseData
}: {
  groupField: GroupField;
  selectedGroup: GroupMetric | null;
  onSelectedGroupChange: (name: string) => void;
  groups: GroupMetric[];
  courseData: ChartData;
}) {
  if (!groups.length) {
    return <div className="panel emptyState">Load live SkyPrep data to inspect individual {groupField} results.</div>;
  }

  return <div className="panel drilldown">
    <div className="drilldownHeader">
      <label className="control">Select {groupField}
        <select suppressHydrationWarning value={selectedGroup?.name || ""} onChange={event => onSelectedGroupChange(event.target.value)}>
          {groups.map(group => <option key={group.name} value={group.name}>{group.name}</option>)}
        </select>
      </label>
      {selectedGroup && <div className="drilldownSummary">
        <strong>{selectedGroup.name}</strong>
        <span>{selectedGroup.enrolled.toLocaleString()} enrolled · {percent(selectedGroup.cert, selectedGroup.enrolled)}% certificate rate</span>
      </div>}
    </div>

    {selectedGroup && <>
      <div className="miniStats">
        <div><span>Started</span><strong>{selectedGroup.started.toLocaleString()}</strong><small>{percent(selectedGroup.started, selectedGroup.enrolled)}%</small></div>
        <div><span>Passed 1+</span><strong>{selectedGroup.passed1.toLocaleString()}</strong><small>{percent(selectedGroup.passed1, selectedGroup.enrolled)}%</small></div>
        <div><span>Certificates</span><strong>{selectedGroup.cert.toLocaleString()}</strong><small>{percent(selectedGroup.cert, selectedGroup.enrolled)}%</small></div>
        <div><span>No Activity</span><strong>{selectedGroup.noActivity.toLocaleString()}</strong><small>{percent(selectedGroup.noActivity, selectedGroup.enrolled)}%</small></div>
      </div>
      <div className="groupCourseChart" role="img" aria-label={`Course pipeline for ${selectedGroup.name}.`}>
        <Bar data={courseData} options={stackedOptions} />
      </div>
    </>}
  </div>;
}

