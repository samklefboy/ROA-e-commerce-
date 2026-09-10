import { Form } from "react-bootstrap";
import { Search, X } from "react-bootstrap-icons";
import { FaSearch } from "react-icons/fa";

export function SearchBar({ search, setSearch }) {
  return (
    <div
      className="d-flex align-items-center gap-3 p-3"
      style={{ background: "#0008018a", borderRadius: 12 }}
    >
      <Search
        style={{
          fontSize: 20,
          color: "rgba(255, 255, 255, 0.48)",
          flexShrink: 0,
        }}
      />

      <Form.Control
        placeholder="Search transactions, references..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
      />
      {search && (
        <X
          style={{ fontSize: 14, color: "#666", cursor: "pointer" }}
          onClick={() => setSearch("")}
        />
      )}
    </div>
  );
}
