import { Container, Badge, Button, Nav } from "react-bootstrap";
import { BsArrowRight, BsPeople, BsShieldCheck, BsShop } from "react-icons/bs";

export function HeroSection({ setCreate, create }) {
  return (
    <section className="hero_section">
      <Container>
        <Badge className="hero-badge px-4 mb-4">
          <h6>Start selling on R.O.A</h6>
        </Badge>

        <div
          className="mb-4"
          style={{
            fontSize: "clamp(46px, 7.5vw, 150px)",
            fontWeight: 600,
            lineHeight: 1.4,
          }}
        >
          <div className="text-white">Your store</div>
          <div className="text-white">Your brand</div>
          <div style={{ color: "#ffcc01" }}>Your earnings</div>
        </div>

        <h6 style={{ lineHeight: 1.3 }}>
          Join thousands of sellers already making money with us. Set up your
          store in minutes, list your products and start selling to your
          patronizers/buyers across Nigeria.
        </h6>

        <div
          onClick={() => setCreate(!false)}
          className="hero-btn my-5 p-3 py-2 fs-4 d-inline-block ms-2"
          style={{ cursor: "pointer" }}
        >
          <Nav.Link
            className={`text-dark ${create ? "d-none" : "d-block"}`}
            href="#store_open"
          >
            Create Store
            <BsArrowRight className="ms-2" />{" "}
          </Nav.Link>
        </div>

        <div className="hero-stat justify-content-center ">
          <div className="d-flex flex-column gap-2  text-center">
            <BsShop size={33} className="mx-auto mb-1 " />
            <h3>10K+</h3>
            <span>Products</span>
          </div>

          <div className="d-flex flex-column gap-2  text-center ">
            <BsPeople size={33} className="mx-auto mb-1 " />
            <h3>50+</h3>
            <span>Stores</span>
          </div>

          <div className="d-flex flex-column gap-2  text-center ">
            <BsShieldCheck size={33} className="mx-auto mb-1 " />
            <h3>100%</h3>
            <span>Secure</span>
          </div>
        </div>
      </Container>
    </section>
  );
}
