import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Image, Nav, Stack } from "react-bootstrap";
import { Link } from "react-router-dom";
import ProductPage from "../../components/product/ProductPage.jsx";
import { motion, AnimatePresence } from "framer-motion";
import { fadeUp } from "../../animation";
import {
  FiHeadphones,
  FiLoader,
  FiSearch,
  FiShoppingCart,
} from "react-icons/fi";
import {
  FaArrowLeft,
  FaBus,
  FaLocationArrow,
  FaMoneyBill,
  FaMoneyCheck,
  FaWhatsapp,
} from "react-icons/fa";
import {
  Envelope,
  Instagram,
  Shield,
  ShieldCheck,
  TwitterX,
} from "react-bootstrap-icons";

const STORES = getStoreById("store-001");

const STORE_POLICIES = {
  Delivery: {
    Icon: FaBus,
    color: "#e0ee19",
  },
  Returns: {
    Icon: FiLoader,
    color: "#1927ee",
  },
  Warranty: {
    Icon: Shield,
    color: "#ee19ee",
  },

  Support: {
    Icon: FiHeadphones,
    color: "#19ee35",
  },
  Location: {
    Icon: FaLocationArrow,
    color: "#c0ee19",
  },
};

const STORE_CONTACT = [
  {
    Icon: FaWhatsapp,
    color: "#19ee19",
    bg: "#19ee193a",
    tag: "Whatsapp",
    value: `${STORES.whatsapp}`,
  },
  {
    Icon: Envelope,
    color: "#7c19ee",
    bg: "#7c19ee3a",
    tag: "Email",
    value: `${STORES.email}`,
  },
  {
    Icon: Instagram,
    color: "#ff9baa",
    bg: "#c21919e0",
    tag: "Instagram",
    value: `${STORES.socialLinks.instagram}`,
  },
  {
    Icon: TwitterX,
    color: "#ffffff",
    bg: "#0f0f0fcc",
    tag: "TwitterX",
    value: `${STORES.socialLinks.twitter}`,
  },
];

