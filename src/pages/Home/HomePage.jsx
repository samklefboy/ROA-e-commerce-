import { Container, Row, Col, Form, Stack } from "react-bootstrap";
import { Link } from "react-router-dom";
import MainHeader from "../../components/MainHeader";
import { Footer } from "./components/Footer";
import { FaStar, FaStore, FaShoppingBasket } from "react-icons/fa";
import { zoomIn, container, fadeUp } from "../../utils/animation";
import { motion } from "framer-motion";
import { WhyUs } from "./components/WhyUs";
import { Categories } from "./components/Categories";
import { FeaturedProducts } from "./components/FeaturedProducts";
import { HowItWorks } from "./components/HowItworks";
import { ArrowRight } from "react-bootstrap-icons";

function HomePage() {
  return (
    <>
      <title>r. o. a.</title>

      <MainHeader showAuth={true} showCart={true} showSearchbtn={true} />

      <Container>
        <div className="align-items-center text-light text-center about-us text-light ">
          <div
            className="mb-3 mb-xl-5 hero1"
            style={{
              fontStyle: "italic",
              lineHeight: 1,
              color: "#ffee00",
            }}
          >
            YOUR MARKET
          </div>

          <div
            className="d-flex align-items-center gap-2 gap-lg-5 flex-wrap justify-content-center text-white"
            style={{
              fontStyle: "italic",
              lineHeight: 0.9,
            }}
          >
            <div className="hero2">YOUR</div>{" "}
            <motion.div
              variants={container}
              initial="hidden"
              animate="visible"
              viewport={{ once: true }}
            >
              <div className="d-flex gap-1">
                {["W", "O", "R", "L", "D", "."].map((a) => {
                  return (
                    <motion.div variants={zoomIn} className="hero3" key={a}>
                      <div>{a}</div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>

        <h6 className="my-4 my-lg-5 text-center" style={{ lineHeight: 1.5 }}>
          Tired of sending pictures and prices back and forth? Create your free
          online store in 2 minutes, get discovered by your customers using your
          store slug also by buyers across Nigeria
        </h6>

        <motion.div initial="hidden" animate="visible" variants={fadeUp}>
          <div className="d-flex  gap-5 justify-content-center pb-5">
            <Link to="/create-store">
              {" "}
              <button className="btn1 px-4 py-2 d-flex align-items-center gap-2 text-black">
                <FaStore size={20} /> Get your free store
              </button>
            </Link>

            <Link to="/shop">
              <button className="btn2 px-4 py-2 d-flex align-items-center gap-2 ">
                <FaShoppingBasket size={20} /> Browse the marketplace{" "}
                <ArrowRight />
              </button>
            </Link>
          </div>
        </motion.div>
      </Container>

      <section className="py-5" style={{ background: "#494708" }}>
        {" "}
        <Container>
          <Row
            g-5
            className="my-5 mx-auto align-items-center"
            style={{
              border: "1px solid rgba(233, 229, 4, 0.4)",
            }}
          >
            <Col>
              <div
                className="store-milestone"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  textAlign: "center",
                  borderRight: "1px solid rgba(233, 229, 4, 0.4)",
                  padding: "25px",
                }}
              >
                <div
                  style={{
                    color: "rgb(255, 238, 0)",
                    fontSize: "clamp(44px, 6vw, 48px)",
                  }}
                >
                  12<span style={{ fontSize: "75px" }}>k</span>+
                </div>
                <div>
                  ACTIVE <br />
                  STORES
                </div>
              </div>
            </Col>

            <Col>
              <div
                className="order-milestone"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  textAlign: "center",
                  borderRight: "1px solid rgba(233, 229, 4, 0.4)",
                  padding: "25px",
                }}
              >
                <div
                  style={{
                    color: "rgb(255, 238, 0)",
                    fontSize: "clamp(44px, 6vw, 48px)",
                    display: "flex",
                    alignItems: "end",
                    justifyContent: "center",
                  }}
                >
                  <div>725</div>
                  <div
                    style={{
                      fontSize: "62px",
                      marginBottom: "5px",
                    }}
                  >
                    k
                  </div>
                </div>
                <div>
                  ORDERS <br />
                  FULFILLED
                </div>
              </div>
            </Col>

            <Col>
              <div
                className="satisfactory-milestone"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  textAlign: "center",
                  padding: "25px",
                }}
              >
                <div
                  style={{
                    color: "rgb(255, 238, 0)",
                    fontSize: "clamp(44px, 6vw, 48px)",
                    display: "flex",
                    alignItems: "end",
                    justifyContent: "center",
                  }}
                >
                  <div>9</div>
                  <div
                    style={{
                      marginBottom: "10px",
                    }}
                  >
                    8%
                  </div>
                </div>
                <div>
                  ORDERS <br />
                  FULFILLED
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <WhyUs />

      <Categories />

      <FeaturedProducts />

      <HowItWorks />

      <div
        className=" text-center"
        style={{
          color: " rgba(194, 194, 194, 0.83)",
          background: "#2c2a08",
          padding: "150px 0",
        }}
      >
        <Container>
          <h3
            className="mb-4"
            style={{
              color: "rgb(255, 238, 0)",

              letterSpacing: "2px",
            }}
          >
            OUR FEATURES
          </h3>

          <h2 className="text-light mb-5">
            Everything a{" "}
            <span style={{ color: "#ffee00" }}>serious seller </span>
            needs
          </h2>

          <Row g-5 className="g-5">
            <Col className="col-12 col-lg-4">
              <div className="features-card">
                <Row g-5 className="align-items-start">
                  <Col className="col-auto">
                    <div className="mt-2">
                      {" "}
                      <FaStar
                        className="p-1"
                        style={{ border: "2px solid rgba(255, 238, 0, 0.62)" }}
                        color="yellow"
                        size={25}
                      />
                    </div>
                  </Col>
                  <Col>
                    <div>
                      <h4 className="text-light">Branded Storefront</h4>
                      <p>
                        Your store is a fully branded page with custom name,
                        profile, product gallery and bio. It's yours, not just a
                        listing on someone else's platform
                      </p>
                    </div>
                  </Col>
                </Row>
              </div>
            </Col>

            <Col className="col-12 col-lg-4">
              <div className="features-card">
                <Row g-5 className="align-items-start">
                  <Col className="col-auto">
                    <div className="mt-2">
                      {" "}
                      <FaStar
                        className="p-1"
                        style={{ border: "2px solid rgba(255, 238, 0, 0.62)" }}
                        color="yellow"
                        size={25}
                      />
                    </div>
                  </Col>
                  <Col>
                    <h4 className="text-light">Smart Discovery Engine</h4>
                    <p>
                      R.O.A surfaces your products to buyers who already wants
                      what you sell based on their browsing history and
                      interests.
                    </p>
                  </Col>
                </Row>
              </div>
            </Col>

            <Col className="col-12 col-lg-4">
              <div className="features-card">
                <Row g-5 className="align-items-start">
                  <Col className="col-auto">
                    <div className="mt-2">
                      {" "}
                      <FaStar
                        className="p-1"
                        style={{ border: "2px solid rgba(255, 238, 0, 0.62)" }}
                        color="yellow"
                        size={25}
                      />
                    </div>
                  </Col>
                  <Col>
                    <h4 className="text-light">Real-time Analytics</h4>
                    <p>
                      know your best sellers, top markets, and peak hours. make
                      decisions backed by data, not guesswork.
                    </p>
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      <div
        className=""
        style={{
          borderTopRightRadius: "170px",
          background: "#308f0465",
          padding: "110px 0",
        }}
      >
        <Container>
          <div className="py-4">
            <div
              className="d-inline-flex gap-2 align-items-center"
              style={{
                border: "1px solid rgb(255, 238, 0)",
                borderBottom: "none",
                padding: "5px 10px ",
              }}
            >
              <div
                style={{
                  background: "rgb(255, 238, 0)",
                  padding: "4px",
                  borderRadius: "50%",
                }}
              ></div>

              <div style={{ color: "rgb(255, 238, 0)" }}>
                {" "}
                <h6 className="m-0">COMING SOON</h6>
              </div>
            </div>

            <h1 className="text-light my-4" style={{ fontStyle: "italic" }}>
              The{" "}
              <span
                style={{
                  color: "rgb(255, 238, 0)",
                }}
              >
                Neighbourhood
              </span>{" "}
              is coming
            </h1>

            <p
              style={{
                color: "rgba(194, 194, 194, 0.93)",
                fontSize: "21px",
                lineHeight: 2,
              }}
            >
              R.O.A. is more than a marketplace. We're building a neighbourhood
              - a social layer where non sellers stay engaged, feel connected,
              and need not feel like a stranger on here. Everyone belongs here
              not just the sellers.
            </p>

            <div
              style={{ color: "rgba(194, 194, 194, 0.93)", marginTop: "45px" }}
            >
              <ul>
                <li>
                  <h5>A live community feed of store activity and new drops</h5>
                </li>
              </ul>

              <ul>
                <li>
                  <h5>Follow stores and sellers like you follow people</h5>
                </li>
              </ul>

              <ul>
                <li>
                  <h5>Community reviews, reactions, and recommendation</h5>
                </li>
              </ul>
            </div>

            <div className="my-5" style={{}}>
              <div className=" d-flex flex-column">
                <div className="d-flex waitlist-form justify-content-center">
                  <input type="email" placeholder="Your email address" id="" />
                  <button className="px-4">JOIN WAITLIST</button>
                </div>

                <p className="mt-2 mx-auto">
                  Be the first to access the neighbourhood when it launches
                </p>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* ── FOOTER ── */}
      <Footer />
    </>
  );
}

export default HomePage;
