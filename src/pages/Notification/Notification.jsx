import { Container, Row, Col } from "react-bootstrap";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FaBolt, FaMapPin, FaStore, FaTruckLoading } from "react-icons/fa";
import { FilterTabs } from "./components/FilterTabs";
import api from "../../services/api";
import { GroupedTransaction } from "./components/GroupedNotification";
import { FiAlertCircle, FiBellOff } from "react-icons/fi";
import {
  ArrowDown,
  Bell,
  BellFill,
  Check,
  CheckCircle,
  Heart,
  InfoCircle,
  Plus,
  Speaker,
  Star,
  Tag,
  Wallet,
  XCircle,
} from "react-bootstrap-icons";
import NavTop from "../../components/PageNav";

const NOTIF_CONFIG = {
  ORDER_IN_DELIVERY: {
    Icon: FaTruckLoading,
    color: "#c2b937",
    bg: "rgba(201,168,76,0.1)",
    badge: {
      Icon: FaMapPin,
      bg: "#c2b937",
      color: "#141301",
    },
    cta: {
      label: "Track order",
      route: "/orders",
    },
  },

  ORDER_DELIVERED: {
    Icon: CheckCircle,
    color: "#1D9E75",
    bg: "rgba(29,158,117,0.1)",
    badge: null,
    cta: {
      label: "Rate store",
      route: "/orders",
    },
  },

  ORDER_CANCELLED: {
    Icon: XCircle,
    color: "#c0392b",
    bg: "rgba(192,57,43,0.1)",
    badge: null,
    cta: {
      label: "View wallet",
      route: "/wallet/transactions",
    },
  },

  ORDER_CONFIRMED: {
    Icon: CheckCircle,
    color: "#378ADD",
    bg: "rgba(55,138,221,0.1)",
    badge: {
      Icon: Check,
      bg: "#378ADD",
      color: "#fff",
    },
    cta: {
      label: "View order",
      route: "/orders",
    },
  },

  STORE_NEW_PRODUCT: {
    Icon: FaStore,
    color: "#1D9E75",
    bg: "rgba(29,158,117,0.1)",
    badge: {
      Icon: Plus,
      bg: "#1D9E75",
      color: "#fff",
    },
    cta: {
      label: "View store",
      route: "/store",
    },
  },

  STORE_SALE: {
    Icon: Tag,
    color: "#D4537E",
    bg: "rgba(212,83,126,0.1)",
    badge: {
      Icon: FaBolt,
      bg: "#D4537E",
      color: "#fff",
    },
    cta: {
      label: "Shop sale",
      route: "/shop",
    },
  },

  PROMO: {
    Icon: Speaker,
    color: "#D4537E",
    bg: "rgba(212,83,126,0.1)",
    badge: {
      Icon: FaBolt,
      bg: "#D4537E",
      color: "#fff",
    },
    cta: {
      label: "Shop now",
      route: "/shop",
    },
  },

  WALLET: {
    Icon: Wallet,
    color: "#378ADD",
    bg: "rgba(55,138,221,0.1)",
    badge: {
      Icon: ArrowDown,
      bg: "#378ADD",
      color: "#fff",
    },
    cta: {
      label: "View wallet",
      route: "/wallet/transactions",
    },
  },

  WISHLIST_RESTOCK: {
    Icon: Heart,
    color: "#D4537E",
    bg: "rgba(212,83,126,0.1)",
    badge: {
      Icon: Check,
      bg: "#1D9E75",
      color: "#fff",
    },
    cta: {
      label: "Buy now",
      route: "/shop",
    },
  },

  REVIEW: {
    Icon: Star,
    color: "#c9a84c",
    bg: "rgba(201,168,76,0.1)",
    badge: null,
    cta: {
      label: "View review",
      route: "/seller/orders",
    },
  },

  SYSTEM: {
    Icon: InfoCircle,
    color: "#888",
    bg: "rgba(255,255,255,0.06)",
    badge: null,
    cta: null,
  },
};

//Filter tabs
const FILTER_TABS = [
  {
    key: "all",
    label: "All",
    types: null,
  },

  {
    key: "orders",
    label: "Orders",
    types: [
      "ORDER_IN_DELIVERY",
      "ORDER_DELIVERED",
      "ORDER_CANCELLED",
      "ORDER_CONFIRMED",
    ],
  },

  {
    key: "stores",
    label: "Stores",
    types: ["STORE_NEW_PRODUCT", "STORE_SALE"],
  },

  {
    key: "promos",
    label: "Promos",
    types: ["PROMO"],
  },

  {
    key: "wallet",
    label: "Wallet",
    types: ["WALLET"],
  },

  {
    key: "wishlist",
    label: "Wishlist",
    types: ["WISHLIST_RESTOCK"],
  },

  {
    key: "unread",
    label: "Unread",
    types: null,
    unreadOnly: true,
  },
];

