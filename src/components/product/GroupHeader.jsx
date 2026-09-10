// accordion header component
import { GROUP_CONFIG } from "./ProductGroupAccordion";
import { FaChevronDown } from "react-icons/fa";

export default function GroupHeader({
  type,
  count,
  isOpen,
  onToggle,
  Store,
  storeFront,
}) {
  const config = GROUP_CONFIG[type];

  return (
    <div
      className={`py-md-3 ${isOpen ? "sticky-top" : Store ? "group_header_store" : storeFront ? "group_header_storefront" : "group_header"}`}
      onClick={onToggle}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 14px",
        top: Store
          ? "133px"
          : storeFront
            ? "clamp(133px, 30vw, 155px)"
            : "112px",
        zIndex: 1,
        background: isOpen ? config.bg : "#273f27",
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(50px)",
        border: `0.5px solid ${isOpen ? config.border : "#2b462a"}`,
        borderRadius: isOpen ? "20px" : 12,
        cursor: "pointer",
        transition: "all 0.2s",
        userSelect: "none",
      }}
    >
      {/* Left — icon + label + count */}
      <div className="d-flex align-items-center gap-4">
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: config.bg,
            border: `0.5px solid ${config.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <config.Icon style={{ fontSize: 18, color: config.color }} />
        </div>
        <div>
          <p
            className="mb-2"
            style={{
              fontWeight: 700,
              color: isOpen ? config.color : "#ddd",
              transition: "color 0.2s",
            }}
          >
            {config.label}
          </p>
          <p className="text-white">
            {count} listing{count !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Right — chevron */}
      <div
        style={{
          flexShrink: 0,
          transition: "transform 0.3s",
          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
        }}
      >
        <FaChevronDown size={17} />
      </div>
    </div>
  );
}
