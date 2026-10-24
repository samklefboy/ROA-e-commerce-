import { useEffect, useMemo, useState } from "react";
import { Container, Row, Col, Spinner } from "react-bootstrap";
import axios from "axios";
import {
  FiArrowDownRight,
  FiArrowRight,
  FiArrowUpRight,
  FiBox,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiEye,
  FiPackage,
  FiRefreshCw,
  FiShoppingBag,
  FiStar,
  FiUsers,
  FiAlertCircle,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { TopNav } from "./components/TopNav";
import StoreOrders from "./orders/StoreOrders";
import StoreProductPage from "./products/ProductManagementPage";

/**
 * Future backend contract:
 * GET /api/v1/dashboard/store/overview?period=7d|30d|12m
 *
 * Expected response:
 * {
 *   success: true,
 *   data: {
 *     store: { name, status, followerCount, averageRating, reviewCount },
 *     summary: {
 *       todaySales, totalOrders, activeProducts, pendingOrders, lowStockProducts,
 *       heldEarnings, periodRevenue, previousPeriodRevenue,
 *       sellerEarnings, platformCommission, refunds, completedOrders, listingViews
 *     },
 *     revenue: [{ date: "2026-10-24", amount: 12000 }],
 *     recentOrders: [{
 *       id, orderNumber, customerName, itemCount, total, status, createdAt
 *     }],
 *     topProducts: [{
 *       id, name, imageUrl, quantitySold, revenue
 *     }]
 *   }
 * }
 *
 * Sales revenue, released seller earnings, held escrow and refunds are separate
 * figures. The shared wallet balance is deliberately not shown as store earnings.
 */

const OVERVIEW_ENDPOINT = "/api/dashboard/store/overview";

const PERIODS = [
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "12 months", value: "12m" },
];

const EMPTY_OVERVIEW = {
  store: {
    name: "Your store",
    status: "PENDING",
    followerCount: 0,
    averageRating: 0,
    reviewCount: 0,
  },
  summary: {
    todaySales: 0,
    totalOrders: 0,
    activeProducts: 0,
    pendingOrders: 0,
    lowStockProducts: 0,
    heldEarnings: 0,
    periodRevenue: 0,
    previousPeriodRevenue: 0,
    sellerEarnings: 0,
    platformCommission: 0,
    refunds: 0,
    completedOrders: 0,
    listingViews: null,
  },
  revenue: [],
  recentOrders: [],
  topProducts: [],
};

const money = (value, compact = false) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
    notation: compact ? "compact" : "standard",
  }).format(Number(value) || 0);

const number = (value) =>
  new Intl.NumberFormat("en-NG").format(Number(value) || 0);

const dateLabel = (value, period) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    ...(period === "12m" ? {} : { day: "numeric" }),
  }).format(date);
};

const dateTimeLabel = (value) => {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const statusTone = (status = "") => {
  const normalized = status.toUpperCase();
  if (["DELIVERED", "COMPLETED", "RELEASED"].includes(normalized))
    return "success";
  if (["PENDING", "PENDING_PAYMENT", "CONFIRMED"].includes(normalized))
    return "warning";
  if (["CANCELLED", "FAILED", "REJECTED"].includes(normalized)) return "danger";
  if (["IN_DELIVERY", "DISPATCHED", "RELEASE_PENDING"].includes(normalized))
    return "info";
  return "muted";
};

function StatCard({
  title,
  value,
  detail,
  icon: Icon,
  tone = "yellow",
  onClick,
}) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      className={`roa-stat-card h-100${onClick ? " roa-stat-card-button" : ""}`}
      {...(onClick
        ? {
            type: "button",
            onClick,
            "aria-label": `${title}: ${value}. ${detail || "Open related section"}`,
          }
        : {})}
    >
      <div className="d-flex justify-content-between align-items-start gap-3">
        <div>
          <p className="roa-muted mb-2">{title}</p>
          <div className="roa-stat-value">{value}</div>
        </div>
        <div className={`roa-stat-icon roa-stat-icon-${tone}`}>
          <Icon aria-hidden="true" />
        </div>
      </div>
      {detail ? <p className="roa-stat-detail mb-0 mt-3">{detail}</p> : null}
    </Wrapper>
  );
}

