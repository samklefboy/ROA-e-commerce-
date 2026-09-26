import { Stack } from "react-bootstrap";
import { FaClock, FaEnvelope } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { container, fadedown } from "../../../animation";
import { ArrowRight, X } from "react-bootstrap-icons";

function timeAgo(dateString) {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  return new Date(dateString).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
  });
}

export function GroupedTransaction({
  grouped,
  NOTIF_CONFIG,
  handleClick,
  loading,
  deleteNotification,
  deletingId,
}) {
  return (
    <>
      {" "}
      {!loading &&
        grouped.map(([dateLabel, notifs]) => (
          <div key={dateLabel} className="my-5">
            {/* Date group header */}
            <div
              className="mb-4"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <p
                style={{
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                  whiteSpace: "nowrap",
                }}
              >
                {dateLabel}
              </p>
              <div
                style={{ flex: 1, height: "0.5px", background: "#1a2a1a" }}
              />
            </div>

            {/* Notifications in this group */}
            <motion.div variants={container} initial="hidden" animate="visible">
              {notifs.map((notif) => {
                const config = NOTIF_CONFIG[notif.type];
                const isDeleting = deletingId === notif.id;

                if (!config) return null;

                return (
                  <AnimatePresence key={notif.id}>
                    {!isDeleting && (
                      <motion.div
                        className={`notif-tab mb-5 px-4 ${!notif.read ? "p-3" : "p-3"}`}
                        variants={fadedown}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.25 }}
                        onClick={() => handleClick(notif)}
                        style={{
                          background: !notif.read ? "#2e2b0165" : "#3534343f",
                          border: !notif.read
                            ? "1px solid #e4d8363b"
                            : "1px solid #ffffff23",
                          borderRadius: 12,
                        }}
                      >
                        {/* Unread indicator */}
                        {!notif.read && (
                          <FaEnvelope
                            className="notif-read"
                            size={20}
                            style={{ color: "#e4d836c9" }}
                          />
                        )}

                        <Stack
                          direction="horizontal"
                          className="align-items-start gap-3 gap-md-5"
                        >
                          {/* Icon with badge */}
                          <div
                            className="icon-tab mt-2"
                            style={{
                              background: config.bg,
                              border: `0.5px solid ${config.color}33`,
                            }}
                          >
                            <config.Icon
                              size={20}
                              style={{ color: config.color }}
                            />

                            {config.badge && (
                              <div
                                className="badge-tab"
                                style={{ background: config.badge.bg }}
                              >
                                <config.badge.Icon
                                  size={10}
                                  style={{ color: config.badge.color }}
                                />
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h5
                              style={{
                                lineHeight: 1.4,
                                color: notif.read ? "" : "#ddd",
                                fontWeight: notif.read ? 400 : 500,
                              }}
                              dangerouslySetInnerHTML={{ __html: notif.title }}
                            />
                            <p
                              className="text-white my-2 mb-3"
                              style={{
                                lineHeight: 1.5,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {notif.description}
                            </p>

                            {/* Time + CTA row */}
                            <div
                              className="my-3"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                              }}
                            >
                              <small
                                className="d-flex align-items-center gap-2"
                                style={{ color: "rgba(255, 255, 255, 0.3)" }}
                              >
                                <FaClock size={11} className="" />
                                {timeAgo(notif.createdAt)}
                              </small>

                              {/* Action required badge */}
                              {notif.requiresAction && !notif.read && (
                                <span
                                  className="p-1 px-2"
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: "#da3725",
                                    background: "rgba(192, 58, 43, 0.12)",
                                    borderRadius: 10,
                                  }}
                                >
                                  Action needed
                                </span>
                              )}
                            </div>

                            {/* CTA button */}
                            {config.cta && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClick(notif);
                                }}
                                style={{
                                  fontSize: 13,
                                  padding: "5px 12px",
                                  borderRadius: 10,
                                  cursor: "pointer",
                                  fontWeight: 600,
                                  background: `${config.color}12`,
                                  border: `0.5px solid ${config.color}33`,
                                  color: config.color,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 7,
                                  transition: "all 0.15s",
                                }}
                              >
                                <ArrowRight style={{ fontSize: 13 }} />
                                {config.cta.label}
                              </button>
                            )}
                          </div>

                          {/* Delete button */}
                          <div
                            onClick={(e) => deleteNotification(e, notif.id)}
                            style={{
                              flexShrink: 0,
                              padding: "2px 0",
                              cursor: "pointer",
                              opacity: 0.55,
                              transition: "opacity 0.15s",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.opacity = 1)
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.opacity = 0.4)
                            }
                          >
                            <X style={{ fontSize: 30, color: "#888" }} />
                          </div>
                        </Stack>
                      </motion.div>
                    )}
                  </AnimatePresence>
                );
              })}
            </motion.div>
          </div>
        ))}
    </>
  );
}
