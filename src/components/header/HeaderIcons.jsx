import { Badge, Nav, Container } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { FiSearch, FiShoppingCart, FiBell, FiHeart } from "react-icons/fi";

const HeaderIcons = ({
  showCart,
  showWishlist,
  showSearchbtn,
  showNotification,
}) => {
  const { user } = useAuthStore();

  return (
    <>
      {user && (
        <Container>
          <div className="header-icons">
            {showSearchbtn && (
              <Nav.Link className="d-md-none ms-auto">
                <FiSearch size={24} color="white" />
              </Nav.Link>
            )}

            {showNotification && (
              <Nav.Link
                className={` d-none d-md-block ${showNotification ? "d-block" : ""}`}
                as={Link}
                to="/notification"
              >
                <FiBell size={24} color="orange" />
              </Nav.Link>
            )}

            {showWishlist && (
              <Nav.Link className="mx-2" as={Link} to="/wishlist">
                <FiHeart size={24} />
                <Badge pill className=" p-1">
                  <div>2</div>
                </Badge>
              </Nav.Link>
            )}

            {showCart && (
              <Nav.Link as={Link} to="/cart">
                <FiShoppingCart size={24} />
                <Badge pill className=" p-1">
                  <div>2</div>
                </Badge>
              </Nav.Link>
            )}
          </div>
        </Container>
      )}

      {!user && (
        <div className="header-icons ">
          {showSearchbtn && (
            <Nav.Link className="d-md-none ms-auto">
              <FiSearch size={24} color="white" />
            </Nav.Link>
          )}
          {showCart && (
            <Nav.Link as={Link} to="/cart">
              <FiShoppingCart size={24} />
              <Badge pill className=" p-1">
                <div>2</div>
              </Badge>
            </Nav.Link>
          )}
        </div>
      )}
    </>
  );
};

export default HeaderIcons;