function Panel({ title, subtitle, action, children, className = "" }) {
  return (
    <section className={`roa-panel ${className}`}>
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h2 className="roa-panel-title mb-1">{title}</h2>
          {subtitle ? <p className="roa-muted mb-0">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function RevenueChart({ points = [], period, loading }) {
  const chart = useMemo(() => {
    const sorted = [...points].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    const maxAmount = Math.max(
      1,
      ...sorted.map((point) => Number(point.amount) || 0),
    );
    const width = 720;
    const height = 230;
    const left = 12;
    const right = 12;
    const top = 18;
    const bottom = 34;
    const innerWidth = width - left - right;
    const innerHeight = height - top - bottom;
    const coordinates = sorted.map((point, index) => ({
      ...point,
      x:
        sorted.length <= 1
          ? width / 2
          : left + (index / (sorted.length - 1)) * innerWidth,
      y:
        top +
        innerHeight -
        ((Number(point.amount) || 0) / maxAmount) * innerHeight,
    }));
    const line = coordinates
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ");
    const area = coordinates.length
      ? `${line} L ${coordinates[coordinates.length - 1].x} ${height - bottom} L ${coordinates[0].x} ${height - bottom} Z`
      : "";
    return { width, height, bottom, coordinates, line, area, maxAmount };
  }, [points]);

  if (loading) {
    return (
      <div className="roa-chart-state">
        <Spinner animation="border" size="sm" />
        <span>Loading revenue data…</span>
      </div>
    );
  }

  if (!chart.coordinates.length) {
    return (
      <div className="roa-chart-empty">
        <div className="roa-empty-icon">
          <FiCalendar />
        </div>
        <h3>No revenue data yet</h3>
        <p className="roa-muted mb-0">
          Once orders generate sales, your revenue trend will appear here.
        </p>
      </div>
    );
  }

  const labelIndexes = [
    ...new Set([
      0,
      Math.floor((chart.coordinates.length - 1) / 2),
      chart.coordinates.length - 1,
    ]),
  ];

  return (
    <div className="roa-chart-wrap">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span className="roa-muted small">Revenue (₦)</span>
        <span className="roa-muted small">
          {PERIODS.find((p) => p.value === period)?.label}
        </span>
      </div>
      <svg
        className="roa-revenue-svg"
        viewBox={`0 0 ${chart.width} ${chart.height}`}
        role="img"
        aria-label="Revenue chart for the selected period"
        preserveAspectRatio="none"
      >
        {[0, 1, 2, 3].map((line) => {
          const y = 18 + (line / 3) * (chart.height - 52);
          return (
            <line
              key={line}
              x1="12"
              x2="708"
              y1={y}
              y2={y}
              className="roa-chart-grid"
            />
          );
        })}
        <defs>
          <linearGradient id="roaRevenueFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#d8d51a" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#d8d51a" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        <path d={chart.area} fill="url(#roaRevenueFill)" />
        <path d={chart.line} className="roa-chart-line" />
        {chart.coordinates.map((point, index) => (
          <circle
            key={`${point.date}-${index}`}
            cx={point.x}
            cy={point.y}
            r="3.5"
            className="roa-chart-point"
          >
            <title>{`${dateLabel(point.date, period)}: ${money(point.amount)}`}</title>
          </circle>
        ))}
        {labelIndexes.map((index) => {
          const point = chart.coordinates[index];
          return (
            <text
              key={`${point.date}-label`}
              x={point.x}
              y={chart.height - 9}
              textAnchor={
                index === 0
                  ? "start"
                  : index === chart.coordinates.length - 1
                    ? "end"
                    : "middle"
              }
              className="roa-chart-label"
            >
              {dateLabel(point.date, period)}
            </text>
          );
        })}
      </svg>
      <div className="roa-chart-footer">
        <span>
          <span className="roa-chart-legend-dot" /> Revenue
        </span>
        <span className="roa-muted small">
          Peak:{" "}
          {money(
            Math.max(
              ...chart.coordinates.map((point) => Number(point.amount) || 0),
            ),
            true,
          )}
        </span>
      </div>
    </div>
  );
}

function OrderRow({ order, onClick }) {
  return (
    <button
      type="button"
      className="roa-order-row roa-dashboard-row-button"
      onClick={onClick}
      aria-label={`Open orders to manage ${order.orderNumber || "this order"}`}
    >
      <div className="roa-order-avatar">
        <FiShoppingBag />
      </div>
      <div className="flex-grow-1 min-w-0">
        <div className="d-flex flex-wrap align-items-center gap-2">
          <strong className="roa-order-name">
            {order.orderNumber ||
              (order.id ? `Order ${String(order.id).slice(-8)}` : "Order")}
          </strong>
          <span className={`roa-status roa-status-${statusTone(order.status)}`}>
            {String(order.status || "UNKNOWN")
              .replaceAll("_", " ")
              .toLowerCase()}
          </span>
        </div>
        <p className="roa-muted small mb-0 mt-1">
          {order.customerName || "Customer"} · {number(order.itemCount)}{" "}
          {Number(order.itemCount) === 1 ? "item" : "items"}
        </p>
        <p className="roa-muted small mb-0 mt-1">
          {dateTimeLabel(order.createdAt)}
        </p>
      </div>
      <strong className="roa-order-total">{money(order.total, true)}</strong>
    </button>
  );
}

function ProductRow({ product, onClick }) {
  return (
    <button
      type="button"
      className="roa-product-row roa-dashboard-row-button"
      onClick={onClick}
      aria-label={`Open product management for ${product.name || "this product"}`}
    >
      <div className="roa-product-image">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt="" loading="lazy" />
        ) : (
          <FiPackage aria-hidden="true" />
        )}
      </div>
      <div className="flex-grow-1 min-w-0">
        <p className="roa-product-name mb-1">
          {product.name || "Untitled product"}
        </p>
        <p className="roa-muted small mb-0">
          {number(product.quantitySold)} sold
        </p>
      </div>
      <strong className="roa-product-revenue">
        {money(product.revenue, true)}
      </strong>
    </button>
  );
}

export const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState("Overview");
  const [period, setPeriod] = useState("7d");
  const [overview, setOverview] = useState(EMPTY_OVERVIEW);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadOverview = async () => {
      setLoading(true);
      setError("");
      try {
        // Replace axios with your project's configured API client if it adds
        // bearer tokens or uses a custom base URL.
        const response = await axios.get(OVERVIEW_ENDPOINT, {
          params: { period },
          withCredentials: true,
        });
        if (!active) return;
        const payload = response?.data?.data ?? response?.data ?? {};
        setOverview({
          ...EMPTY_OVERVIEW,
          ...payload,
          store: { ...EMPTY_OVERVIEW.store, ...(payload.store ?? {}) },
          summary: { ...EMPTY_OVERVIEW.summary, ...(payload.summary ?? {}) },
          revenue: Array.isArray(payload.revenue) ? payload.revenue : [],
          recentOrders: Array.isArray(payload.recentOrders)
            ? payload.recentOrders
            : [],
          topProducts: Array.isArray(payload.topProducts)
            ? payload.topProducts
            : [],
        });
      } catch (requestError) {
        if (!active) return;
        setError(
          requestError?.response?.data?.message ||
            "We couldn't load your dashboard. Please try again.",
        );
      } finally {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    void loadOverview();
    return () => {
      active = false;
    };
  }, [period]);

  const refresh = () => {
    setRefreshing(true);
    // Changing the period triggers the effect; for same-period refresh, remount
    // the request by calling this helper below.
    setError("");
    axios
      .get(OVERVIEW_ENDPOINT, { params: { period }, withCredentials: true })
      .then((response) => {
        const payload = response?.data?.data ?? response?.data ?? {};
        setOverview({
          ...EMPTY_OVERVIEW,
          ...payload,
          store: { ...EMPTY_OVERVIEW.store, ...(payload.store ?? {}) },
          summary: { ...EMPTY_OVERVIEW.summary, ...(payload.summary ?? {}) },
          revenue: Array.isArray(payload.revenue) ? payload.revenue : [],
          recentOrders: Array.isArray(payload.recentOrders)
            ? payload.recentOrders
            : [],
          topProducts: Array.isArray(payload.topProducts)
            ? payload.topProducts
            : [],
        });
      })
      .catch((requestError) => {
        setError(
          requestError?.response?.data?.message ||
            "Refresh failed. Please try again.",
        );
      })
      .finally(() => setRefreshing(false));
  };

  const store = overview.store;
  const stats = overview.summary;
  const revenueChange =
    Number(stats.previousPeriodRevenue) > 0
      ? ((Number(stats.periodRevenue) - Number(stats.previousPeriodRevenue)) /
          Number(stats.previousPeriodRevenue)) *
        100
      : null;
  const storeOpen = store.status === "ACTIVE" && store.isOpen !== false;

  return (
    <section className="roa-dashboard pt-4 pt-lg-5">
      <style>{`
        .roa-dashboard{min-height:100vh;background:#080b09;color:#f6f7f2;padding-bottom:4rem}
        .roa-dashboard .roa-muted{color:#9ba69e}
        .roa-dashboard .roa-panel,.roa-dashboard .roa-stat-card{background:linear-gradient(145deg,#111813,#0d120e);border:1px solid #253329;border-radius:20px}
        .roa-dashboard .roa-panel{padding:clamp(18px,2.5vw,28px);height:100%}
        .roa-dashboard .roa-stat-card{padding:20px;box-shadow:0 12px 35px #0003;transition:transform .18s ease,border-color .18s ease}
        .roa-dashboard .roa-stat-card-button{display:block;width:100%;text-align:left;color:inherit;cursor:pointer;font:inherit}
        .roa-dashboard .roa-stat-card-button:focus-visible,.roa-dashboard .roa-dashboard-row-button:focus-visible{outline:2px solid #d8d51a;outline-offset:3px}
        .roa-dashboard .roa-dashboard-row-button{width:100%;text-align:left;color:inherit;font:inherit;background:transparent;border:0;cursor:pointer}
        .roa-dashboard .roa-dashboard-row-button:hover .roa-order-name,.roa-dashboard .roa-dashboard-row-button:hover .roa-product-name{color:#dedb23}
        .roa-dashboard .roa-stat-card:hover{transform:translateY(-2px);border-color:#64751e}
        .roa-dashboard .roa-stat-value{font-size:clamp(1.25rem,2.3vw,1.8rem);font-weight:750;letter-spacing:-.04em;overflow-wrap:anywhere}
        .roa-dashboard .roa-stat-detail{font-size:.8rem;color:#9ba69e}
        .roa-dashboard .roa-stat-icon{width:42px;height:42px;flex:0 0 42px;display:grid;place-items:center;border-radius:13px;font-size:1.15rem}
        .roa-dashboard .roa-stat-icon-yellow{background:#d8d51a18;color:#e5df29}
        .roa-dashboard .roa-stat-icon-green{background:#00d68f18;color:#00d68f}
        .roa-dashboard .roa-stat-icon-blue{background:#61b7ff18;color:#61b7ff}
        .roa-dashboard .roa-stat-icon-orange{background:#ffb45418;color:#ffb454}
        .roa-dashboard .roa-panel-title{font-size:1.05rem;font-weight:700;color:#f5f7f1}
        .roa-dashboard .roa-welcome{padding:clamp(24px,4vw,38px);border-radius:22px;background:radial-gradient(circle at 85% 15%,#e0dd2527,transparent 35%),linear-gradient(115deg,#17241a,#101611 70%);border:1px solid #35462b}
        .roa-dashboard .roa-eyebrow{color:#d9d62a;text-transform:uppercase;font-size:.72rem;font-weight:800;letter-spacing:.14em}
        .roa-dashboard .roa-welcome h1{font-size:clamp(1.7rem,3vw,2.35rem);font-weight:800;letter-spacing:-.045em}
        .roa-dashboard .roa-pill{display:inline-flex;align-items:center;gap:8px;padding:7px 11px;border:1px solid #324435;border-radius:999px;font-size:.8rem;color:#d9e1d9;background:#0b110d}
        .roa-dashboard .roa-pill-dot{width:7px;height:7px;border-radius:50%;background:#9ba69e}
        .roa-dashboard .roa-pill-open .roa-pill-dot{background:#00d68f;box-shadow:0 0 10px #00d68f88}
        .roa-dashboard .roa-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:1px solid #d8d51a;background:#d8d51a;color:#10130b;border-radius:11px;padding:10px 14px;font-size:.88rem;font-weight:750;text-decoration:none}
        .roa-dashboard .roa-btn:hover{background:#f1ed3d;color:#10130b}
        .roa-dashboard .roa-btn-outline{background:transparent;color:#e8e9df;border-color:#3b493b}
        .roa-dashboard .roa-btn-outline:hover{background:#182219;color:#fff}
        .roa-dashboard .roa-periods{display:flex;gap:5px;padding:4px;border:1px solid #29372c;background:#0a100c;border-radius:11px}
        .roa-dashboard .roa-period-button{border:0;background:transparent;color:#aab4ab;border-radius:8px;padding:7px 10px;font-size:.8rem;white-space:nowrap}
        .roa-dashboard .roa-period-button.active{background:#d8d51a;color:#12150c;font-weight:800}
        .roa-dashboard .roa-chart-wrap{width:100%}
        .roa-dashboard .roa-revenue-svg{width:100%;height:clamp(190px,28vw,260px);overflow:visible;display:block}
        .roa-dashboard .roa-chart-grid{stroke:#29352c;stroke-width:1;stroke-dasharray:4 6}
        .roa-dashboard .roa-chart-line{fill:none;stroke:#dedb23;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}
        .roa-dashboard .roa-chart-point{fill:#dedb23;stroke:#111813;stroke-width:2}
        .roa-dashboard .roa-chart-label{fill:#8d9b90;font-size:12px}
        .roa-dashboard .roa-chart-footer{display:flex;justify-content:space-between;align-items:center;margin-top:10px}
        .roa-dashboard .roa-chart-footer>span:first-child{display:flex;align-items:center;gap:8px;font-size:.82rem}
        .roa-dashboard .roa-chart-legend-dot{width:8px;height:8px;border-radius:50%;background:#dedb23}
        .roa-dashboard .roa-chart-state,.roa-dashboard .roa-chart-empty{min-height:250px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center}
        .roa-dashboard .roa-chart-empty h3{font-size:1rem;margin:0}
        .roa-dashboard .roa-empty-icon{display:grid;place-items:center;width:48px;height:48px;border-radius:15px;background:#d8d51a16;color:#dedb23;font-size:1.25rem}
        .roa-dashboard .roa-earning-total{font-size:clamp(1.8rem,4vw,2.7rem);font-weight:800;letter-spacing:-.05em}
        .roa-dashboard .roa-earning-metric{padding:14px;background:#0a100c;border:1px solid #29372c;border-radius:13px}
        .roa-dashboard .roa-earning-metric strong{display:block;margin-top:6px;font-size:1rem}
        .roa-dashboard .roa-order-row,.roa-dashboard .roa-product-row{display:flex;align-items:center;gap:12px;padding:15px 0;border-bottom:1px solid #243027}
        .roa-dashboard .roa-order-row:last-child,.roa-dashboard .roa-product-row:last-child{border-bottom:0;padding-bottom:0}
        .roa-dashboard .roa-order-avatar{width:40px;height:40px;flex:0 0 40px;display:grid;place-items:center;border-radius:12px;background:#d8d51a14;color:#e4df26}
        .roa-dashboard .roa-order-name,.roa-dashboard .roa-product-name{font-size:.88rem;color:#f2f5ef;overflow:hidden;text-overflow:ellipsis}
        .roa-dashboard .roa-order-total,.roa-dashboard .roa-product-revenue{font-size:.88rem;white-space:nowrap;color:#f3f5ed}
        .roa-dashboard .roa-status{font-size:.67rem;text-transform:capitalize;padding:4px 7px;border-radius:99px;background:#ffffff0d;color:#c4ccc4;white-space:nowrap}
        .roa-dashboard .roa-status-success{color:#50e2a4;background:#50e2a414}
        .roa-dashboard .roa-status-warning{color:#e8d74b;background:#e8d74b14}
        .roa-dashboard .roa-status-danger{color:#ff8585;background:#ff858514}
        .roa-dashboard .roa-status-info{color:#80c9ff;background:#80c9ff14}
        .roa-dashboard .roa-status-muted{color:#aab4ab;background:#ffffff0d}
        .roa-dashboard .roa-product-image{width:48px;height:48px;flex:0 0 48px;display:grid;place-items:center;overflow:hidden;border-radius:12px;background:#202b22;color:#b3bdab}
        .roa-dashboard .roa-product-image img{width:100%;height:100%;object-fit:cover}
        .roa-dashboard .roa-performance-item{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:15px 0;border-bottom:1px solid #243027}
        .roa-dashboard .roa-performance-item:last-child{border-bottom:0;padding-bottom:0}
        .roa-dashboard .roa-performance-item strong{color:#f5f7f1}
        .roa-dashboard .roa-alert{padding:14px 16px;border:1px solid #684b2b;background:#251b10;border-radius:13px;color:#f5d5a4}
        .roa-dashboard .roa-min-height{min-height:100%}
        @media(max-width:575px){.roa-dashboard .roa-panel{border-radius:16px}.roa-dashboard .roa-stat-card{padding:15px}.roa-dashboard .roa-stat-icon{width:35px;height:35px;flex-basis:35px}.roa-dashboard .roa-period-button{padding:7px 8px;font-size:.74rem}.roa-dashboard .roa-order-row{gap:8px}.roa-dashboard .roa-order-avatar{display:none}.roa-dashboard .roa-order-total{font-size:.78rem}}
      `}</style>

      <TopNav selectedTab={selectedTab} setSelectedTab={setSelectedTab} />

      <Container className="pt-4 pt-lg-5">
        {selectedTab === "Overview" && (
          <div className="d-flex flex-column gap-4">
            <header className="roa-welcome">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-4">
                <div>
                  <p className="roa-eyebrow mb-2">Seller workspace</p>
                  <h1 className="mb-2">
                    Welcome back{store.name ? ` to ${store.name}` : ""}
                  </h1>
                  <p className="roa-muted mb-3">
                    Your store at a glance. Review orders, track revenue, and
                    keep your listings moving.
                  </p>
                  <span
                    className={`roa-pill ${storeOpen ? "roa-pill-open" : ""}`}
                  >
                    <span className="roa-pill-dot" />
                    {storeOpen
                      ? "Store is open"
                      : `Store status: ${String(store.status || "UNKNOWN").toLowerCase()}`}
                  </span>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="roa-btn roa-btn-outline"
                    onClick={refresh}
                    disabled={refreshing}
                  >
                    <FiRefreshCw className={refreshing ? "roa-spinning" : ""} />{" "}
                    Refresh
                  </button>
                  <button
                    type="button"
                    className="roa-btn"
                    onClick={() => setSelectedTab("Products")}
                  >
                    Manage products <FiArrowRight />
                  </button>
                </div>
              </div>
            </header>

            {error && (
              <div
                className="roa-alert d-flex align-items-start gap-2"
                role="alert"
              >
                <FiAlertCircle className="mt-1 flex-shrink-0" />
                <div className="flex-grow-1">
                  <strong>Dashboard data unavailable</strong>
                  <p className="mb-2 mt-1">{error}</p>
                  <button
                    type="button"
                    className="roa-btn roa-btn-outline"
                    onClick={refresh}
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}

            <Row className="g-3">
              <Col xs={6} xl={4}>
                <StatCard
                  title="Today's sales"
                  value={loading ? "—" : money(stats.todaySales, true)}
                  detail="Gross sales recorded today"
                  icon={FiDollarSign}
                  tone="yellow"
                />
              </Col>
              <Col xs={6} xl={4}>
                <StatCard
                  title="Total orders"
                  value={loading ? "—" : number(stats.totalOrders)}
                  detail="Orders associated with your store · View orders"
                  icon={FiShoppingBag}
                  tone="blue"
                  onClick={() => setSelectedTab("Orders")}
                />
              </Col>
              <Col xs={6} xl={4}>
                <StatCard
                  title="Active products"
                  value={loading ? "—" : number(stats.activeProducts)}
                  detail="Listings currently active · Manage products"
                  icon={FiPackage}
                  tone="green"
                  onClick={() => setSelectedTab("Products")}
                />
              </Col>
              <Col xs={6} xl={4}>
                <StatCard
                  title="Seller earnings"
                  value={loading ? "—" : money(stats.sellerEarnings, true)}
                  detail="Funds released from your store orders in this period"
                  icon={FiDollarSign}
                  tone="green"
                />
              </Col>
              <Col xs={6} xl={4}>
                <StatCard
                  title="Pending orders"
                  value={loading ? "—" : number(stats.pendingOrders)}
                  detail="Orders needing your attention · View orders"
                  icon={FiClock}
                  tone="orange"
                  onClick={() => setSelectedTab("Orders")}
                />
              </Col>
              <Col xs={6} xl={4}>
                <StatCard
                  title="Low stock"
                  value={loading ? "—" : number(stats.lowStockProducts)}
                  detail="Products at or below the stock threshold · Manage products"
                  icon={FiBox}
                  tone="yellow"
                  onClick={() => setSelectedTab("Products")}
                />
              </Col>
            </Row>

            <Row className="g-3 align-items-stretch">
              <Col xs={12} xl={8}>
                <Panel
                  title="Revenue overview"
                  subtitle="Track sales revenue over time"
                  action={
                    <div
                      className="roa-periods"
                      role="group"
                      aria-label="Revenue chart period"
                    >
                      {PERIODS.map((option) => (
                        <button
                          type="button"
                          key={option.value}
                          className={`roa-period-button ${period === option.value ? "active" : ""}`}
                          aria-pressed={period === option.value}
                          onClick={() => setPeriod(option.value)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  }
                >
                  <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-3">
                    <div>
                      <p className="roa-muted mb-1 small">
                        Revenue in selected period
                      </p>
                      <div className="roa-earning-total">
                        {loading ? "—" : money(stats.periodRevenue)}
                      </div>
                    </div>
                    {revenueChange !== null && !loading && (
                      <span
                        className={`d-inline-flex align-items-center gap-1 small ${revenueChange >= 0 ? "text-success" : "text-danger"}`}
                      >
                        {revenueChange >= 0 ? (
                          <FiArrowUpRight />
                        ) : (
                          <FiArrowDownRight />
                        )}
                        {Math.abs(revenueChange).toFixed(1)}% vs previous period
                      </span>
                    )}
                  </div>
                  <RevenueChart
                    points={overview.revenue}
                    period={period}
                    loading={loading}
                  />
                </Panel>
              </Col>

              <Col xs={12} xl={4}>
                <Panel
                  title="Earnings snapshot"
                  subtitle="Store-specific funds, separate from your shared wallet"
                >
                  <p className="roa-muted small mb-1">
                    Seller earnings for this period
                  </p>
                  <div className="roa-earning-total mb-4">
                    {loading ? "—" : money(stats.sellerEarnings)}
                  </div>
                  <div className="roa-earning-metric mb-2">
                    <div className="d-flex align-items-center justify-content-between gap-2">
                      <span className="roa-muted small">
                        Order funds still held
                      </span>
                      <FiClock className="text-warning" />
                    </div>
                    <strong>{loading ? "—" : money(stats.heldEarnings)}</strong>
                  </div>
                  <div className="roa-earning-metric mb-4">
                    <div className="d-flex align-items-center justify-content-between gap-2">
                      <span className="roa-muted small">
                        Platform commission
                      </span>
                      <FiDollarSign className="roa-muted" />
                    </div>
                    <strong>
                      {loading ? "—" : money(stats.platformCommission)}
                    </strong>
                  </div>
                  <button
                    type="button"
                    className="roa-btn w-100"
                    onClick={() => navigate("/wallet")}
                  >
                    Manage wallet <FiArrowRight />
                  </button>
                </Panel>
              </Col>
            </Row>

            <Row className="g-3 align-items-stretch">
              <Col xs={12} xl={7}>
                <Panel
                  title="Recent orders"
                  subtitle="The latest activity from your store"
                  action={
                    <button
                      type="button"
                      className="roa-btn roa-btn-outline"
                      onClick={() => setSelectedTab("Orders")}
                    >
                      View all <FiArrowRight />
                    </button>
                  }
                >
                  {loading ? (
                    <div className="roa-chart-state">
                      <Spinner animation="border" size="sm" />
                      <span>Loading orders…</span>
                    </div>
                  ) : overview.recentOrders.length ? (
                    overview.recentOrders
                      .slice(0, 5)
                      .map((order, index) => (
                        <OrderRow
                          key={order.id || order.orderNumber || index}
                          order={order}
                          onClick={() => setSelectedTab("Orders")}
                        />
                      ))
                  ) : (
                    <div className="roa-chart-empty">
                      <div className="roa-empty-icon">
                        <FiShoppingBag />
                      </div>
                      <h3>No orders yet</h3>
                      <p className="roa-muted mb-0">
                        New orders will appear here when customers buy from your
                        store.
                      </p>
                    </div>
                  )}
                </Panel>
              </Col>
              <Col xs={12} xl={5}>
                <Panel
                  title="Top-selling products"
                  subtitle="Best performers in the selected period"
                  action={
                    <button
                      type="button"
                      className="roa-btn roa-btn-outline"
                      onClick={() => setSelectedTab("Products")}
                    >
                      Products <FiArrowRight />
                    </button>
                  }
                >
                  {loading ? (
                    <div className="roa-chart-state">
                      <Spinner animation="border" size="sm" />
                      <span>Loading products…</span>
                    </div>
                  ) : overview.topProducts.length ? (
                    overview.topProducts
                      .slice(0, 5)
                      .map((product, index) => (
                        <ProductRow
                          key={product.id || index}
                          product={product}
                          onClick={() => setSelectedTab("Products")}
                        />
                      ))
                  ) : (
                    <div className="roa-chart-empty">
                      <div className="roa-empty-icon">
                        <FiPackage />
                      </div>
                      <h3>No product sales yet</h3>
                      <p className="roa-muted mb-0">
                        Products with sales will appear here once customers
                        place orders.
                      </p>
                    </div>
                  )}
                </Panel>
              </Col>
            </Row>

            <Panel
              title="Store performance"
              subtitle="A quick view of your store's reach and fulfilment"
            >
              <Row className="g-3">
                <Col xs={6} md={3}>
                  <div className="roa-performance-item h-100">
                    <span className="roa-muted small d-flex align-items-center gap-2">
                      <FiUsers /> Followers
                    </span>
                    <strong>
                      {loading ? "—" : number(store.followerCount)}
                    </strong>
                  </div>
                </Col>
                <Col xs={6} md={3}>
                  <div className="roa-performance-item h-100">
                    <span className="roa-muted small d-flex align-items-center gap-2">
                      <FiStar /> Store rating
                    </span>
                    <strong>
                      {loading
                        ? "—"
                        : Number(store.averageRating) > 0
                          ? `${Number(store.averageRating).toFixed(1)} / 5`
                          : "Not rated"}
                    </strong>
                    {!loading && (
                      <span className="roa-muted small">
                        {number(store.reviewCount)} reviews
                      </span>
                    )}
                  </div>
                </Col>
                <Col xs={6} md={3}>
                  <div className="roa-performance-item h-100">
                    <span className="roa-muted small d-flex align-items-center gap-2">
                      <FiCheckCircle /> Completed orders
                    </span>
                    <strong>
                      {loading ? "—" : number(stats.completedOrders)}
                    </strong>
                  </div>
                </Col>
                <Col xs={6} md={3}>
                  <div className="roa-performance-item h-100">
                    <span className="roa-muted small d-flex align-items-center gap-2">
                      <FiEye /> Listing views
                    </span>
                    <strong>
                      {loading
                        ? "—"
                        : stats.listingViews == null
                          ? "Not tracked"
                          : number(stats.listingViews)}
                    </strong>
                  </div>
                </Col>
              </Row>
              <p className="roa-muted small mt-3 mb-0">
                Views and response-time analytics will only display once ROA
                records those events reliably.
              </p>
            </Panel>
          </div>
        )}

        {selectedTab === "Products" && <StoreProductPage />}
        {selectedTab === "Orders" && <StoreOrders />}
      </Container>
    </section>
  );
};

export default Dashboard;
