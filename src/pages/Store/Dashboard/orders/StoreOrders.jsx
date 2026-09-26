import { Form, Row, Col, Container, Offcanvas } from "react-bootstrap";
import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import OrderCard from "./components/OrderCard";
import { fadedown, container } from "../../../../utils/animation";
import { TopNav } from "../components/TopNav";
import { FiShoppingBag } from "react-icons/fi";
import {
  ArrowReturnLeft,
  CheckCircle,
  Clock,
  ClockFill,
  Search,
  TruckFront,
  WalletFill,
  X,
  XCircle,
} from "react-bootstrap-icons";
import { FaTruckPickup } from "react-icons/fa";
import OrderDetails from "./components/StoreOrdersDetails";

import { getOrdersBySeller } from "../../../../dummyData";

const FILTER_TABS = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "New" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "IN_DELIVERY", label: "In delivery" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "CANCELLED", label: "Cancelled" },
];

const SORT_OPTIONS = [
  { key: "newest", label: "Newest first" },
  { key: "oldest", label: "Oldest first" },
  { key: "highest", label: "Highest value" },
  { key: "lowest", label: "Lowest value" },
];

const SORT_FNS = {
  newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  oldest: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  highest: (a, b) => b.total - a.total,
  lowest: (a, b) => a.total - b.total,
};

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
    color: "#E89A0B",
    bg: "rgba(232,154,11,0.12)",
    border: "rgba(232,154,11,0.3)",
    Icon: TruckFront,
    dot: "#E89A0B",
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

