import { Container, Row, Col, Form } from "react-bootstrap";
import { FaSearch, FaShoppingBag, FaStore } from "react-icons/fa";
import OrderDetails from "./components/OrderDetails";
import OrderStatusBadge from "../Store/Dashboard/orders/components/OrderStatusBadge";
import { Footer } from "../Home/components/Footer";
import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fadedown, container } from "../../animation";
import { SortAlphaUpAlt, X } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import BuyerOrderCard from "./components/BuyerOrderCard";
import { getOrders, getOrder, cancelOrder } from "../../services/orderServices";
import NavTop from "../../components/PageNav";

const SORT_OPTIONS = [
  { key: "newest", label: "Newest first" },
  { key: "oldest", label: "Oldest first" },
  { key: "highest", label: "Highest value" },
  { key: "lowest", label: "Lowest value" },
];

const SORT_FNS = {
  newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  oldest: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  highest: (a, b) => Number(b.total || 0) - Number(a.total || 0),
  lowest: (a, b) => Number(a.total || 0) - Number(b.total || 0),
};

const FILTER_TABS = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "New" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "IN_DELIVERY", label: "In delivery" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "CANCELLED", label: "Cancelled" },
];

function getApiPayload(data) {
  // Supports either:
  // { orders: [], total, hasMore }
  // OR simply []
  if (Array.isArray(data)) {
    return {
      orders: data,
      total: data.length,
      hasMore: false,
    };
  }

  return {
    orders: data?.orders || [],
    total: data?.total ?? data?.orders?.length ?? 0,
    hasMore: Boolean(data?.hasMore),
  };
}

