import { ArrowReturnLeft, CheckCircle, XCircle } from "react-bootstrap-icons";
import { FaShoppingBag, FaTruckPickup } from "react-icons/fa";
import { FiHome } from "react-icons/fi";

const TIMELINE_STEPS = [
  { status: "PENDING", label: "Order placed", Icon: FaShoppingBag, sub: null },
  {
    status: "CONFIRMED",
    label: "Order confirmed",
    Icon: CheckCircle,
    sub: "Your order have been confirmed by the seller",
  },
  {
    status: "IN_DELIVERY",
    label: "In delivery",
    Icon: FaTruckPickup,
    sub: "Your order is on the way to your address",
  },
  { status: "DELIVERED", label: "Delivered", Icon: FiHome, sub: null },
];

const STATUS_ORDER = ["PENDING", "CONFIRMED", "IN_DELIVERY", "DELIVERED"];

export default function OrderTimeline({ currentStatus, timestamps = {} }) {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);

  return (
    <div>
      {TIMELINE_STEPS.map((step, index) => {
        const isDone = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === TIMELINE_STEPS.length - 1;

        return (
          <div
            key={step.status}
            className="d-flex flex-col align-items-start gap-4"
          >
            {/* Left — icon + line */}
            <div
              className="d-flex flex-column align-items-center "
              style={{
                flexShrink: 0,
              }}
            >
              <div
                className="d-flex align-items-center  justify-content-center"
                style={{
                  width: "clamp(45px, 3px + 5vw, 55px)",
                  aspectRatio: 1 / 1,
                  borderRadius: "50%",
                  background: isCurrent
                    ? "#9fa11e"
                    : isDone
                      ? "#1D9E75"
                      : "#1a2a1a",
                  border: `3px solid ${
                    isCurrent ? "#9fa11e" : isDone ? "#1D9E75" : "#ffffff15"
                  }`,
                  transition: "all 0.3s",
                }}
              >
                <step.Icon
                  style={{
                    fontSize: 20,
                    color: isDone ? "#fff" : "",
                  }}
                />
              </div>

              {/* Connecting line */}
              {!isLast && (
                <div
                  style={{
                    width: 6,
                    flex: 1,
                    minHeight: "clamp(77px, 3px + 5vw, 95px)",
                    background: index < currentIndex ? "#1D9E75" : "#ffffff15",
                    margin: "5px 0",
                    transition: "background 0.3s",
                  }}
                />
              )}
            </div>

            {/* Right — label + timestamp */}
            <div>
              <div className="d-sm-flex align-items-center gap-5 mt-sm-1 mb-lg-1">
                <h6
                  className="mb-1"
                  style={{
                    color: isDone ? (isCurrent ? "#e7eb0af5" : "") : "",
                    display: "inline-block",
                  }}
                >
                  {step.label}
                  {isCurrent && (
                    <span
                      className="py-1 ms-4"
                      style={{
                        marginLeft: 10,
                        color: "#e7eb0ad0",
                        background: "#c7c93a33",
                        borderRadius: 20,
                        padding: "1px 7px",
                        fontSize: "12px",
                        // letterSpacing: 1,
                      }}
                    >
                      Current
                    </span>
                  )}
                </h6>
                <p>
                  {timestamps[step.status]
                    ? new Date(timestamps[step.status]).toLocaleString("en-NG")
                    : isDone
                      ? "—"
                      : "Pending"}
                </p>
              </div>
              <p
                style={{
                  color: "#fff",
                  lineHeight: 1.2,
                  letterSpacing: 0.5,
                }}
              >
                {step.sub}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
