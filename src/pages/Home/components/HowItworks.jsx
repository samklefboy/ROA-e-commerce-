import { Container, Row, Col, Stack } from "react-bootstrap";
import { FaStore, FaShoppingCart } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useState } from "react";

export function HowItWorks() {
  const [heroSellBtn, setHeroSellBtn] = useState(true);

  const [heroShopBtn, setHeroShopBtn] = useState(false);

  return (
    <div
      style={{
        background: "#000000",
      }}
    >
      <Container>
        <Row g-5 className=" text-light align-items-center mt-5 py-5 px-3 ">
          <Col className=" text-center col-12 mb-4">
            <div className="d-flex flex-column justify-content-center">
              <h3
                style={{
                  color: "#00ff37 ",
                }}
              >
                How It Works
              </h3>

              <p className="text-white mt-2">Getting started is easy</p>

              <div className="d-flex my-5 justify-content-center gap-4">
                <button
                  onClick={() => {
                    setHeroSellBtn(true);
                    setHeroShopBtn(false);
                  }}
                  className={` px-3 py-3 ${heroSellBtn ? "hero-active" : "hero-btn"}`}
                >
                  <div className="d-flex align-items-center gap-2">
                    <FaStore /> I WANT TO SELL
                  </div>
                </button>

                <button
                  onClick={() => {
                    setHeroShopBtn(true);
                    setHeroSellBtn(false);
                  }}
                  className={`px-3 py-3 ${heroShopBtn ? "hero-active" : "hero-btn"}`}
                >
                  <div className="d-flex align-items-center gap-2">
                    <FaShoppingCart /> <div>I WANT TO SHOP</div>
                  </div>
                </button>
              </div>
            </div>

            <div className=" border my-5" style={{ borderRadius: "50%" }} />
          </Col>

          <Col>
            {heroSellBtn && (
              <>
                <div className="text-center">
                  <div>
                    <p
                      className="mb-4"
                      style={{
                        color: "#00ff37",
                        letterSpacing: "2.5px",
                      }}
                    >
                      FOR SELLERS
                    </p>
                    <h1 className="text-white">
                      Commerce made{" "}
                      <span
                        style={{
                          color: "#00ff37",
                        }}
                      >
                        beautifully simple
                      </span>
                    </h1>
                    <p className="my-5">
                      From setting up your storefront to reaching customers
                      globally - R.O.A handles the complexity so you focus on
                      what you do best{" "}
                    </p>
                  </div>

                  <Row g-5 className="text-start g-5">
                    <Col className="col-12 col-sm-6">
                      <div
                        className="seller-info-card"
                        style={{
                          border: "1px solid rgba(233, 229, 4, 0.4)",
                          background: "rgba(0, 0, 0, 0.87)",

                          padding: "40px 25px",
                        }}
                      >
                        <h1
                          style={{
                            color: "#ffffff21",
                          }}
                        >
                          01
                        </h1>
                        <h4 className="text-light py-3">Create Your Store</h4>
                        <p>
                          Set up a branded storefront in minutes. customize your
                          profile, add products, and set your own pricing with
                          zero technical expertize needed.
                        </p>
                      </div>
                    </Col>

                    <Col className="col-12 col-sm-6">
                      <div
                        className="seller-info-card"
                        style={{
                          border: "1px solid rgba(233, 229, 4, 0.4)",
                          background: "rgba(0, 0, 0, 0.87)",

                          padding: "40px 25px",
                        }}
                      >
                        <h1
                          style={{
                            color: "#ffffff21",
                          }}
                        >
                          02
                        </h1>
                        <h4 className="text-light py-3">Get Discovered</h4>
                        <p>
                          Your store is visible to buyers across the platform
                          the moment you have a store with us. Customers find
                          you organically - no paid needed to get started.
                        </p>
                      </div>
                    </Col>

                    <Col className="col-12 col-sm-6">
                      <div
                        className="seller-info-card"
                        style={{
                          border: "1px solid rgba(233, 229, 4, 0.4)",
                          background: "rgba(0, 0, 0, 0.87)",

                          padding: "40px 25px",
                        }}
                      >
                        <h1
                          style={{
                            color: "#ffffff21",
                          }}
                        >
                          03
                        </h1>
                        <h4 className="text-light py-3">Sell Globally</h4>
                        <p>
                          Accept payments from anywhere, in any currency.
                          Customers from all states can patronze your store with
                          a single tap.
                        </p>
                      </div>
                    </Col>

                    <Col className="col-12 col-sm-6">
                      <div
                        className="seller-info-card"
                        style={{
                          border: "1px solid rgba(233, 229, 4, 0.4)",
                          background: "rgba(0, 0, 0, 0.87)",

                          padding: "40px 25px",
                        }}
                      >
                        <h1
                          style={{
                            color: "#ffffff21",
                          }}
                        >
                          04
                        </h1>
                        <h4 className="text-light py-3">Earn & Scale</h4>
                        <p>
                          Track orders, manage inventory, and watch revenue
                          grow. Built in analytics show you exactly what's
                          working and where your buyers are coming from.
                        </p>
                      </div>
                    </Col>
                  </Row>
                </div>
                <Link to="/create-store">
                  <button
                    style={{
                      border: "none",
                      background: "rgb(255, 238, 0)",
                      width: "100%",
                      marginTop: "50px",
                      padding: "12px 0",
                    }}
                  >
                    OPEN YOUR STORE FREE
                  </button>
                </Link>
              </>
            )}

            {heroShopBtn && (
              <>
                <div className="text-center">
                  <div>
                    <p
                      className="mb-4"
                      style={{
                        color: "#00ff37",
                        letterSpacing: "2.5px",
                      }}
                    >
                      FOR BUYERS
                    </p>
                    <h1 className="text-white">
                      Shop stores from {""}
                      <span
                        style={{
                          color: "#00ff37",
                        }}
                      >
                        anywhere
                      </span>
                      {""} in the world
                    </h1>
                    <p className="my-5">
                      R.O.A isn't just for sellers. If you're a buyer, you get
                      access to thousands of unique stores across fashion,
                      beauty, foods, crafts and more -- all in one place,you
                      just a tap away.
                    </p>
                  </div>

                  <Row className="text-start g-4 my-5">
                    <Col className="col-12 col-sm-6">
                      <div
                        className="py-4 px-3 buyer-info-card"
                        style={{
                          border: "1px solid rgba(233, 229, 4, 0.4)",
                          background: "rgba(0, 0, 0, 0.87)",
                        }}
                      >
                        <Stack
                          className="align-items-start "
                          direction="horizontal"
                          gap={3}
                        >
                          <div
                            className="p-1 mt-2"
                            style={{
                              border: "2px solid rgb(255, 238, 0)",
                            }}
                          >
                            <div
                              className="p-1"
                              style={{
                                background: "rgb(255, 238, 0)",
                                border: "1px solid rgba(233, 229, 4, 0.4)",
                              }}
                            ></div>
                          </div>

                          <div>
                            <h5 className="text-light mb-3">
                              Follow Your Favourite Stores
                            </h5>

                            <p>
                              Follow stores you love and get notified when they
                              drop new products, or have something special lined
                              up.
                            </p>
                          </div>
                        </Stack>
                      </div>
                    </Col>

                    <Col className="col-12 col-sm-6 col-auto">
                      <div
                        className="py-4 px-3 buyer-info-card"
                        style={{
                          border: "1px solid rgba(233, 229, 4, 0.4)",
                          background: "rgba(0, 0, 0, 0.87)",
                        }}
                      >
                        <Stack
                          direction="horizontal"
                          className="align-items-start"
                          gap={3}
                        >
                          <div
                            className="p-1 mt-2"
                            style={{
                              border: "2px solid rgb(255, 238, 0)",
                            }}
                          >
                            <div
                              className="p-1"
                              style={{
                                background: "rgb(255, 238, 0)",
                                border: "1px solid rgba(233, 229, 4, 0.4)",
                              }}
                            ></div>
                          </div>

                          <div>
                            <h5 className="text-light mb-3">
                              Shop Across States, Effortlessly
                            </h5>

                            <p>
                              Pay with trusted, secure checkout. Whether the
                              seller is in Kano or Delta, buying is always
                              smooth
                            </p>
                          </div>
                        </Stack>
                      </div>
                    </Col>

                    <Col className="col-12 col-sm-6 col-auto">
                      <div
                        className="py-4 px-3 buyer-info-card"
                        style={{
                          border: "1px solid rgba(233, 229, 4, 0.4)",
                          background: "rgba(0, 0, 0, 0.87)",
                        }}
                      >
                        <Stack
                          direction="horizontal"
                          className="align-items-start"
                          gap={3}
                        >
                          <div
                            className="p-1 mt-2"
                            style={{
                              border: "2px solid rgb(255, 238, 0)",
                            }}
                          >
                            <div
                              className="p-1"
                              style={{
                                background: "rgb(255, 238, 0)",
                                border: "1px solid rgba(233, 229, 4, 0.4)",
                              }}
                            ></div>
                          </div>

                          <div>
                            <h5 className="text-light mb-3">
                              Discover Curated Stores
                            </h5>

                            <p>
                              Browse categories or let R.O.A. suggest stores
                              based on your interest. Every visit surfaces
                              something worth buying
                            </p>
                          </div>
                        </Stack>
                      </div>
                    </Col>

                    <Col className="col-12 col-sm-6">
                      <div
                        className="px-3 py-4 buyer-info-card"
                        style={{
                          border: "1px solid rgba(233, 229, 4, 0.4)",
                          background: "rgba(0, 0, 0, 0.87)",
                        }}
                      >
                        <Stack
                          direction="horizontal"
                          gap={3}
                          className="align-items-start"
                        >
                          <div
                            className="p-1 mt-2"
                            style={{
                              border: "2px solid rgb(255, 238, 0)",
                            }}
                          >
                            <div
                              className="p-1"
                              style={{
                                background: "rgb(255, 238, 0)",
                                border: "1px solid rgba(233, 229, 4, 0.4)",
                              }}
                            ></div>
                          </div>

                          <div>
                            <h5 className="text-light mb-3">
                              Wishlist & Price Alerts
                            </h5>

                            <p>
                              Save what you love and get notified when price
                              drop. Shopping on your terms, on your own timeline
                            </p>
                          </div>
                        </Stack>
                      </div>
                    </Col>
                  </Row>
                </div>
                <Link to="/shopping">
                  <button
                    style={{
                      border: "none",
                      background: "rgb(255, 238, 0)",
                      width: "100%",
                      marginTop: "50px",
                      padding: "12px 0",
                    }}
                  >
                    START SHOPPING
                  </button>
                </Link>
              </>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
}
