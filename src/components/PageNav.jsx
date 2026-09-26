import { Container } from "react-bootstrap";
import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { FiSearch, FiSettings } from "react-icons/fi";
import { FaArrowLeft } from "react-icons/fa";

export default function NavTop({
  title,
  showSearchBtn = false,
  notifAction = false,
  summary,
  markAllRead,
  markingAll,
}) {
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
    <div
      className={`header fixed-top py-3 ${scrolled ? "header-scrolled py-3" : ""}`}
    >
      <Container>
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex gap-4  align-items-center">
            {" "}
            <div
              onClick={() => navigate(-1)}
              className="d-flex align-items-center justify-content-center"
              style={{
                width: 45,
                height: 40,
                background: "#ffffff1a",
                borderRadius: "100%",
                cursor: "pointer",
              }}
            >
              <FaArrowLeft size={20} />
            </div>
            <h4 className="text-light fw-bold mb-0">{title}</h4>
          </div>
          {showSearchBtn && (
            <div>
              <FiSearch size={24} />
            </div>
          )}
          {notifAction && (
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
              }}
            >
              {summary.unread > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  disabled={markingAll}
                  className="border-0 bg-transparent p-0"
                  style={{
                    color: markingAll ? "#777" : "#c4b531",
                    cursor: markingAll ? "default" : "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {markingAll ? "Marking..." : "Mark all read"}
                </button>
              )}

              <button
                type="button"
                onClick={() => navigate("/settings")}
                className="border-0 bg-transparent text-light p-0"
                aria-label="Notification settings"
                style={{
                  cursor: "pointer",
                }}
              >
                <FiSettings
                  style={{
                    fontSize: 20,
                  }}
                />
              </button>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
