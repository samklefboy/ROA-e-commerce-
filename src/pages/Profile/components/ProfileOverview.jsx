import { Row, Col } from "react-bootstrap";

export const Overview = () => {
  return (
    <Row g-5 className="mb-5">
      <Col className="col-12 col-lg-6">
        <div
          className="mt-5 p-4"
          style={{
            border: "1px solid rgba(233, 229, 4, 0.4)",
            background: "rgba(54, 44, 44, 0.29)",
          }}
        >
          <div
            style={{
              color: "rgb(255, 251, 5)",
            }}
          >
            BIO
            <div
              style={{
                borderBottom: "1px solid  rgba(233, 229, 4, 0.4)",
                padding: "11px",
              }}
            ></div>
          </div>

          <p className="py-4" style={{ color: "#ffffff83" }}>
            Lorem ipsum, dolor sit amet consectetur adipisicing elit.
            Laudantium, dolore. Provident nesciunt esse harum. Molestiae, velit
            repudiandae tenetur fugit ea repellendus nulla, molestias, quae
            corporis maxime maiores minus deserunt nostrum!
          </p>

          <button
            className="p-2 d-flex ms-auto"
            style={{
              background: "none",
              color: "#fffb05 ",
              fontSize: "10px",
              letterSpacing: 1.4,
              border: "1px solid #fffb059d",
            }}
          >
            Edit
          </button>
        </div>
      </Col>

      <Col className="col-12 col-lg-6">
        <div
          className="mt-5 p-4"
          style={{
            border: "1px solid rgba(233, 229, 4, 0.4)",
            background: "rgba(12, 12, 12, 0.29)",
          }}
        >
          <div
            style={{
              color: "rgb(255, 251, 5)",
            }}
          >
            INTEREST
            <div
              style={{
                borderBottom: "1px solid  rgba(233, 229, 4, 0.4)",
                padding: "11px",
              }}
            ></div>
          </div>

          <div
            className="py-4"
            style={{ color: "#ffffff83", fontSize: "11.5px" }}
          >
            <Row g-5>
              <Col className="col-auto">
                <div
                  style={{
                    border: "1px solid #ffffff83",
                    padding: "7px",
                  }}
                >
                  FASHION
                </div>
              </Col>
            </Row>
          </div>
        </div>
      </Col>

      <Col>
        <div
          className="mt-5 p-4"
          style={{
            border: "1px solid rgba(233, 229, 4, 0.4)",
            background: "rgba(12, 12, 12, 0.29)",
          }}
        >
          <div
            style={{
              color: "rgb(255, 251, 5)",
            }}
          >
            FOLLOWING STORES
            <div
              style={{
                borderBottom: "1px solid  rgba(233, 229, 4, 0.4)",
                padding: "11px",
              }}
            ></div>
          </div>

          <div
            className="py-4"
            style={{ color: "#ffffff83", fontSize: "11.5px" }}
          >
            <Row g-5>
              <Col className="col-12">
                <Row g-5 className="align-items-center">
                  <Col className="col-auto">
                    <div
                      style={{
                        background: "#3a1e1e",
                        padding: "12px",
                        color: "rgb(255, 251, 5)",
                        letterSpacing: "2px",
                      }}
                    >
                      AD
                    </div>
                  </Col>

                  <Col className="col-auto">
                    <div className="d-flex flex-column">
                      <h6 className="text-white m-0">Annointed Chips</h6>
                      <p>Baking . Lagos</p>
                    </div>
                  </Col>

                  <Col className="d-flex">
                    <button
                      className="ms-auto"
                      style={{
                        background: "none",
                        border: "1px solid rgba(233, 229, 4, 0.4) !important",
                        color: "rgb(255, 251, 5)",
                        padding: "8px",
                      }}
                    >
                      VISIT STORE
                    </button>
                  </Col>
                </Row>

                <div
                  style={{
                    borderBottom: "1px solid  rgba(233, 229, 4, 0.4)",
                    padding: "11px",
                    marginBottom: "17px",
                  }}
                ></div>
              </Col>

              <Col className="12">
                <Row g-5 className="align-items-center">
                  <Col className="col-auto">
                    <div
                      style={{
                        background: "#1a2631",
                        padding: "12px",
                        color: "rgb(255, 251, 5)",
                        letterSpacing: "2px",
                      }}
                    >
                      MG
                    </div>
                  </Col>

                  <Col className="col-auto">
                    <div className="d-flex flex-column">
                      <h6 className="text-white m-0">Mide's Gem</h6>
                      <p>Fashion . Ogun</p>
                    </div>
                  </Col>

                  <Col className="d-flex">
                    <button
                      className="ms-auto"
                      style={{
                        background: "none",
                        border: "1px solid rgba(233, 229, 4, 0.4) !important",
                        color: "rgb(255, 251, 5)",
                        padding: "8px",
                      }}
                    >
                      VISIT STORE
                    </button>
                  </Col>
                </Row>

                <div
                  style={{
                    borderBottom: "1px solid  rgba(233, 229, 4, 0.4)",
                    padding: "11px",
                    marginBottom: "11px",
                  }}
                ></div>
              </Col>

              <Col className="col-12">
                <Row g-5 className="align-items-center">
                  <Col className="col-auto">
                    <div
                      style={{
                        background: "#2e1a31",
                        padding: "12px",
                        color: "rgb(255, 251, 5)",
                        letterSpacing: "2px",
                      }}
                    >
                      KG
                    </div>
                  </Col>

                  <Col className="col-auto">
                    <div className="d-flex flex-column">
                      <h6 className="text-white m-0">Kelechi's Gadget</h6>
                      <p>Gadgets . Benin</p>
                    </div>
                  </Col>

                  <Col className="d-flex">
                    <button
                      className="ms-auto"
                      style={{
                        background: "none",
                        border: "1px solid rgba(233, 229, 4, 0.4) !important",
                        color: "rgb(255, 251, 5)",
                        padding: "8px",
                      }}
                    >
                      VISIT STORE
                    </button>
                  </Col>
                </Row>

                <div
                  style={{
                    borderBottom: "1px solid  rgba(233, 229, 4, 0.4)",
                    padding: "11px",
                    marginBottom: "11px",
                  }}
                ></div>
              </Col>
            </Row>
          </div>
        </div>
      </Col>
    </Row>
  );
};
