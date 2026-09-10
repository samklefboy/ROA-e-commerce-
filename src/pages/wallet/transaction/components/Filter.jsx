export function FilterChip({
  activeFilter,
  setActiveFilter,
  FILTERS,
  tabCounts,
}) {
  return (
    <div className="my-5 pt-3  gap-3 gap-md-4 filter-tab py-3 hidescroll-bar">
      {FILTERS.map((f) => {
        const count = tabCounts[f.key] || 0;
        const isActive = activeFilter === f.key;

        return (
          <button
            className={`px-3 py-1 d-flex align-items-center gap-2 filter-button ${
              isActive ? "active" : ""
            }`}
            type="button"
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
          >
            {f.label}
            {count > 0 && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "1px 6px",
                  borderRadius: 10,
                  background: isActive ? "#3c3d079d" : "rgba(255,255,255,0.08)",
                  color: isActive ? "#f3f700d0" : "#ffffff63",
                }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
