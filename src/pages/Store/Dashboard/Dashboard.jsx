import { Container, Stack, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FiArrowRight, FiArrowUp, FiPackage } from "react-icons/fi";
import { FaShoppingBag } from "react-icons/fa";
import { useState } from "react";
import { CurrencyExchange, Person } from "react-bootstrap-icons";
import { TopNav } from "./components/TopNav";
import StoreOrders from "./orders/StoreOrders";
import { motion } from "framer-motion";
import StoreProductPage from "./products/ProductPage";

const statCards = [
  {
    id: "Today's sales",
    Icon: CurrencyExchange,
    a: "Today's sales",
    value: "45,000",
    incrementPercentage: "+24%",
  },
  {
    id: "orders",
    Icon: FaShoppingBag,
    a: "Orders",
    value: "47",
    incrementPercentage: "+24%",
  },
  {
    id: "products",
    Icon: FiPackage,
    a: "Products",
    value: "225",
    incrementPercentage: null,
  },
  {
    id: "followers",
    Icon: Person,
    a: "Followers",
    value: "1563",
    incrementPercentage: "+24%",
  },
  {
    id: "low stock",
    Icon: FaShoppingBag,
    a: "Low stock",
    value: "2",
    incrementPercentage: null,
  },
  {
    id: "pending orders",
    Icon: FaShoppingBag,
    a: "Pending order",
    value: "2",
    incrementPercentage: null,
  },
];

