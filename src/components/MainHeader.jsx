import { Navbar, Container, Nav, Stack } from "react-bootstrap";
import { useState, useEffect } from "react";
import HeaderHamburger from "./header/HeaderHamburger";
import HeaderLogo from "./header/HeaderLogo";
import HeaderSearch from "./header/HeaderSearch";
import HeaderIcons from "./header/HeaderIcons";
import HeaderAuth from "./header/HeaderAuth";

const MainHeader = ({
  searchValue,
  setSearch,
  showNotification = true,
  search = true,
  hamburger = true,
  showAuth = true,
  showCart = true,
  showWishlist = false,
  showSearchbtn = true,
}) => {
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
        className={`header py-3 ${scrolled ? "header-scrolled py-3" : ""} `}
      >
        <Container>
          <div className=" d-flex align-items-center gap-4 gap-">
            {hamburger && <HeaderHamburger />}
            <HeaderLogo />
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
          </div>
        </Container>
      </Navbar>
    </>
  );
};

export default MainHeader;
