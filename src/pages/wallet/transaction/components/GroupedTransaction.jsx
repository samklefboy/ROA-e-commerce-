import { Stack } from "react-bootstrap";
import { motion } from "framer-motion";
import { container, fadedown } from "../../../../animation";
import { TYPE_CONFIG } from "../Transactions";
import { FiAlertCircle } from "react-icons/fi";
import { ChevronRight } from "react-bootstrap-icons";

export const STATUS_CONFIG = {
  COMPLETED: {
    label: "Completed",
    color: "#1D9E75",
    bg: "rgba(29,158,117,0.1)",
  },
  PENDING: { label: "Pending", color: "#e8d20b", bg: "#e8d20b1a" },
  FAILED: { label: "Failed", color: "#c0392b", bg: "rgba(192,57,43,0.1)" },
};

export function formatTime(dateString) {
  return new Date(dateString).toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function GroupedTransaction({
  grouped,
  setSelectedTnx,
  loading,
  transactions,
  search,
  activeFilter,
  datePreset,
  FILTER_TABS,
  setActiveFilter,
  setDatePreset,
  setSearch,
}) {
  return (
    <>
      {" "}
      {loading ? (
        <div className="my-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 12,
                padding: "12px 0",
                borderBottom: "0.5px solid #0f1a0f",
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  background: "#111a11",
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    height: 12,
                    background: "#111a11",
                    borderRadius: 5,
                    marginBottom: 7,
                    width: "60%",
                  }}
                />
                <div
                  style={{
                    height: 10,
                    background: "#111a11",
                    borderRadius: 5,
                    width: "80%",
                  }}
                />
              </div>
              <div
                style={{
                  height: 14,
                  width: 70,
                  background: "#111a11",
                  borderRadius: 5,
                }}
              />
            </div>
          ))}
        </div>
      ) : !loading && transactions.length === 0 ? (
        <div className="my-4" style={{ textAlign: "center" }}>
          <i
            className="ti ti-receipt-off"
            style={{
              fontSize: 48,
              color: "rgba(255,255,255,0.07)",
              display: "block",
              marginBottom: 14,
            }}
          />
          <p
            style={{
              fontSize: 15,
              color: "rgba(255,255,255,0.25)",
              fontWeight: 500,
              marginBottom: 6,
            }}
          >
            {search
              ? "No transactions match your search"
              : activeFilter !== "ALL"
                ? `No ${FILTER_TABS.find((t) => t.key === activeFilter)?.label.toLowerCase()} transactions`
                : datePreset !== "all"
                  ? "No transactions in this period"
                  : "No transactions yet"}
          </p>
          <p
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.15)",
              lineHeight: 1.6,
              marginBottom: 20,
            }}
          >
            {search
              ? "Try different search terms or clear the search"
              : "Your wallet transactions will appear here"}
          </p>
          {(search || activeFilter !== "ALL" || datePreset !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setActiveFilter("ALL");
                setDatePreset("all");
              }}
              style={{
                padding: "10px 20px",
                background: "#c9c14c",
                border: "none",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                color: "#1a1800",
                cursor: "pointer",
              }}
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        !loading &&
        grouped.map(([date, items]) => (
          <div key={date} className="my-4 my-lg-5">
            {/* Date group header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "14px 0 8px",
              }}
            >
              <p
                style={{
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                {date}
              </p>
              <div
                style={{ flex: 1, height: "0.5px", background: "#024202" }}
              />
              {/* Daily summary */}
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                {(() => {
                  const dayIn = items
                    .filter(
                      (t) =>
                        TYPE_CONFIG[t.type]?.isCredit &&
                        t.status === "COMPLETED",
                    )
                    .reduce((s, t) => s + t.amount, 0);
                  const dayOut = items
                    .filter(
                      (t) =>
                        !TYPE_CONFIG[t.type]?.isCredit &&
                        t.status === "COMPLETED",
                    )
                    .reduce((s, t) => s + t.amount, 0);
                  return (
                    <>
                      {dayIn > 0 && (
                        <p
                          style={{
                            color: "#1D9E75",
                            fontWeight: 600,
                          }}
                        >
                          +₦{dayIn.toLocaleString()}
                        </p>
                      )}
                      {dayOut > 0 && (
                        <p
                          style={{
                            color: "#c0392b",
                            fontWeight: 600,
                          }}
                        >
                          -₦{dayOut.toLocaleString()}
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            <motion.div variants={container} initial="hidden" animate="visible">
              {" "}
              {items.map((tx) => {
                const cfg = TYPE_CONFIG[tx.type] || TYPE_CONFIG.PURCHASE;
                const statusCfg =
                  STATUS_CONFIG[tx.status] || STATUS_CONFIG.COMPLETED;
                const isFailed = tx.status === "FAILED";
                const isCredit = cfg.isCredit && !isFailed;
                return (
                  <motion.div className=" my-3" key={tx.id} variants={fadedown}>
                    {" "}
                    <Stack
                      direction="horizontal"
                      gap={3}
                      onClick={() => setSelectedTnx(tx)}
                      className="align-items-center px-3 py-2 py-md-3"
                      style={{
                        background: "#e4e0e017",
                        borderRadius: 8,
                        cursor: "pointer",
                        opacity: isFailed ? 0.6 : 1,
                        borderBottom: "0.5px solid rgba(255, 255, 255, 0.53)",
                      }}
                    >
                      <div
                        className="p-2 d-flex"
                        style={{
                          width: 39,
                          height: 39,
                          borderRadius: "50%",
                          background: isFailed
                            ? "rgba(255,255,255,0.06)"
                            : cfg.bg,
                          border: `0.5px solid ${isFailed ? "rgba(255,255,255,0.08)" : cfg.color + "33"}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {isFailed ? (
                          <FiAlertCircle
                            style={{ fontSize: 18, color: "#666" }}
                          />
                        ) : (
                          <cfg.Icon
                            style={{ fontSize: 18, color: cfg.color }}
                          />
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            color: isFailed
                              ? "rgba(255, 255, 255, 0.43)"
                              : "#eee",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {tx.title}
                        </p>
                        <p
                          className="my-1 my-md-2 my-lg-2 my-xl-3"
                          style={{
                            color: "#c2bdbdb9",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            fontSize: 13,
                          }}
                        >
                          {tx.description}
                        </p>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            marginTop: 3,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 12,
                              color: "rgba(255, 255, 255, 0.25)",
                            }}
                          >
                            {formatTime(tx.createdAt)}
                          </span>
                          {tx.status !== "COMPLETED" && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 600,
                                color: statusCfg.color,
                                background: statusCfg.bg,
                                borderRadius: 4,
                                padding: "1px 6px",
                              }}
                            >
                              {statusCfg.label}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Amount + chevron */}
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <p
                          style={{
                            fontFamily: "'Syne',sans-serif",
                            fontWeight: 700,
                            color: isFailed
                              ? ""
                              : isCredit
                                ? "#1D9E75"
                                : "#c0392b",
                            margin: 0,
                          }}
                        >
                          {isFailed ? "" : isCredit ? "+" : "-"}₦
                          {tx.amount?.toLocaleString()}
                        </p>
                        <div
                          className="mt-1 mt-lg-3"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            gap: 4,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 13,
                              color: "rgba(255, 255, 255, 0.34)",
                            }}
                          >
                            {cfg.label}
                          </span>
                          <ChevronRight
                            style={{
                              fontSize: 13,
                              color: "rgba(255, 255, 255, 0.44)",
                            }}
                          />
                        </div>
                      </div>
                    </Stack>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        ))
      )}
    </>
  );
}
