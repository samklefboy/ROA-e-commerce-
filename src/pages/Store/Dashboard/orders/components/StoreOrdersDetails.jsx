import { Form, Row, Col, Container, Offcanvas, Modal } from "react-bootstrap";
import { useState } from "react";
import { motion } from "framer-motion";
import { fadedown, container } from "../../../../../utils/animation";
import OrderStatusBadge from "./OrderStatusBadge";
import OrderTimeline from "../components/OrderTimeline";
import { Lock, Whatsapp, X } from "react-bootstrap-icons";
import { FiShoppingBag } from "react-icons/fi";

export default function OrderDetails({
  order,
  onHide,
  show,
  handleStatusUpdate,
  cancelModal,
  setCancelModal,
  loading,
  actionLoad,
}) {
  const [cancelNote, setCancelNote] = useState("");

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

  const isActionable = ["PENDING", "CONFIRMED", "IN_DELIVERY"].includes(
    order.status,
  );
  const isCancellable = ["PENDING", "CONFIRMED"].includes(order.status);
  const roaCommission = order.total * 0.05;
  const youReceive = order.total - roaCommission;

  const getNextAction = () => {
    switch (order.status) {
      case "PENDING":
        return {
          label: "Confirm order",
          color: "#d8c51b",
          bg: "#bdaf2f25",
          border: "#bdaf2f4f",
          nextStatus: "CONFIRMED",
        };
      case "CONFIRMED":
        return {
          label: "mark as in-delivery",
          color: "#a411df",
          bg: "rgba(156, 89, 182, 0.17)",
          border: "#9733b675",
          nextStatus: "IN_DELIVERY",
        };

      case "IN_DELIVERY":
        return {
          label: "Mark as delivered",
          color: "#13dd9d",
          bg: "#1d9e7527",
          border: "#1d9e755d",
          nextStatus: "DELIVERED",
        };
      default:
        return null;
    }
  };

  const nextAction = getNextAction();

  return (
    <Offcanvas
      style={{
        background:
          "radial-gradient(circle,  #05270af6, #001a04, #05270af6 , #001a04 )",
        scrollbarWidth: "thin",
        msOverflowStyle: "none",
        width: "80%",
        height: "100%",
        paddingBottom: 70,
      }}
      show={show}
      onHide={onHide}
      placement={window.innerWidth < 750 ? "bottom" : "start"}
    >
      <div
        className="py-3 py-lg-4"
        style={{
          zIndex: 20,
          background: "rgba(10,26,10,0.97)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderBottom: "0.5px solid #a3a108",
        }}
      >
        <Offcanvas.Header className="px-sm-5 py-0">
          {/* TOPBAR */}
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
              <h5
                className="text-white"
                style={{ letterSpacing: 1.5, lineHeight: 1 }}
              >
                {order.orderNumber}
              </h5>
            </div>
          </div>
          <OrderStatusBadge status={order.status} />
        </Offcanvas.Header>
      </div>

      <Offcanvas.Body className="p-0 py-4">
        <Container>
          <motion.div variants={container} initial="hidden" animate="visible">
            {/* ORDER TIMELINE */}
            <motion.div variants={fadedown} className="my-5 py-3">
              <div
                className="px-3 px-sm-4 py-3"
                style={{
                  background: "#111a11",
                  border: "0.5px solid #1a2a1a",
                  borderRadius: 14,
                }}
              >
                <div>
                  <h5 style={{ color: "#ebe700" }}>Order progress</h5>
                </div>
                <div className=" py-4">
                  <OrderTimeline
                    currentStatus={order.status}
                    timestamps={order.timestamps || {}}
                  />
                </div>
              </div>
            </motion.div>

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
                <div className="px-3 px-sm-4 py-3">
                  <h5 style={{ color: "#ebe700" }}>
                    Items ordered ({order.items?.length})
                  </h5>
                </div>

                {order.items?.map((item_data, i) => {
                  return (
                    <div
                      className="d-flex align-items-center gap-3 px-3 px-sm-4 py-4"
                      key={i}
                      style={{
                        borderTop: "0.5px solid #1a2a1a",
                      }}
                    >
                      {/* Image */}
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
                        {item_data.product?.images?.[0] ? (
                          <img
                            src={item_data.product.images[0]}
                            alt={item_data.product.name}
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

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          className="text-white "
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item_data.product?.name}
                        </p>

                        {item_data.variant && (
                          <div className="d-flex flex-wrap gap-2 mb-1">
                            {Object.entries(item_data.variant).map(([k, v]) => {
                              return (
                                <p
                                  style={{
                                    background: "rgba(255,255,255,0.05)",
                                    borderRadius: 5,
                                    padding: "1px 6px",
                                  }}
                                  key={k}
                                >
                                  {k}: {v}
                                </p>
                              );
                            })}
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
                            ₦{item_data.price?.toLocaleString()} x{" "}
                            {item_data.quantity}
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
                              item_data.price * item_data.quantity
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* PAYMENT BREAKDOWN */}
            <motion.div variants={fadedown} className="my-5 py-3">
              <div
                className="px-3 px-sm-4 py-3"
                style={{
                  background: "#111a11",
                  border: "0.5px solid #1a2a1a",
                  borderRadius: 14,
                  padding: 14,
                }}
              >
                <div className="pb-4">
                  <h5 style={{ color: "#ebe700" }}>Payment breakdown</h5>
                </div>
                {[
                  {
                    label: "Subtotal",
                    val: `₦${order.subtotal?.toLocaleString()}`,
                    color: "#ddd",
                  },
                  {
                    label: "Delivery fee",
                    val: order.deliveryFee
                      ? `₦${order.deliveryFee.toLocaleString()}`
                      : "Free",
                    color: "#ddd",
                  },
                  {
                    label: "Discount",
                    val: order.discount
                      ? `-₦${order.discount.toLocaleString()}`
                      : "—",
                    color: "#1D9E75",
                  },
                  {
                    label: "Order total",
                    val: `₦${order.total?.toLocaleString()}`,
                    color: "#eee",
                    bold: true,
                  },
                  {
                    label: "r.o.a. commission (5%)",
                    val: `-₦${roaCommission.toLocaleString()}`,
                    color: "#c0392b",
                  },
                  {
                    label: "You receive",
                    val: `₦${youReceive.toLocaleString()}`,
                    color: "#1D9E75",
                    bold: true,
                  },
                ].map((row, i) => (
                  <div
                    key={row.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "9px 0",
                      borderTop: i >= 4 ? "0.5px solid #1a2a1a" : "none",
                      marginTop: i === 4 ? 4 : 0,
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

                {/* Payment status */}
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
                  <Lock style={{ fontSize: 13, color: "#1D9E75" }} />
                  <p style={{ color: "#1D9E75", lineHeight: 1.2 }}>
                    Paid via {order.paymentMethod} · Payment secured by r.o.a.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* BUYER INFO */}
            <motion.div variants={fadedown} className="my-5 py-3">
              <div
                className="px-3 px-sm-4 py-3"
                style={{
                  background: "#111a11",
                  border: "0.5px solid #1a2a1a",
                }}
              >
                <h5 style={{ color: "#ebe700" }}>Buyer information</h5>

                {/* Buyer profile row */}
                <div
                  className="d-flex align-items-center gap-3 flex-wrap py-4 py-sm-4 py-lg-5"
                  style={{
                    borderBottom: "0.5px solid #1a2a1a",
                  }}
                >
                  <div
                    className="d-flex align-items-center justify-content-center "
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: "50%",
                      background: "#1a2a1a",
                      flexShrink: 0,
                      overflow: "hidden",
                    }}
                  >
                    {order.buyer?.avatar ? (
                      <img
                        src={order.buyer.avatar}
                        alt={order.buyer.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <h5 className="fw-bold" style={{ color: "#d4d110" }}>
                        {order.buyer?.name?.charAt(0)?.toUpperCase()}
                      </h5>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h5 className="text-white" style={{ lineHeight: 1 }}>
                      {order.buyer?.name}
                    </h5>
                    <p>{order.buyer?.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/seller/chat/${order.buyer?.id}`)}
                    style={{
                      padding: "7px 14px",
                      background: "rgba(29,158,117,0.1)",
                      border: "0.5px solid rgba(29,158,117,0.3)",
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#1D9E75",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <Whatsapp style={{ fontSize: 14 }} />
                    Chat
                  </button>
                </div>

                {/* Delivery address */}
                <h6 className="py-2">Delivery address</h6>
                <div
                  style={{
                    background: "#0a1a0a",
                    border: "0.5px solid #1a2a1a",
                    borderRadius: 10,
                    padding: 15,
                  }}
                >
                  <p className="text-white">
                    {order.deliveryAddress?.street}
                    <br />
                    {order.deliveryAddress?.city},{" "}
                    {order.deliveryAddress?.state}
                    <br />
                    {order.deliveryAddress?.country}
                  </p>
                  {order.deliveryNote && (
                    <p
                      className="mt-2"
                      style={{
                        color: "#ebe70a",
                      }}
                    >
                      📝 Note: {order.deliveryNote}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* ORDER META */}
            <motion.div variants={fadedown} className="my-5 py-3">
              <div
                className="px-3 px-sm-4 py-2"
                style={{
                  background: "#111a11",
                  border: "0.5px solid #1a2a1a",
                  borderRadius: 14,
                }}
              >
                <h5 style={{ color: "#ebe700" }}>Order information</h5>
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
                  { label: "Payment status", val: order.paymentStatus },
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
                    key={row.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      borderBottom: "0.5px solid #1a2a1a",
                    }}
                  >
                    <p>{row.label}</p>
                    <p className="text-white text-right">{row.val}</p>
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
                  <h5 style={{ color: "#c0392b" }}>Cancellation reason</h5>
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
        {/* ---- BOTTOM ACTION BAR ---- */}
        {(isActionable || isCancellable) && (
          <div
            className="d-flex gap-3 gap-lg-5"
            style={{
              position: "sticky",
              bottom: 0,
              left: 0,
              width: "100%",
              background: "rgba(10,26,10,0.97)",
              backdropFilter: "blur(10px)",
              borderTop: "0.5px solid #a3a108",
              padding: "12px 16px",
              zIndex: 20,
            }}
          >
            {/* Cancel button */}
            {isCancellable && (
              <button
                type="button"
                onClick={() => setCancelModal(true)}
                disabled={actionLoad}
                style={{
                  flex: 1,
                  padding: 13,
                  background: "transparent",
                  border: "0.5px solid rgba(192,57,43,0.3)",
                  borderRadius: 12,
                  fontWeight: 600,
                }}
              >
                <p style={{ color: "#e91f09" }}>Cancel order</p>
              </button>
            )}

            {/* Primary action */}
            {nextAction && (
              <button
                type="button"
                onClick={() => handleStatusUpdate(order.id, nextAction.next)}
                disabled={actionLoad}
                style={{
                  flex: 2,
                  padding: 13,
                  background: nextAction.color,
                  border: "none",
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: actionLoad ? "not-allowed" : "pointer",
                  opacity: actionLoad ? 0.7 : 1,
                  transition: "all 0.2s",
                }}
              >
                <p
                  style={{
                    color: nextAction.next === "DELIVERED" ? "#fff" : "#1a1a00",
                  }}
                >
                  {actionLoad ? "Updating..." : nextAction.label}
                </p>
              </button>
            )}
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
              <p className="mb-2 text-white">Cancel this order?</p>
              <p
                style={{
                  marginBottom: 16,
                  lineHeight: 1.6,
                }}
              >
                The buyer will be notified and the payment will be refunded to
                their r.o.a. wallet.
              </p>

              <Form.Label> Reason for cancellation</Form.Label>
              <Form.Control
                placeholder="e.g. Item out of stock, unable to fulfil order..."
                value={cancelNote}
                onChange={(e) => setCancelNote(e.target.value)}
                as="textarea"
                rows={3}
                style={{
                  resize: "none",
                }}
              />
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
                  onClick={() => handleStatusUpdate("CANCELLED", cancelNote)}
                  disabled={actionLoad}
                  style={{
                    flex: 1,

                    background: "rgba(192,57,43,0.15)",
                    border: "0.5px solid rgba(192,57,43,0.3)",
                    borderRadius: 12,

                    color: "#c0392b",
                  }}
                >
                  {actionLoad ? "Cancelling..." : "Yes, cancel order"}
                </button>
              </div>
            </Modal.Footer>
          </Modal>
        )}
      </Offcanvas.Body>
    </Offcanvas>
  );
}
