import { Container, Row, Col } from "react-bootstrap";
import {
  FaInstagram,
  FaLinkedin,
  FaTwitter,
  FaTiktok,
  FaWhatsapp,
} from "react-icons/fa";

export const Footer = () => {
  return (
    <>
      <div
        style={{
          background: "#292727bd",
          color: "rgba(194, 194, 194, 0.83)",
          borderTop: "1px solid rgba(255, 238, 0, 0.575)",
        }}
      >
        <Container>
          <div className="py-5 mx-auto about px-3 px-sm-0">
            <h1 style={{ color: "rgb(255, 238, 0)" }}>R . O . A .</h1>

            <h6 style={{ color: "rgb(255, 238, 0)", paddingTop: "7px" }}>
              REACH. OWN. ACHIEVE.
            </h6>

            <p>
              A premium e-commerce platform built for sellers who thinks
              inter-state and buyers who want something real. Open your store,
              find your market, sell everywhere.
            </p>

            <Row g-5 className="mt-4 g-5">
              <Col>
                <h6 style={{ color: "rgb(255, 238, 0)" }}>PLATFORM</h6>
                <div className="d-flex flex-column gap-2">
                  <a href="">For Sellers</a>
                  <a href="">For Buyers</a>
                  <a href="">Pricing</a>
                  <a href="">Neighbourhood</a>
                  <a href="">Categories</a>
                  <a href="">Become a Seller</a>
                </div>
              </Col>

              <Col>
                <h6 style={{ color: "rgb(255, 238, 0)" }}>COMPANY</h6>
                <div className="d-flex flex-column gap-2">
                  <a href="">About R.O.A.</a>
                  <a href="">Blog</a>
                  <a href="">Careers</a>
                  <a href="">Contact</a>
                </div>
              </Col>

              <Col>
                <h6 style={{ color: "rgb(255, 238, 0)" }}>LEGAL</h6>
                <div className="d-flex flex-column gap-2">
                  <a href="">Privacy Policy</a>
                  <a href="">Terms of Use</a>
                  <a href="">Cookie Policy</a>
                </div>
              </Col>
            </Row>
          </div>
        </Container>
      </div>

      <footer className="bg-black py-3">
        <Container>
          <div
            className="justify-content-center justify-content-sm-between"
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <span
              style={{
                color: "rgba(255, 255, 255, 0.29)",
                fontSize: "clamp(15px, 5px + 1vw, 22px)",
              }}
            >
              © 2026 R.O.A. · Powering local stores online.
            </span>

            <div
              style={{ display: "flex", gap: "clamp(1px, 1vw, 10px)" }}
              className="footer-social-links"
            >
              {[
                { key: "whatsapp", Icon: FaWhatsapp },
                { key: "instagram", Icon: FaInstagram },
                { key: "linkedin", Icon: FaLinkedin },
                { key: "tiktok", Icon: FaTiktok },
              ].map((link) => (
                <a key={link.key} href="#">
                  <link.Icon />
                </a>
              ))}
            </div>
          </div>
        </Container>
      </footer>
    </>
  );
};
