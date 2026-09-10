import {
  Container,
  Stack,
  Row,
  Col,
  Form,
  FormControl,
  Alert,
  Image,
  Offcanvas,
} from "react-bootstrap";
import NavTop from "../../../components/PageNav";
import { Link } from "react-router-dom";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiArrowRight,
  FiArrowUp,
  FiBarChart,
  FiBell,
  FiHome,
  FiMenu,
  FiMessageCircle,
  FiPackage,
  FiPlus,
  FiSearch,
  FiSettings,
  FiUser,
} from "react-icons/fi";
import {
  FaArrowLeft,
  FaCheck,
  FaMoneyBill,
  FaSearch,
  FaShoppingBasket,
  FaStore,
} from "react-icons/fa";
import { useState } from "react";
import ProductPage from "../../../components/product/ProductPage";
import { ArrowRight, Check, Clock, Textarea, X } from "react-bootstrap-icons";
import { TopNav } from "./components/TopNav";
import StoreOrders from "./orders/StoreOrders";
import { motion } from "framer-motion";
import { getProductsByStore } from "../../../dummyData";

export const Dashboard = () => {
  const [alert, setAlert] = useState(true);
  const [selectedTab, setSelectedTab] = useState("Overview");

  const orderTab = selectedTab === "Orders";

  const [showDetails, setShowDetails] = useState(true);

  return (
    <>
      {/*   <NavTop title="Dashbaord" /> */}
      <span className={`${orderTab ? "d-none" : "d-block"}`}>
        {" "}
        <TopNav />
      </span>

      <section className="dashboard pt-5">
        {" "}
        <div>
          <div
            className="fixed-bottom d-xxl-none side_bar"
            style={{ background: "#023810", borderTop: "1px solid #a5c70e69" }}
          >
            <Container>
              <div className=" py-3 px-3 ">
                <div className="d-flex  align-items-center  justify-content-between">
                  {[
                    { Icon: FiHome, a: "Overview" },
                    { Icon: FiPackage, a: "Products" },
                    { Icon: FaShoppingBasket, a: "Orders" },
                    { Icon: FaMoneyBill, a: "Earnings" },
                    { Icon: FaStore, a: "Store" },
                  ].map((s, i) => {
                    return (
                      <div
                        onClick={() => setSelectedTab(s.a)}
                        className="d-flex flex-column align-items-center gap-2"
                        key={i}
                      >
                        <s.Icon
                          className="icon"
                          style={{
                            color: selectedTab === s.a ? "#fbff01" : "#fff",
                            fontSize: "clamp(22px, 3vw, 30px)",
                          }}
                        />
                        <span
                          style={{
                            color: selectedTab === s.a ? "#fff" : "",
                            fontSize: "10px",
                          }}
                        >
                          {s.a}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Container>
          </div>

          <div style={{ position: "fixed" }}>
            <div className="d-none d-xxl-flex">
              <div
                className="side_bar py-5 px-3 d-flex flex-column justify-content-between"
                style={{
                  height: "100vh",
                  borderRight: "1px solid   #a5c70e69 ",
                }}
              >
                {[
                  { Icon: FiHome, a: "Overview" },
                  { Icon: FiPackage, a: "Products" },
                  { Icon: FaShoppingBasket, a: "Orders" },
                  { Icon: FaMoneyBill, a: "Earnings" },
                  { Icon: FiBarChart, a: "Analytics" },
                  { Icon: FaStore, a: "Store" },
                ].map((s, i) => {
                  return (
                    <div
                      onClick={() => setSelectedTab(s.a)}
                      className="d-flex flex-column align-items-center my-2"
                      key={i}
                    >
                      <s.Icon
                        className="icon mb-1"
                        size={30}
                        style={{
                          color: selectedTab === s.a ? "#fbff01" : "#fff",
                        }}
                      />
                      <p
                        style={{
                          color: selectedTab === s.a ? "#fff" : "",
                        }}
                      >
                        {s.a}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        {/* dashbaord body */}
        <Container>
          <div className="dashboard_body " style={{ paddingBottom: "200px" }}>
            {/* Overview session */}
            {selectedTab === "Overview" && (
              <>
                <Alert
                  className={` my-5 justify-content-between p-3 pt-0 pb-3 gap-3 gap-sm-4 ${alert ? "d-flex" : "d-none"}`}
                >
                  <div>
                    <h5
                      className="d-flex  align-items-center gap-2"
                      style={{ color: "#f89500" }}
                    >
                      <FiAlertTriangle />
                      Complete your registration to get verified{" "}
                    </h5>

                    <button
                      onClick={() => setAlert(false)}
                      className="px-3 py-1 mt-3 "
                      style={{ background: "#f89500", border: "none" }}
                    >
                      Get Verified <FiArrowRight />
                    </button>
                  </div>

                  <span
                    onClick={() => setAlert(!true)}
                    className="fs-4"
                    style={{ color: "#f89500" }}
                  >
                    x
                  </span>
                </Alert>

                <div className="my-5">
                  <h2 className="">Good morning Samuel</h2>

                  <span
                    className="d-inline-flex align-items-center gap-2 px-3 my-4 "
                    style={{
                      border: "0.5px solid #07f3ac",
                      borderRadius: "12px",
                    }}
                  >
                    <div
                      className="p-1"
                      style={{ background: "#07f3ac", borderRadius: "50%" }}
                    />
                    <h5 style={{ color: "#07f3ac" }}>Store is open</h5>
                  </span>
                </div>
                {/* earning card */}
                <div className="earning_card mt-5  p-4">
                  <h2>Total earning this month</h2>

                  <h3
                    className="text-white my-3 my-sm-4 my-md-5 fw-bold"
                    style={{ letterSpacing: 1.3 }}
                  >
                    ₦ 284,500 .00
                  </h3>

                  <span className="d-flex align-items-center gap-1 mb-4 mb-sm-5">
                    <FiArrowUp />
                    <p>+24%</p> <p className="ms-3">from last month</p>
                  </span>

                  <button className="px-3 py-2 cta">
                    withdraw earning <FiArrowRight />
                  </button>
                </div>

                {/* stats card */}
                <div className="my-5">
                  <Row
                    className="g-0"
                    style={{
                      border: "1px solid #d0ff00f1",
                      borderBottom: "none",
                      borderRight: "none",
                      borderTop: "none",
                    }}
                  >
                    {[
                      { a: "Today's sales", b: "45,000" },
                      { a: "Orders", b: "47" },
                      { a: "Products", b: "47" },
                      { a: "Followers", b: "1,200" },
                      { a: "Low stock", b: "2" },
                      { a: "Pending orders", b: "8" },
                    ].map((s) => {
                      return (
                        <Col className="col-auto">
                          <div
                            className="px-4 py-3 d-flex justify-content-center align-items-center"
                            style={{
                              border: "0.5px solid #d0ff00f1",
                              borderLeft: "none",
                              background: "#d0ff0023",
                            }}
                          >
                            <div className="text-center">
                              <h5
                                style={{ lineHeight: 1.2 }}
                                className="text-white mb-2"
                              >
                                {s.a}
                              </h5>
                              <h3 style={{ color: "#e6ff02" }}>{s.b}</h3>
                            </div>
                          </div>
                        </Col>
                      );
                    })}
                  </Row>
                </div>

                {/* Revenue chart */}
                <div className="mb-5"></div>

                {/* Top selling product */}
                <h3 className="text-white mb-3">Top selling Products</h3>

                <div
                  className="mb-5 d-flex gap-3 gap-md-4 pb-5"
                  style={{ flexWrap: "wrap" }}
                >
                  <div className="top_products pb-3">
                    <div>
                      <img
                        src="images/profile.jpg"
                        alt=""
                        style={{
                          objectFit: "cover",
                          width: "100%",
                          aspectRatio: "1/1",
                        }}
                      />
                      <div className="px-2">
                        <h6
                          className="text-white"
                          style={{
                            fontStyle: "italic",
                          }}
                        >
                          Black and Gray Athletic Cotton Socks{" "}
                        </h6>
                        <span className="d-flex  align-items-center gap-3 py-1">
                          {" "}
                          <p style={{ lineHeight: 1 }}>unit sold:</p> <p>256</p>
                        </span>
                        <p className=" fw-bold"> ₦ 24,500.00</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* recent order */}

                <div className="mb-5">
                  <h3 className="text-white mb-3">Recent Orders</h3>

                  <div className="d-flex flex-wrap gap-5 mb-5 ">
                    <div
                      className="text-center p-3"
                      style={{
                        boxShadow: "0 0  5px #e1f71b",
                      }}
                    >
                      <h6 className="text-white"># ROA-102</h6>
                      <h6 className="text-white">James</h6>
                      <h6 className="text-white"> ₦ 8,000</h6>
                      <div className="d-flex gap-1 align-items-center justify-content-center">
                        <FaCheck size={12} style={{ color: "#56d61b" }} />
                        <h6 className="text-white">paid</h6>
                      </div>
                    </div>
                  </div>

                  <button className=" px-3 py-2 btn_button">
                    View all orders <FiArrowRight />
                  </button>
                </div>

                {/* store performance */}
                <h3 className="text-white mb-3 ">Store Performance</h3>

                <div
                  className="px-3 mb-4"
                  style={{
                    border: "0.5px solid #a5c70e69",
                    background: "#00000060",
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
                        className="d-flex justify-content-between align-items-center py-1 py-sm-2 py-md-3"
                        style={{
                          borderBottom:
                            i === 3 ? "none" : "0.5px solid #a5c70e69",
                        }}
                      >
                        <p>{sp.a}</p>
                        <p>{sp.b}</p>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* product tab session */}
            {selectedTab === "Products" && (
              <div>
                <Link
                  className="py-3 px-4 position-fixed ms-2 ms-sm-3 ms-md-4"
                  to="/add_product"
                  style={{
                    background: "rgb(0, 255, 0)",
                    bottom: 100,
                    zIndex: 1,
                    borderRadius: 22,
                  }}
                >
                  <div
                    className="d-flex align-items-center justify-content-center p-1 bg-dark"
                    style={{ borderRadius: 12 }}
                  >
                    <FiPlus
                      className="fs-1"
                      style={{ color: "#e7eb03" }}
                    />{" "}
                  </div>
                </Link>

                <div className="my-5">
                  <div
                    className="d-flex align-items-center gap-3 px-4 py-3"
                    style={{ background: "#000" }}
                  >
                    <FiSearch />
                    <FormControl
                      className="py-1"
                      type="text"
                      placeholder="search products..."
                    />
                  </div>
                </div>

                <div>
                  <ProductPage
                    Shop={false}
                    product={getProductsByStore("store-001")}
                    showWishlist={false}
                  />
                </div>

                <Offcanvas
                  style={{
                    background:
                      "radial-gradient(circle,  #05270af6, #001a04, #05270af6 , #001a04 )",
                    scrollbarWidth: "thin",
                    msOverflowStyle: "none",
                    width: "clamp(600px, 10px + 55vw, 800px)",
                    height: "100%",
                    paddingBottom: 70,
                  }}
                  show={showDetails}
                  onHide={() => setShowDetails(false)}
                  placement={window.innerWidth < 750 ? "bottom" : "start"}
                >
                  <div
                    className="py-3 py-lg-4"
                    style={{
                      zIndex: 20,
                      background: "rgba(10,26,10,0.97)",
                      backdropFilter: "blur(10px)",
                      WebkitBackdropFilter: "blur(10px)",
                      borderBottom: "0.5px solid #a3a108",
                    }}
                  >
                    {" "}
                    {/* TOPBAR */}
                    <Offcanvas.Header className="px-sm-5 py-0">
                      <div className="d-flex align-items-center gap-4 gap-sm-5 ">
                        <div
                          onClick={() => setShowDetails(false)}
                          style={{
                            width: 30,
                            height: 30,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                          }}
                        >
                          <X className="text-white fs-5" />
                        </div>
                        <div>
                          <p className="mb-2 mb-sm-3" style={{ lineHeight: 1 }}>
                            Order details
                          </p>
                          <h5
                            className="text-white"
                            style={{ letterSpacing: 1.5, lineHeight: 1 }}
                          >
                            ROA-345hu75
                          </h5>
                        </div>
                      </div>
                      <p className="ms-auto">Delivered</p>
                    </Offcanvas.Header>
                  </div>
                  <Offcanvas.Body className="p-0 p-4">
                    {/* ORDER TIMELINE */}
                    <div
                      className="p-3 px-sm-4 "
                      style={{
                        background: "#111a11",
                        border: "0.5px solid #1a2a1a",
                        borderRadius: 14,
                      }}
                    >
                      <div>
                        <h5 style={{ color: "#ebe700" }}>Order tracking</h5>
                      </div>
                      <div className=" py-4">
                        <div className="d-flex  align-items-start gap-4">
                          {/* Left — icon + line */}
                          <div
                            className="d-flex flex-column align-items-center "
                            style={{
                              flexShrink: 0,
                            }}
                          >
                            <div
                              className="d-flex align-items-center  justify-content-center"
                              style={{
                                width: "clamp(45px, 3px + 5vw, 60px)",
                                aspectRatio: 1 / 1,
                                borderRadius: "50%",
                                background: "#1D9E75",

                                border: `2px solid "#1D9E75"  ,
                                            }`,
                                transition: "all 0.3s",
                              }}
                            >
                              <FaStore
                                style={{
                                  fontSize: 20,
                                  color: "#fff",
                                }}
                              />
                            </div>

                            {/* Connecting line */}

                            <div
                              style={{
                                width: 5,
                                flex: 1,
                                minHeight: 40,
                                background: "#1D9E75",
                                margin: "5px 0",
                                transition: "background 0.3s",
                              }}
                            />
                          </div>

                          {/* Right — label + timestamp */}
                          <div>
                            <h6
                              className="mb-1 mb-sm-2"
                              style={{
                                fontWeight: 600,
                                color: "#e7eb0af5",
                                lineHeight: 1,
                                display: "inline-block",
                              }}
                            >
                              step.label
                            </h6>
                            <p>"Pending"</p>
                          </div>
                        </div>
                        <div className="d-flex  align-items-start gap-4">
                          {/* Left — icon + line */}
                          <div
                            className="d-flex flex-column align-items-center "
                            style={{
                              flexShrink: 0,
                            }}
                          >
                            <div
                              className="d-flex align-items-center  justify-content-center"
                              style={{
                                width: 45,
                                height: 45,
                                borderRadius: "50%",
                                background: "#1D9E75",

                                border: `2px solid "#1D9E75"  ,
                                            }`,
                                transition: "all 0.3s",
                              }}
                            >
                              <FaStore
                                style={{
                                  fontSize: 20,
                                  color: "#fff",
                                }}
                              />
                            </div>

                            {/* Connecting line */}

                            <div
                              style={{
                                width: 5,
                                flex: 1,
                                minHeight: 40,
                                background: "#1D9E75",
                                margin: "5px 0",
                                transition: "background 0.3s",
                              }}
                            />
                          </div>

                          {/* Right — label + timestamp */}
                          <div>
                            <h6
                              className="mb-1"
                              style={{
                                fontWeight: 600,
                                color: "#c8ca3af3",
                                lineHeight: 1,
                                display: "inline-block",
                              }}
                            >
                              step.label
                            </h6>
                            <p>"Pending"</p>
                          </div>
                        </div>
                        <div className="d-flex  align-items-start gap-4">
                          {/* Left — icon + line */}
                          <div
                            className="d-flex flex-column align-items-center "
                            style={{
                              flexShrink: 0,
                            }}
                          >
                            <div
                              className="d-flex align-items-center  justify-content-center"
                              style={{
                                width: 45,
                                height: 45,
                                borderRadius: "50%",
                                background: "#1D9E75",

                                border: `2px solid "#1D9E75"  ,
                                            }`,
                                transition: "all 0.3s",
                              }}
                            >
                              <FaStore
                                style={{
                                  fontSize: 20,
                                  color: "#fff",
                                }}
                              />
                            </div>

                            {/* Connecting line */}

                            <div
                              style={{
                                width: 5,
                                flex: 1,
                                minHeight: 40,
                                background: "#1D9E75",
                                margin: "5px 0",
                                transition: "background 0.3s",
                              }}
                            />
                          </div>

                          {/* Right — label + timestamp */}
                          <div>
                            <h6
                              className="mb-1"
                              style={{
                                fontWeight: 600,
                                color: "#c8ca3af3",
                                lineHeight: 1,
                                display: "inline-block",
                              }}
                            >
                              step.label
                            </h6>
                            <p>"Pending"</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ESTIMATED DELIVERY */}
                    <div
                      className="d-flex align-items-center justify-content-between  p-3 px-sm-4"
                      style={{
                        background: "linear-gradient(135deg, #1a4a1a, #2d7a0a)",
                        borderRadius: 14,
                        padding: 14,
                      }}
                    >
                      <div>
                        <h5 style={{ color: "#ebe700" }}>Estimated delivery</h5>
                        <h6 className="text-white fw-bold py-4">
                          order.estimatedAt
                        </h6>
                      </div>
                      <FaStore
                        style={{
                          fontSize: 32,
                          color: "rgba(255,255,255,0.3)",
                        }}
                      />
                    </div>

                    {/* CANCELLED NOTICE */}

                    <div
                      className="p-3 px-sm-4"
                      style={{
                        background: "rgba(192, 58, 43, 0.14)",
                        border: "0.5px solid rgba(192, 58, 43, 0.6)",
                        borderRadius: 14,
                      }}
                    >
                      <div className="d-flex align-items-center gap-4 mb-2">
                        <X style={{ fontSize: 18, color: "#c0392b" }} />
                        <h5
                          style={{
                            color: "#c0392b",
                          }}
                        >
                          Order cancelled
                        </h5>
                      </div>

                      <p
                        style={{
                          lineHeight: 1.6,
                        }}
                      >
                        Reason: Lorem ipsum dolor sit amet, consectetur
                        adipisicing elit. Rerum dolorum, soluta ipsum, tempore
                        fugiat enim voluptate laborum non laudantium repudiandae
                        quos delectus repellendus necessitatibus praesentium?
                        Temporibus eum consequuntur consequatur iure.
                      </p>

                      <div
                        className="d-flex align-items-center gap-2"
                        style={{
                          marginTop: 10,
                          background: "rgba(29,158,117,0.06)",
                          border: "0.5px solid rgba(29,158,117,0.2)",
                          borderRadius: 8,
                          padding: "8px 12px",
                        }}
                      >
                        <FaStore
                          className="mb-1"
                          style={{ fontSize: 14, color: "#1D9E75" }}
                        />
                        <span style={{ fontSize: 12, color: "#1D9E75" }}>
                          ₦35,785 refunded to your r.o.a. wallet
                        </span>
                      </div>
                    </div>

                    {/* DELIVERED — rate prompt */}

                    <div
                      //  onClick={() => navigate(`/orders/${order.id}/review`)}
                      style={{
                        background: "#c9c74c15",
                        border: "0.5px solid #c9c74c60",
                        borderRadius: 14,
                        padding: 14,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            background: "#c9c74c1a",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <FaShoppingBasket
                            style={{
                              fontSize: 20,
                              color: "rgba(201, 199, 76, 0.94)",
                            }}
                          />
                        </div>
                        <div>
                          <h5
                            className="mb-1 mb-sm-2"
                            style={{
                              fontWeight: 600,
                              color: "#dfdb17",
                            }}
                          >
                            How was your experience?
                          </h5>
                          <p>Rate Annoited chips and help other buyers</p>
                        </div>
                      </div>
                      <FiArrowRight
                        className="text-white"
                        style={{ fontSize: 22 }}
                      />
                    </div>

                    {/* ORDER ITEMS */}
                    <div
                      style={{
                        background: "#111a11",
                        border: "0.5px solid #1a2a1a",
                        borderRadius: 14,
                        overflow: "hidden",
                      }}
                    >
                      {/* Store header */}
                      <div
                        className="p-3 px-sm-4 d-flex align-items-center gap-4"
                        //    onClick={() => navigate(`/store/${order.storeId}`)}
                        style={{
                          borderBottom: "0.5px solid #1a2a1a",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            width: "clamp(45px, 3px + 5vw, 60px)",
                            height: "clamp(45px, 3px + 5vw, 60px)",
                            borderRadius: 10,
                            background: "#1a2a1a",
                            overflow: "hidden",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <img
                            src="images/profile.jpg"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p
                            className="text-white mb-2 mb-lg-3"
                            style={{
                              fontWeight: 600,
                            }}
                          >
                            Annointed chips
                          </p>
                          <p
                            style={{
                              fontSize: 11,
                            }}
                          >
                            Tap to visit store
                          </p>
                        </div>
                        <ArrowRight style={{ fontSize: 15, color: "#555" }} />
                      </div>

                      {/* Items */}

                      <div
                        style={{
                          background: "#111a11b4",
                          borderRadius: 14,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          className="d-flex align-items-center gap-3 px-3 px-sm-4 py-3"
                          style={{
                            borderTop: "0.5px solid #1a2a1a",
                          }}
                        ></div>
                      </div>

                      {/* Buy again row */}

                      <div
                        className="p-3 px-sm-4"
                        style={{
                          borderTop: "0.5px solid #1a2a1a",
                        }}
                      >
                        <button
                          type="button"
                          //   onClick={() => navigate(`/product/${order.items?.[0]?.productId}`)}
                          style={{
                            width: "100%",
                            padding: "10px 0",
                            background: "transparent",
                            border: "0.5px solid rgba(201,168,76,0.25)",
                            borderRadius: 10,
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#c9a84c",
                            cursor: "pointer",
                            fontFamily: "'Plus Jakarta Sans',sans-serif",
                          }}
                        >
                          Buy again
                        </button>
                      </div>
                    </div>
                  </Offcanvas.Body>
                </Offcanvas>
              </div>
            )}

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
