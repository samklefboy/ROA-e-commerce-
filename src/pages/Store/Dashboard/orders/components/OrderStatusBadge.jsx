// components/OrderStatusBadge.jsx
import {
  ArrowReturnLeft,
  CheckCircle,
  Clock,
  TruckFront,
  XCircle,
} from "react-bootstrap-icons";

const ORDER_STATUS_CONFIG = {
  PENDING: {
    label: "New order",
    color: "#bcbe2e",
    bg: "rgba(201,168,76,0.12)",
    border: "rgba(201,168,76,0.3)",
    Icon: Clock,
    dot: "#bcbe2e",
  },
  CONFIRMED: {
    label: "Confirmed",
    color: "#378ADD",
    bg: "rgba(55,138,221,0.12)",
    border: "rgba(55,138,221,0.3)",
    Icon: CheckCircle,
    dot: "#378ADD",
  },

  IN_DELIVERY: {
    label: "In delivery",
    color: "#ebbd40",
    bg: "#c496171c",
    border: "#e0ac1b38",
    Icon: TruckFront,
    dot: "#ec68ba",
  },
  DELIVERED: {
    label: "Delivered",
    color: "#1D9E75",
    bg: "rgba(29,158,117,0.12)",
    border: "rgba(29,158,117,0.3)",
    Icon: CheckCircle,
    dot: "#1D9E75",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "#c0392b",
    bg: "rgba(192,57,43,0.12)",
    border: "rgba(192,57,43,0.3)",
    Icon: XCircle,
    dot: "#c0392b",
  },
  RETURNED: {
    label: "Returned",
    color: "#888",
    bg: "rgba(255,255,255,0.06)",
    border: "rgba(255,255,255,0.12)",
    Icon: ArrowReturnLeft,
    dot: "#888",
  },
};

function OrderStatusBadge({ status }) {
  const config = ORDER_STATUS_CONFIG[status] || ORDER_STATUS_CONFIG.PENDING;

  return (
    <span
      className="d-inline-flex align-items-center gap-2 px-2  px-sm-3  px-md-3 py-1"
      style={{
        fontWeight: 600,
        color: config.color,
        borderRadius: 20,
        whiteSpace: "nowrap",
        fontSize: 13,
      }}
    >
      <config.Icon />
      {config.label}
    </span>
  );
}

export default OrderStatusBadge;
