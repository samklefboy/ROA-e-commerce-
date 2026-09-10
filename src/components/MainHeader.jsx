import { Navbar, Container, Nav, Stack } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import HeaderHamburger from "./header/HeaderHamburger";
import { FaArrowLeft } from "react-icons/fa";
import HeaderLogo from "./header/HeaderLogo";
import HeaderSearch from "./header/HeaderSearch";
import HeaderIcons from "./header/HeaderIcons";
import HeaderAuth from "./header/HeaderAuth";
import ProductFilter from "./product/ProductFilter";

const MainHeader = ({
  title,
  searchValue,
  setSearch,
  showNotification = true,
  search = true,
  hamburger = true,
  showAuth = true,
  showCart = true,
  showWishlist = false,
  showSearchbtn = true,
  ownStore = false,
  CATEGORIES,
  selectedCategory,
  setSelectedCategory,
  shop = false,
}) => {
  const navigate = useNavigate();

  const [scrolled, setScrolled] = useState(false);

  const [showProfile, setShowProfile] = useState(false);

  const handleShow = () => {
    setShowProfile(true);
  };

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
      <Navbar
        fixed="top"
        className={`header py-3 ${scrolled ? "header-scrolled py-3" : ""} ${title ? "py-3" : ""}`}
      >
        <Container>
          <div className=" d-flex align-items-center gap-4 gap-">
            {title ? (
              <>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-4">
                    {" "}
                    <div
                      className="d-inline-flex p-1 p-sm-2 px-2 px-sm-3 "
                      onClick={() => navigate(-1)}
                      style={{
                        background: "#ffffffd7",
                        borderRadius: "50%",
                        cursor: "pointer",
                      }}
                    >
                      <FaArrowLeft size={18} className="text-dark" />
                    </div>
                    {title === "order" ? (
                      <h4
                        className="fw-bold fs-5 fs-sm-4 text-white"
                        style={{ letterSpacing: 1 }}
                      ></h4>
                    ) : (
                      <h4
                        className="text-white fw-bold fs-5 fs-sm-4"
                        style={{ letterSpacing: 1 }}
                      >
                        Hello Samuel
                      </h4>
                    )}
                  </div>

                  <p
                    className="p-1"
                    style={{
                      color: "#eaee09",
                    }}
                  >
                    12 total orders
                  </p>
                </div>
              </>
            ) : (
              <>
                {hamburger && <HeaderHamburger />}
                <HeaderLogo />
              </>
            )}
          </div>

          {search && (
            <HeaderSearch search={searchValue} setSearch={setSearch} />
          )}

          <div className=" nav-icons">
            <HeaderIcons
              showCart={showCart}
              showWishlist={showWishlist}
              showSearchbtn={showSearchbtn}
              showNotification={showNotification}
            />
            {showAuth && (
              <HeaderAuth
                handleShow={handleShow}
                show={showProfile}
                onHide={() => setShowProfile(false)}
                scrolled={scrolled}
              />
            )}

            {ownStore && (
              <Link to="/login">
                <div className="d-inline-flex gap-3 align-items-center">
                  <button className="login-btn">Login</button>
                </div>
              </Link>
            )}
          </div>
        </Container>
      </Navbar>
    </>
  );
};

export default MainHeader;
