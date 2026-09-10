import { useState, useCallback, useEffect } from "react";
import { Row, Col, Form, Modal } from "react-bootstrap";
import { SortAlphaDown } from "react-bootstrap-icons";

const SORT_OPTIONS = [
  "Newest first",
  "Most popular",
  "Price: low to high",
  "Price: high to low",
  "Top rated",
  "Most sold",
];

const STORE_SORT_OPTIONS = [
  "Newest first",
  "Best selling",
  "Low stock",
  "Price: low to high",
  "Price: high to low",
];

function ProductFilter({
  selectedCategory,
  setSelectedCategory,
  setSort,
  sort,
  CATEGORIES,
  Shop,
  Store,
  storeFront,
}) {
  const [sortOpen, setSortOpen] = useState(false);

  // handle sort apply — useCallback
  const handleSort = useCallback(
    (value) => {
      setSort(value);
      setSortOpen(false);
    },
    [setSort],
  );

  return (
    <div
      className="py-2 py-sm-1 py-md-2 px-4 px-lg-5 "
      style={{
        position: "sticky",
        top: 82,
        zIndex: 30,
        background: "#011d0870",
        backdropFilter: " blur(8px)",
        WebkitBackdropFilter: " blur(10px)",
        borderRadius: 20,
        border: "0.5px solid #000",
      }}
    >
      {" "}
      <Row className="align-items-center g-2 ">
        <Col className={` ${!Store ? "col-9 col-sm-8" : "col-9 col-sm-8"}`}>
          {/* Category filter chips */}
          <span className="filter-tab gap-4 gap-lg-5 hide-scrollbar py-sm-3">
            {" "}
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: isActive ? 600 : 400,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s",
                    border: "none",
                    background: "none",
                  }}
                >
                  <h6
                    style={{
                      color: isActive ? "#eeff00" : "#fff",
                      letterSpacing: 1,
                    }}
                  >
                    {cat}
                  </h6>
                </button>
              );
            })}
          </span>
        </Col>

        {(Store || storeFront) && (
          <Col className="  col-sm-4 d-flex">
            <div className="ms-auto ">
              <button
                onClick={() => setSortOpen(true)}
                style={{
                  background: "#d2e01628",
                  borderRadius: 10,
                  color: "#d8e706",
                  whiteSpace: "nowrap",
                  letterSpacing: 1.2,
                  padding: "9px 14px",
                  border: "none",
                }}
              >
                {" "}
                <div className="d-flex align-items-center gap-2">
                  <SortAlphaDown size={15} />
                  <div className="d-none d-sm-block">
                    {sort.split(":")[0].split(" ").slice(0, 2).join(" ")}
                  </div>
                </div>
              </button>{" "}
            </div>

            <Modal
              show={sortOpen}
              onHide={() => setSortOpen(false)}
              centered
              style={{ background: "#111a11", borderRadius: "16px" }}
            >
              <div
                style={{
                  width: 36,
                  height: 4,
                  background: "#1a2a1a",
                  borderRadius: 2,
                  margin: "12px auto 4px",
                }}
              />

              <Modal.Header
                closeButton
                style={{ borderBottom: "0.5px solid #1a2a1a" }}
              >
                <Modal.Title>Sort by</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form>
                  {(
                    (Shop && SORT_OPTIONS) ||
                    (storeFront && SORT_OPTIONS) ||
                    (Store && STORE_SORT_OPTIONS)
                  ).map((opt) => {
                    return (
                      <Form.Check
                        className="py-2"
                        style={{ fontSize: "20px" }}
                        key={opt}
                        id={opt}
                        type="radio"
                        label={opt}
                        name="sortGroup"
                        value={opt}
                        checked={sort === opt}
                        onChange={(e) => handleSort(e.target.value)}
                      />
                    );
                  })}
                </Form>
              </Modal.Body>
            </Modal>
          </Col>
        )}
      </Row>
    </div>
  );
}

export default ProductFilter;
