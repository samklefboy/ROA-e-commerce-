import { Stack } from "react-bootstrap";

export function FilterTabs({
  FILTERS,
  setActiveFilter,
  filterCounts,
  activeFilter,
}) {
  return (
    <div className=" filter-tab d-flex gap-4 gap-lg-4 my-5">
      {FILTERS.map((f) => {
        const count = filterCounts[f.key] || 0;
        const isActive = activeFilter === f.key;
        return (
          <button
            type="button"
            onClick={() => setActiveFilter(f.key)}
            key={f.key}
            className={`px-3 py-1 d-flex filter-button align-items-center gap-2  ${isActive ? "active" : ""}`}
          >
            {f.label}
            <span>{count && <> {filterCounts[f.key] || 0}</>}</span>
          </button>
        );
      })}
    </div>
  );
}
