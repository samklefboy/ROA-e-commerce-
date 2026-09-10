import { Form, Row, Col, Container, Offcanvas, Modal } from "react-bootstrap";
import axios from "axios";
import { motion } from "framer-motion";
import { fadedown, container } from "../../../../../animation";
import OrderStatusBadge from "../../Store/Dashboard/orders/components/OrderStatusBadge";
import OrderTimeline from "../../Store/Dashboard/orders/components/OrderTimeline";
import {
  ChevronRight,
  Headset,
  Lock,
  ShieldCheck,
  Star,
  Wallet,
  Whatsapp,
  X,
} from "react-bootstrap-icons";
import { FiMapPin, FiShoppingBag } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { FaFileInvoice } from "react-icons/fa";

function OrderDetails({
  order,
  onHide,
  show,
  loading,
  handleCancel,
  cancelModal,
  setCancelModal,
  cancelLoad,
}) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div
        style={{
          background: "#0a1a0a",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 36,
              height: 36,
              border: "2px solid #1a2a1a",
              borderTopColor: "#c7c94c",
              borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
              margin: "0 auto 10px",
            }}
          />
          <p>Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const canCancel = order.status === "PENDING";
  const isDelivered = order.status === "DELIVERED";
  const isCancelled = order.status === "CANCELLED";

  return (
    <Offcanvas
      style={{
        background:
          "radial-gradient(circle,  #05270af6, #001a04, #05270af6 , #001a04 )",
        scrollbarWidth: "thin",
        msOverflowStyle: "none",
        width: "80%",
        paddingBottom: 70,
      }}
      show={show}
      onHide={onHide}
      placement={window.innerWidth < 750 ? "bottom" : "start"}
    >
      <Offcanvas.Header
        className="py-3 py-lg-4 sticky-top d-flex align-items-center justify-content-between"
        style={{
          zIndex: 20,
          background: "rgba(10,26,10,0.97)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderBottom: "0.5px solid #a3a108",
        }}
      >
        {" "}
        {/* TOPBAR */}{" "}
        <div className="d-flex align-items-center gap-4 gap-sm-5">
          <div
            onClick={onHide}
            style={{
              width: 30,
              height: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X className="text-white fs-5" />
          </div>
          <div>
            <p className="mb-2 mb-sm-3" style={{ lineHeight: 1 }}>
              Order details
            </p>
            <h6
              className="text-white"
              style={{ letterSpacing: 1.5, lineHeight: 1 }}
            >
              {order.orderNumber}
            </h6>
          </div>
        </div>
        <span className="ms-auto ">
          <OrderStatusBadge status={order.status} />
        </span>
      </Offcanvas.Header>
      <Offcanvas.Body className="p-0 py-4">
        <Container>
          <motion.div variants={container} initial="hidden" animate="visible">
            {/* ORDER TIMELINE */}
            <motion.div variants={fadedown} className="my-5 py-3">
              <div
                className="p-3 px-sm-4 "
                style={{
                  background: "#111a11",
                  border: "0.5px solid #1a2a1a",
                  borderRadius: 14,
                }}
              >
                <h6 style={{ color: "#ebe700" }}>Order tracking</h6>
                <div className=" py-4">
                  <OrderTimeline
                    currentStatus={order.status}
                    timestamps={order.timestamps || {}}
                  />
                </div>
              </div>
            </motion.div>

            {/* ESTIMATED DELIVERY */}
            {order.status === "IN_TRANSIT" && order.estimatedAt && (
              <motion.div variants={fadedown} className="my-5 py-3">
                <div
                  className="d-flex align-items-center justify-content-between  p-3 px-sm-4"
                  style={{
                    background: "linear-gradient(135deg, #1a4a1a, #2d7a0a)",
                    borderRadius: 14,
                    padding: 14,
                  }}
                >
                  <div>
                    <h6 style={{ color: "#ebe700" }}>Estimated delivery</h6>
                    <h6 className="text-white fw-bold py-4">
                      {new Date(order.estimatedAt).toLocaleDateString("en-NG", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </h6>
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

            {/* CANCELLED NOTICE */}
            {isCancelled && (
              <motion.div variants={fadedown} className="my-5 py-3">
                <div
                  className="p-3 px-sm-4"
                  style={{
                    background: "rgba(192, 58, 43, 0.14)",
                    border: "0.5px solid rgba(192, 58, 43, 0.6)",
                    borderRadius: 14,
                  }}
                >
                  <div className="d-flex align-items-center gap-4 mb-2">
                    <X style={{ fontSize: 18, color: "#c0392b" }} />
                    <h6
                      style={{
                        color: "#c0392b",
                      }}
                    >
                      Order cancelled
                    </h6>
                  </div>

                  <p
                    style={{
                      lineHeight: 1.6,
                    }}
                  >
                    Reason: {order.cancellationReason}
                  </p>

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
                    <FaStore
                      className="mb-1"
                      style={{ fontSize: 14, color: "#1D9E75" }}
                    />
                    <span style={{ fontSize: 12, color: "#1D9E75" }}>
                      ₦{order.total?.toLocaleString()} refunded to your r.o.a.
                      wallet
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* DELIVERED — rate prompt */}
            {isDelivered && !order.hasReviewed && (
              <motion.div variants={fadedown} className="my-5 py-3">
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
                          color: "rgba(201, 199, 76, 0.94)",
                        }}
                      />
                    </div>
                    <div>
                      <h6
                        className="mb- mb-sm-2 mb-lg-3"
                        style={{
                          color: "#dfdb17",
                        }}
                      >
                        How was your experience?
                      </h6>
                      <p> Rate {order.store?.name} and help other buyers</p>
                    </div>
                  </div>
                  <ChevronRight
                    className="text-white"
                    style={{ fontSize: 22 }}
                  />
                </div>
              </motion.div>
            )}

            {/* ORDER ITEMS */}
            <motion.div variants={fadedown} className="my-5 py-3">
              <div
                style={{
                  background: "#111a11",
                  border: "0.5px solid #1a2a1a",
                  borderRadius: 14,
                  overflow: "hidden",
                }}
              >
                {/* Store header */}
                <div
                  className="p-3 px-sm-4 d-flex align-items-center gap-4"
                  onClick={() => navigate(`/store/${order.storeId}`)}
                  style={{
                    borderBottom: "0.5px solid #1a2a1a",
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
                        alt={order.store.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <i
                        className="ti ti-store"
                        style={{ fontSize: 16, color: "#888" }}
                      />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p
                      className="text-white mb-2 mb-lg-3"
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
                    style={{ fontSize: 15 }}
                  />
                </div>

                {/* Items */}
                {order.items?.map((orderItem, i) => (
                  <div
                    className="p-3 px-sm-4 d-flex align-items-center gap-3"
                    key={i}
                    style={{
                      borderTop: i > 0 ? "0.5px solid #1a2a1a" : "none",
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
                          alt={orderItem.product.name}
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

                    <div style={{ flex: 1, minWidth: 0 }}>
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
                        <div className="d-flex flex-wrap gap-2 mb-1">
                          {Object.entries(orderItem.variant).map(([k, v]) => (
                            <p
                              key={k}
                              style={{
                                background: "rgba(255,255,255,0.05)",
                                borderRadius: 5,
                                padding: "1px 6px",
                              }}
                            >
                              {k}: {v}
                            </p>
                          ))}
                        </div>
                      )}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <p>
                          ₦{orderItem.price?.toLocaleString()} x{" "}
                          {orderItem.quantity}
                        </p>
                        <p
                          className="fw-bold"
                          style={{
                            color: "#1D9E75",
                            letterSpacing: 1.5,
                          }}
                        >
                          ₦
                          {(
                            orderItem.price * orderItem.quantity
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Buy again row */}
                {isDelivered && (
                  <div
                    className="p-3 px-sm-4"
                    style={{
                      borderTop: "0.5px solid #1a2a1a",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/product/${order.items?.[0]?.productId}`)
                      }
                      style={{
                        width: "100%",
                        padding: "10px 0",
                        background: "transparent",
                        border: "0.5px solid #c9c63d80",
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#cac715",
                      }}
                    >
                      Buy again
                    </button>
                  </div>
                )}
              </div>
            </motion.div>

            {/* PAYMENT BREAKDOWN */}
            <motion.div variants={fadedown} className="my-5 py-3">
              <div
                className="p-3 px-sm-4"
                style={{
                  background: "#111a11",
                  border: "0.5px solid #1a2a1a",
                  borderRadius: 14,
                }}
              >
                <h6 style={{ color: "#ebe700" }}>Payment summary</h6>
                {[
                  {
                    label: "Subtotal",
                    val: `₦${order.subtotal?.toLocaleString()}`,
                    color: "#ddd",
                  },
                  {
                    label: "Delivery fee",
                    val: order.deliveryFee
                      ? `₦${order.deliveryFee?.toLocaleString()}`
                      : "Free",
                    color: "#ddd",
                  },
                  {
                    label: "Discount",
                    val: order.discount
                      ? `-₦${order.discount?.toLocaleString()}`
                      : "—",
                    color: "#1D9E75",
                  },
                  {
                    label: "Total paid",
                    val: `₦${order.total?.toLocaleString()}`,
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
                      borderTop: i === 3 ? "0.5px solid #1a2a1a" : "none",
                      marginTop: i === 3 ? 4 : 0,
                    }}
                  >
                    <p>{row.label}</p>
                    <span
                      style={{
                        fontSize: row.bold ? 15 : 13,
                        color: row.color,
                        fontWeight: row.bold ? 700 : 500,
                      }}
                    >
                      {row.val}
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
                  <ShieldCheck style={{ fontSize: 13, color: "#1D9E75" }} />
                  <p style={{ color: "#1D9E75", lineHeight: 1.2 }}>
                    Paid via {order.paymentMethod} · Protected by r.o.a.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* DELIVERY ADDRESS */}
            <motion.div variants={fadedown} className="my-5 py-3">
              <div
                className="p-3 px-sm-4"
                style={{
                  background: "#111a11",
                  border: "0.5px solid #1a2a1a",
                  borderRadius: 14,
                  padding: 14,
                }}
              >
                <h6 style={{ color: "#ebe700" }}>Delivery address</h6>
                <div
                  className="py-4"
                  style={{
                    background: "#0a1a0a",
                    border: "0.5px solid #1a2a1a",
                    borderRadius: 10,
                    padding: 12,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                    }}
                  >
                    <FiMapPin
                      style={{
                        fontSize: 16,
                        color: "#cac83c",
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <p
                        className="text-white"
                        style={{
                          lineHeight: 1.6,
                        }}
                      >
                        {order.deliveryAddress?.street}
                        <br />
                        {order.deliveryAddress?.city},{" "}
                        {order.deliveryAddress?.state}
                      </p>
                      {order.deliveryNote && (
                        <p className="mt-3">📝 {order.deliveryNote}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ORDER INFO */}
            <motion.div variants={fadedown} className="my-5 py-3">
              <div
                className="p-3 px-sm-4"
                style={{
                  background: "#111a11",
                  border: "0.5px solid #1a2a1a",
                  borderRadius: 14,
                  padding: 14,
                }}
              >
                <h6 style={{ color: "#ebe700" }}>Order information</h6>
                {[
                  { label: "Order number", val: order.orderNumber },
                  {
                    label: "Placed on",
                    val: new Date(order.createdAt).toLocaleString("en-NG", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                  },
                  { label: "Payment method", val: order.paymentMethod },
                  ...(order.estimatedAt
                    ? [
                        {
                          label: "Estimated delivery",
                          val: new Date(order.estimatedAt).toLocaleDateString(
                            "en-NG",
                            { day: "numeric", month: "long", year: "numeric" },
                          ),
                        },
                      ]
                    : []),
                  ...(order.deliveredAt
                    ? [
                        {
                          label: "Delivered on",
                          val: new Date(order.deliveredAt).toLocaleDateString(
                            "en-NG",
                            { day: "numeric", month: "long", year: "numeric" },
                          ),
                        },
                      ]
                    : []),
                ].map((row) => (
                  <div
                    className="py-4"
                    key={row.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      padding: "10px 0",
                      borderBottom: "0.5px solid #1a2a1a",
                    }}
                  >
                    <p>{row.label}</p>
                    <p
                      className="text-white text-end"
                      style={{
                        fontWeight: 500,
                        maxWidth: "60%",
                      }}
                    >
                      {row.val}
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
                  background: "#111a11",
                  border: "0.5px solid #1a2a1a",
                  borderRadius: 14,
                  overflow: "hidden",
                }}
              >
                <h6 style={{ color: "#ebe700" }}>Need help?</h6>
                {[
                  {
                    Icon: Whatsapp,
                    color: "#1D9E75",
                    label: "Contact store",
                    sub: `Chat with ${order.store?.name}`,
                    action: () => navigate(`/chat/${order.storeId}`),
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
                    action: () => {},
                  },
                ].map((btn) => (
                  <div
                    className="py-3"
                    key={btn.label}
                    onClick={btn.action}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 14px",
                      cursor: "pointer",
                      borderTop: "0.5px solid #1a2a1a",
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
                      <btn.Icon style={{ fontSize: 18, color: btn.color }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p
                        className="text-white"
                        style={{
                          fontWeight: 500,
                          marginBottom: 2,
                        }}
                      >
                        {btn.label}
                      </p>
                      <p>{btn.sub}</p>
                    </div>
                    <ChevronRight style={{ fontSize: 14, color: "#555" }} />
                  </div>
                ))}
              </div>
            </motion.div>

            {/* CANCEL REASON — if cancelled */}
            {order.status === "CANCELLED" && order.cancellationReason && (
              <motion.div variants={fadedown} className="my-5 py-3">
                <div
                  className="px-3 px-sm-4 py-2"
                  style={{
                    background: "rgba(192,57,43,0.06)",
                    border: "0.5px solid rgba(192,57,43,0.2)",
                    borderRadius: 14,
                  }}
                >
                  <h6 style={{ color: "#c0392b" }}>Cancellation reason</h6>
                  <p
                    className="mt-2"
                    style={{
                      lineHeight: 1.6,
                    }}
                  >
                    {order.cancellationReason}
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </Container>

        {/* BOTTOM ACTION BAR */}
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

        {/* CANCEL ORDER MODAL */}
        {cancelModal && (
          <Modal
            show={cancelModal}
            onHide={() => setCancelModal(false)}
            centered
            backdrop="static"
            keyboard={false}
          >
            <Modal.Header>
              <Modal.Title className="ms-auto">
                <X
                  className="text-white fs-2"
                  onClick={() => setCancelModal(false)}
                  style={{ cursor: "pointer" }}
                />
              </Modal.Title>
            </Modal.Header>

            <Modal.Body>
              <p className=" text-white">Cancel this order?</p>
              <p
                className="mt-2 mb-3 "
                style={{
                  marginBottom: 16,
                  lineHeight: 1.6,
                }}
              >
                You can only cancel orders that have not been confirmed by the
                seller yet.
              </p>

              <div
                style={{
                  background: "rgba(29,158,117,0.06)",
                  border: "0.5px solid rgba(29,158,117,0.2)",
                  borderRadius: 8,
                  padding: "10px 12px",
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Wallet style={{ fontSize: 14, color: "#1D9E75" }} />
                <p style={{ color: "#1D9E75" }}>
                  ₦{order?.total?.toLocaleString()} will be refunded to your
                  r.o.a. wallet
                </p>
              </div>
            </Modal.Body>

            <Modal.Footer>
              <div className="d-flex gap-4 w-100">
                <button
                  className="p-2 text-center"
                  type="button"
                  onClick={() => setCancelModal(false)}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "0.5px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    fontWeight: 600,
                  }}
                >
                  <p>Keep order</p>
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
        )}
      </Offcanvas.Body>
    </Offcanvas>
  );
}

export default OrderDetails;
