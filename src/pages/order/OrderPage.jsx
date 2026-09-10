import {
  Container,
  Row,
  Col,
  Offcanvas,
  Form,
  FormCheck,
} from "react-bootstrap";
import {
  FaArrowLeft,
  FaSearch,
  FaStar,
  FaStore,
  FaShoppingCart,
  FaInstagram,
  FaLinkedin,
  FaTwitter,
  FaTiktok,
  FaWhatsapp,
  FaChevronDown,
  FaShoppingBag,
} from "react-icons/fa";
import { Slider } from "./components/OrderPageSlider";
import OrderDetails from "./components/OrderDetails";
import { Footer } from "../Home/components/Footer";
import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import OrderStatusBadge, {
  ORDER_STATUS_CONFIG,
} from "../../pages/Store/Dashboard/orders/components/OrderStatusBadge";
import { fadedown, container } from "../../../../animation";
import MainHeader from "../../components/MainHeader";
import { X } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import { Prev } from "react-bootstrap/esm/PageItem";

import { getOrdersByBuyer } from "../../dummyData";

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

const FILTER_TABS = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "New" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "IN_DELIVERY", label: "In delivery" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "CANCELLED", label: "Cancelled" },
];

function OrderPage() {
  const navigate = useNavigate();
  // const [orders, setOrders] = useState([]);
  // const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [sort, setSort] = useState("newest");
  const [sortLabel, setSortLabel] = useState("Newest first");
  const [sortOpen, setSortOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelLoad, setCancelLoad] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  //opens the details offcanvas
  const handleSelectedOrder = (order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  {
    /*  // fetch buyer orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get("/api/orders");
        setOrders(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [orders]);
 */
  }
  const orders = getOrdersByBuyer("user-001");

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

  // active order — most recent non-delivered
  const activeOrder = useMemo(() => {
    return orders.find((o) =>
      ["PENDING", "CONFIRMED", "IN_DELIVERY"].includes(o.status),
    );
  }, [orders]);

  // cancel order — buyer can only cancel if PENDING
  const handleCancel = useCallback(async (orderId) => {
    try {
      setCancelLoad(true);
      const data = await axios.post(`/api/orders/${orderId}/cancel`);
      setOrders((Prev) => [...Prev, data]);
      setCancelModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setCancelLoad(false);
    }
  }, []);

  return (
    <>
      <MainHeader
        title="order"
        showAuth={!true}
        showCart={false}
        showSearchbtn={!true}
        search={false}
      />

      <Container>
        <section className="orders">
          {/* ACTIVE ORDER TRACKER */}
          {activeOrder && (
            <div
              className="my-5"
              onClick={() => handleSelectedOrder(activeOrder)}
              style={{
                background: "linear-gradient(135deg,#1a4a1a,#2d7a0a)",
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
                      background: "#c9c74c",
                      animation: "pulse 2s infinite",
                    }}
                  />
                  <p className="text-white">Active order</p>
                </div>
                <OrderStatusBadge status={activeOrder.status} />
              </div>

              <p className="text-white fs-5 my-2">{activeOrder.orderNumber}</p>
              <p>
                {activeOrder.store?.name} · {activeOrder.items?.length} item
                {activeOrder.items?.length !== 1 ? "s" : ""}
              </p>

              {/* Mini progress bar */}
              <div
                className="my-3"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  borderRadius: 3,
                  height: 4,
                }}
              >
                <div
                  style={{
                    height: "100%",
                    borderRadius: 3,
                    background: "#cacc36",
                    width:
                      activeOrder.status === "PENDING"
                        ? "20%"
                        : activeOrder.status === "CONFIRMED"
                          ? "40%"
                          : activeOrder.status === "PROCESSING"
                            ? "60%"
                            : activeOrder.status === "IN_TRANSIT"
                              ? "80%"
                              : "100%",
                    transition: "width 0.4s ease",
                  }}
                />
              </div>

              <div className="d-flex align-items-center justify-content-between">
                <span style={{ fontSize: 11, color: "#ffffff80" }}>
                  {activeOrder.status === "IN_TRANSIT" &&
                  activeOrder.estimatedAt
                    ? `Est. delivery: ${new Date(activeOrder.estimatedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}`
                    : "Tap to track"}
                </span>
                <p
                  className="fw-bold"
                  style={{
                    color: "#c7c94c",
                  }}
                >
                  ₦{activeOrder.total?.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* SEARCH AND SORT  */}
          <Row className="align-items-center g-md-4 my-5">
            {/* SEARCH */}
            <Col className=" col-12 col-md-10 mb-4 mb-md-0">
              <div
                className="d-flex align-items-center px-3 py-3  gap-3 "
                style={{
                  background: "#0a0f0a",
                  border: "0.5px solid #1a2a1a",
                  borderRadius: 10,
                }}
              >
                <FaSearch size={20} />
                <Form.Control
                  style={{ fontSize: "14px" }}
                  className="py-2"
                  type="search"
                  placeholder="Search orders, stores or products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <X
                    size={18}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSearch("")}
                  />
                )}
              </div>
            </Col>

            {/* SORT */}
            <Col className="col-md-2  d-flex">
              <div className="ms-auto">
                <button
                  className="px-3 py-1"
                  onClick={() => setSortOpen(true)}
                  style={{
                    background: "#a7a40631",
                    border: "0.5px solid #a7a406cc",
                    borderRadius: 8,
                  }}
                >
                  <p style={{ color: "#eeea07" }}> {sortLabel}</p>{" "}
                  <FaChevronDown className="ms-2" />
                </button>{" "}
              </div>

              {/* ---- SORT BOTTOM SHEET ---- */}
              <AnimatePresence>
                {sortOpen && (
                  <Offcanvas
                    show={sortOpen}
                    onHide={() => setSortOpen(false)}
                    placement="bottom"
                    style={{
                      background: " #172417 ",
                      height: "35%",
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
                                setSortLabel(opt.label);
                                setSortOpen(false);
                              }}
                              value={opt.key}
                              label={
                                <p
                                  style={{
                                    color: sort === opt.key ? "#ddda0f" : "",
                                    fontWeight: sort === opt.key ? 600 : "",
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
            </Col>
          </Row>

          {/* FILTER TABS */}
          <div
            className="pb-4 my-5"
            style={{
              display: "flex",
              gap: 15,
              padding: "10px 16px",
              overflowX: "auto",
              flexShrink: 0,
              msOverflowStyle: "none",
              scrollbarWidth: "thin",
            }}
            className="hide-scrollbar"
          >
            {FILTER_TABS.map((tab) => {
              const count = statusCounts[tab.key] || 0;
              const isActive = filter === tab.key;
              return (
                <button
                  className="d-flex align-items-center gap-2 px-2 "
                  key={tab.key}
                  type="button"
                  onClick={() => setFilter(tab.key)}
                  style={{
                    borderRadius: 17,
                    fontWeight: isActive ? 600 : 400,
                    whiteSpace: "nowrap",
                    transition: "all 0.15s",
                    border: `0.5px solid ${isActive ? "#cac838" : "rgba(255,255,255,0.08)"}`,

                    background: isActive ? "#c7c94c1a" : "transparent",
                  }}
                >
                  <p
                    style={{
                      color: isActive ? "#c4c714" : "rgba(255,255,255,0.4)",
                    }}
                  >
                    {" "}
                    {tab.label}
                  </p>
                  {count > 0 && (
                    <span
                      style={{
                        fontSize: 10,
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
          <div className="my-5">
            {/* Loading */}
            {loading && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      height: 140,
                      background: "#111a11",
                      borderRadius: 14,
                      border: "0.5px solid #1a2a1a",
                    }}
                  />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <FaShoppingBag
                  style={{
                    fontSize: 48,

                    display: "block",
                    marginBottom: 14,
                  }}
                />
                <p className="mb-2">
                  {filter === "ALL"
                    ? "No orders yet"
                    : `No ${filter.toLowerCase().replace("_", " ")} orders`}
                </p>
                <p
                  className="mb-2"
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
                      background: "#c9a84c",
                      border: "none",
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#1a1000",
                      cursor: "pointer",
                    }}
                  >
                    Start shopping →
                  </button>
                )}
              </div>
            )}

            {/* Orders */}
            {!loading && sorted.length > 0 && (
              <motion.div
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
                          <BuyerOrderCard order={order} />
                        </motion.div>
                      </Col>
                    );
                  })}
                </Row>
              </motion.div>
            )}
          </div>
        </section>

        {/* Order Details */}
        <OrderDetails
          show={showDetails}
          onHide={() => {
            setShowDetails(false);
          }}
          order={selectedOrder}
          loading={loading}
          handleCancel={handleCancel}
          cancelModal={cancelModal}
          cancelLoad={cancelLoad}
          setCancelModal={setCancelModal}
        />
      </Container>

      {/* ── FOOTER ── */}

      <Footer />
    </>
  );
}