export const Dashboard = () => {
  const navigate = useNavigate();

  const [selectedTab, setSelectedTab] = useState("Overview");

  return (
    <>
      <section className="dashboard pt-5">
        {/*   <NavTop title="Dashbaord" /> */}
        <TopNav selectedTab={selectedTab} setSelectedTab={setSelectedTab} />

        <Container>
          <div className=" pt-5">
            {/* Overview session */}
            {selectedTab === "Overview" && (
              <>
                <Row className="g-4">
                  <Col className=" col-12 col-xl-8">
                    <div>
                      <div
                        className="p-5 py-4"
                        style={{
                          background:
                            "linear-gradient(to right, #f0ec00c9, #fdffa175)",
                          borderRadius: 22,
                        }}
                      >
                        <h1 className="text-white">Hello, Samuel!</h1>
                        <h6 className="text-white mt-3">
                          Welcome back to r.o.a
                        </h6>
                      </div>

                      <div className="my-4">
                        <span
                          className="d-inline-flex align-items-center gap-2 px-3 my-4 "
                          style={{
                            border: "0.5px solid #07f3ac",
                            borderRadius: "12px",
                          }}
                        >
                          <div
                            className="p-1"
                            style={{
                              background: "#07f3ac",
                              borderRadius: "50%",
                            }}
                          />
                          <h6 style={{ color: "#07f3ac" }}>Store is open</h6>
                        </span>
                      </div>

                      {/* stats card */}
                      <div className="my-4">
                        <Row className="g-5">
                          {statCards.map((s) => {
                            return (
                              <Col
                                key={s.key}
                                className="col-6 col-md-4 col-lg-3 col-xl-4  "
                              >
                                <div
                                  className="ps-3 py-3 "
                                  style={{
                                    background: "#05792815",
                                    boxShadow: "-5px -5px 35px #000f01",
                                    borderRadius: 18,
                                  }}
                                >
                                  <div className="d-flex align-items-center gap-3">
                                    <s.Icon
                                      style={{ color: "#cec002", fontSize: 20 }}
                                    />
                                    <h6>{s.a}</h6>
                                  </div>
                                  <div className="pt-4 d-flex align-items-center  gap-4">
                                    <p className="text-white fs-3">{s.value}</p>
                                    <p style={{ color: "#00f891" }}>
                                      {s.incrementPercentage}
                                    </p>
                                  </div>
                                </div>
                              </Col>
                            );
                          })}
                        </Row>
                      </div>

                      {/* earning card */}
                      <div className="earning_card mt-5  p-4">
                        <h6>Total earning this month</h6>

                        <p
                          className="fs-2 text-white mt-4 mb-3 fw-bold"
                          style={{ letterSpacing: 1.3, fontFamily: "Syne" }}
                        >
                          ₦ 284,500 .00
                        </p>

                        <div className="d-flex align-items-center gap-3 mb-4">
                          <div className="d-flex align-items-center">
                            <FiArrowUp />
                            <p>+24%</p>
                          </div>
                          <p className="ms-3">from last month</p>
                        </div>

                        <button
                          onClick={() => navigate("/wallet/witdraw")}
                          className="px-3 py-2 cta"
                        >
                          withdraw earning <FiArrowRight />
                        </button>
                      </div>

                      {/* Revenue chart */}
                      <div className="mb-5"></div>

                      {/* Top selling product */}
                      <div className="mb-5 d-xl-none">
                        {" "}
                        <h5 className="text-white mb-3">
                          Top selling Products
                        </h5>
                        <div className="gap-3 gap-md-4 d-flex">
                          <div className="top_products pb-3">
                            <img
                              src="images/profile.jpg"
                              alt=""
                              style={{
                                objectFit: "cover",
                                width: "100%",
                                height: "100px",
                                borderRadius: "12px 12px 0 0 ",
                              }}
                            />
                            <div className="px-2">
                              <h6
                                className="mt-1 text-white"
                                style={{
                                  fontStyle: "italic",
                                }}
                              >
                                Black and Gray Athletic Cotton Socks{" "}
                              </h6>
                              <span className="d-flex  align-items-center gap-1 py-2">
                                {" "}
                                <p style={{ lineHeight: 1 }}>Unit sold:</p>{" "}
                                <p className="text-white">256</p>
                              </span>
                              <p
                                className=" fw-bold text-white"
                                style={{ fontFamily: "Syne", letterSpacing: 1 }}
                              >
                                {" "}
                                ₦ 24,500.00
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Col>

                  <Col className="col-xl-4 ">
                    {/* recent order */}
                    <div
                      className="p-4"
                      style={{ border: "1px solid #3a3b02", borderRadius: 30 }}
                    >
                      <div>
                        <div className="d-flex align-items-center justify-content-between mb-3">
                          {" "}
                          <h5 className="text-white mb-3">Recent Orders</h5>
                          <p style={{ color: "#e6ff02", cursor: "pointer" }}>
                            view all <FiArrowRight />
                          </p>
                        </div>

                        <div className="d-flex flex-column gap-4 ">
                          <Stack gap={3} direction="horizontal">
                            <div
                              style={{
                                overflow: "hidden",
                                width: "60px",
                                borderRadius: 12,
                              }}
                            >
                              <img
                                src="images/profile.jpg"
                                alt=""
                                style={{
                                  objectFit: "cover",
                                  width: "100%",
                                  aspectRatio: "1/1",
                                }}
                              />
                            </div>

                            <div>
                              <p className="text-white fs-5">Samson</p>
                              <div className="mt-1 d-flex align-items-center gap-2">
                                <span>items:</span>
                                <p className="text-white">4</p>
                              </div>
                            </div>

                            <div className="text-end ms-auto">
                              <p
                                className="fs-4 text-white mb-2"
                                style={{ fontFamily: "Syne" }}
                              >
                                ₦ 22,650
                              </p>
                              <p style={{ color: "#b8b520" }}>pending</p>
                            </div>
                          </Stack>

                          <Stack gap={3} direction="horizontal">
                            <div
                              style={{
                                overflow: "hidden",
                                width: "60px",
                                borderRadius: 12,
                              }}
                            >
                              <img
                                src="images/profile.jpg"
                                alt=""
                                style={{
                                  objectFit: "cover",
                                  width: "100%",
                                  aspectRatio: "1/1",
                                }}
                              />
                            </div>

                            <div>
                              <p className="text-white fs-5">Samson</p>
                              <div className="mt-1 d-flex align-items-center gap-2">
                                <span>items:</span>
                                <p className="text-white">4</p>
                              </div>
                            </div>

                            <div className="text-end ms-auto">
                              <p
                                className="fs-4 text-white mb-2"
                                style={{ fontFamily: "Syne" }}
                              >
                                ₦ 22,650
                              </p>
                              <p style={{ color: "#b8b520" }}>pending</p>
                            </div>
                          </Stack>
                        </div>
                      </div>
                    </div>

                    {/* Top selling order */}
                    <div
                      className="p-4 mt-5 d-xl-block d-none"
                      style={{ border: "1px solid #3a3b02", borderRadius: 30 }}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        {" "}
                        <h5 className="text-white mb-3">
                          Top selling products
                        </h5>
                        <p style={{ color: "#e6ff02", cursor: "pointer" }}>
                          view all <FiArrowRight />
                        </p>
                      </div>
                      <div>
                        <div className="d-flex flex-column gap-4 ">
                          <Stack gap={3} direction="horizontal">
                            <div
                              style={{
                                overflow: "hidden",
                                width: "50px",
                                borderRadius: 12,
                              }}
                            >
                              <img
                                src="images/profile.jpg"
                                alt=""
                                style={{
                                  objectFit: "cover",
                                  width: "100%",
                                  aspectRatio: "1/1",
                                }}
                              />
                            </div>

                            <div className="top-products">
                              <h6 className="text-white fs-5">
                                black and white socks
                              </h6>
                              <div className="mt-1 d-flex align-items-center gap-2">
                                <span>unit sold:</span>
                                <p className="text-white">23</p>
                              </div>
                            </div>

                            <div
                              className="text-end ms-auto "
                              style={{ textWrap: "nowrap" }}
                            >
                              <p
                                className="fs-4 text-white mb-2"
                                style={{ fontFamily: "Syne" }}
                              >
                                ₦ 7,800
                              </p>
                            </div>
                          </Stack>

                          <Stack gap={3} direction="horizontal">
                            <div
                              style={{
                                overflow: "hidden",
                                width: "50px",
                                borderRadius: 12,
                              }}
                            >
                              <img
                                src="images/profile.jpg"
                                alt=""
                                style={{
                                  objectFit: "cover",
                                  width: "100%",
                                  aspectRatio: "1/1",
                                }}
                              />
                            </div>

                            <div className="top-products">
                              <h6 className="text-white fs-5">
                                black and white socks
                              </h6>
                              <div className="mt-1 d-flex align-items-center gap-2">
                                <span>unit sold:</span>
                                <p className="text-white">23</p>
                              </div>
                            </div>

                            <div
                              className="text-end ms-auto "
                              style={{ textWrap: "nowrap" }}
                            >
                              <p
                                className="fs-4 text-white mb-2"
                                style={{ fontFamily: "Syne" }}
                              >
                                ₦ 7,800
                              </p>
                            </div>
                          </Stack>
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>
                <div className="my-5 pb-5">
                  {" "}
                  <h5 className="text-white mb-3 ">Store Performance</h5>
                  <div
                    className="px-3 mb-4"
                    style={{
                      border: "0.5px solid #a5c70e69",
                      background: "#000c0179",
                      borderRadius: 12,
                      maxWidth: 750,
                    }}
                  >
                    {[
                      { a: "Offer Rates", b: "124%" },
                      { a: "listing Views", b: "1,352" },
                      { a: "Response Time", b: "< 1hr" },
                      { a: "Completed sales", b: "31" },
                    ].map((sp, i) => {
                      return (
                        <div
                          key={i}
                          className="d-flex justify-content-between align-items-center py-3 "
                          style={{
                            borderBottom:
                              i === 3 ? "none" : "0.5px solid #a5c70e69",
                          }}
                        >
                          <p>{sp.a}</p>
                          <h6 className="text-white">{sp.b}</h6>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* product tab session */}
            {selectedTab === "Products" && <StoreProductPage />}

            {/* orders tab session */}
            {selectedTab === "Orders" && (
              <>
                <StoreOrders />
              </>
            )}
          </div>
        </Container>
      </section>
    </>
  );
};

export default Dashboard;
