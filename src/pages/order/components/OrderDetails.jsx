import { Container, Offcanvas, Modal, Form } from "react-bootstrap";
import { motion } from "framer-motion";
import { fadedown, container } from "../../../animation";
import OrderStatusBadge from "../../Store/Dashboard/orders/components/OrderStatusBadge";
import OrderTimeline from "../../Store/Dashboard/orders/components/OrderTimeline";
import {
  ChevronRight,
  Headset,
  ShieldCheck,
  Star,
  Wallet,
  Whatsapp,
  X,
} from "react-bootstrap-icons";
import { FiMapPin, FiShoppingBag } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { FaFileInvoice, FaStore } from "react-icons/fa";
import { contactStoreOnWhatsApp } from "../../../utils/whatsapp";

function formatCurrency(value) {
  return `₦${Number(value || 0).toLocaleString("en-NG")}`;
}

function formatDate(value, options = {}) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-NG", options);
}

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function OrderDetails({
  order,
  onHide,
  show,
  loading,
  handleCancel,
  cancelModal,
  setCancelModal,
  cancelLoad,
  cancelReason,
  setCancelReason,
}) {
  const navigate = useNavigate();

  if (!order && !loading) {
    return null;
  }

  const canCancel = order?.status === "PENDING";

  const isDelivered = order?.status === "DELIVERED";

  const isCancelled = order?.status === "CANCELLED";

  const isReturned = order?.status === "RETURNED";

  const handleContactStore = () => {
    if (!order) return;

    contactStoreOnWhatsApp({
      store: order.store,
      orderNumber: order.orderNumber,
    });
  };

  return (
    <Offcanvas
      show={show}
      onHide={onHide}
      placement="end"
      className="order-details offcanvas-order-details"
    >
      {/* HEADER */}

      <Offcanvas.Header
        className="py-3 sticky-top d-flex align-items-center justify-content-between"
        style={{
          background: "#0a1a0aa6",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderBottom: "0.5px solid #a3a00844",
          boxShadow: "10px 40px 80px #0a1a0af5",
          zIndex: 30,
        }}
      >
        <div className="d-flex align-items-center gap-4 gap-sm-5">
          <button
            type="button"
            onClick={onHide}
            aria-label="Close order details"
            style={{
              width: 35,
              height: 35,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#ffffff18",
              cursor: "pointer",
              border: "none",
              borderRadius: "50%",
            }}
          >
            <X className="text-white fs-4" />
          </button>

          <div style={{ flex: 1 }}>
            <p className="mb-2">Order details</p>

            <p
              className="text-white fs-5"
              style={{
                letterSpacing: 1.5,
                lineHeight: 1,
                fontStyle: "oblique",
              }}
            >
              {loading ? "Loading..." : order?.orderNumber}
            </p>
          </div>
        </div>

        {!loading && order && <OrderStatusBadge status={order.status} />}
      </Offcanvas.Header>

      <Offcanvas.Body className="p-0 px-3 px-lg-4">
        {/* DETAIL LOADING */}
        {loading && (
          <div
            className="d-flex flex-column align-items-center justify-content-center"
            style={{
              minHeight: 400,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                border: "2px solid #1a2a1a",
                borderTopColor: "#c7c94c",
                borderRadius: "50%",
                animation: "spin 0.7s linear infinite",
              }}
            />

            <p className="mt-3">Loading order details...</p>
          </div>
        )}

        {!loading && order && (
          <Container>
            <motion.div variants={container} initial="hidden" animate="visible">
              {/* ORDER TIMELINE */}

              {!isCancelled && !isReturned && (
                <motion.div variants={fadedown} className="my-5 py-3">
                  <div
                    className="p-3 px-sm-4"
                    style={{
                      border: "1px solid #ffffff50",
                      borderRadius: 18,
                      background:
                        "linear-gradient(230deg, #252502c5, #164101e7)",
                    }}
                  >
                    <p
                      style={{
                        color: "#ebe700",
                      }}
                    >
                      Order tracking
                    </p>

                    <div className="py-4">
                      <OrderTimeline
                        currentStatus={order.status}
                        timestamps={order.timestamps || {}}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ESTIMATED DELIVERY */}

              {order.status === "IN_DELIVERY" && order.estimatedAt && (
                <motion.div variants={fadedown} className="my-5">
                  <div
                    className="d-flex align-items-center justify-content-between p-3 px-sm-4"
                    style={{
                      background: "linear-gradient(135deg, #1a4a1a, #2d7a0a)",
                      borderRadius: 14,
                    }}
                  >
                    <div>
                      <p
                        style={{
                          color: "#ebe700",
                        }}
                      >
                        Estimated delivery
                      </p>

                      <p className="text-white mt-2">
                        {formatDate(order.estimatedAt, {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                      </p>
                    </div>

                    <FaStore
                      style={{
                        fontSize: 32,
                        color: "rgba(255,255,255,0.3)",
                      }}
                    />
                  </div>
                </motion.div>
              )}

              {/* CANCELLED */}

              {isCancelled && (
                <motion.div variants={fadedown} className="my-5">
                  <div
                    className="p-3 px-sm-4"
                    style={{
                      background: "rgba(192,58,43,0.14)",
                      border: "0.5px solid rgba(192,58,43,0.6)",
                      borderRadius: 14,
                    }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <X
                        style={{
                          fontSize: 25,
                          color: "#c0392b",
                        }}
                      />

                      <p
                        style={{
                          color: "#c0392b",
                        }}
                      >
                        Order cancelled
                      </p>
                    </div>

                    {order.cancellationReason && (
                      <p
                        className="my-3"
                        style={{
                          lineHeight: 1.6,
                        }}
                      >
                        Reason: {order.cancellationReason}
                      </p>
                    )}

                    <div
                      className="d-flex align-items-center gap-2"
                      style={{
                        marginTop: 10,
                        background: "rgba(29,158,117,0.06)",
                        border: "0.5px solid rgba(29,158,117,0.2)",
                        borderRadius: 8,
                        padding: "8px 12px",
                      }}
                    >
                      <Wallet
                        style={{
                          fontSize: 14,
                          color: "#1D9E75",
                        }}
                      />

                      <span
                        style={{
                          fontSize: 13,
                          color: "#1D9E75",
                        }}
                      >
                        Refund status is managed by r.o.a.
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* DELIVERED REVIEW */}

              {isDelivered && !order.hasReviewed && (
                <motion.div variants={fadedown} className="my-5">
                  <div
                    className="p-3 px-sm-4"
                    onClick={() => navigate(`/orders/${order.id}/review`)}
                    style={{
                      background: "#c9c74c15",
                      border: "0.5px solid #c9c74c60",
                      borderRadius: 14,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 10,
                          background: "#c9c74c1a",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Star
                          style={{
                            fontSize: 20,
                            color: "rgba(201,199,76,0.94)",
                          }}
                        />
                      </div>

                      <div>
                        <p
                          className="mb-2"
                          style={{
                            color: "#dfdb17",
                          }}
                        >
                          How was your experience?
                        </p>

                        <span
                          style={{
                            color: "#bebebeb0",
                          }}
                        >
                          Rate {order.store?.name} and help other buyers
                        </span>
                      </div>
                    </div>

                    <ChevronRight
                      className="text-white"
                      style={{
                        fontSize: 22,
                      }}
                    />
                  </div>
                </motion.div>
              )}

              {/* ORDER ITEMS */}

              <motion.div variants={fadedown} className="my-5">
                <div
                  style={{
                    border: "1px solid #ffffff50",
                    borderRadius: 18,
                    background: "linear-gradient(230deg, #252502c5, #164101e7)",
                    overflow: "hidden",
                  }}
                >
                  {/* STORE */}

                  <div
                    className="p-3 px-sm-4 d-flex align-items-center gap-4"
                    onClick={() =>
                      navigate(`/store/${order.store?.slug || order.storeId}`)
                    }
                    style={{
                      borderBottom: "0.5px solid #315831",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        width: "clamp(45px, 3px + 5vw, 60px)",
                        height: "clamp(45px, 3px + 5vw, 60px)",
                        borderRadius: 10,
                        background: "#1a2a1a",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {order.store?.logo ? (
                        <img
                          src={order.store.logo}
                          alt={order.store.name || "Store"}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <FaStore
                          style={{
                            color: "#888",
                          }}
                        />
                      )}
                    </div>

                    <div
                      style={{
                        flex: 1,
                      }}
                    >
                      <p
                        className="text-white mb-2"
                        style={{
                          fontWeight: 600,
                        }}
                      >
                        {order.store?.name}
                      </p>

                      <p
                        style={{
                          fontSize: 11,
                        }}
                      >
                        Tap to visit store
                      </p>
                    </div>

                    <ChevronRight
                      className="text-white"
                      style={{
                        fontSize: 15,
                      }}
                    />
                  </div>

                  {/* ITEMS */}

                  {order.items?.map((orderItem, i) => {
                    const lineTotal =
                      Number(orderItem.price || 0) *
                      Number(orderItem.quantity || 0);

                    return (
                      <div
                        className="p-3 px-sm-4 d-flex align-items-center gap-3"
                        key={orderItem.id || `${orderItem.productId}-${i}`}
                        style={{
                          borderTop: i > 0 ? "0.5px solid #315831" : "none",
                        }}
                      >
                        <div
                          style={{
                            width: 60,
                            height: 60,
                            borderRadius: 10,
                            background: "#1a2a1a",
                            flexShrink: 0,
                            overflow: "hidden",
                          }}
                        >
                          {orderItem.product?.images?.[0] ? (
                            <img
                              src={orderItem.product.images[0]}
                              alt={orderItem.product?.name || "Product"}
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
                              <FiShoppingBag
                                style={{
                                  fontSize: 25,
                                  color: "rgba(255,255,255,0.15)",
                                }}
                              />
                            </div>
                          )}
                        </div>

                        <div
                          style={{
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          <p
                            className="text-white mb-2"
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {orderItem.product?.name}
                          </p>

                          {orderItem.variant && (
                            <div className="d-flex flex-wrap gap-2 mb-2">
                              {Object.entries(orderItem.variant).map(
                                ([key, value]) => (
                                  <span
                                    key={key}
                                    style={{
                                      background: "rgba(255,255,255,0.05)",
                                      borderRadius: 7,
                                      padding: "1px 6px",
                                      fontSize: 13,
                                      color: "#bebebeb0",
                                    }}
                                  >
                                    {key}: {value}
                                  </span>
                                ),
                              )}
                            </div>
                          )}

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <span
                              style={{
                                color: "#bebebeb0",
                              }}
                            >
                              {formatCurrency(orderItem.price)} ×{" "}
                              {orderItem.quantity}
                            </span>

                            <p
                              className="fw-bold"
                              style={{
                                color: "#1D9E75",
                                letterSpacing: 1.5,
                                fontFamily: "Syne",
                              }}
                            >
                              {formatCurrency(lineTotal)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* BUY AGAIN */}

                  {isDelivered && (
                    <div
                      className="p-3 px-sm-4"
                      style={{
                        borderTop: "0.5px solid #315831",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          const productId = order.items?.[0]?.productId;

                          if (productId) {
                            navigate(`/product/${productId}`);
                          }
                        }}
                        style={{
                          width: "100%",
                          padding: "11px 0",
                          background: "transparent",
                          border: "0.5px solid #c9c73d91",
                          borderRadius: 10,
                          fontSize: 15,
                          fontWeight: 600,
                          color: "#cac715ef",
                        }}
                      >
                        Buy again
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* PAYMENT */}

              <motion.div variants={fadedown} className="my-5 py-3">
                <div
                  className="p-3 px-sm-4"
                  style={{
                    border: "1px solid #ffffff50",
                    borderRadius: 18,
                    background: "linear-gradient(450deg, #252502c5, #164101e7)",
                  }}
                >
                  <p
                    style={{
                      color: "#ebe700",
                    }}
                    className="mb-2"
                  >
                    Payment summary
                  </p>

                  {[
                    {
                      label: "Subtotal",
                      value: formatCurrency(order.subtotal),
                      color: "#ddd",
                    },
                    {
                      label: "Delivery fee",
                      value:
                        Number(order.deliveryFee || 0) > 0
                          ? formatCurrency(order.deliveryFee)
                          : "Free",
                      color: "#ddd",
                    },
                    {
                      label: "Discount",
                      value:
                        Number(order.discount || 0) > 0
                          ? `-${formatCurrency(order.discount)}`
                          : "—",
                      color: "#1D9E75",
                    },
                    {
                      label: "Total paid",
                      value: formatCurrency(order.total),
                      color: "#d6da0e",
                      bold: true,
                    },
                  ].map((row, i) => (
                    <div
                      className="py-3"
                      key={row.label}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "9px 0",
                        borderTop: i === 3 ? "0.5px solid #315831" : "none",
                        marginTop: i === 3 ? 4 : 0,
                      }}
                    >
                      <p>{row.label}</p>

                      <span
                        style={{
                          fontSize: row.bold ? 15 : 13,
                          color: row.color,
                          fontWeight: row.bold ? 700 : 500,
                          fontFamily: "Syne",
                          letterSpacing: 1,
                        }}
                      >
                        {row.value}
                      </span>
                    </div>
                  ))}

                  <div
                    className="d-flex align-items-center gap-3"
                    style={{
                      marginTop: 10,
                      padding: "8px 12px",
                      background: "rgba(29,158,117,0.06)",
                      border: "0.5px solid rgba(29,158,117,0.2)",
                      borderRadius: 8,
                    }}
                  >
                    <ShieldCheck
                      style={{
                        fontSize: 20,
                        color: "#1D9E75",
                      }}
                    />

                    <span
                      style={{
                        color: "#1D9E75",
                      }}
                    >
                      {order.paymentStatus === "PAID"
                        ? `Paid via ${order.paymentMethod || "r.o.a."}`
                        : `Payment status: ${
                            order.paymentStatus || "Pending"
                          }`}{" "}
                      · Protected by r.o.a.
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* DELIVERY ADDRESS */}

              <motion.div variants={fadedown} className="my-5 py-3">
                <div
                  className="p-3 px-sm-4"
                  style={{
                    border: "1px solid #ffffff50",
                    borderRadius: 18,
                    background: "linear-gradient(90deg, #252502c5, #164101e7)",
                  }}
                >
                  <p
                    style={{
                      color: "#ebe700",
                    }}
                    className="mb-3"
                  >
                    Delivery address
                  </p>

                  <div
                    className="py-3 px-4"
                    style={{
                      background: "#0a1a0a6c",
                      border: "0.5px solid #1a2a1a",
                      borderRadius: 15,
                    }}
                  >
                    <div className="d-flex align-items-start gap-3">
                      <FiMapPin
                        style={{
                          fontSize: 18,
                          color: "#cac83c",
                          flexShrink: 0,
                        }}
                      />

                      <div>
                        <p className="text-white mb-2">
                          {order.deliveryAddress?.street},{" "}
                          {order.deliveryAddress?.city},{" "}
                          {order.deliveryAddress?.state}
                        </p>

                        {order.deliveryNote && (
                          <span
                            style={{
                              color: "#bebebeb0",
                            }}
                          >
                            📝 {order.deliveryNote}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* ORDER INFORMATION */}

              <motion.div variants={fadedown} className="my-5 py-3">
                <div
                  className="p-3 px-sm-4"
                  style={{
                    border: "1px solid #ffffff50",
                    borderRadius: 18,
                    background: "linear-gradient(250deg, #252502c5, #164101e7)",
                  }}
                >
                  <p
                    style={{
                      color: "#ebe700",
                    }}
                    className="mb-3"
                  >
                    Order information
                  </p>

                  {[
                    {
                      label: "Order number",
                      value: order.orderNumber,
                    },
                    {
                      label: "Placed on",
                      value: formatDateTime(order.createdAt),
                    },
                    {
                      label: "Payment method",
                      value: order.paymentMethod || "—",
                    },
                    ...(order.estimatedAt
                      ? [
                          {
                            label: "Estimated delivery",
                            value: formatDate(order.estimatedAt, {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            }),
                          },
                        ]
                      : []),
                    ...(order.deliveredAt
                      ? [
                          {
                            label: "Delivered on",
                            value: formatDate(order.deliveredAt, {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            }),
                          },
                        ]
                      : []),
                  ].map((row) => (
                    <div
                      className="py-3"
                      key={row.label}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        padding: "10px 0",
                        borderBottom: "0.5px solid #315831",
                      }}
                    >
                      <span
                        style={{
                          color: "#bebebeb0",
                        }}
                      >
                        {row.label}
                      </span>

                      <p
                        className="text-white text-end"
                        style={{
                          fontWeight: 500,
                          maxWidth: "60%",
                        }}
                      >
                        {row.value}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* NEED HELP */}

              <motion.div variants={fadedown} className="my-5 py-3">
                <div
                  className="p-3 px-sm-4"
                  style={{
                    border: "1px solid #ffffff50",
                    borderRadius: 18,
                    background:
                      "linear-gradient(to right, #252502c5, #164101e7)",
                  }}
                >
                  <p
                    style={{
                      color: "#ebe700",
                    }}
                    className="mb-3"
                  >
                    Need help?
                  </p>

                  {[
                    {
                      Icon: Whatsapp,
                      color: "#1D9E75",
                      label: "Contact store",
                      sub: `Chat with ${
                        order.store?.name || "the store"
                      } on WhatsApp`,
                      action: handleContactStore,
                    },
                    {
                      Icon: Headset,
                      color: "#378ADD",
                      label: "r.o.a. support",
                      sub: "We are here to help",
                      action: () => navigate("/help"),
                    },
                    {
                      Icon: FaFileInvoice,
                      color: "#c9c14c",
                      label: "View invoice",
                      sub: "Download PDF receipt",
                      action: () => {
                        // Connect this to:
                        // GET /api/orders/:id/invoice
                        // when invoice endpoint is ready.
                      },
                    },
                  ].map((btn) => (
                    <button
                      type="button"
                      className="py-2 d-flex align-items-center gap-3 w-100 text-start"
                      key={btn.label}
                      onClick={btn.action}
                      style={{
                        cursor: "pointer",
                        border: "none",
                        borderTop: "0.5px solid #315831",
                        background: "transparent",
                        transition: "background 0.15s",
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: `${btn.color}15`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <btn.Icon
                          style={{
                            fontSize: 18,
                            color: btn.color,
                          }}
                        />
                      </div>

                      <div
                        style={{
                          flex: 1,
                        }}
                      >
                        <p
                          className="text-white"
                          style={{
                            fontWeight: 500,
                            marginBottom: 2,
                          }}
                        >
                          {btn.label}
                        </p>

                        <span
                          style={{
                            color: "#bebebeb0",
                          }}
                        >
                          {btn.sub}
                        </span>
                      </div>

                      <ChevronRight
                        style={{
                          fontSize: 14,
                          color: "#555",
                        }}
                      />
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* CANCELLATION REASON */}

              {isCancelled && order.cancellationReason && (
                <motion.div variants={fadedown} className="my-5 py-3">
                  <div
                    className="px-3 px-sm-4 py-3"
                    style={{
                      background: "rgba(192,58,43,0.12)",
                      border: "0.5px solid rgba(192,58,43,0.39)",
                      borderRadius: 14,
                    }}
                  >
                    <p
                      style={{
                        color: "#cf2512",
                      }}
                    >
                      Cancellation reason
                    </p>

                    <span
                      className="d-block mt-2"
                      style={{
                        color: "#bebebeb0",
                      }}
                    >
                      {order.cancellationReason}
                    </span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </Container>
        )}

        {/* CANCEL ACTION */}

        {canCancel && (
          <div
            style={{
              position: "sticky",
              bottom: 0,
              left: 0,
              width: "100%",
              background: "rgba(10,26,10,0.97)",
              backdropFilter: "blur(10px)",
              borderTop: "0.5px solid #1a2a1a",
              padding: "12px 16px",
              zIndex: 20,
            }}
          >
            <button
              type="button"
              onClick={() => setCancelModal(true)}
              style={{
                width: "100%",
                padding: 13,
                background: "transparent",
                border: "0.5px solid rgba(192,57,43,0.3)",
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 600,
                color: "#c0392b",
                cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans',sans-serif",
              }}
            >
              Cancel order
            </button>
          </div>
        )}

        {/* CANCEL MODAL */}
        <Modal
          show={cancelModal}
          onHide={() => !cancelLoad && setCancelModal(false)}
          centered
          backdrop="static"
          keyboard={!cancelLoad}
        >
          <Modal.Header>
            <Modal.Title className="ms-auto">
              <button
                type="button"
                onClick={() => !cancelLoad && setCancelModal(false)}
                style={{
                  border: "none",
                  background: "transparent",
                }}
                aria-label="Close"
              >
                <X
                  className="text-white fs-2"
                  style={{
                    cursor: cancelLoad ? "not-allowed" : "pointer",
                  }}
                />
              </button>
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <p className="text-white">Cancel this order?</p>

            <p
              className="mt-2 mb-3"
              style={{
                lineHeight: 1.6,
              }}
            >
              You can only cancel an order before the seller confirms it.
            </p>

            <div
              className="px-3 py-2 mb-4 "
              style={{
                background: "rgba(29,158,117,0.06)",
                border: "0.5px solid rgba(29,158,117,0.2)",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Wallet
                style={{
                  fontSize: 14,
                  color: "#1D9E75",
                }}
              />

              <p
                style={{
                  color: "#1D9E75",
                }}
              >
                Your payment/refund status will be updated by r.o.a.
              </p>
            </div>

            <Form.Group>
              <Form.Label>
                Reason{" "}
                <span
                  style={{
                    color: "#ffffff66",
                  }}
                >
                  (optional)
                </span>
              </Form.Label>

              <Form.Control
                as="textarea"
                rows={3}
                value={cancelReason || ""}
                onChange={(e) => setCancelReason(e.target.value)}
                disabled={cancelLoad}
                placeholder="Tell us why you're cancelling..."
                style={{
                  resize: "none",
                }}
              />
            </Form.Group>
          </Modal.Body>

          <Modal.Footer>
            <div className="d-flex gap-4 w-100">
              <button
                className="p-2 text-center"
                type="button"
                onClick={() => setCancelModal(false)}
                disabled={cancelLoad}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "0.5px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  fontWeight: 600,
                  cursor: cancelLoad ? "not-allowed" : "pointer",
                }}
              >
                <p> Keep order</p>
              </button>

              <button
                className="p-2 text-center fw-bold"
                type="button"
                onClick={handleCancel}
                disabled={cancelLoad}
                style={{
                  flex: 1,
                  background: "rgba(192,57,43,0.15)",
                  border: "0.5px solid rgba(192,57,43,0.3)",
                  borderRadius: 12,
                  cursor: cancelLoad ? "not-allowed" : "pointer",
                  opacity: cancelLoad ? 0.7 : 1,
                  color: "#c0392b",
                }}
              >
                {cancelLoad ? "Cancelling..." : "Yes, cancel"}
              </button>
            </div>
          </Modal.Footer>
        </Modal>
      </Offcanvas.Body>
    </Offcanvas>
  );
}

export default OrderDetails;
