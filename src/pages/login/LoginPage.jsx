import { Container } from "react-bootstrap";
import { useState } from "react";
import { Card, Form, Alert } from "react-bootstrap";
import { motion, AnimatePresence } from "framer-motion";
import PhoneInput from "./components/PhoneInput";
import { requestOtp } from "../../services/authService";
import "./LoginPage.css";
import VerifyOtpPage from "./components/VerifyOtpPage";
import { zoomIn } from "../../utils/animation";

export const LoginPage = () => {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page1, setPage1] = useState(true);
  const [page2, setPage2] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (!phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }
    try {
      setLoading(true);
      await requestOtp(phone);
      setPage1(false);
      setPage2(true);
    } catch (error) {
      setError(
        error.response?.data?.message || "Unable to send verification code.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container className="d-flex align-items-center justify-content-center min-vh-100">
      {page1 && (
        <AnimatePresence initial={false}>
          <motion.div
            variants={zoomIn}
            initail="hidden"
            animate="visible"
            exit={{
              opacity: 0,
              x: -20,
              animationDuration: 0.2,
            }}
            style={{
              width: "100%",
              maxWidth: 750,
              background: "none",
              borderRadius: 22,
            }}
          >
            {" "}
            <Card
              className=" border-0"
              style={{
                background: "none",
              }}
            >
              {" "}
              <Card.Body>
                {" "}
                <div className="mb-5 text-center ">
                  <h1 className=" fw-bold">
                    {" "}
                    Welcome to
                    <span className="ms-2 ">
                      <div style={{ display: "inline-flex", gap: 6 }}>
                        <h1 className="first-letter">r.</h1>{" "}
                        <h1 className="second-letter">o.</h1>{" "}
                        <h1 className="third-letter">a.</h1>
                      </div>
                    </span>
                  </h1>{" "}
                  <p className=" my-4">
                    Sign in or create your account using your phone number.{" "}
                  </p>{" "}
                </div>{" "}
                {error && <Alert variant="danger"> {error} </Alert>}
                <Form onSubmit={handleSubmit}>
                  {" "}
                  <PhoneInput
                    value={phone}
                    onChange={setPhone}
                    disabled={loading}
                  />{" "}
                  <button
                    type="submit"
                    className="w-100 mt-4 container-login-button"
                    disabled={loading}
                  >
                    {" "}
                    {loading ? "Sending code..." : "Continue"}{" "}
                  </button>{" "}
                </Form>
                <p className=" mt-4 mb-0">
                  {" "}
                  By continuing, you agree to ROA's terms and privacy
                  policy.{" "}
                </p>{" "}
              </Card.Body>{" "}
            </Card>
          </motion.div>
        </AnimatePresence>
      )}
      {page2 && (
        <AnimatePresence>
          <VerifyOtpPage phone={phone} />
        </AnimatePresence>
      )}
    </Container>
  );
};
