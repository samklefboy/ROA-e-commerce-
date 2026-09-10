// ---- BUYER ORDER CARD ----

import { Star } from "react-bootstrap-icons";
import { FaShoppingBag, FaStore } from "react-icons/fa";
import { FiMapPin } from "react-icons/fi";

function timeAgo(dateString) {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(dateString).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function BuyerOrderCard({ order }) {
  const navigate = useNavigate();

  const isDelivered = order.status === "DELIVERED";
  const isCancelled = order.status === "CANCELLED";
  const isActive = ["PENDING", "CONFIRMED", "IN_TRANSIT"].includes(
    order.status,
  );

  return (
    <div
      style={{
        background: "#090e09d5",
        border: `0.5px solid #fffb0052`,
        borderRadius: 14,
        overflow: "hidden",
        transition: "border-color 0.2s",
      }}
    >
      {/* Active indicator line */}
      {isActive && (
        <div
          style={{
            height: 6,
            background: "linear-gradient(90deg, #c7c94c, #1D9E75)",
          }}
        />
      )}

      <div className="p-3 p-4 p-xxl-5">
        {/* Top row */}
        <div className="d-flex align-items-start justify-content-between ">
          <div>
            <span style={{ fontSize: "clamp(12px, 3vw, 16px)" }}>
              {timeAgo(order.createdAt)} · {order.orderNumber}
            </span>
            <div className="d-flex align-items-center gap-3 mt-3">
              {order.store?.logo ? (
                <img
                  src={order.store.logo}
                  alt={order.store.name}
                  style={{
                    width: 33,
                    aspectRatio: 1 / 1,
                    borderRadius: 5,
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 33,
                    aspectRatio: 1 / 1,
                    borderRadius: 5,
                    background: "#1a2a1a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FaStore style={{ fontSize: 12 }} />
                </div>
              )}
              <p className="text-white" style={{ fontWeight: 600 }}>
                {order.store?.name}
              </p>
            </div>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        {/* Items */}
        <div className="d-flex align-items-center gap-4 my-4 py-2 my-md-5 ">
          {/* Image stack */}
          <div style={{ display: "flex", flexShrink: 0 }}>
            {order.items?.slice(0, 3).map((item, i) => (
              <div
                key={i}
                style={{
                  width: 65,
                  aspectRatio: 1 / 1,
                  borderRadius: 8,
                  background: "#1a2a1a",
                  flexShrink: 0,
                  overflow: "hidden",
                  border: "1.5px solid #0a1a0a",
                  marginLeft: i > 0 ? -16 : 0,
                }}
              >
                {item.product?.images?.[0] ? (
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FaShoppingBag style={{ fontSize: 23 }} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Item names */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              className="text-white mb-3"
              style={{
                overflow: "hidden",
                fontWeight: 500,
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {order.items?.[0]?.product?.name}
            </p>
            {order.items?.length > 1 && (
              <span>
                +{order.items.length - 1} more item
                {order.items.length - 1 !== 1 ? "s" : ""}
              </span>
            )}
            <p
              className=" fw-bold mt-3"
              style={{
                color: "#58c22e",
              }}
            >
              ₦{order.total?.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Progress bar for active orders */}
        {isActive && (
          <div className="my-4">
            <div
              style={{
                background: "#1a2a1a",
                borderRadius: 3,
                height: 4,
              }}
            >
              <div
                style={{
                  height: "100%",
                  borderRadius: 3,
                  background: "linear-gradient(90deg, #1D9E75, #c9c74c)",
                  width:
                    order.status === "PENDING"
                      ? "15%"
                      : order.status === "CONFIRMED"
                        ? "55%"
                        : order.status === "IN_TRANSIT"
                          ? "80%"
                          : "100%",
                  transition: "width 0.4s ease",
                }}
              />
            </div>
            <span className="mt-3" style={{ fontSize: 12 }}>
              {order.status === "PENDING"
                ? "Waiting for seller to confirm"
                : order.status === "CONFIRMED"
                  ? "Seller confirmed your order"
                  : order.status === "IN_DELIVERY"
                    ? "Your order is on the way 🚚"
                    : ""}
            </span>
          </div>
        )}

        {/* Bottom row — action buttons */}
        <div
          style={{
            display: "flex",
            gap: 8,
            paddingTop: 12,
            borderTop: "0.5px solid #1a2a1a",
          }}
        >
          {/* Track order */}
          {isActive && (
            <button
              className="d-flex align-items-center justify-content-center gap-2"
              type="button"
              //  onClick={(e) => { e.stopPropagation(); navigate(`/orders/${order.id}`); }}
              style={{
                flex: 1,
                padding: "9px 0",
                background: "#c9c74c2a",
                border: "0.5px solid #c9c74c75",
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 600,
                color: "#c9c74c",
                cursor: "pointer",
              }}
            >
              <FiMapPin className="mb-1" style={{ fontSize: 13 }} />
              Track order
            </button>
          )}

          {/* Contact store */}
          <button
            className="d-flex align-items-center justify-content-center gap-2"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/store/${order.storeId}`);
            }}
            style={{
              flex: 1,
              padding: "9px 0",
              background: "rgba(255,255,255,0.04)",
              border: "0.5px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 500,
              color: "rgba(255,255,255,0.5)",
              cursor: "pointer",
            }}
          >
            <FaStore className="mb-1" style={{ fontSize: 13 }} />
            Contact store
          </button>

          {/* Rate store — delivered only */}
          {isDelivered && !order.hasReviewed && (
            <button
              className="d-flex align-items-center justify-content-center gap-2"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/orders/${order.id}/review`);
              }}
              style={{
                flex: 1,
                padding: "9px 0",
                background: "#4cc98018",
                border: "0.5px solid #4cc98054",
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 600,
                color: "#4cc980",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                fontFamily: "'Plus Jakarta Sans',sans-serif",
              }}
            >
              <Star className="mb-1" style={{ fontSize: 13 }} />
              Rate store
            </button>
          )}

          {/* Buy again — delivered */}
          {isDelivered && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/product/${order.items?.[0]?.productId}`);
              }}
              style={{
                flex: 1,
                padding: "9px 0",
                background: "#c1c94c1a",
                border: "0.5px solid #c1c94c63",
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 600,
                color: "#c1c94c",
                cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans',sans-serif",
              }}
            >
              Buy again
            </button>
          )}

          {/* Cancelled info */}
          {isCancelled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/orders/${order.id}`);
              }}
              style={{
                flex: 1,
                padding: "9px 0",
                background: "rgba(192,57,43,0.06)",
                border: "0.5px solid rgba(192,57,43,0.2)",
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 600,
                color: "#c0392b",
                cursor: "pointer",
              }}
            >
              View details
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
