// ---- BUYER ORDER CARD ----

import { Star } from "react-bootstrap-icons";
import { FaShoppingBag, FaStore } from "react-icons/fa";
import { FiMapPin } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import OrderStatusBadge from "../../Store/Dashboard/orders/components/OrderStatusBadge";
import { contactStoreOnWhatsApp } from "../../../utils/whatsapp";

function timeAgo(dateString) {
  const diff = Math.max(0, Date.now() - new Date(dateString).getTime());
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

export default function BuyerOrderCard({ order }) {
  const navigate = useNavigate();

  const isDelivered = order.status === "DELIVERED";
  const isCancelled = order.status === "CANCELLED";
  const isActive = ["PENDING", "CONFIRMED", "IN_DELIVERY"].includes(
    order.status,
  );

  const firstProduct = order.items?.[0]?.product;

  const itemCount = order.items?.length || 0;

  const total = Number(order.total || 0);

  const handleContactStore = (e) => {
    e.stopPropagation();

    contactStoreOnWhatsApp({
      store: order.store,
      orderNumber: order.orderNumber,
    });
  };

  const handleRateStore = (e) => {
    e.stopPropagation();

    navigate(`/orders/${order.id}/review`);
  };

  const handleBuyAgain = (e) => {
    e.stopPropagation();

    const productId = order.items?.[0]?.productId;

    if (!productId) return;

    navigate(`/product/${productId}`);
  };

  return (
    <div
      className="order_card"
      style={{
        overflow: "hidden",
      }}
    >
      <div className="p-4 px-3 p-xxl-4 py-xxl-5">
        {/* TOP ROW */}

        <div className="d-flex align-items-start gap-3 justify-content-between">
          <div>
            <small
              style={{
                color: "#ffffff77",
              }}
            >
              {timeAgo(order.createdAt)} · {order.orderNumber}
            </small>

            <div className="d-flex align-items-center gap-2 mt-2">
              {order.store?.logo ? (
                <img
                  src={order.store.logo}
                  alt={order.store?.name || "Store"}
                  style={{
                    width: 45,
                    aspectRatio: "1 / 1",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 45,
                    aspectRatio: "1 / 1",
                    borderRadius: "50%",
                    background: "#1a2a1a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FaStore
                    style={{
                      fontSize: 22,
                    }}
                  />
                </div>
              )}

              <p
                className="text-white"
                style={{
                  fontWeight: 600,
                }}
              >
                {order.store?.name || "Store"}
              </p>
            </div>
          </div>

          <OrderStatusBadge status={order.status} />
        </div>

        {/* ITEMS */}

        <div className="d-flex align-items-center gap-2 gap-lg-3 my-3 mb-4 my-xxl-4">
          {/* IMAGE STACK */}

          <div
            style={{
              display: "flex",
              flexShrink: 0,
            }}
          >
            {order.items?.slice(0, 3).map((item, i) => (
              <div
                key={item.id || `${item.productId}-${i}`}
                style={{
                  width: 63,
                  aspectRatio: "1 / 1",
                  borderRadius: 12,
                  background: "#1a2a1a",
                  flexShrink: 0,
                  overflow: "hidden",
                  borderLeft: "1.5px solid #000000",
                  marginLeft: i > 0 ? -26 : 0,
                }}
              >
                {item.product?.images?.[0] ? (
                  <img
                    src={item.product.images[0]}
                    alt={item.product?.name || "Product"}
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
                    <FaShoppingBag
                      style={{
                        fontSize: 23,
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ITEM NAMES */}

          <div
            style={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <p
              className="text-white mb-1"
              style={{
                overflow: "hidden",
                fontWeight: 500,
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {firstProduct?.name || "Order items"}
            </p>

            {itemCount > 1 && (
              <small
                style={{
                  color: "#ffffff77",
                }}
              >
                +{itemCount - 1} more item
                {itemCount - 1 !== 1 ? "s" : ""}
              </small>
            )}

            <p
              className="fw-bold"
              style={{
                color: "#58c22e",
                fontFamily: "Syne",
              }}
            >
              ₦{total.toLocaleString()}
            </p>
          </div>
        </div>

        {/* ACTIVE PROGRESS */}

        {isActive && (
          <div className="my-4">
            <div
              style={{
                background: "#1a2a1ada",
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
                      ? "25%"
                      : order.status === "CONFIRMED"
                        ? "50%"
                        : order.status === "IN_DELIVERY"
                          ? "75%"
                          : "100%",
                  transition: "width 0.4s ease",
                }}
              />
            </div>

            <span
              className="d-block my-2"
              style={{
                fontSize: 12,
              }}
            >
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

        {/* ACTIONS */}

        <div
          style={{
            display: "flex",
            gap: 8,
            paddingTop: 15,
            borderTop: "0.5px solid #008300",
            flexWrap: "wrap",
          }}
        >
          {/* TRACK */}

          {isActive && (
            <button
              className="d-flex align-items-center justify-content-center gap-1"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                // The order card is already inside
                // the details flow. Tracking details
                // will be loaded from the backend.
              }}
              style={{
                flex: 1,
                minWidth: 110,
                padding: "9px 0",
                background: "#c9c74c2a",
                border: "0.5px solid #c9c74c75",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                color: "#c9c74c",
                cursor: "pointer",
              }}
            >
              <FiMapPin />
              Track order
            </button>
          )}

          {/* WHATSAPP */}

          <button
            className="d-flex align-items-center justify-content-center gap-1"
            type="button"
            onClick={handleContactStore}
            style={{
              flex: 1,
              minWidth: 110,
              padding: "9px 0",
              background: "rgba(255,255,255,0.08)",
              border: "0.5px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 500,
              color: "#ffffff93",
              cursor: "pointer",
            }}
          >
            <FaStore />
            Contact store
          </button>

          {/* RATE */}

          {isDelivered && !order.hasReviewed && (
            <button
              className="d-flex align-items-center justify-content-center gap-1"
              type="button"
              onClick={handleRateStore}
              style={{
                flex: 1,
                minWidth: 110,
                padding: "9px 0",
                background: "#4cc98018",
                border: "0.5px solid #4cc98054",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                color: "#4cc980",
                cursor: "pointer",
              }}
            >
              <Star className="mb-1" />
              Rate store
            </button>
          )}

          {/* BUY AGAIN */}

          {isDelivered && (
            <button
              type="button"
              onClick={handleBuyAgain}
              style={{
                flex: 1,
                minWidth: 110,
                padding: "9px 0",
                background: "#c1c94c1a",
                border: "0.5px solid #c1c94c63",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                color: "#c1c94c",
                cursor: "pointer",
              }}
            >
              Buy again
            </button>
          )}

          {/* CANCELLED */}

          {isCancelled && (
            <button
              type="button"
              style={{
                flex: 1,
                minWidth: 110,
                padding: "9px 0",
                background: "rgba(192,58,43,0.22)",
                border: "0.5px solid rgba(192,57,43,0.2)",
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 600,
                color: "#ec5443",
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
