import { Container, Stack } from "react-bootstrap";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
//import axios from "axios";
import NavTop from "../../components/PageNav";
import {
  FaArrowDown,
  FaArrowLeft,
  FaBolt,
  FaCheck,
  FaCheckCircle,
  FaHeart,
  FaMapPin,
  FaPlus,
  FaStopCircle,
  FaStore,
  FaStoreAlt,
  FaTag,
  FaTruckPickup,
  FaWallet,
} from "react-icons/fa";
import { FilterTabs } from "./components/FilterTabs";
import { GroupedTransaction } from "./components/GroupedNotification";

import { getNotificationsByUser } from "../../dummyData";

// notification type config
const NOTIF_CONFIG = {
  ORDER_ON_DELIVERING: {
    Icon: FaTruckPickup,
    color: "#e4d836",
    bg: "#c9c14c14",
    badge: { Icon: FaMapPin, bg: "#e4d836" },
    cta: { label: "Track order", route: "/orders" },
  },
  ORDER_DELIVERED: {
    Icon: FaCheckCircle,
    color: "#1D9E75",
    bg: "rgba(29,158,117,0.08)",
    badge: null,
    cta: { label: "Rate store", route: "/orders" },
  },
  ORDER_CANCELLED: {
    Icon: FaStopCircle,
    color: "#c0392b",
    bg: "rgba(192,57,43,0.08)",
    badge: null,
    cta: { label: "View wallet", route: "/wallet/transactions" },
  },
  STORE_NEW_PRODUCT: {
    Icon: FaStore,
    color: "#1D9E75",
    bg: "rgba(29,158,117,0.08)",
    badge: { Icon: FaPlus, bg: "#1D9E75" },
    cta: { label: "View store", route: "/store" },
  },
  STORE_SALE: {
    Icon: FaStoreAlt,
    color: "#1D9E75",
    bg: "rgba(29,158,117,0.08)",
    badge: null,
    cta: { label: "View store", route: "/store" },
  },
  PROMO: {
    Icon: FaTag,
    color: "#D4537E",
    bg: "rgba(212,83,126,0.08)",
    badge: { Icon: FaBolt, bg: "#D4537E" },
    cta: { label: "Shop now", route: "/shop" },
  },
  WALLET: {
    Icon: FaWallet,
    color: "#378ADD",
    bg: "rgba(55,138,221,0.08)",
    badge: { Icon: FaArrowDown, bg: "#378ADD" },
    cta: { label: "View wallet", route: "/wallet/transactions" },
  },
  WISHLIST_RESTOCK: {
    Icon: FaHeart,
    color: "#D4537E",
    bg: "rgba(212,83,126,0.08)",
    badge: { Icon: FaCheck, bg: "#D4537E" },
    cta: { label: "Buy now", route: "/shop" },
  },
};

// filter tabs config
const FILTERS = [
  { key: "all", label: "All" },
  {
    key: "order",
    label: "Orders",
    types: ["ORDER_ON_DELIVERING", "ORDER_DELIVERED", "ORDER_CANCELLED"],
  },
  { key: "store", label: "Stores", types: ["STORE_NEW_PRODUCT", "STORE_SALE"] },
  { key: "promo", label: "Promos", types: ["PROMO"] },
  { key: "wallet", label: "Wallet", types: ["WALLET"] },
  { key: "wishlist", label: "Wishlist", types: ["WISHLIST_RESTOCK"] },
];

// fetch from backend
{
  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        //   const { data } = await axios.get("/api/notifications");
        //   setNotifications(/* data */);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);
}

// date grouping
function getDateLabel(dateString) {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const txDate = new Date(dateString).toDateString();

  if (txDate === today) return "Today";
  if (txDate === yesterday) return "Yesterday";

  return new Date(dateString).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function Notifications() {
  //  const [notifications, setNotifications] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const notifications = getNotificationsByUser("user-001");

  // filter count per tab
  const filterCounts = useMemo(() => {
    const counts = {};
    FILTERS.forEach((f) => {
      counts[f.key] = f.types
        ? notifications.filter((n) => f.types.includes(n.type)).length
        : notifications.length;
    });
    return counts;
  }, [notifications]);

  // filtered notifications — useMemo
  const filtered = useMemo(() => {
    const activeTab = FILTERS.find((f) => f.key === activeFilter);
    if (!activeTab?.types) return notifications;
    return notifications.filter((n) => activeTab.types.includes(n.type));
  }, [notifications, activeFilter]);

  // sort newest first then group by date
  const grouped = useMemo(() => {
    const groups = {};
    const sorted = [...filtered].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
    sorted.forEach((notif) => {
      const label = getDateLabel(notif.createdAt);
      if (!groups[label]) groups[label] = [];
      groups[label].push(notif);
    });
    return groups;
  }, [filtered]);

  // mark all read — useCallback
  const markAllRead = useCallback(async () => {
    try {
      await axios.patch("/api/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  }, []);

  // mark single read — useCallback
  const markRead = useCallback(async (id) => {
    try {
      await axios.patch(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    } catch (err) {
      console.error(err);
    }
  }, []);

  // handle notification click — useCallback
  const handleClick = useCallback(
    (notif) => {
      markRead(notif.id);
      const config = NOTIF_CONFIG[notif.type];
      if (config?.cta?.route) navigate(config.cta.route);
    },
    [markRead, navigate],
  );

  return (
    <section className="notification">
      <Container>
        <div
          className="d-flex  align-items-center justify-content-between p-3 py-4 fixed-top"
          style={{ background: "#000", borderRadius: 12 }}
        >
          <Container>
            <div className="d-flex gap-3 gap-md-5 align-items-center">
              <div
                onClick={() => navigate(-1)}
                className="d-flex align-items-center "
                style={{
                  background: "#ffffff42",

                  borderRadius: "100%",
                  padding: "10px",
                }}
              >
                <FaArrowLeft size={15} />
              </div>

              <h3 className="text-light">
                <b>Notifications</b>
              </h3>
            </div>

            {filterCounts > 0 && (
              <h6
                onClick={markAllRead}
                style={{ color: "#facc15", cursor: "pointer" }}
              >
                Mark all read
              </h6>
            )}
          </Container>
        </div>

        {/* Filter tabs */}
        <FilterTabs
          FILTERS={FILTERS}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          filterCounts={filterCounts}
        />

        {/* Notifications grouped by date */}

        <GroupedTransaction
          grouped={grouped}
          handleClick={handleClick}
          NOTIF_CONFIG={NOTIF_CONFIG}
          loading={loading}
        />
      </Container>
    </section>
  );
}
