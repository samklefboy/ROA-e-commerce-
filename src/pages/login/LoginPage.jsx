import { Container, Card, Form, Alert } from "react-bootstrap";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import PhoneInput from "./components/PhoneInput";
import VerifyOtpPage from "./components/VerifyOtpPage";
import PasswordLoginPage from "./components/PasswordLoginPage";

import { requestOtp } from "../../services/authService";
import "./LoginPage.css";
import { zoomIn } from "../../utils/animation";

export const LoginPage = () => {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [step, setStep] = useState("phone");

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    try {
      setLoading(true);

      const data = await requestOtp(phone);

      if (data.exists && data.requiresPassword) {
        setStep("password");
        return;
      }
      setStep("otp");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to continue. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (step === "password") {
    return (
      <Container className="d-flex align-items-center justify-content-center min-vh-100">
        <PasswordLoginPage
          phone={phone}
          onBack={() => {
            setStep("phone");
            setError("");
          }}
        />
      </Container>
    );
  }

  if (step === "otp") {
    return (
      <Container className="d-flex align-items-center justify-content-center min-vh-100">
        <VerifyOtpPage phone={phone} />
      </Container>
    );
  }

  return (
    <Container className="d-flex align-items-center justify-content-center min-vh-100">
      <AnimatePresence initial={false}>
        <motion.div
          variants={zoomIn}
          initial="hidden"
          animate="visible"
          exit={{
            opacity: 0,
            x: -20,
            transition: {
              duration: 0.2,
            },
          }}
          style={{
            width: "100%",
            maxWidth: 750,
            background: "none",
            borderRadius: 22,
          }}
        >
          <Card
            className="border-0"
            style={{
              background: "none",
            }}
          >
            <Card.Body>
              <div className="mb-5 text-center">
                <h1 className="fw-bold">
                  Welcome to
                  <span className="ms-2">
                    <span
                      style={{
                        display: "inline-flex",
                        gap: 6,
                      }}
                    >
                      <span className="first-letter">r.</span>
                      <span className="second-letter">o.</span>
                      <span className="third-letter">a.</span>
                    </span>
                  </span>
                </h1>

                <p className="my-4">
                  Sign in or create your account using your phone number.
                </p>
              </div>

              {error && (
                <Alert
                  variant="danger"
                  dismissible
                  onClose={() => setError("")}
                >
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <PhoneInput
                  value={phone}
                  onChange={setPhone}
                  disabled={loading}
                />

                <button
                  type="submit"
                  className="w-100 mt-4 container-login-button"
                  disabled={loading}
                >
                  {loading ? "Checking number..." : "Continue"}
                </button>
              </Form>

              <p className="mt-4 mb-0">
                By continuing, you agree to ROA's terms and privacy policy.
              </p>
            </Card.Body>
          </Card>
        </motion.div>
      </AnimatePresence>
    </Container>
  );
};
