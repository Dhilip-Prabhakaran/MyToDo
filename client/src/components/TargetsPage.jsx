import Targets from "./Targets.jsx";
import PlannedTable from "./PlannedTable.jsx";

// Top: create targets and track milestone completion.
// Bottom: planned tasks still awaiting completion (upcoming + unfinished past).
export default function TargetsPage({ data, refresh }) {
  return (
    <div>
      <h2 className="section-title">Targets & Milestones</h2>
      <Targets data={data} refresh={refresh} />
      <h2 className="section-title">Planned tasks</h2>
      <PlannedTable data={data} refresh={refresh} />
    </div>
  );
}
