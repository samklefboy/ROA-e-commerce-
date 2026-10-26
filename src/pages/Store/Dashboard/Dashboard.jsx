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
      <TopNav selectedTab={selectedTab} setSelectedTab={setSelectedTab} />

      <Container className="pt-4 pt-lg-5">
        {selectedTab === "Overview" && (
          <div className="d-flex flex-column gap-4 py-5">
            <Row className="g-3">
              <Col className="col-xxl-7">
                <header className="roa-welcome">
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-4">
                    <div>
                      <h1 className="mb-2" style={{ lineHeight: 1 }}>
                        Welcome back
                        {store.name ? ` to ${store.name}` : ""}
                      </h1>
                      <p className="roa-muted mb-3">
                        Your store at a glance. Review orders, track revenue,
                        and keep your listings moving.
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
                        <FiRefreshCw
                          className={refreshing ? "roa-spinning" : ""}
                        />{" "}
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

                <Row className="g-5 my-auto">
                  <Col xs={6} xl={4} xxl={6}>
                    <StatCard
                      title="Today's sales"
                      value={loading ? "—" : money(stats.todaySales, true)}
                      detail="Gross sales recorded today"
                      icon={FiDollarSign}
                      tone="yellow"
                    />
                  </Col>
                  <Col xs={6} xl={4} xxl={6}>
                    <StatCard
                      title="Total orders"
                      value={loading ? "—" : number(stats.totalOrders)}
                      detail="Orders associated with your store · View orders"
                      icon={FiShoppingBag}
                      tone="blue"
                      onClick={() => setSelectedTab("Orders")}
                    />
                  </Col>
                  <Col xs={6} xl={4} xxl={6}>
                    <StatCard
                      title="Active products"
                      value={loading ? "—" : number(stats.activeProducts)}
                      detail="Listings currently active · Manage products"
                      icon={FiPackage}
                      tone="green"
                      onClick={() => setSelectedTab("Products")}
                    />
                  </Col>
                  <Col xs={6} xl={4} xxl={6}>
                    <StatCard
                      title="Seller earnings"
                      value={loading ? "—" : money(stats.sellerEarnings, true)}
                      detail="Funds released from your store orders in this period"
                      icon={FiDollarSign}
                      tone="green"
                    />
                  </Col>
                  <Col xs={6} xl={4} xxl={6}>
                    <StatCard
                      title="Pending orders"
                      value={loading ? "—" : number(stats.pendingOrders)}
                      detail="Orders needing your attention · View orders"
                      icon={FiClock}
                      tone="orange"
                      onClick={() => setSelectedTab("Orders")}
                    />
                  </Col>
                  <Col xs={6} xl={4} xxl={6}>
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
              </Col>

              <Col className="col-xxl-5 d-none d-xxl-flex">
                <Row className="g-4 align-items-stretch">
                  <Col className="col-12">
                    <Panel
                      title="Recent orders"
                      subtitle="The latest activity from your store"
                      action={
                        <p
                          style={{ color: "#f9fd03" }}
                          onClick={() => setSelectedTab("Orders")}
                        >
                          View all <FiArrowRight />
                        </p>
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
                            New orders will appear here when customers buy from
                            your store.
                          </p>
                        </div>
                      )}
                    </Panel>
                  </Col>
                  <Col className="col-12">
                    <Panel
                      title="Top-selling products"
                      subtitle="Best performers in the selected period"
                      action={
                        <p
                          style={{ color: "#f9fd03" }}
                          onClick={() => setSelectedTab("Products")}
                        >
                          View all <FiArrowRight />
                        </p>
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
              </Col>

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
                          {Math.abs(revenueChange).toFixed(1)}% vs previous
                          period
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
                      <strong>
                        {loading ? "—" : money(stats.heldEarnings)}
                      </strong>
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

              <Row className="g-3 align-items-stretch d-flex d-xxl-none">
                <Col xs={12} xl={7}>
                  <Panel
                    title="Recent orders"
                    subtitle="The latest activity from your store"
                    action={
                      <p
                        style={{ color: "#fdf900" }}
                        onClick={() => setSelectedTab("Orders")}
                      >
                        View all <FiArrowRight />
                      </p>
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
                          New orders will appear here when customers buy from
                          your store.
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
                      <p
                        style={{ color: "#fdf900" }}
                        onClick={() => setSelectedTab("Products")}
                      >
                        View all <FiArrowRight />
                      </p>
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
                className="mt-5"
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
            </Row>
          </div>
        )}

        {selectedTab === "Products" && <StoreProductPage />}
        {selectedTab === "Orders" && <StoreOrders />}
      </Container>
    </section>
  );
};

export default Dashboard;
