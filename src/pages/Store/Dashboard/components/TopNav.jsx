import { Container, Image } from "react-bootstrap";
import { useEffect, useState } from "react";
import { FiBell, FiHome, FiPackage } from "react-icons/fi";
import { Link } from "react-router-dom";
import { ChevronDown, Search } from "react-bootstrap-icons";
import { FaMoneyBill, FaShoppingBasket, FaStore } from "react-icons/fa";

export function TopNav({ selectedTab, setSelectedTab }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  return (
    <>
      <div className={`fixed-top  ${scrolled ? "nav-scroll" : ""}`}>
        <Container>
          <div className=" py-2 d-flex align-items-center justify-content-between ">
            <Link to="/">
              <div
                className="d-flex align-items-center gap-2 "
                style={{ fontSize: 35 }}
              >
                {" "}
                <span style={{ color: " rgb(163, 207, 4)" }}>r.</span>
                <span style={{ color: "rgb(196, 250, 1)" }}>o.</span>
                <span style={{ color: "rgb(0, 241, 0)" }}>a</span>
              </div>
            </Link>

            <div
              className="d-flex align-items-center justify-content-between  py-2 px-3 w-100 mx-5 d-none d-md-flex"
              style={{
                background: "rgba(0, 34, 9, 0.78)",
                borderRadius: 20,
              }}
            >
              {[
                { Icon: FiHome, a: "Overview" },
                { Icon: FiPackage, a: "Products" },
                { Icon: FaShoppingBasket, a: "Orders" },
                { Icon: FaMoneyBill, a: "Earnings" },
                { Icon: FaStore, a: "Store" },
              ].map((s) => {
                return (
                  <div onClick={() => setSelectedTab(s.a)} key={s.a}>
                    <div
                      style={{
                        cursor: "pointer",
                      }}
                    >
                      <s.Icon
                        className="icon d-flex d-lg-none"
                        style={{
                          fontSize: 27,
                          color: selectedTab === s.a ? "#fbff01" : "#fff",
                        }}
                      />
                      <h6
                        className="d-none d-lg-flex"
                        style={{
                          color: selectedTab === s.a ? "#fbff01" : "#fff",
                        }}
                      >
                        {s.a}
                      </h6>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className=" gap-3 d-flex  align-items-center ">
              <div className="gap-4 gap-xl-5 d-flex  align-items-center ">
                <Search
                  style={{
                    fontSize: 22,
                    color: "#a0a0a0",
                    cursor: "pointer",
                  }}
                />
                <FiBell
                  style={{
                    fontSize: 22,
                    color: "#a0a0a0",
                    cursor: "pointer",
                  }}
                />
              </div>
              <div className="d-flex align-items-center gap-2">
                {" "}
                <Image
                  roundedCircle
                  style={{
                    objectFit: "cover",
                    width: "clamp(20px, 4vw, 40px)",
                    aspectRatio: "1/1",
                  }}
                  src="public/images/profile.jpg"
                />
                <h6
                  className=" d-md-none d-xl-block"
                  style={{
                    lineHeight: 1.3,
                    color: "#fff",
                    fontWeight: 700,
                  }}
                >
                  Annointed Chips
                </h6>
                <ChevronDown />
              </div>
            </div>
          </div>
        </Container>
      </div>

      <div
        className="fixed-bottom d-md-none"
        style={{ background: "#023810", borderTop: "1px solid #a5c70e69" }}
      >
        <Container>
          <div className=" py-2">
            <div className="d-flex  align-items-center  justify-content-between">
              {[
                { Icon: FiHome, a: "Overview" },
                { Icon: FiPackage, a: "Products" },
                { Icon: FaShoppingBasket, a: "Orders" },
                { Icon: FaMoneyBill, a: "Earnings" },
                { Icon: FaStore, a: "Store" },
              ].map((s) => {
                return (
                  <div
                    onClick={() => setSelectedTab(s.a)}
                    className="d-flex flex-column align-items-center gap-1"
                    key={s.a}
                    style={{ cursor: "pointer" }}
                  >
                    <s.Icon
                      className="icon"
                      style={{
                        color: selectedTab === s.a ? "#fbff01" : "#fff",
                        fontSize: "clamp(22px, 3vw, 30px)",
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
        </Container>
      </div>
    </>
  );
}
