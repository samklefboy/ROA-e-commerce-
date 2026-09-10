import { FormControl } from "react-bootstrap";
import { X } from "react-bootstrap-icons";

const HeaderSearch = ({ search, setSearch }) => {
  return (
    <>
      {/* Desktop Search */}
      <div
        className="d-none d-md-block search-bar me-3"
        style={{ flexShrink: 500 }}
      >
        <div className="d-flex align-items-center gap-2 w-100">
          {" "}
          <FormControl
            placeholder="Search products, stores..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-light py-2 w-100"
          />
          {search && (
            <X
              style={{ fontSize: 14, color: "#666", cursor: "pointer" }}
              onClick={() => setSearch("")}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default HeaderSearch;
