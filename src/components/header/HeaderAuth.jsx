import {
  Nav,
  Image,
  Offcanvas,
  Container,
  Stack,
  NavDropdown,
} from "react-bootstrap";
import { useState } from "react";
import {
  Bag,
  Heart,
  Person,
  Gear,
  Shop,
  FileArrowDown,
  Eye,
  Chat,
  EyeSlash,
} from "react-bootstrap-icons";
import {
  FaChevronRight,
  FaHandshake,
  FaPhoneAlt,
  FaSignOutAlt,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

const HeaderAuth = () => {
  const [view, setView] = useState(false);
  const { user } = useAuthStore();

  const [showProfile, setShowProfile] = useState(false);

  return (
    <>
      {user && (
        <Container>
          <Stack
            className="ps-2 align-items-center "
            direction="horizontal"
            gap={1}
            onClick={() => setShowProfile(true)}
            style={{
              background: "#eff3087c",
              borderRadius: "10px",
              fontSize: "11px",
              cursor: "pointer",
              overflow: "hidden",
            }}
          >
            {view ? (
              <h6 className="text-white">***</h6>
            ) : (
              <p className="text-white text-wrap">₦ </p>
            )}

            <div
              className="d-flex align-items-center gap-1"
              style={{ overflow: "hidden" }}
            >
              <Image
                style={{
                  objectFit: "cover",
                }}
                roundedCircle
                width={25}
                height={28}
                src="/images/profile.jpg"
              />
            </div>
          </Stack>
        </Container>
      )}

      <Offcanvas
        show={showProfile}
        onHide={() => setShowProfile(false)}
        placement="end"
        className="profile-dropdown"
      >
        <div className="pt-3 px-4 d-flex flex-column">
          <div className="d-flex gap-3 align-items-center mb-3">
            <div className="profile-pic-wrapper">
              <Image className="profile-pic" src="/images/profile.jpg" />
            </div>

            <p
              className="text-light ms-auto fs-5"
              onClick={() => setShowProfile(false)}
              style={{ cursor: "pointer" }}
            >
              X
            </p>
          </div>
        </div>

        <Offcanvas.Body className="profile-body p-0 mt-2">
          <div className="wallet px-3 pt-4 pb-5 mx-2 mb-4 ">
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-3 ">
                {" "}
                <p>My Balance(NGN)</p>
                <p
                  onClick={() => setView((p) => !p)}
                  style={{ cursor: "pointer" }}
                >
                  {view ? <EyeSlash size={20} /> : <Eye size={20} />}
                </p>
              </div>
              <div className="text-end">
                <Link to="/transactions">
                  <p>View all transactions</p>
                </Link>
              </div>
            </div>
            <div className="  my-4 my-md-5">
              {view ? (
                <h1
                  className="fs-1 fw-bolder text-white"
                  style={{ letterSpacing: 4, fontFamily: "Syne" }}
                >
                  ***
                </h1>
              ) : (
                <h1
                  className="fs-1 fw-bolder text-white"
                  style={{ letterSpacing: 4, fontFamily: "Syne" }}
                >
                  ₦
                </h1>
              )}
            </div>

            <Stack direction="horizontal" gap={3} className="my-3">
              <Link to="/wallet/topup" className="w-100">
                <button
                  className="text-light text-center  p-2  w-100"
                  style={{
                    background: "#e00837",
                    borderRadius: "20px",
                    border: "1px solid #ffffffab",
                  }}
                >
                  Top up
                </button>
              </Link>

              <Link to="/wallet/withdraw" className="w-100">
                <button
                  className="text-light text-center w-100 p-2  "
                  style={{
                    background: "#7f08e0",
                    border: "1px solid #ffffffab",
                    borderRadius: "20px",
                  }}
                >
                  Withdraw
                </button>
              </Link>
            </Stack>
          </div>

          <div className="flex-column nav-items mx-2 px-4">
            <NavDropdown.Item>
              <Nav.Link as={Link} to="/profile">
                <Stack
                  className="justify-content-between"
                  direction="horizontal"
                >
                  <span>
                    <Person className="me-3 profile_Icons" /> Profile
                  </span>
                  <FaChevronRight />
                </Stack>
              </Nav.Link>
            </NavDropdown.Item>

            <NavDropdown.Item>
              <Nav.Link as={Link} to="/wishlist">
                <Stack
                  className="justify-content-between"
                  direction="horizontal"
                >
                  <span>
                    <Heart className="me-3 profile_Icons" />
                    Wishlist
                  </span>
                  <FaChevronRight />
                </Stack>
              </Nav.Link>
            </NavDropdown.Item>

            <NavDropdown.Item>
              <Nav.Link as={Link} to="/orders">
                <Stack
                  className="justify-content-between"
                  direction="horizontal"
                >
                  <span>
                    <FileArrowDown className="me-3 profile_Icons" /> My
                    Orders{" "}
                  </span>
                  <FaChevronRight />
                </Stack>
              </Nav.Link>
            </NavDropdown.Item>

            {/*  {user.hasShop && (
              <>
                <NavDropdown.Item>
                  <Nav.Link as={Link} to="/store/dashboard">
                    <span>
                      <Shop className="me-3 profile_Icons" />
                      Creator Studio (My Store)
                    </span>
                  </Nav.Link>
                </NavDropdown.Item>
              </>
            )} */}

            <NavDropdown.Item className="border-0">
              <Nav.Link as={Link} to="/profile" className="">
                <Stack
                  className="justify-content-between"
                  direction="horizontal"
                >
                  <span>
                    <Gear className="me-3 profile_Icons" /> Account
                    Settings{" "}
                  </span>
                  <FaChevronRight />
                </Stack>
              </Nav.Link>
            </NavDropdown.Item>
          </div>

          <div className="customer_service mx-2 my-4 p-4">
            <Stack className="justify-content-between" direction="horizontal">
              <div className="text-light d-flex gap-1">
                <FaHandshake size={25} className="profile_icons me-3" />
                CUSTOMER SERVICE
              </div>
              <FaChevronRight className="text-light " />
            </Stack>

            <p className="my-3" style={{ marginLeft: "37px" }}>
              Our customer service team are dedicated to cater all your requests
              anywhere,anytime,anyhow
            </p>

            <Stack
              direction="horizontal"
              gap={0}
              style={{ marginLeft: "37px" }}
            >
              <button
                className="w-100 text-center "
                style={{ borderBottomRightRadius: 0 }}
              >
                <FaPhoneAlt
                  size={25}
                  className="me-2"
                  style={{ color: "#00ff15" }}
                />
                Call Us
              </button>

              <button
                className="w-100 text-center"
                style={{ borderBottomLeftRadius: 0, borderTopLeftRadius: 0 }}
              >
                <Chat size={25} className="me-2" style={{ color: "#00ff15" }} />
                Message Us
              </button>
            </Stack>
          </div>

          <div className="logout mx-2 mb-4 p-4" style={{ cursor: "pointer" }}>
            <div className="d-flex gap-3 text-light">
              <FaSignOutAlt className="profile_icons" />
              LOGOUT
            </div>
          </div>
        </Offcanvas.Body>
      </Offcanvas>

      {!user && (
        <Link to="/login">
          <button className="login-btn py-0 px-4">Login</button>
        </Link>
      )}
    </>
  );
};

export default HeaderAuth;
