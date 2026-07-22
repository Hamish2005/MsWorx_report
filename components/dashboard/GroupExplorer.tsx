import { percent, type GroupField, type GroupMetric } from "@/lib/report";

function courseName(name: string) {
  return name.replace(/^\d+\s*\|\s*/, "");
}

export function GroupExplorer({ groupField, groups }: { groupField: GroupField; groups: GroupMetric[] }) {
  if (!groups.length) {
    return <div className="panel emptyState">Load live SkyPrep data to inspect {groupField} results.</div>;
  }

  return <div className="panel groupExplorer">
    <div className="explorerHeader">
      <strong>{groups.length.toLocaleString()} {groupField} {groups.length === 1 ? "group" : "groups"}</strong>
      <span>Each row shows enrollment, outcomes, and the seven-course progress pattern for that group.</span>
    </div>
    <div className="groupCards">
      {groups.map(group => {
        const passRate = percent(group.passed1, group.enrolled);
        const certRate = percent(group.cert, group.enrolled);
        const activityRate = percent(group.started, group.enrolled);
        return <article className="groupCard" key={group.name}>
          <div className="groupCardTop">
            <div>
              <h3>{group.name}</h3>
              <span>{group.enrolled.toLocaleString()} enrolled</span>
            </div>
            <div className="groupRate">
              <strong>{certRate}%</strong>
              <span>certificate rate</span>
            </div>
          </div>
          <div className="groupMetrics">
            <div><span>Started</span><strong>{group.started}</strong><small>{activityRate}%</small></div>
            <div><span>Passed 1+</span><strong>{group.passed1}</strong><small>{passRate}%</small></div>
            <div><span>Certificates</span><strong>{group.cert}</strong><small>{certRate}%</small></div>
            <div><span>No Activity</span><strong>{group.noActivity}</strong><small>{percent(group.noActivity, group.enrolled)}%</small></div>
          </div>
          <div className="courseMiniList">
            {group.courses.map(course => {
              const total = Math.max(1, course.passed + course.progress + course.notStarted);
              return <div className="courseMini" key={course.name}>
                <span title={courseName(course.name)}>{course.name.slice(0, 2)}</span>
                <div className="courseMiniBar" aria-label={`${courseName(course.name)}: ${course.passed} passed, ${course.progress} in progress, ${course.notStarted} not started`}>
                  <i className="passed" style={{ width: `${percent(course.passed, total)}%` }} />
                  <i className="progress" style={{ width: `${percent(course.progress, total)}%` }} />
                  <i className="notStarted" style={{ width: `${percent(course.notStarted, total)}%` }} />
                </div>
                <b>{course.passed}/{total}</b>
              </div>;
            })}
          </div>
        </article>;
      })}
    </div>
  </div>;
}

