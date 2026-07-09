import Targets from "./Targets.jsx";
import PlannedTable from "./PlannedTable.jsx";

// Top: create targets and track milestone completion.
// Bottom: date-wise history of every task up to today.
export default function TargetsPage({ data, refresh }) {
  return (
    <div>
      <h2 className="section-title">Targets & Milestones</h2>
      <Targets data={data} refresh={refresh} />
      <h2 className="section-title">Task history</h2>
      <PlannedTable data={data} refresh={refresh} history title="Task history" />
    </div>
  );
}