export default function StoreOrders() {
  //const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [sort, setSort] = useState("newest");
  const [search, setSearch] = useState("");
  const [sortOpen, setSortOpen] = useState(false);
  const [actionLoad, setActionLoad] = useState(null);
  const [cancelModal, setCancelModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [showDetails, setShowDetails] = useState(true);

  //opens the details offcanvas
  const handleSelectedOrder = (order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  // fetch orders
  {
    /*  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get("/api/store/orders");
        setOrders(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [orders]); */
  }

  const orders = getOrdersBySeller("store-001");

  // counts per status — useMemo
  const statusCounts = useMemo(() => {
    const counts = { ALL: orders.length };
    FILTER_TABS.slice(1).forEach((tab) => {
      counts[tab.key] = orders.filter((o) => o.status === tab.key).length;
    });
    return counts;
  }, [orders]);

  // filter + search + sort — useMemo chain
  const filtered = useMemo(() => {
    return orders.filter((order) => {
      const matchStatus = filter === "ALL" || order.status === filter;
      const matchSearch = search
        ? order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
          order.buyer?.name.toLowerCase().includes(search.toLowerCase()) ||
          order.items?.some((i) =>
            i.product?.name.toLowerCase().includes(search.toLowerCase()),
          )
        : true;
      return matchStatus && matchSearch;
    });
  }, [orders, filter, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort(SORT_FNS[sort]);
  }, [filtered, sort]);

  // update order status — useCallback
  const handleStatusUpdate = useCallback(
    async (orderId, newStatus, note = "") => {
      try {
        setActionLoad(orderId);

        await axios.patch(`/api/store/orders/${orderId}/status`, {
          status: newStatus,
          note,
        });

        if (newStatus === "CANCELLED") setCancelModal(false);

        // optimistic update
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: newStatus,
                  timestamps: {
                    ...o.timestamps,
                    [newStatus]: new Date().toISOString(),
                  },
                }
              : o,
          ),
        );
      } catch (err) {
        console.error(err);
      } finally {
        setActionLoad(null);
      }
    },
    [],
  );

  // summary stats
  const summary = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter(
      (o) => new Date(o.createdAt) >= todayStart,
    );

    const pendingRevenue = orders
      .filter((o) => !["CANCELLED", "RETURNED"].includes(o.status))
      .reduce((sum, o) => sum + (o.total || 0), 0);

    return {
      todayCount: todayOrders.length,
      pendingCount: statusCounts.PENDING || 0,
      processingCount: statusCounts.CONFIRMED || 0,
      pendingRevenue,
    };
  }, [orders, statusCounts]);

  return (
    <div className="pt-3">
      {/* ---- TOPBAR ---- */}
      <TopNav title="Orders" setSortOpen={setSortOpen} />

      {/* ---- SUMMARY CARDS ---- */}
      <Row className="g-3 g-sm-4 g-lg-5 mt-2">
        {[
          {
            label: "New orders today",
            val: summary.todayCount,
            color: "#d3eb00",
            Icon: FiShoppingBag,
            bg: "#d4eb0036",
            urgent: summary.pendingCount > 0,
          },
          {
            label: "Awaiting action",
            val: summary.pendingCount + summary.processingCount,
            color: "#ffa600",
            Icon: ClockFill,
            bg: "rgba(232, 155, 11, 0.15)",
            urgent: summary.pendingCount + summary.processingCount > 0,
          },
          {
            label: "In delivery",
            val: statusCounts.IN_DELIVERY || 0,
            color: "#0b80f5",
            Icon: FaTruckPickup,
            bg: "rgba(55, 138, 221, 0.16)",
            urgent: false,
          },
          {
            label: "Delivered",
            val: statusCounts.DELIVERED || 0,
            color: "#04f5a9",
            Icon: CheckCircle,
            bg: "rgba(29, 158, 117, 0.17)",
            urgent: false,
          },
        ].map((s) => (
          <Col key={s.label} className="col-12 col-md-6 col-lg-3 ">
            {" "}
            <div
              className="p-4 py-3"
              style={{
                background: "#081101bb",
                border: `0.5px solid ${s.urgent ? s.color + "55" : "#034d03"}`,
                borderRadius: 12,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {s.urgent && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: s.color,
                  }}
                />
              )}
              <div className="d-flex align-items-center justify-content-between ">
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 10,
                    background: s.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <s.Icon style={{ fontSize: 22, color: s.color }} />
                </div>
                {s.urgent && s.val > 0 && (
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: s.color,
                      animation: "pulse 2s infinite",
                    }}
                  />
                )}
              </div>
              <p
                className="fs-5 fw-bold my-3 my-sm-4"
                style={{
                  color: s.color,
                }}
              >
                {s.val}
              </p>
              <p>{s.label}</p>
            </div>
          </Col>
        ))}
      </Row>

      {/* ---- PENDING REVENUE BANNER ---- */}
      {summary.pendingRevenue > 0 && (
        <div
          className="my-5 px-3 py-2 d-flex align-items-start justify-content-between "
          style={{
            background: "linear-gradient(135deg, #1a4a1a, #2d7a0a)",
            borderRadius: 12,
          }}
        >
          <div>
            <p>Pending earnings from active orders</p>
            <p className="text-white fs-5 f-w-bold">
              ₦ {summary.pendingRevenue.toLocaleString()}
            </p>
          </div>
          <WalletFill className="mt-2" size={22} />
        </div>
      )}

      {/* ---- SEARCH ---- */}
      <div>
        <div
          className="d-flex align-items-center gap-3 p-2 px-3 my-5"
          style={{
            background: "#051405",
            border: "0.5px solid #072b07",
            borderRadius: 10,
          }}
        >
          <Search className="text-white" style={{ fontSize: 20 }} />
          <Form.Control
            className="p-2 px-3"
            placeholder="Search order number, buyer name or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <X
              style={{ fontSize: 30, cursor: "pointer" }}
              onClick={() => setSearch("")}
            />
          )}
        </div>
      </div>

      {/* ---- FILTER TABS ---- */}
      <div
        className="pb-4 gap-lg-5 gap-sm-3 gap-md-4"
        style={{
          display: "flex",
          gap: 15,
          overflowX: "auto",
          flexShrink: 0,
          msOverflowStyle: "none",
          scrollbarWidth: "thin",
        }}
      >
        {FILTER_TABS.map((tab) => {
          const count = statusCounts[tab.key] || 0;
          const isActive = filter === tab.key;
          return (
            <button
              className="d-flex align-items-center gap-2 px-3 py-1"
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              style={{
                borderRadius: 20,
                fontWeight: isActive ? 600 : 400,
                cursor: "pointer",
                whiteSpace: "nowrap",
                fontSize: 15,
                fontFamily: "'Plus Jakarta Sans',sans-serif",
                transition: "all 0.15s",
                border: `0.5px solid ${isActive ? "#fffb0093" : "rgba(255,255,255,0.08)"}`,
                color: isActive ? "#fffb00f8" : "rgba(255, 255, 255, 0.45)",
                background: isActive ? "#fffb001f" : "transparent",
              }}
            >
              {tab.label}
              {count > 0 && (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "1px 6px",
                    borderRadius: 10,
                    background: isActive
                      ? "#1a1907f8"
                      : "rgba(255,255,255,0.08)",
                    color: isActive ? "#fffb00" : "rgba(255, 255, 255, 0.35)",
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ---- RESULTS COUNT ---- */}
      <div
        className="d-flex align-items-center my-3"
        style={{
          justifyContent: "space-between",
        }}
      >
        <p>
          {sorted.length} order{sorted.length !== 1 ? "s" : ""}
        </p>
        {search && ` matching "${search}"`}
        <p></p>
      </div>

      {/* ---- ORDER LIST ---- */}
      <div className="my-5">
        {/* Loading skeleton */}
        {loading && (
          <div className="d-flex flex-column gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: 120,
                  background: "#023102b4",
                  borderRadius: 14,
                  border: "0.5px solid #1a2a1a",
                  animation: "shimmer 1.5s infinite",
                }}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && sorted.length === 0 && (
          <div className="py-5" style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 45,
                display: "block",
                marginBottom: 14,
              }}
            >
              {filter === "ALL" ? (
                <FiShoppingBag />
              ) : (
                ORDER_STATUS_CONFIG[filter]?.icon || <FiShoppingBag />
              )}
            </div>
            <p>
              {search
                ? "No orders match your search"
                : filter === "ALL"
                  ? "No orders yet"
                  : `No ${ORDER_STATUS_CONFIG[filter]?.label?.toLowerCase()} orders`}
            </p>
            <p>
              {search
                ? "Try a different search term"
                : filter === "ALL"
                  ? "When buyers place orders they will appear here"
                  : "Orders in this status will appear here"}
            </p>
          </div>
        )}

        {/* Orders */}
        {!loading && sorted.length > 0 && (
          <motion.div
            className=""
            variants={container}
            initial="hidden"
            animate="visible"
          >
            {" "}
            <Row className="g-3">
              {" "}
              {sorted.map((order) => {
                return (
                  <Col
                    key={order.id}
                    className="col-12 col-md-6 col-xl-4"
                    onClick={() => handleSelectedOrder(order)}
                    style={{ cursor: "pointer" }}
                  >
                    {" "}
                    <motion.div variants={fadedown}>
                      <div
                        style={{
                          opacity: actionLoad === order.id ? 0.6 : 1,
                          transition: "opacity 0.2s",
                        }}
                      >
                        <OrderCard
                          order={order}
                          handleSelectedOrder={handleSelectedOrder}
                          onActionClick={handleStatusUpdate}
                        />
                      </div>
                    </motion.div>
                  </Col>
                );
              })}
            </Row>
          </motion.div>
        )}
      </div>

      {/* ---- SORT BOTTOM SHEET ---- */}
      <AnimatePresence>
        {sortOpen && (
          <Offcanvas
            show={sortOpen}
            onHide={() => setSortOpen(false)}
            placement="bottom"
            style={{
              background: "#111a11",
              height: "30%",
              overflowY: "scroll",
            }}
          >
            <Container>
              <Offcanvas.Title>
                {" "}
                <div className="d-flex align-items-center justify-content-between pt-3 ">
                  <h5 className="text-white">Sort orders</h5>
                  <button
                    className="d-flex align-items-center justify-content-center"
                    type="button"
                    onClick={() => setSortOpen(false)}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      background: "none",
                      border: "none",
                    }}
                  >
                    <X size={30} className="text-white" />
                  </button>
                </div>
              </Offcanvas.Title>

              <Offcanvas.Body className="p-0 py-4 ">
                {SORT_OPTIONS.map((opt) => (
                  <div className="py-2 px-2 " key={opt.key}>
                    <Form.Check
                      className="d-flex gap-3"
                      onChange={(e) => {
                        setSort(e.target.value);
                        setSortOpen(false);
                      }}
                      value={opt.key}
                      label={
                        <p
                          style={{
                            color: sort === opt.key ? "#ddda0f" : "",
                            fontWeight: sort === opt.key ? 600 : 400,
                          }}
                        >
                          {opt.label}
                        </p>
                      }
                      checked={sort === opt.key}
                      type="radio"
                    />
                  </div>
                ))}
              </Offcanvas.Body>
            </Container>
          </Offcanvas>
        )}
      </AnimatePresence>

      {/* DETAILS (desktop animated switching) */}
      <OrderDetails
        show={showDetails}
        onHide={() => {
          setShowDetails(false);
        }}
        order={selectedOrder}
        handleStatusUpdate={handleStatusUpdate}
        cancelModal={cancelModal}
        setCancelModal={setCancelModal}
        loading={loading}
        actionLoad={actionLoad}
      />
    </div>
  );
}