export default OrderPage;









// pages/wallet/TransactionsPage.jsx
// ============================================================
// FULL TRANSACTIONS PAGE
// Filter by type + date range + search
// Summary — money in / money out / balance
// All API endpoints documented
// Dummy data for development
// ============================================================

import {
  useState, useEffect, useMemo,
  useCallback, useRef,
} from "react";
import { useNavigate }             from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  TRANSACTIONS,
  WALLET_SUMMARY,
} from "../../js/dummyData";





// ============================================================
// TRANSACTION DETAIL BOTTOM SHEET
// ============================================================
function TransactionDetailSheet({ txn, onClose }) {
  if (!txn) return null;

  const cfg    = TYPE_CONFIG[txn.type]   || TYPE_CONFIG.PURCHASE;
  const status = STATUS_CONFIG[txn.status] || STATUS_CONFIG.COMPLETED;
  const isCredit = cfg.isCredit && txn.status !== "FAILED";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position:   "fixed",
          inset:      0,
          background: "rgba(0,0,0,0.7)",
          zIndex:     200,
          display:    "flex",
          alignItems: "flex-end",
        }}
      >
        <motion.div
          initial={{ y: 400 }}
          animate={{ y: 0 }}
          exit={{ y: 400 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background:   "#111a11",
            borderRadius: "20px 20px 0 0",
            width:        "100%",
            maxWidth:     480,
            margin:       "0 auto",
            padding:      "0 0 32px",
          }}
        >
          {/* Drag handle */}
          <div style={{ width: 36, height: 4, background: "#1a2a1a", borderRadius: 2, margin: "12px auto 0" }} />

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "0.5px solid #1a2a1a" }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#eee" }}>
              Transaction details
            </span>
            <div
              onClick={onClose}
              style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <i className="ti ti-x" style={{ fontSize: 14, color: "#888" }} />
            </div>
          </div>

          <div style={{ padding: "20px 20px 0" }}>

            {/* Amount — hero */}
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ width: 60, height: 60, borderRadius: "50%", background: cfg.bg, border: `2px solid ${cfg.color}44`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <i className={`ti ${cfg.icon}`} style={{ fontSize: 26, color: cfg.color }} />
              </div>
              <p style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 800, color: isCredit ? "#1D9E75" : txn.status === "FAILED" ? "#888" : "#c0392b", margin: 0 }}>
                {isCredit ? "+" : txn.status !== "FAILED" ? "-" : ""}₦{txn.amount?.toLocaleString()}
              </p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "4px 0 8px" }}>
                {cfg.label}
              </p>
              <span style={{ fontSize: 11, fontWeight: 600, color: status.color, background: status.bg, borderRadius: 20, padding: "3px 12px" }}>
                {status.label}
              </span>
            </div>

            {/* Details table */}
            <div style={{ background: "#0a1a0a", border: "0.5px solid #1a2a1a", borderRadius: 12, overflow: "hidden" }}>
              {[
                { label: "Description", val: txn.title       },
                { label: "Details",     val: txn.description },
                { label: "Date",        val: new Date(txn.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }) },
                { label: "Time",        val: formatTime(txn.createdAt) },
                { label: "Reference",   val: txn.reference, mono: true  },
                { label: "Type",        val: cfg.label       },
              ].filter(r => r.val).map((row, i) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "11px 14px", borderTop: i > 0 ? "0.5px solid #1a2a1a" : "none", gap: 12 }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", flexShrink: 0 }}>
                    {row.label}
                  </span>
                  <span style={{ fontSize: 12, color: "#ddd", fontWeight: 500, textAlign: "right", fontFamily: row.mono ? "monospace" : "inherit", wordBreak: "break-all" }}>
                    {row.val}
                  </span>
                </div>
              ))}
            </div>

            {/* Copy reference */}
            {txn.reference && (
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(txn.reference)}
                style={{ width: "100%", padding: "11px 0", marginTop: 12, background: "transparent", border: "0.5px solid rgba(201,168,76,0.25)", borderRadius: 10, fontSize: 12, color: "#c9a84c", cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                <i className="ti ti-copy" style={{ fontSize: 14 }} />
                Copy reference number
              </button>
            )}

            {/* Link to related order if applicable */}
            {txn.metadata?.orderId && (
              <button
                type="button"
                onClick={() => {}}
                style={{ width: "100%", padding: "11px 0", marginTop: 8, background: "rgba(29,158,117,0.08)", border: "0.5px solid rgba(29,158,117,0.2)", borderRadius: 10, fontSize: 12, color: "#1D9E75", cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                <i className="ti ti-shopping-bag" style={{ fontSize: 14 }} />
                View related order
              </button>
            )}

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function TransactionsPage() {
 
  return (
    <div style={{ background: "#0a1a0a", minHeight: "100vh", paddingBottom: 100 }}>

      {/* ================================================================
          TOPBAR
      ================================================================ */}
      <div style={{
        position:             "sticky",
        top:                  0,
        zIndex:               30,
        background:           "rgba(10,26,10,0.97)",
        backdropFilter:       "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderBottom:         "0.5px solid #1a2a1a",
        padding:              "12px 16px",
        display:              "flex",
        alignItems:           "center",
        justifyContent:       "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            onClick={() => navigate(-1)}
            style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <i className="ti ti-arrow-left" style={{ fontSize: 15, color: "#888" }} />
          </div>
          <div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0 }}>Wallet</p>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 700, color: "#eee", margin: 0 }}>
              Transactions
            </h1>
          </div>
        </div>

       
      </div>

     


     

      {/* ================================================================
          TRANSACTION LIST
      ================================================================ */}
      <div style={{ padding: "0 16px" }}>

        {/* Loading skeletons */}
        {loading && (
        
        )}

        {/* Empty state */}
        

        {/* Grouped transactions */}
        {!loading && grouped.map(([dateLabel, txns]) => (
          <div key={dateLabel}>

            {/* Date group header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 0 8px" }}>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: 1.5, textTransform: "uppercase", margin: 0, whiteSpace: "nowrap" }}>
                {dateLabel}
              </p>
              <div style={{ flex: 1, height: "0.5px", background: "#1a2a1a" }} />
              {/* Daily summary */}
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                {(() => {
                  const dayIn  = txns.filter(t => TYPE_CONFIG[t.type]?.isCredit && t.status === "COMPLETED").reduce((s, t) => s + t.amount, 0);
                  const dayOut = txns.filter(t => !TYPE_CONFIG[t.type]?.isCredit && t.status === "COMPLETED").reduce((s, t) => s + t.amount, 0);
                  return (
                    <>
                      {dayIn  > 0 && <span style={{ fontSize: 10, color: "#1D9E75", fontWeight: 600 }}>+₦{dayIn.toLocaleString()}</span>}
                      {dayOut > 0 && <span style={{ fontSize: 10, color: "#c0392b", fontWeight: 600 }}>-₦{dayOut.toLocaleString()}</span>}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Transactions in this date group */}
            <motion.div variants={container} initial="hidden" animate="show">
              {txns.map(txn => {
                const cfg       = TYPE_CONFIG[txn.type]     || TYPE_CONFIG.PURCHASE;
                const statusCfg = STATUS_CONFIG[txn.status] || STATUS_CONFIG.COMPLETED;
                const isFailed  = txn.status === "FAILED";
                const isCredit  = cfg.isCredit && !isFailed;

                return (
                  <motion.div
                    key={txn.id}
                    variants={cardAnim}
                    onClick={() => setSelectedTxn(txn)}
                    style={{
                      display:    "flex",
                      alignItems: "center",
                      gap:        12,
                      padding:    "12px 0",
                      
                    }}
                  >
                    {/* Type icon */}
                    <div style={{}}>
                      <i className={`ti ${isFailed ? "ti-alert-circle" : cfg.icon}`}
                         style={{ fontSize: 18, color: isFailed ? "#666" : cfg.color }} />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, color: isFailed ? "rgba(255,255,255,0.35)" : "#ddd", fontWeight: 500, margin: 0, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {txn.title}
                      </p>
                      <p >
                        {txn.description}
                      </p>
                    
                    </div>

                    {/* Amount + chevron */}
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 700, color: isFailed ? "#555" : isCredit ? "#1D9E75" : "#c0392b", margin: 0 }}>
                        {isFailed ? "" : isCredit ? "+" : "-"}₦{txn.amount?.toLocaleString()}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, marginTop: 3 }}>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>
                          {cfg.label}
                        </span>
                        <i className="ti ti-chevron-right" style={{ fontSize: 11, color: "rgba(255,255,255,0.15)" }} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        ))}

       

      </div>

      {/* ================================================================
          SORT BOTTOM SHEET
      ================================================================ */}
      <AnimatePresence>
        {sortOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSortOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "flex-end" }}
          >
            <motion.div
              initial={{ y: 250 }} animate={{ y: 0 }} exit={{ y: 250 }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background: "#111a11", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, margin: "0 auto", paddingBottom: 24 }}
            >
              <div style={{ width: 36, height: 4, background: "#1a2a1a", borderRadius: 2, margin: "12px auto 4px" }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 20px 14px", borderBottom: "0.5px solid #1a2a1a" }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: "#eee" }}>Sort by</span>
                <button type="button" onClick={() => setSortOpen(false)} style={{ width: 28, height: 28, borderRadius: "50%", background: "#1a2a1a", border: "none", color: "#aaa", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <i className="ti ti-x" style={{ fontSize: 14 }} />
                </button>
              </div>
              {SORT_OPTIONS.map(opt => (
                <div
                  key={opt.key}
                  onClick={() => { setSort(opt.key); setSortOpen(false); }}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", cursor: "pointer", background: sort === opt.key ? "#1f1a0e" : "transparent", borderBottom: "0.5px solid #1a2a1a" }}
                >
                  <span style={{ fontSize: 14, color: sort === opt.key ? "#c9a84c" : "#ccc", fontWeight: sort === opt.key ? 600 : 400 }}>
                    {opt.label}
                  </span>
                  {sort === opt.key && <i className="ti ti-check" style={{ fontSize: 16, color: "#c9a84c" }} />}
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================================================================
          DATE FILTER BOTTOM SHEET
      ================================================================ */}
    

      {/* ================================================================
          TRANSACTION DETAIL SHEET
      ================================================================ */}
      {selectedTxn && (
        <TransactionDetailSheet
          txn={selectedTxn}
          onClose={() => setSelectedTxn(null)}
        />
      )}

    </div>
  );
}