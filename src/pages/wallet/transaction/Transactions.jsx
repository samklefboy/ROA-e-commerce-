import { Container } from "react-bootstrap";
import { useNavigate } from "react-router";
import { FaArrowLeft, FaDownload, FaShoppingBag } from "react-icons/fa";
import { useState, useMemo, useEffect, useCallback } from "react";
import { SummaryCard } from "./components/SummaryCard";
import { SearchBar } from "./components/Searchbar";
import { FilterChip } from "./components/Filter";
import { GroupedTransaction } from "./components/GroupedTransaction";
import TransactionDetail from "./components/TransactionDetail";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  CreditCard,
} from "react-bootstrap-icons";
import { FiRefreshCw } from "react-icons/fi";
import CustomDate from "./components/DateFilter";

/// ============================================================
// TRANSACTION TYPE CONFIG
// ============================================================
export const TYPE_CONFIG = {
  TOPUP: {
    label: "Top up",
    Icon: ArrowDownCircle,
    color: "#1D9E75",
    bg: "rgba(29,158,117,0.1)",
    sign: "+",
    isCredit: true,
  },
  SALE: {
    label: "Sale received",
    Icon: FaShoppingBag,
    color: "#1D9E75",
    bg: "rgba(29,158,117,0.1)",
    sign: "+",
    isCredit: true,
  },
  REFUND: {
    label: "Refund",
    Icon: FiRefreshCw,
    color: "#1D9E75",
    bg: "rgba(29,158,117,0.1)",
    sign: "+",
    isCredit: true,
  },
  PURCHASE: {
    label: "Purchase",
    Icon: CreditCard,
    color: "#c0392b",
    bg: "rgba(192,57,43,0.1)",
    sign: "-",
    isCredit: false,
  },
  WITHDRAWAL: {
    label: "Withdrawal",
    Icon: ArrowUpCircle,
    color: "#c0392b",
    bg: "rgba(192,57,43,0.1)",
    sign: "-",
    isCredit: false,
  },
};

// ============================================================
// FILTER TABS
// ============================================================
const FILTER_TABS = [
  { key: "ALL", label: "All" },
  { key: "CREDIT", label: "Money in" },
  { key: "DEBIT", label: "Money out" },
  { key: "TOPUP", label: "Top ups" },
  { key: "WITHDRAWAL", label: "Withdrawals" },
  { key: "PURCHASE", label: "Purchases" },
  { key: "SALE", label: "Sales" },
  { key: "REFUND", label: "Refunds" },
];

// ============================================================
// DATE RANGE PRESETS
// ============================================================
export const DATE_PRESETS = [
  { key: "all", label: "All time" },
  { key: "today", label: "Today" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "3months", label: "Last 3 months" },
  { key: "custom", label: "Custom range" },
];
// ============================================================
// HELPERS
// ============================================================
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

function getDateRangeFromPreset(preset) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case "today":
      return { from: today, to: new Date(today.getTime() + 86400000 - 1) };
    case "week": {
      const day = today.getDay();
      const from = new Date(today.getTime() - day * 86400000);
      return { from, to: now };
    }
    case "month": {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from, to: now };
    }
    case "3months": {
      const from = new Date(today.getFullYear(), today.getMonth() - 3, 1);
      return { from, to: now };
    }
    default:
      return null;
  }
}

