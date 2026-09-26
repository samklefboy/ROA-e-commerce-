import { useEffect, useState } from "react";
import { Alert, Button, Card, Form } from "react-bootstrap";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, ArrowRepeat, Check2 } from "react-bootstrap-icons";

import OtpInput from "./OtpInput";
import { requestOtp, verifyOtp } from "../../../services/authService";
import { fadeleft } from "../../../utils/animation";

const RESEND_COOLDOWN = 60;

export default function VerifyOtpPage({ phone }) {
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");

  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);

  // from the page rendering/navigation.
  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setResendCooldown((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [resendCooldown]);

  useEffect(() => {
    if (!phone) {
      navigate("/login", { replace: true });
    }
  }, [phone, navigate]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading || resending) {
      return;
    }

    setError("");

    if (otp.length !== 6) {
      setError("Enter the 6-digit verification code.");
      return;
    }

    try {
      setLoading(true);

      const data = await verifyOtp({
        phone,
        otp,
      });

      /*
       * OTP verification succeeded.
       *
       * The backend gives us a temporary
       * registration token. We pass it to
       * Create Password.
       */
      navigate("/create-password", {
        replace: true,
        state: {
          phone,
          token: data.token,
        },
      });
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Invalid verification code. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!phone || resendCooldown > 0 || resending || loading) {
      return;
    }

    setError("");

    try {
      setResending(true);

      await requestOtp(phone);

      /* Clear the old OTP after successfully requesting a new one.*/
      setOtp("");

      // Start a fresh 60-second countdown.
      setResendCooldown(RESEND_COOLDOWN);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to resend the verification code. Please try again.",
      );
    } finally {
      setResending(false);
    }
  }

  if (!phone) {
    return null;
  }

  return (
    <motion.div
      variants={fadeleft}
      initial="hidden"
      animate="visible"
      style={{
        width: "100%",
      }}
    >
      <Card
        className="border-0"
        style={{
          width: "100%",
          maxWidth: 800,
          background: "none",
          borderRadius: 22,
        }}
      >
        <Card.Body>
          {/* Header */}
          <div className="mb-5 text-center">
            <h2 className="fw-bold">Verify your number</h2>

            <p className="my-3">Enter the 6-digit code sent to</p>

            <p
              className="fw-semibold mb-0"
              style={{
                letterSpacing: 1,
              }}
            >
              {phone}
            </p>
          </div>

          {/* Error */}
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {/* OTP Form */}
          <Form onSubmit={handleSubmit}>
            <OtpInput
              value={otp}
              onChange={setOtp}
              disabled={loading || resending}
            />

            <button
              type="submit"
              className="w-100 mt-4 container-login-button"
              disabled={loading || resending || otp.length !== 6}
            >
              {loading ? (
                "Verifying..."
              ) : (
                <>
                  <Check2 className="me-2" />
                  Verify & continue
                </>
              )}
            </button>
          </Form>

          {/* Resend section */}
          <div className="text-center mt-4">
            {resendCooldown > 0 ? (
              <div
                className="d-flex align-items-center justify-content-center gap-2"
                style={{
                  color: "#a0a0a0",
                  fontSize: 15,
                }}
              >
                <Clock size={14} />

                <span>
                  Resend code in <strong>{resendCooldown}s</strong>
                </span>
              </div>
            ) : (
              <Button
                type="button"
                onClick={handleResend}
                disabled={resending || loading}
                className="text-decoration-none p-0"
                style={{
                  background: "none",
                  border: "none",
                  color: "#b8c731",
                  fontSize: 17,
                }}
              >
                {resending ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    />
                    Sending new code...
                  </>
                ) : (
                  <>
                    <ArrowRepeat className="me-2" />
                    Resend code
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Back to login */}
          <div className="text-center mt-4">
            <Button
              variant="link"
              type="button"
              onClick={() => navigate("/login")}
              disabled={loading || resending}
              className="text-decoration-none  small"
            >
              <ArrowLeft className="me-2" />
              Change phone number
            </Button>
          </div>
        </Card.Body>
      </Card>
    </motion.div>
  );
}
