// accordion header component
import { Building, CarFront } from "react-bootstrap-icons";
import { FaChevronDown } from "react-icons/fa";
import { FiShoppingBag } from "react-icons/fi";

// group config
const GROUP_CONFIG = {
  REGULAR: {
    label: "product listing",
    Icon: FiShoppingBag,
    color: "#f5f107",
    bg: "rgba(32, 32, 0, 0.71)",
    border: "#c2c0426b",
    emptyMsg: "No shop products found",
  },
  CAR: {
    label: "Vehicle listings",
    Icon: CarFront,
    color: "#378ADD",
    bg: "rgba(0, 11, 22, 0.71)",
    border: "rgba(55,138,221,0.2)",
    emptyMsg: "No vehicle listings found",
  },
  REAL_ESTATE: {
    label: "Property listings",
    Icon: Building,
    color: "#1D9E75",
    bg: "rgba(1, 31, 21, 0.71)",
    border: "rgba(29,158,117,0.2)",
    emptyMsg: "No property listings found",
  },
};

export default function GroupHeader({
  type,
  count,
  isOpen,
  onToggle,
  Store,
  Shop,
  storeFront,
}) {
  const config = GROUP_CONFIG[type];

  return (
    <div
      className={`py-md-3  ${isOpen ? "sticky-top" : Store ? "group_header_store" : storeFront ? "group_header_storefront" : "group_header"}`}
      onClick={onToggle}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 14px",
        top: Store ? "133px" : Shop ? "clamp(125px, 19.5vw, 155px)" : "112px",
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
