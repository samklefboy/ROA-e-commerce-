import { Navbar, Container, Nav } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { FiBell } from "react-icons/fi";
import { useState, useEffect } from "react";

import HeaderAuth from "./header/HeaderAuth";
import { FaArrowLeft } from "react-icons/fa";

const CartPageHeader = ({ cartItems, selectedItems, removeSelected }) => {
  const navigate = useNavigate();
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
    <Navbar
      fixed="top"
      className={`header py-3 ${scrolled ? "header-scrolled" : ""}`}
    >
      <Container>
        <div className="d-flex align-items-center gap-4">
          <div
            className="d-inline-flex "
            onClick={() => navigate(-1)}
            style={{
              background: "#ffffff42",
              borderRadius: "100%",
              padding: "10px",
              cursor: "pointer",
            }}
          >
            <FaArrowLeft size={20} />
          </div>
          <div>
            <h3 className="text-white fw-bold mb-2">My cart</h3>
            <p>
              {cartItems.length} item{cartItems.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <Nav className="ms-auto nav-icons">
          <div className="d-flex align-items-center gap-4">
            <Nav.Link className="" as={Link} to="/notifications">
              <FiBell size={22} color="yellow" />
            </Nav.Link>
            {/* Remove selected */}
            {selectedItems.length > 0 && (
              <button
                type="button"
                onClick={removeSelected}
                style={{
                  fontSize: 12,
                  color: "#c0392b",
                  background: "rgba(192,57,43,0.08)",
                  border: "0.5px solid rgba(192,57,43,0.2)",
                  borderRadius: 8,
                  padding: "6px 12px",
                  cursor: "pointer",
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                }}
              >
                Remove ({selectedItems.length})
              </button>
            )}
          </div>
        </Nav>
      </Container>
    </Navbar>
  );
};

export default CartPageHeader;