export function Transactions() {
  const navigate = useNavigate();

  // ---- states ----
  const [transactions, setTransactions] = useState([]);
  const [walletSummary, setWalletSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [datePreset, setDatePreset] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [dateOpen, setDateOpen] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const PAGE_SIZE = 20;

  const dateRange = useMemo(() => {
    datePreset !== "custom"
      ? getDateRangeFromPreset(datePreset)
      : customFrom && customTo
        ? { from: new Date(customFrom), to: new Date(customTo) }
        : null;
  }, [datePreset, customFrom, customTo]);

  // FETCH TRANSACTIONS
  const fetchTransactions = useCallback(
    async (pageNum = 1, reset = false) => {
      try {
        if (pageNum === 1) setLoading(true);
        else setLoadingMore(true);

        const { data } = await axios.get("/api/wallet/transactions", {
          params: {
            page: pageNum,
            limit: PAGE_SIZE,
            type:
              activeFilter === "ALL" ||
              activeFilter === "CREDIT" ||
              activeFilter === "DEBIT"
                ? undefined
                : activeFilter,
            credit: activeFilter === "CREDIT" ? true : undefined,
            debit: activeFilter === "DEBIT" ? true : undefined,
            search: search.trim() || undefined,
            dateFrom: dateRange?.from?.toISOString() || undefined,
            dateTo: dateRange?.to?.toISOString() || undefined,
            status: undefined, // pass "FAILED" to filter failed only
          },
        });

        const incomingTransactions = Array.isArray(data.transactions)
          ? data.transactions
          : [];

        if (reset || pageNum === 1) {
          setTransactions(incomingTransactions);
        } else {
          setTransactions((prev) => [...prev, ...incomingTransactions]);
        }
        setHasMore(data.hasMore);
        setPage(pageNum || Number(data.page));
      } catch (err) {
        console.error("Transactions fetch failed:", err);
        if (pageNum === 1) {
          setTransactions([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeFilter, search, dateRange],
  );

  // FETCH WALLET SUMMARY
  const fetchSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      const { data } = await axios.get("/api/wallet/summary", {
        params: {
          dateFrom: dateRange?.from?.toISOString(),
          dateTo: dateRange?.to?.toISOString(),
        },
      });
      setWalletSummary(data);
    } catch (err) {
      console.error("wallet summary fetch failed", err);
      setWalletSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // FETCH TRANSACTIONS WHEN FILTER CHANGES
  useEffect(() => {
    if (datePreset === "custom" && (!customFrom || !customTo)) {
      return;
    }

    fetchTransactions(1, true);
  }, [fetchTransactions, datePreset, customFrom, customTo]);

  // GROUP BY DATE — useMemo
  const grouped = useMemo(() => {
    const groups = {};
    transactions.forEach((txn) => {
      const label = getDateLabel(txn.createdAt);
      if (!groups[label]) groups[label] = [];
      groups[label].push(txn);
    });
    return Object.entries(groups);
  }, [transactions]);

  const tabCounts = walletSummary?.counts || {};

  return (
    <>
      {/* Topbar */}
      <div
        className="py-3 fixed-top"
        style={{
          background: "#001402c5",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderBottom: "#025e0bd5",
        }}
      >
        <Container>
          <div className=" d-flex align-items-center justify-content-between ">
            {" "}
            <div className="d-flex gap-3 gap-md-5 align-items-center">
              <div
                onClick={() => navigate(-1)}
                className="d-flex align-items-center"
                style={{
                  background: "#ffffff42",
                  borderRadius: "100%",
                  padding: "10px",
                }}
              >
                <FaArrowLeft size={15} />
              </div>

              <h4 className="text-light fw-bold">Transactions</h4>
            </div>
            <div className="d-flex align-items-center gap-4">
              {/* Date filter */}
              <button
                className="d-flex align-items-center gap-2"
                type="button"
                onClick={() => setDateOpen(true)}
                style={{
                  background: datePreset !== "all" ? "#c9c14c31" : "#015501a4",
                  border: `0.5px solid ${datePreset !== "all" ? "#c9c14cd5" : "#1a2a1a"}`,
                  borderRadius: 8,
                  padding: "6px 10px",
                  fontSize: 13,
                  color: datePreset !== "all" ? "#e2d51c" : "#b6b6b6",
                  cursor: "pointer",
                }}
              >
                <Calendar style={{ fontSize: 15 }} />
                {DATE_PRESETS.find((d) => d.key === datePreset).label ||
                  "All time"}
              </button>
            </div>
          </div>
        </Container>
      </div>

      <Container>
        <section style={{ marginTop: "110px" }}>
          {/* Summary card */}
          <SummaryCard
            summary={walletSummary}
            summaryLoading={summaryLoading}
          />

          {/* Search */}
          <SearchBar search={search} setSearch={setSearch} />

          {/* Filters */}
          <FilterChip
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            FILTERS={FILTER_TABS}
            tabCounts={tabCounts}
          />

          {/* Results count */}
          <div className="px-3 d-flex align-items-center justify-content-between">
            <p>
              {transactions.length} transaction
              {transactions.length !== 1 ? "s" : ""}
              {search && ` matching "${search}"`}
            </p>
            {walletSummary?.failedCount > 0 && (
              <p
                className="px-3 py-1"
                style={{
                  color: "#c0392b",
                  background: "rgba(192, 58, 43, 0.21)",
                  borderRadius: 7,
                }}
              >
                {walletSummary?.failedCount} failed
              </p>
            )}
          </div>

          {/* Grouped transactions */}
          <GroupedTransaction
            grouped={grouped}
            loading={loading}
            setSelectedTnx={setSelectedTxn}
            transactions={transactions}
            search={search}
            activeFilter={activeFilter}
            datePreset={datePreset}
            FILTER_TABS={FILTER_TABS}
            setActiveFilter={setActiveFilter}
            setDatePreset={setDatePreset}
            setSearch={setSearch}
          />

          {/* Load more */}
          {hasMore && (
            <div style={{ padding: "16px 0", textAlign: "center" }}>
              <button
                type="button"
                onClick={() => fetchTransactions(page + 1)}
                disabled={loadingMore}
                style={{
                  padding: "10px 28px",
                  background: "transparent",
                  border: "0.5px solid rgba(255,255,255,0.1)",
                  borderRadius: 10,
                  fontSize: 13,
                  color: "#888",
                  cursor: "pointer",
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                }}
              >
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          )}

          {/* End of list */}
          {!loading && !hasMore && transactions.length > 0 && (
            <p
              style={{
                textAlign: "center",
              }}
            >
              All {transactions.length} transactions shown
            </p>
          )}
        </section>
      </Container>

      {/* Date filter bottom sheet */}
      {dateOpen && (
        <CustomDate
          setDateOpen={setDateOpen}
          setDatePreset={setDatePreset}
          datePreset={datePreset}
          customFrom={customFrom}
          setCustomFrom={setCustomFrom}
          customTo={customTo}
          setCustomTo={setCustomTo}
        />
      )}

      {/* TRANSACTION DETAIL SHEET */}
      {selectedTxn && (
        <TransactionDetail
          txn={selectedTxn}
          onClose={() => setSelectedTxn(null)}
        />
      )}
    </>
  );
}