/* DATE LABEL HELPER */
function getDateLabel(dateString) {
  if (!dateString) return "Earlier";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Earlier";
  }

  const today = new Date();
  const yesterday = new Date();

  today.setHours(0, 0, 0, 0);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const notificationDate = new Date(date);
  notificationDate.setHours(0, 0, 0, 0);

  if (notificationDate.getTime() === today.getTime()) {
    return "Today";
  }

  if (notificationDate.getTime() === yesterday.getTime()) {
    return "Yesterday";
  }

  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const NOTIFICATIONS_API = "/api/notifications";

const PAGE_SIZE = 30;

export default function Notifications() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [serverSummary, setServerSummary] = useState({
    total: 0,
    unread: 0,
    actionNeeded: 0,
  });

  const [filterCounts, setFilterCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [markingAll, setMarkingAll] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [markingReadId, setMarkingReadId] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const activeTab = useMemo(() => {
    return FILTER_TABS.find((tab) => tab.key === activeFilter);
  }, [activeFilter]);

  /*----Fetch notifications from the backend----*/
  const fetchNotifications = useCallback(
    async (pageNum = 1, reset = false) => {
      try {
        if (pageNum === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const params = {
          page: pageNum,
          limit: PAGE_SIZE,
          types:
            activeTab?.types?.length > 0
              ? activeTab.types.join(",")
              : undefined,

          unreadOnly: activeTab?.unreadOnly ? true : undefined,
        };

        const response = await api.get(NOTIFICATIONS_API, { params });

        const data = response?.data || {};

        const incomingNotifications = Array.isArray(data.notifications)
          ? data.notifications
          : [];

        if (reset || pageNum === 1) {
          setNotifications(incomingNotifications);
        } else {
          setNotifications((previous) => {
            /*
              Protect against duplicate notifications if the
              backend accidentally returns overlapping pages.
            */

            const existingIds = new Set(previous.map((item) => item.id));

            const uniqueIncoming = incomingNotifications.filter(
              (item) => !existingIds.has(item.id),
            );

            return [...previous, ...uniqueIncoming];
          });
        }
        setHasMore(Boolean(data.hasMore));
        setPage(Number(data.page) || pageNum);
        if (data.summary) {
          setServerSummary({
            total: Number(data.summary.total) || 0,
            unread: Number(data.summary.unread) || 0,
            actionNeeded: Number(data.summary.actionNeeded) || 0,
          });
        } else {
          setServerSummary({
            total: Number(data.total) || 0,
            unread: Number(data.unread) || 0,
            actionNeeded: Number(data.actionNeeded) || 0,
          });
        }
        if (data.counts) {
          setFilterCounts(data.counts);
        }
      } catch (err) {
        console.error("Notifications fetch failed:", err);
        if (pageNum === 1) {
          setNotifications([]);
          setHasMore(false);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeTab],
  );

  /*----Filter notifications when the active filter changes----*/
  useEffect(() => {
    setPage(1);

    fetchNotifications(1, true);
  }, [activeFilter, fetchNotifications]);

  /*---Mark a single notification as read---*/
  const markRead = useCallback(
    async (id) => {
      if (!id || markingReadId === id) return;

      const previousNotification = notifications.find(
        (notification) => notification.id === id,
      );

      if (!previousNotification || previousNotification.read) {
        return;
      }

      setMarkingReadId(id);

      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === id
            ? {
                ...notification,
                read: true,
              }
            : notification,
        ),
      );
      setServerSummary((previous) => ({
        ...previous,
        unread: Math.max(0, previous.unread - 1),
      }));

      try {
        await api.patch(`${NOTIFICATIONS_API}/${id}/read`);
      } catch (err) {
        setNotifications((previous) =>
          previous.map((notification) =>
            notification.id === id ? previousNotification : notification,
          ),
        );

        setServerSummary((previous) => ({
          ...previous,
          unread: previous.unread + 1,
        }));

        console.error("Mark notification read failed:", err);
      } finally {
        setMarkingReadId(null);
      }
    },
    [notifications, markingReadId],
  );

  /*---Mark all notifications as read---*/
  const markAllRead = useCallback(async () => {
    if (markingAll || serverSummary.unread <= 0) {
      return;
    }
    const previousNotifications = notifications;

    const previousSummary = serverSummary;

    setMarkingAll(true);
    setNotifications((previous) =>
      previous.map((notification) => ({
        ...notification,
        read: true,
      })),
    );

    setServerSummary((previous) => ({
      ...previous,
      unread: 0,
      actionNeeded: 0,
    }));

    try {
      await api.patch(`${NOTIFICATIONS_API}/read-all`);
    } catch (err) {
      setNotifications(previousNotifications);

      setServerSummary(previousSummary);

      console.error("Mark all notifications read failed:", err);
    } finally {
      setMarkingAll(false);
    }
  }, [markingAll, serverSummary, notifications]);

  /*---Delete a notification---*/
  const deleteNotification = useCallback(
    async (event, id) => {
      event.stopPropagation();

      if (!id || deletingId === id) return;

      const deletedNotification = notifications.find(
        (notification) => notification.id === id,
      );

      if (!deletedNotification) return;

      setDeletingId(id);

      setNotifications((previous) =>
        previous.filter((notification) => notification.id !== id),
      );
      setServerSummary((previous) => ({
        ...previous,
        total: Math.max(0, previous.total - 1),
        unread: !deletedNotification.read
          ? Math.max(0, previous.unread - 1)
          : previous.unread,
        actionNeeded:
          deletedNotification.requiresAction && !deletedNotification.read
            ? Math.max(0, previous.actionNeeded - 1)
            : previous.actionNeeded,
      }));

      try {
        await api.delete(`${NOTIFICATIONS_API}/${id}`);
      } catch (err) {
        setNotifications((previous) => {
          const alreadyExists = previous.some(
            (notification) => notification.id === id,
          );

          if (alreadyExists) {
            return previous;
          }

          return [...previous, deletedNotification].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
          );
        });

        setServerSummary((previous) => ({
          ...previous,
          total: previous.total + 1,
          unread: !deletedNotification.read
            ? previous.unread + 1
            : previous.unread,
          actionNeeded:
            deletedNotification.requiresAction && !deletedNotification.read
              ? previous.actionNeeded + 1
              : previous.actionNeeded,
        }));

        console.error("Delete notification failed:", err);
      } finally {
        setDeletingId(null);
      }
    },
    [notifications, deletingId],
  );

  /*---Handle click on a notification---*/
  const handleClick = useCallback(
    async (notification) => {
      if (!notification?.id) return;

      if (!notification.read) {
        markRead(notification.id);
      }

      const config = NOTIF_CONFIG[notification.type];

      const metadataRoute = notification.metadata?.route;

      const configuredRoute = config?.cta?.route;

      const destination =
        typeof metadataRoute === "string" && metadataRoute.startsWith("/")
          ? metadataRoute
          : configuredRoute || null;

      if (destination) {
        navigate(destination);
      }
    },
    [markRead, navigate],
  );

  /*-----SUMMARY COUNTS-----*/
  const summary = useMemo(() => {
    const localTotal = notifications.length;

    const localUnread = notifications.filter(
      (notification) => !notification.read,
    ).length;

    const localActionNeeded = notifications.filter(
      (notification) => notification.requiresAction && !notification.read,
    ).length;

    return {
      total: serverSummary.total || localTotal,

      unread: serverSummary.unread || localUnread,

      actionNeeded: serverSummary.actionNeeded || localActionNeeded,
    };
  }, [notifications, serverSummary]);

  /*-----FILTER COUNTS-----*/
  const displayedFilterCounts = useMemo(() => {
    if (Object.keys(filterCounts).length > 0) {
      return filterCounts;
    }

    const counts = {};

    FILTER_TABS.forEach((tab) => {
      if (tab.unreadOnly) {
        counts[tab.key] = notifications.filter(
          (notification) => !notification.read,
        ).length;

        return;
      }

      if (tab.types) {
        counts[tab.key] = notifications.filter((notification) =>
          tab.types.includes(notification.type),
        ).length;

        return;
      }

      counts[tab.key] = notifications.length;
    });

    return counts;
  }, [filterCounts, notifications]);

  /*-----GROUP NOTIFICATIONS BY DATE-----*/

  const grouped = useMemo(() => {
    const groups = {};

    const sortedNotifications = [...notifications].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );

    sortedNotifications.forEach((notification) => {
      const label = getDateLabel(notification.createdAt);

      if (!groups[label]) {
        groups[label] = [];
      }

      groups[label].push(notification);
    });

    return Object.entries(groups);
  }, [notifications]);

  /*-----LOAD MORE NOTIFICATIONS-----*/
  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore) {
      return;
    }

    fetchNotifications(page + 1, false);
  }, [loadingMore, hasMore, page, fetchNotifications]);

  return (
    <section className="notification">
      <NavTop
        title="Notification"
        notifAction={true}
        markAllRead={markAllRead}
        summary={summary}
        markingAll={markingAll}
      />

      <Container>
        {/* Summary */}

        <Row className="g-3 g-lg-4 g-xl-5 my-5 py-2">
          {[
            {
              num: summary.total,
              label: "Total",
              color: "#c6c930",
              Icon: BellFill,
            },

            {
              num: summary.unread,
              label: "Unread",
              color: summary.unread > 0 ? "#1D9E75" : "#888",
              Icon: Bell,
              pulse: summary.unread > 0,
            },

            {
              num: summary.actionNeeded,
              label: "Action needed",
              color: summary.actionNeeded > 0 ? "#c0392b" : "#888",
              Icon: FiAlertCircle,
              pulse: summary.actionNeeded > 0,
            },
          ].map(
            (summaryItem) =>
              summaryItem.num > 0 && (
                <Col key={summaryItem.label}>
                  <div
                    className="py-3"
                    style={{
                      background: "#9bd8013f",
                      border: summaryItem.pulse
                        ? `0.5px solid ${summaryItem.color}55`
                        : "none",
                      borderRadius: 12,
                      textAlign: "center",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {summaryItem.pulse && (
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          height: 3,
                          background: summaryItem.color,
                        }}
                      />
                    )}

                    <div className="d-flex justify-content-center">
                      <summaryItem.Icon
                        style={{
                          fontSize: 22,
                          color: summaryItem.color,
                        }}
                      />
                    </div>

                    <h6
                      className="my-2 my-lg-3 fw-bold"
                      style={{
                        fontFamily: "'Syne'",
                        color: summaryItem.color,
                        margin: 0,
                      }}
                    >
                      {summaryItem.num}
                    </h6>

                    <p className="mb-0">{summaryItem.label}</p>
                  </div>
                </Col>
              ),
          )}
        </Row>

        {/* ====================================================
            FILTER TABS
            ==================================================== */}

        <FilterTabs
          FILTERS={FILTER_TABS}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          filterCounts={displayedFilterCounts}
        />

        {/* ====================================================
            NOTIFICATIONS
            ==================================================== */}

        <div className="my-5 py-2">
          {/* Loading skeleton */}

          {loading && (
            <div>
              {[1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: "12px 0",
                    borderBottom: "0.5px solid #0f1a0f",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: "#111a11",
                      flexShrink: 0,
                    }}
                  />

                  <div
                    style={{
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        height: 12,
                        background: "#111a11",
                        borderRadius: 5,
                        marginBottom: 8,
                        width: "70%",
                      }}
                    />

                    <div
                      style={{
                        height: 10,
                        background: "#111a11",
                        borderRadius: 5,
                        width: "90%",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ==================================================
              EMPTY STATE
              ================================================== */}

          {!loading && grouped.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
              }}
            >
              <FiBellOff
                style={{
                  fontSize: 48,
                  color: "rgba(255,255,255,0.07)",
                  display: "block",
                  margin: "0 auto 14px",
                }}
              />

              <p
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  marginBottom: 6,
                }}
              >
                {activeFilter === "all"
                  ? "No notifications yet"
                  : activeFilter === "unread"
                    ? "All caught up 🎉"
                    : `No ${
                        FILTER_TABS.find(
                          (tab) => tab.key === activeFilter,
                        )?.label?.toLowerCase() || ""
                      } notifications`}
              </p>

              <p
                style={{
                  lineHeight: 1.6,
                  marginBottom: activeFilter !== "all" ? 20 : 0,
                }}
              >
                {activeFilter === "unread"
                  ? "You have read all your notifications"
                  : "You will be notified about orders, stores and promotions here"}
              </p>

              {activeFilter !== "all" && (
                <button
                  type="button"
                  onClick={() => setActiveFilter("all")}
                  style={{
                    padding: "10px 20px",
                    background: "#cac149",
                    border: "none",
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#181600",
                    cursor: "pointer",
                  }}
                >
                  View all notifications
                </button>
              )}
            </div>
          )}

          {/* ==================================================
              GROUPED NOTIFICATIONS
              ================================================== */}

          {!loading && grouped.length > 0 && (
            <GroupedTransaction
              grouped={grouped}
              handleClick={handleClick}
              NOTIF_CONFIG={NOTIF_CONFIG}
              loading={loading}
              deleteNotification={deleteNotification}
              deletingId={deletingId}
            />
          )}

          {/* LOAD MORE */}
          {hasMore && (
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="border-0 bg-transparent"
                style={{
                  color: "#cac149",
                  fontWeight: 600,
                  cursor: loadingMore ? "default" : "pointer",
                }}
              >
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          )}

          {/* End of list */}
          {!loading && !hasMore && notifications.length > 0 && (
            <p className="text-center mt-4">
              All {notifications.length} notification
              {notifications.length !== 1 ? "s" : ""} shown
            </p>
          )}
        </div>
      </Container>
    </section>
  );
}