function OrderPage() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  const [error, setError] = useState("");

  const [filter, setFilter] = useState("ALL");

  const [sort, setSort] = useState("newest");
  const [sortLabel, setSortLabel] = useState("Newest first");
  const [sortOpen, setSortOpen] = useState(false);

  const [search, setSearch] = useState("");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const [cancelModal, setCancelModal] = useState(false);
  const [cancelLoad, setCancelLoad] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  //opens the  order details offcanvas
  const handleSelectedOrder = useCallback(async (order) => {
    setShowDetails(true);
    setDetailLoading(true);
    setCancelModal(false);
    setCancelReason("");
    setSelectedOrder(order);

    try {
      const { data } = await getOrder(order.id);

      const detailedOrder = data?.order || data;

      if (detailedOrder) {
        setSelectedOrder(detailedOrder);
      }
    } catch (err) {
      console.error("Failed to fetch order details:", err);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleCloseDetails = useCallback(() => {
    if (cancelLoad) return;

    setShowDetails(false);
    setSelectedOrder(null);
    setCancelModal(false);
    setCancelReason("");
  }, [cancelLoad]);

  // fetch buyer orders
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        status: filter !== "ALL" ? filter : undefined,
        search: search.trim() || undefined,
      };

      const { data } = await getOrders(params);

      const result = getApiPayload(data);

      setOrders(result.orders);
    } catch (err) {
      console.error("Failed to fetch orders:", err);

      setError(
        err.response?.data?.message ||
          "We couldn't load your orders. Please try again.",
      );

      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 250);

    return () => clearTimeout(timer);
  }, [fetchOrders]);

  // counts per status — useMemo
  const statusCounts = useMemo(() => {
    const counts = {
      ALL: orders.length,
      PENDING: 0,
      CONFIRMED: 0,
      IN_DELIVERY: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };

    orders.forEach((order) => {
      if (counts[order.status] !== undefined) {
        counts[order.status] += 1;
      }
    });

    return counts;
  }, [orders]);

  // filter + search — useMemo chain
  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchStatus = filter === "ALL" || order.status === filter;

      if (!normalizedSearch) {
        return matchStatus;
      }

      const orderNumber = order.orderNumber?.toLowerCase() || "";

      const buyerName = order.buyer?.name?.toLowerCase() || "";

      const storeName = order.store?.name?.toLowerCase() || "";

      const hasMatchingProduct = order.items?.some((item) =>
        item.product?.name?.toLowerCase().includes(normalizedSearch),
      );

      const matchSearch =
        orderNumber.includes(normalizedSearch) ||
        buyerName.includes(normalizedSearch) ||
        storeName.includes(normalizedSearch) ||
        hasMatchingProduct;

      return matchStatus && matchSearch;
    });
  }, [orders, filter, search]);

  //sort
  const sorted = useMemo(() => {
    if (!SORT_FNS[sort]) {
      return filtered;
    }
    return [...filtered].sort(SORT_FNS[sort]);
  }, [filtered, sort]);

  // active order — most recent non-delivered
  const activeOrder = useMemo(() => {
    const activeStatuses = ["PENDING", "CONFIRMED", "IN_DELIVERY"];

    return [...orders]
      .filter((order) => activeStatuses.includes(order.status))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  }, [orders]);

  // cancel order — buyer can only cancel if PENDING
  const handleCancel = useCallback(async () => {
    if (!selectedOrder?.id || cancelLoad) return;

    try {
      setCancelLoad(true);
      setError("");

      const reason = cancelReason.trim() || "Cancelled by buyer";

      const { data } = await cancelOrder(selectedOrder.id, reason);

      const updatedOrder = data?.order || data;

      // Update selected order immediately.
      if (updatedOrder) {
        setSelectedOrder(updatedOrder);
      }

      // Refresh list from backend.
      await fetchOrders();

      setCancelModal(false);
      setCancelReason("");
    } catch (err) {
      console.error("Order cancellation failed:", err);

      setError(
        err.response?.data?.message ||
          "Unable to cancel this order. Please try again.",
      );
    } finally {
      setCancelLoad(false);
    }
  }, [selectedOrder, cancelReason, cancelLoad, fetchOrders]);

  return (
    <>
      <NavTop title="Orders" showSearchBtn={false} />

      <Container>
        <section className="orders">
          {/* ERROR MESSAGE */}
          {error && (
            <div
              className="my-5 p-3"
              style={{
                background: "rgba(192,57,43,0.12)",
                border: "0.5px solid rgba(192,57,43,0.35)",
                borderRadius: 12,
                color: "#ec5443",
              }}
            >
              <div className="d-flex align-items-center justify-content-between gap-3">
                <span>{error}</span>

                <button
                  type="button"
                  onClick={fetchOrders}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#d9ff00",
                    fontWeight: 600,
                  }}
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* ACTIVE ORDER TRACKER */}

          {activeOrder && (
            <div
              className="my-5 p-4 px-lg-5"
              onClick={() => handleSelectedOrder(activeOrder)}
              style={{
                background: "linear-gradient(195deg, #1a4a1ac0, #3550039c)",
                borderRadius: 14,
                cursor: "pointer",
              }}
            >
              <div className="d-flex align-items-center justify-content-between ">
                <div className="d-flex align-items-center gap-3">
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#cdda17",
                      animation: "pulse 2s infinite",
                    }}
                  />
                  <p className="">Active order</p>
                </div>
                <OrderStatusBadge status={activeOrder.status} />
              </div>

              <p className="text-white fs-5 my-2 my-sm-3 my-lg-4">
                {activeOrder.orderNumber}
              </p>
              <p>
                <FaStore /> {activeOrder.store?.name} ·{" "}
                {activeOrder.items?.length || 0} item
                {activeOrder.items?.length !== 1 ? "s" : ""}
              </p>

              {/* Mini progress bar */}
              <div
                className="my-3 my-lg-4"
                style={{
                  background: "rgba(255, 255, 255, 0.14)",
                  borderRadius: 3,
                  height: 4,
                }}
              >
                <div
                  style={{
                    height: "100%",
                    borderRadius: 3,
                    background: "#d9ff00",
                    width:
                      activeOrder.status === "PENDING"
                        ? "20%"
                        : activeOrder.status === "CONFIRMED"
                          ? "40%"
                          : activeOrder.status === "PROCESSING"
                            ? "60%"
                            : activeOrder.status === "IN_DELIVERY"
                              ? "80%"
                              : "100%",
                    transition: "width 0.4s ease",
                  }}
                />
              </div>

              <div className="d-flex align-items-center justify-content-between">
                <p>
                  {activeOrder.status === "IN_DELIVERY" &&
                  activeOrder.estimatedAt
                    ? `Est. delivery: ${new Date(activeOrder.estimatedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}`
                    : "Tap to track"}
                </p>
                <p
                  className="fw-bold"
                  style={{
                    color: "#d9ff00",
                    fontFamily: "Syne",
                  }}
                >
                  {" "}
                  ₦{Number(activeOrder.total || 0).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* SEARCH AND SORT  */}
          <Row className="align-items-center gx-3 my-5 py-lg-3">
            <Col className="col-9">
              <div
                className="d-flex gap-2 align-items-center p-3 py-0"
                style={{
                  background: "#040f00a8",
                  borderRadius: "12px",
                  border: "0.5px solid #ffffff3f",
                }}
              >
                <FaSearch size={20} />

                <Form.Control
                  type="text"
                  className="px-2 border-0 shadow-none"
                  style={{
                    letterSpacing: 2,
                    background: "transparent",
                    color: "#fff",
                  }}
                  placeholder="Search orders, stores or products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                {search && (
                  <X
                    size={30}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSearch("")}
                  />
                )}
              </div>
            </Col>

            <Col className="col-sm-3 d-flex">
              <div className="ms-auto">
                <button
                  type="button"
                  className="px-3 py-1 d-flex align-items-center gap-2"
                  onClick={() => setSortOpen(true)}
                  style={{
                    background: "#a7a40631",
                    border: "0.5px solid #a7a406cc",
                    borderRadius: 8,
                  }}
                >
                  <SortAlphaUpAlt style={{ color: "#eeea07" }} size={20} />

                  <p
                    className="d-none d-md-block"
                    style={{
                      color: "#eeea07",
                    }}
                  >
                    {sortLabel}
                  </p>
                </button>
              </div>

              {/* SORT BOTTOM SHEET */}

              <AnimatePresence>
                {sortOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSortOpen(false)}
                    style={{
                      position: "fixed",
                      inset: 0,
                      background: "rgba(0,0,0,0.6)",
                      zIndex: 100,
                      display: "flex",
                      alignItems: "flex-end",
                    }}
                  >
                    <motion.div
                      initial={{ y: 300 }}
                      animate={{ y: 0 }}
                      exit={{ y: 300 }}
                      transition={{
                        type: "spring",
                        damping: 25,
                      }}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        background: "#172417",
                        borderRadius: "20px 20px 0 0",
                        width: "100%",
                        paddingBottom: 24,
                      }}
                    >
                      <Container>
                        <div
                          style={{
                            width: 36,
                            height: 4,
                            background: "#1a2a1a",
                            borderRadius: 2,
                            margin: "12px auto 4px",
                          }}
                        />

                        <div className="px-4 px-sm-0">
                          <div
                            className="py-4"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              borderBottom: "0.5px solid #1a2a1a",
                            }}
                          >
                            <p className="text-white fs-5">Sort by</p>

                            <button
                              type="button"
                              onClick={() => setSortOpen(false)}
                              style={{
                                width: 35,
                                height: 35,
                                borderRadius: "50%",
                                background: "#1a2a1a",
                                border: "none",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <X className="text-white" size={30} />
                            </button>
                          </div>

                          {SORT_OPTIONS.map((opt) => (
                            <Form.Check
                              className="d-flex gap-3 py-2 py-sm-3"
                              key={opt.key}
                              type="radio"
                              name="order-sort"
                              value={opt.key}
                              checked={sort === opt.key}
                              label={<p>{opt.label}</p>}
                              onChange={(e) => {
                                setSort(e.target.value);
                                setSortLabel(opt.label);
                                setSortOpen(false);
                              }}
                            />
                          ))}
                        </div>
                      </Container>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Col>
          </Row>

          {/* FILTER TABS */}
          <div className="my-5 pt-3 py-lg-4 gap-3 gap-md-4 filter-tab py-3 hidescroll-bar">
            {FILTER_TABS.map((tab) => {
              const count = statusCounts[tab.key] || 0;

              const isActive = filter === tab.key;

              return (
                <button
                  className={`px-3 py-1 d-flex align-items-center gap-2 filter-button ${
                    isActive ? "active" : ""
                  }`}
                  key={tab.key}
                  type="button"
                  onClick={() => setFilter(tab.key)}
                  style={{
                    borderRadius: 17,
                    fontWeight: isActive ? 600 : 400,
                    whiteSpace: "nowrap",
                    transition: "all 0.15s",
                    border: `0.5px solid ${
                      isActive ? "#cac838" : "rgba(255,255,255,0.08)"
                    }`,
                    background: isActive ? "#c7c94c1a" : "transparent",
                  }}
                >
                  <p
                    style={{
                      color: isActive ? "#c4c714" : "rgba(255,255,255,0.4)",
                    }}
                  >
                    {tab.label}
                  </p>

                  {count > 0 && (
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: 10,
                        background: isActive
                          ? "#ccc9302c"
                          : "rgba(255,255,255,0.08)",
                        color: isActive ? "#c4c714" : "rgba(255,255,255,0.35)",
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ORDER LIST */}
          <div className="my-5 py-lg-4">
            {loading && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      height: 180,
                      background: "#001100af",
                      borderRadius: 14,
                      border: "0.5px solid #1a2a1a",
                    }}
                  />
                ))}
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 20px",
                }}
              >
                <FaShoppingBag
                  style={{
                    fontSize: 48,
                    display: "block",
                    margin: "0 auto 14px",
                  }}
                />

                <p className="mb-2">
                  {filter === "ALL"
                    ? "No orders yet"
                    : `No ${filter.toLowerCase().replace("_", " ")} orders`}
                </p>

                <p
                  className="mb-3"
                  style={{
                    lineHeight: 1.6,
                  }}
                >
                  {filter === "ALL"
                    ? "Your orders will appear here once you start shopping"
                    : "Orders in this status will appear here"}
                </p>

                {filter === "ALL" && (
                  <button
                    type="button"
                    onClick={() => navigate("/shop")}
                    style={{
                      padding: "11px 24px",
                      background: "#c5b62a",
                      border: "none",
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#1f1c00",
                      cursor: "pointer",
                    }}
                  >
                    Start shopping →
                  </button>
                )}
              </div>
            )}

            {!loading && sorted.length > 0 && (
              <motion.div
                variants={container}
                initial="hidden"
                animate="visible"
              >
                <Row className="g-4">
                  {sorted.map((order) => (
                    <Col
                      key={order.id}
                      className="col-12 col-lg-6 col-xxl-4"
                      onClick={() => handleSelectedOrder(order)}
                      style={{
                        cursor: "pointer",
                      }}
                    >
                      <motion.div variants={fadedown}>
                        <BuyerOrderCard order={order} />
                      </motion.div>
                    </Col>
                  ))}
                </Row>
              </motion.div>
            )}
          </div>
        </section>

        {/* Order Details */}
        <OrderDetails
          show={showDetails}
          onHide={handleCloseDetails}
          order={selectedOrder}
          loading={detailLoading}
          handleCancel={handleCancel}
          cancelModal={cancelModal}
          cancelLoad={cancelLoad}
          cancelReason={cancelReason}
          setCancelReason={setCancelReason}
          setCancelModal={setCancelModal}
        />
      </Container>

      {/* ── FOOTER ── */}

      <Footer />
    </>
  );
}

export default OrderPage;
