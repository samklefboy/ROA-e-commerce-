import { motion, AnimatePresence } from "framer-motion";
import { Form, Container, Modal, Row, Col } from "react-bootstrap";
import { DATE_PRESETS } from "../Transactions";
import { Check, ChevronRight, X } from "react-bootstrap-icons";
import { useState } from "react";

function CustomDate({
  setDateOpen,
  setDatePreset,
  datePreset,
  customFrom,
  setCustomFrom,
  customTo,
  setCustomTo,
}) {
  const [openModal, setOpenModal] = useState(false);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setDateOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.53)",
          zIndex: 100,
          display: "flex",
          alignItems: "flex-end",
        }}
      >
        <motion.div
          className="filter_bottom-sheet mx-sm-2"
          initial={{ y: 400 }}
          animate={{ y: 0 }}
          exit={{ y: 400 }}
          transition={{ type: "spring", damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "#172417",
            borderRadius: "20px 20px 0 0",
            width: "100%",
            paddingBottom: 24,
            maxHeight: "40vh",
            overflowY: "auto",
          }}
        >
          <Container>
            <div
              className="py-4 d-flex align-items-center justify-content-between"
              style={{
                borderBottom: "0.5px solid #014b0163",
              }}
            >
              <p className="text-white" style={{ fontWeight: 600 }}>
                Filter by date
              </p>
              <button
                type="button"
                onClick={() => setDateOpen(false)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "#014b0163",
                  border: "none",
                  color: "#aaa",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X style={{ fontSize: 20 }} />
              </button>
            </div>

            {/* Preset options */}
            {DATE_PRESETS.filter((d) => d.key !== "custom").map((preset) => (
              <div
                className="d-flex align-items-center justify-content-between p-3"
                key={preset.key}
                onClick={() => {
                  setDatePreset(preset.key);
                  if (preset.key !== "custom") setDateOpen(false);
                }}
                style={{
                  cursor: "pointer",
                  background:
                    datePreset === preset.key ? "#38350e" : "transparent",
                  borderBottom: "0.5px solid #014b0163",
                  transition: "all 0.3s ease",
                }}
              >
                <p
                  style={{
                    color: datePreset === preset.key ? "#c9b929" : "",
                    fontWeight: datePreset === preset.key ? 600 : 400,
                  }}
                >
                  {preset.label}
                </p>
                {datePreset === preset.key && (
                  <Check style={{ fontSize: 20, color: "#c9b929" }} />
                )}
              </div>
            ))}

            {/* Custom date range */}
            <div
              className="p-3"
              style={{
                borderBottom: "0.5px solid #014b0163",
              }}
            >
              <div
                className="d-flex align-items-center justify-content-between"
                onClick={() => {
                  setDatePreset("custom");
                  setOpenModal(true);
                }}
                style={{
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    color: datePreset === "custom" ? "#c9a84c" : "#ccc",
                    fontWeight: datePreset === "custom" ? 600 : 400,
                  }}
                >
                  Custom range
                </span>

                <ChevronRight style={{ fontSize: 14, color: "#888" }} />
              </div>
            </div>

            {/* Clear date filter */}
            {datePreset !== "all" && (
              <div className="py-4">
                <button
                  type="button"
                  onClick={() => {
                    setDatePreset("all");
                    setCustomFrom("");
                    setCustomTo("");
                    setDateOpen(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 0",
                    background: "transparent",
                    border: "0.5px solid rgba(192, 58, 43, 0.45)",
                    borderRadius: 10,
                    fontSize: 15,
                    color: "#c72817",
                    cursor: "pointer",
                  }}
                >
                  Clear date filter
                </button>
              </div>
            )}
          </Container>

          {openModal && (
            <AnimatePresence>
              <Modal
                show={openModal}
                onHide={() => setOpenModal(false)}
                centered
                backdrop="static"
                keyboard={false}
              >
                <Modal.Header>
                  <Modal.Title className="d-flex align-items-center w-100">
                    <p className="text-white"> Custom date range</p>
                    <X
                      className="text-white fs-2 ms-auto"
                      onClick={() => setOpenModal(false)}
                      style={{ cursor: "pointer" }}
                    />
                  </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                  <Row>
                    <Col className="col-12 col-sm-6 mb-4">
                      <Form.Label
                        style={{
                          letterSpacing: 1,
                        }}
                      >
                        From
                      </Form.Label>
                      <Form.Control
                        type="date"
                        value={customFrom}
                        onChange={(e) => setCustomFrom(e.target.value)}
                      />
                    </Col>
                    <Col>
                      <Form.Label
                        style={{
                          letterSpacing: 1,
                        }}
                      >
                        To
                      </Form.Label>
                      <Form.Control
                        type="date"
                        value={customTo}
                        onChange={(e) => setCustomTo(e.target.value)}
                      />
                    </Col>
                  </Row>
                </Modal.Body>

                <Modal.Footer>
                  <div className=" w-100">
                    <button
                      type="button"
                      onClick={() => {
                        if (customFrom && customTo) {
                          setOpenModal(false);
                          setDateOpen(false);
                        }
                      }}
                      disabled={!customFrom || !customTo}
                      style={{
                        width: "100%",
                        padding: "10px 0",
                        background:
                          customFrom && customTo ? "#c0b231" : "#014b0163",
                        border: "none",
                        borderRadius: 10,
                        fontSize: 15,
                        fontWeight: 700,
                        color: customFrom && customTo ? "#1a1000" : "#555",
                        cursor:
                          customFrom && customTo ? "pointer" : "not-allowed",
                      }}
                    >
                      Apply custom range
                    </button>
                  </div>
                </Modal.Footer>
              </Modal>{" "}
            </AnimatePresence>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default CustomDate;
