import { Modal } from "react-bootstrap";
import { motion, AnimatePresence } from "framer-motion";
import { TYPE_CONFIG } from "../Transactions";
import { STATUS_CONFIG } from "./GroupedTransaction";
import { Check, Copy, X } from "react-bootstrap-icons";
import { formatTime } from "./GroupedTransaction";
import { useState } from "react";
import { zoomIn } from "../../../../animation";
import { FaDownload } from "react-icons/fa";

export default function TransactionDetail({ txn, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!txn) return null;

  const cfg = TYPE_CONFIG[txn.type] || TYPE_CONFIG.PURCHASE;
  const status = STATUS_CONFIG[txn.status] || STATUS_CONFIG.COMPLETED;
  const isCredit = cfg.isCredit && txn.status !== "FAILED";

  const handleCopy = async (referenceNumber) => {
    try {
      await navigator.clipboard.writeText(referenceNumber);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (e) {
      console.log("copy failed", e);
    }
  };

  return (
    <AnimatePresence>
      {txn && (
        <Modal
          show={txn}
          onHide={onClose}
          centered
          backdrop="static"
          keyboard={false}
        >
          <Modal.Header style={{ zIndex: 1 }}>
            <Modal.Title className="d-flex align-items-center w-100">
              <h6 className="text-white">Transaction details</h6>
              <div className="d-flex align-items-center gap-3 ms-auto">
                <FaDownload size={22} />{" "}
                <X
                  className="text-white fs-1 "
                  onClick={onClose}
                  style={{ cursor: "pointer" }}
                />
              </div>
            </Modal.Title>
          </Modal.Header>

          <div
            className="modal_content"
            style={{ overflowY: "auto", height: "450px" }}
          >
            <Modal.Body>
              {/* Amount — hero */}
              <div className="mb-4" style={{ textAlign: "center" }}>
                <div
                  className="my-3"
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    background: cfg.bg,
                    border: `2px solid ${cfg.color}44`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px",
                  }}
                >
                  <cfg.Icon style={{ fontSize: 26, color: cfg.color }} />
                </div>
                <span
                  className="my-lg-1"
                  style={{
                    fontFamily: "'Syne',sans-serif",
                    fontSize: 25,
                    fontWeight: 800,
                    color: isCredit
                      ? "#1D9E75"
                      : txn.status === "FAILED"
                        ? ""
                        : "#c0392b",
                  }}
                >
                  {isCredit ? "+" : txn.status !== "FAILED" ? "-" : ""}₦
                  {txn.amount?.toLocaleString()}
                </span>
                <p className="my-1">{cfg.label}</p>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: status.color,
                    background: status.bg,
                    borderRadius: 20,
                    padding: "3px 12px",
                  }}
                >
                  {status.label}
                </span>
              </div>

              {/* Details table */}
              <div
                className="my-3"
                style={{
                  background: "#012501",
                  border: "0.5px solid #015001",
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                {[
                  { label: "Description", val: txn.title },
                  { label: "Details", val: txn.description },
                  {
                    label: "Date",
                    val: new Date(txn.createdAt).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }),
                  },
                  { label: "Time", val: formatTime(txn.createdAt) },
                  { label: "Reference", val: txn.reference, mono: true },
                  { label: "Type", val: cfg.label },
                ]
                  .filter((r) => r.val)
                  .map((row, i) => (
                    <div
                      className="p-3 "
                      key={row.label}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        borderTop: i > 0 ? "0.5px solid #1a2a1a" : "none",
                        gap: 12,
                      }}
                    >
                      <p>{row.label}</p>
                      <p
                        className="text-white "
                        style={{
                          fontWeight: 500,
                          textAlign: "right",
                          fontFamily: row.mono ? "monospace" : "inherit",
                          wordBreak: "break-all",
                        }}
                      >
                        {row.val}
                      </p>
                    </div>
                  ))}
              </div>
            </Modal.Body>

            <Modal.Footer>
              {/* Copy reference */}
              {txn.reference && (
                <button
                  className="my-3"
                  type="button"
                  onClick={() => {
                    handleCopy(txn.reference);
                  }}
                  style={{
                    width: "100%",
                    padding: "11px 0",
                    background: "transparent",
                    border: "0.5px solid #c7bd3273",
                    borderRadius: 10,
                    fontSize: 14,
                    color: "#c9bd1a",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  {copied ? (
                    <motion.div
                      variants={zoomIn}
                      initial="hidden"
                      animate="visible"
                    >
                      <Check style={{ fontSize: 14 }} /> Copied
                    </motion.div>
                  ) : (
                    <>
                      {" "}
                      <Copy style={{ fontSize: 14 }} />
                      Copy reference number
                    </>
                  )}
                </button>
              )}
            </Modal.Footer>
          </div>
        </Modal>
      )}
    </AnimatePresence>
  );
}
