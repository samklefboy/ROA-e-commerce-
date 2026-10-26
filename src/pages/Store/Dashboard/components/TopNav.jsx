import { useEffect, useState } from "react";
import { Container, Image } from "react-bootstrap";
import { FiBell, FiHome, FiPackage } from "react-icons/fi";
import { FaMoneyBill, FaShoppingBasket, FaStore } from "react-icons/fa";
import { ChevronDown } from "react-bootstrap-icons";
import { Link } from "react-router-dom";

const DASHBOARD_TABS = [
  { Icon: FiHome, label: "Overview" },
  { Icon: FiPackage, label: "Products" },
  { Icon: FaShoppingBasket, label: "Orders" },
  { Icon: FaMoneyBill, label: "Earnings" },
  { Icon: FaStore, label: "Promotions" },
];

export function TopNav({ selectedTab = "Overview", setSelectedTab }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleTabChange = (tab) => {
    if (typeof setSelectedTab === "function") {
      setSelectedTab(tab);
    }
  };

  const renderTab = (tab, mobile = false) => {
    const { Icon, label } = tab;
    const isActive = selectedTab === label;

    return (
      <button
        key={label}
        type="button"
        onClick={() => handleTabChange(label)}
        aria-current={isActive ? "page" : undefined}
        aria-label={label}
        title={label}
        className={`border-0 ${
          mobile
            ? "d-flex flex-column align-items-center justify-content-center gap-1 flex-fill"
            : "d-flex align-items-center justify-content-center gap-2"
        }`}
        style={{
          cursor: "pointer",
          minWidth: 0,
          minHeight: mobile ? 54 : 42,
          flex: mobile ? "1 1 0" : "1 1 0",
          padding: mobile ? "6px 2px" : "10px 12px",
          borderRadius: mobile ? 12 : 30,
          background: isActive
            ? mobile
              ? "rgba(251, 255, 1, 0.12)"
              : "#fbff01"
            : "transparent",
          color: isActive ? (mobile ? "#fbff01" : "#111") : "#fff",
          transition: "background 180ms ease, color 180ms ease",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <Icon
          aria-hidden="true"
          style={{
            flexShrink: 0,
            fontSize: mobile
              ? "clamp(19px, 5vw, 24px)"
              : "clamp(19px, 2vw, 23px)",
          }}
        />

        <span
          style={{
            fontSize: mobile ? "clamp(9px, 2.5vw, 11px)" : 14,
            lineHeight: 1.2,
            fontWeight: isActive ? 700 : 500,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "100%",
          }}
          className={mobile ? "" : "d-none d-lg-inline"}
        >
          {label}
        </span>
      </button>
    );
  };

  return (
    <>
      {/* Desktop and tablet top navigation */}
      <div
        className={`fixed-top ${scrolled ? "nav-scroll" : ""}`}
        style={{
          zIndex: 1030,
          background: scrolled
            ? "rgba(5, 16, 10, 0.97)"
            : "rgba(5, 16, 10, 0.94)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: scrolled
            ? "1px solid rgba(165, 199, 14, 0.2)"
            : "1px solid transparent",
          transition: "background 180ms ease, border-color 180ms ease",
        }}
      >
        <Container>
          <div
            className="py-2 d-flex align-items-center justify-content-between gap-2 gap-lg-3"
            style={{ minHeight: 64 }}
          >
            {/* ROA logo */}
            <Link
              to="/"
              aria-label="ROA home"
              className="text-decoration-none flex-shrink-0"
            >
              <div
                className="d-flex align-items-center"
                style={{
                  fontSize: "clamp(27px, 3vw, 35px)",
                  fontWeight: 800,
                  lineHeight: 1,
                  letterSpacing: "-2px",
                }}
              >
                <span style={{ color: "rgb(163, 207, 4)" }}>r.</span>
                <span style={{ color: "rgb(196, 250, 1)" }}>o.</span>
                <span style={{ color: "rgb(0, 241, 0)" }}>a</span>
              </div>
            </Link>

            {/* Desktop navigation */}
            <nav
              aria-label="Seller dashboard navigation"
              className="d-none d-md-flex align-items-center justify-content-between flex-grow-1 mx-md-2 mx-lg-4 p-1"
              style={{
                minWidth: 0,
                maxWidth: 680,
                background: "linear-gradient(145deg, #034421, #0a1600)",
                borderRadius: 30,
                border: "1px solid #405045",
              }}
            >
              {DASHBOARD_TABS.map((tab) => renderTab(tab))}
            </nav>

            {/* Notifications and seller profile */}
            <div className="d-flex align-items-center gap-2 gap-lg-3 flex-shrink-0">
              <button
                type="button"
                aria-label="Notifications"
                title="Notifications"
                className="border-0 bg-transparent d-flex align-items-center justify-content-center rounded-circle"
                style={{
                  width: 40,
                  height: 40,
                  color: "#a0a0a0",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <FiBell size={22} />
              </button>

              <button
                type="button"
                aria-label="Seller profile menu"
                className="border-0 bg-transparent d-flex align-items-center gap-2 p-0"
                style={{ cursor: "pointer", minWidth: 0 }}
              >
                <Image
                  roundedCircle
                  src="/images/profile.jpg"
                  alt="Seller profile"
                  onError={(event) => {
                    event.currentTarget.style.visibility = "hidden";
                  }}
                  style={{
                    objectFit: "cover",
                    width: "clamp(28px, 3vw, 40px)",
                    height: "clamp(28px, 3vw, 40px)",
                    flexShrink: 0,
                    background: "#243328",
                  }}
                />

                <span
                  className="d-none d-xl-inline text-truncate"
                  style={{
                    maxWidth: 130,
                    lineHeight: 1.3,
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  Annointed Chips
                </span>

                <ChevronDown
                  className="d-none d-sm-inline"
                  color="#b9c0bb"
                  size={14}
                />
              </button>
            </div>
          </div>
        </Container>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Mobile seller dashboard navigation"
        className="d-md-none fixed-bottom"
        style={{
          zIndex: 1030,
          background: "rgba(2, 56, 16, 0.98)",
          borderTop: "1px solid #a5c70e69",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <Container fluid="sm">
          <div className="d-flex align-items-center justify-content-between gap-1 py-2">
            {DASHBOARD_TABS.map((tab) => renderTab(tab, true))}
          </div>
        </Container>
      </nav>
    </>
  );
}