const STORE_SORT_OPTIONS = [
  "Newest first",
  "Best selling",
  "Low stock",
  "Price: low to high",
  "Price: high to low",
];
// config per CATEGORY — controls Icon and color
const SORT_CONFIG = {
  "Newest first": (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  "Most popular": (a, b) => (b.soldCount || 0) - (a.soldCount || 0),
  "Price: low to high": (a, b) => a.price - b.price,
  "Price: high to low": (a, b) => b.price - a.price,
  "Most sold": (a, b) => (b.soldCount || 0) - (a.soldCount || 0),
};

import { getStoreById, getProductsByStore } from "../../dummyData.js";

export default function StorePublicPage() {
  const [followed, setFollowed] = useState(false);
  const [tab, setTab] = useState("PRODUCTS");
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [sort, setSort] = useState("Newest first");
  // const [sortOpen, setSortOpen] = usestate(false);
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setScrolled(!entry.isIntersecting);
      },
      { threshold: 0 },
    );

    const storeHero = document.querySelector(".store_Image");

    if (storeHero) {
      observer.observe(storeHero);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const CATEGORIES = [
    "All",
    ...new Set(getProductsByStore("store-001").flatMap((p) => p.category)),
  ];

  return (
    <>
      <AnimatePresence>
        {" "}
        {scrolled && (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0, ease: "easeInOut" }}
          >
            {" "}
            <div
              className="scroll_active fixed-top"
              style={{
                backgroundImage: `linear-gradient( #001403a1 ) , url(${STORES.coverImage}) `,
              }}
            >
              {/* Topbar */}

              <Container>
                <div className="d-flex gap-4 gap-md-5  align-items-center py-3 scroll_content">
                  {" "}
                  <div
                    onClick={() => navigate(-1)}
                    className="d-flex align-items-center "
                    style={{
                      background: "#fff",
                      borderRadius: "50%",
                      padding: "10px",
                    }}
                  >
                    <FaArrowLeft size={18} color="black" />
                  </div>
                  <div className="d-flex gap-3 gap-sm-3 align-items-center ">
                    <Image
                      roundedCircle
                      width={50}
                      height={50}
                      style={{ objectFit: "cover" }}
                      src={STORES.logo}
                    />

                    <h4
                      className="fw-bold"
                      style={{
                        color: "#f0f6fc",
                        lineHeight: 1.2,
                      }}
                    >
                      {STORES.name}
                    </h4>
                  </div>{" "}
                  <div className="d-flex gap-4 gap-sm-5 align-items-center ms-auto me-3">
                    <FiSearch size={30} />

                    <Nav.Link
                      as={Link}
                      to="/cart"
                      style={{ position: "relative" }}
                    >
                      <FiShoppingCart size={30} />
                      <span
                        className="px-2 fw-bold"
                        style={{
                          background: "#d7e600",
                          color: "#000",
                          top: -10,
                          left: 20,
                          fontSize: "15px",
                          position: "absolute",
                          borderRadius: "50%",
                        }}
                      >
                        3
                      </span>
                    </Nav.Link>
                  </div>
                </div>
              </Container>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO ── */}
      <section>
        <div className="store_Image">
          <div
            style={{
              overflow: "hidden",
              position: "relative",
            }}
          >
            <Image
              src={STORES.coverImage}
              style={{
                objectFit: "cover",
                width: "100%",
                height: "clamp(250px, 40vw, 450px)",
              }}
            />
            <div
              style={{
                background:
                  " linear-gradient(180deg, #05270a00 , #001a0400, #05270a00, #001a04)",
                position: "absolute",
                bottom: 0,
                paddingTop: "60px",
                width: "100%",
              }}
            />
            {/* Badge pill */}
            {STORES.verified && (
              <div>
                <small
                  className="px-2 py-1 my-3 mx-sm-4 px-sm-4 me-3 d-flex align-items-center gap-2"
                  style={{
                    background: "rgba(2, 22, 12, 0.82)",
                    color: "#00E676",
                    border: "1px solid rgba(0,230,118,0.3)",
                    borderRadius: 20,
                    position: "absolute",
                    top: 0,
                    right: 0,
                    letterSpacing: 1,
                    display: "inline-block",
                    zIndex: 1,
                  }}
                >
                  <ShieldCheck className="mb-1" /> verified store
                </small>
              </div>
            )}

            {/* store category */}
            <small
              className="px-2 py-1 my-3 mx-sm-4 px-sm-4  ms-3"
              style={{
                background: "#131602d1",
                color: "#d7fd00d1",
                border: "1px solid #9db804d1",
                borderRadius: 20,
                position: "absolute",
                top: 0,
                left: 0,
                letterSpacing: 1,
                display: "inline-block",
              }}
            >
              {STORES.category}
            </small>
          </div>

          <Container>
            {" "}
            <div
              className="text-center"
              style={{
                marginTop: " clamp(-50px, 10vw, -200px)",
              }}
            >
              {/* Logo with glow ring + status dot */}
              <div
                style={{
                  position: "relative",
                  display: "inline-block",
                }}
              >
                <div className="profile-logo-wrapper">
                  <img src={STORES.logo} className="profile-logo" />
                </div>
                <span
                  style={{
                    position: "absolute",
                    bottom: 4,
                    right: 4,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background:
                      STORES.status === "ACTIVE" ? "#00E676" : "#d60606",
                    border: "2.5px solid #0d1117",
                    transition: "backgroung 0.3s easeInOut",
                  }}
                />
              </div>

              {/* Store name */}
              <span
                className="my-4 mb-sm-2"
                style={{
                  fontWeight: 800,
                  color: "#f0f6fc",
                  display: "block",
                  fontSize: "clamp(1.95rem, 6vw, 4.7em)",
                  lineHeight: 1.2,
                }}
              >
                {STORES.name}
              </span>
            </div>
          </Container>
        </div>

        <Container>
          <div className="text-center">
            {/* Meta */}
            <h6
              className=""
              style={{
                lineHeight: 1.72,
              }}
            >
              {STORES.handle} &nbsp;·&nbsp; 📍 {STORES.location}
              &nbsp;·&nbsp; {STORES.createdAt}
            </h6>

            {/* Tagline */}
            <h6
              className="my-3"
              style={{
                lineHeight: 1.72,
              }}
            >
              {STORES.tagline}
            </h6>

            {/* open */}
            {STORES.isOpen && (
              <div className="d-flex align-items-center gap-2 justify-content-center pb-4">
                {" "}
                <span
                  className=" inline-flex"
                  style={{
                    background: "#1aee96",
                    borderRadius: "100%",
                    padding: "3px",
                  }}
                />
                <p style={{ color: "#56b990" }}>
                  Open now &nbsp;·&nbsp; Responds within 1 hr
                </p>
              </div>
            )}

            {/* CTAs */}
            <div>
              <button
                onClick={() => setFollowed((f) => !f)}
                className=" fs-5 fw-bold text-center py-2 w-50 w-lg-100 my-3"
                style={{
                  background: followed ? "#00E676" : "transparent",
                  border: followed ? "none" : "#00e67757",
                  borderRadius: 12,
                  fontSize: "0.92rem",
                  color: followed ? "#000" : "#00e677f6",
                  boxShadow: "0 8px 28px rgba(0, 230, 119, 0.2)",
                  transition: "all 0.22s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "translateY(-2px)")
                }
                onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
              >
                {followed ? "following..." : " ♡ Follow Store"}
              </button>
            </div>
          </div>
        </Container>
      </section>

      {/* Stats strip */}
      <Container>
        <div className="py-5  d-flex gap-4 gap-sm-5 justify-content-center flex-wrap">
          {STORES.stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <h6
                className="fw-bold mb-3 fs-1"
                style={{
                  color: "#b6eb24f6",
                }}
              >
                {value}
              </h6>
              <p style={{ letterSpacing: 1 }}>{label}</p>
            </div>
          ))}
        </div>
      </Container>

      {/* ── TRUST STRIP ── */}

      <div className="trust-chip-container py-3 py-md-4 py-lg-5 ">
        <Container>
          <div className="d-flex gap-4 flex-wrap justify-content-center">
            {STORES.trust.map((t) => (
              <span key={t} className="trust-chip  py-sm-1 px-3">
                ✓ &nbsp;{t}
              </span>
            ))}
          </div>
        </Container>
      </div>

      {/* ── PROMO BANNER ── */}

      <div style={{ background: "#3c3d01" }}>
        <Container>
          <div
            className="py-3 d-flex "
            style={{ overflowX: "auto", color: "#fbff00" }}
          >
            🔥🔥 Flash Sale — Up to 30% off selected items this week only
          </div>
        </Container>
      </div>

      <Container>
        <div className=" d-flex justify-content-between  justify-content-md-start gap-md-5 pt-5">
          {["PRODUCTS", "ABOUT", "REVIEWS"].map((s) => {
            return (
              <div
                className="px-3 py-2"
                key={s}
                onClick={() => setTab(s)}
                style={{
                  cursor: "pointer",
                  border: `0.5px solid ${tab === s ? "#c2c518" : "#f0f0f067"}`,
                  background: tab === s ? "#57580f70" : "",
                  borderRadius: "18px",
                }}
              >
                {" "}
                <p
                  style={{
                    color: tab === s ? "#c0ca2b" : "",
                  }}
                >
                  {s}
                </p>
              </div>
            );
          })}
        </div>

        {/* ── STORE_PRODUCTS ── */}
        {tab === "PRODUCTS" && (
          <div className="my-5 py-lg-3">
            {" "}
            <h6
              className="mb-4 py-lg-3"
              style={{
                color: "#00E676",
                fontWeight: 700,
                letterSpacing: 1,
              }}
            >
              STORE CATALOGUE
            </h6>
            <ProductPage
              filter={true}
              product={getProductsByStore("store-001")}
              count={!false}
              CATEGORIES={CATEGORIES}
              sort={sort}
              Store={false}
              setSort={setSort}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              storeFront={true}
            />
          </div>
        )}

        {/* ── ABOUT ── */}

        {tab === "ABOUT" && (
          <>
            {" "}
            {/* about store */}
            <div
              className="mt-5"
              style={{
                border: "1px solid rgba(233, 229, 4, 0.32)",
                borderRadius: 15,
                background: "rgba(12, 12, 12, 0.29)",
              }}
            >
              <div
                className="p-4 py-3"
                style={{
                  color: "rgb(226, 223, 59)",
                  borderBottom: "1px solid  rgba(233, 229, 4, 0.27)",
                }}
              >
                ABOUT THIS STORE
              </div>
              <div className="p-4">
                <p style={{ lineHeight: "25px" }}>{STORES.about}</p>
              </div>
            </div>
            {/* store policies*/}
            <div
              className="my-5"
              style={{
                border: "1px solid rgba(233, 229, 4, 0.32)",
                borderRadius: 15,
                background: "rgba(12, 12, 12, 0.29)",
              }}
            >
              <div
                className="p-4 py-3"
                style={{
                  color: "rgb(226, 223, 59)",
                  borderBottom: "1px solid  rgba(233, 229, 4, 0.27)",
                }}
              >
                {" "}
                STORE POLICIES
              </div>
              <div className="px-4">
                {STORES.policies.map((p) => {
                  const policiesConfig = STORE_POLICIES[p.label];
                  return (
                    <div key={p.label}>
                      {" "}
                      <Stack
                        className="my-4 py-2 gap-3 gap-lg-4 "
                        direction="horizontal"
                      >
                        <policiesConfig.Icon
                          size={20}
                          style={{
                            color: policiesConfig.color,
                          }}
                        />
                        <h6>{p.label}</h6>
                        <p
                          className="text-white ms-auto text-end"
                          style={{ lineHeight: "25px" }}
                        >
                          {p.value}
                        </p>
                      </Stack>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* store contact info*/}
            <div
              className="my-5"
              style={{
                border: "1px solid rgba(233, 229, 4, 0.32)",
                borderRadius: 15,
                background: "rgba(12, 12, 12, 0.29)",
              }}
            >
              <div
                className="p-4 py-3"
                style={{
                  color: "rgb(226, 223, 59)",
                  borderBottom: "1px solid  rgba(233, 229, 4, 0.27)",
                }}
              >
                CONTACTS
              </div>
              <div className="px-4">
                {STORE_CONTACT.map((c) => {
                  return (
                    <Stack
                      key={c}
                      className="my-5 align-items-center"
                      direction="horizontal"
                      gap={3}
                    >
                      <c.Icon
                        className="d-flex align-items-center justify-content-center p-2"
                        size={35}
                        style={{
                          color: c.color,
                          borderRadius: "9px",
                          background: c.bg,
                        }}
                      />
                      <div>
                        {" "}
                        <p>{c.tag}</p>
                      </div>

                      <p className="text=white d-none d-sm-block ms-auto">
                        {c.value}
                      </p>
                    </Stack>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </Container>

      {/* ── FOOTER ── */}
      <footer
        className="py-4 mt-5"
        style={{
          background: "#010500",
        }}
      >
        <Container>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <span
              style={{
                color: "rgba(255,255,255,0.2)",
                fontSize: "1rem",
              }}
            >
              © 2026 R. O . A Powering local stores online
            </span>
            <div style={{ display: "flex", gap: 22 }}>
              {["Support?", "Report Store"].map((link) => (
                <a
                  key={link}
                  href="#"
                  style={{
                    color: "rgba(255,255,255,0.26)",
                    fontSize: "0.75rem",
                    fontFamily: "'Outfit',sans-serif",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#00E676")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "rgba(255,255,255,0.26)")
                  }
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        </Container>
      </footer>

      {/* <WhatsAppFloat store={STORES.whatsapp} /> */}
    </>
  );
}
