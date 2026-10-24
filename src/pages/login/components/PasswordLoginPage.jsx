import { useState } from "react";
import { Alert, Button, Card, Form } from "react-bootstrap";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeSlash } from "react-bootstrap-icons";

import { login } from "../../../services/authService";
import { useAuthStore } from "../../../store/authStore";
import { zoomIn } from "../../../utils/animation";

export default function PasswordLoginPage({ phone, onBack }) {
  const navigate = useNavigate();

  const setSession = useAuthStore((state) => state.setSession);

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      const data = await login(phone, password);

      setSession({
        user: data.user,
        accessToken: data.accessToken,
      });

      navigate("/", {
        replace: true,
      });
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to sign in. Please check your password.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      variants={zoomIn}
      initial="hidden"
      animate="visible"
      style={{
        width: "100%",
        maxWidth: 750,
      }}
    >
      <Card
        className="border-0"
        style={{
          background: "none",
          borderRadius: 22,
        }}
      >
        <Card.Body>
          <div className="mb-5 text-center">
            <h2 className="fw-bold">Welcome back</h2>

            <p className="my-3">Enter your password to continue.</p>

            <p
              className="fw-semibold mb-0"
              style={{
                letterSpacing: 1,
              }}
            >
              {phone}
            </p>
          </div>

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-4">
              <Form.Label>Password</Form.Label>

              <div className="position-relative">
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  disabled={loading}
                  autoComplete="current-password"
                  required
                  style={{
                    paddingRight: 48,
                  }}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  disabled={loading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="position-absolute top-50 end-0 translate-middle-y border-0 bg-transparent d-flex align-items-center justify-content-center"
                  style={{
                    width: 45,
                    height: 45,
                    color: "#6c757d",
                    cursor: loading ? "default" : "pointer",
                  }}
                >
                  {showPassword ? <EyeSlash size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </Form.Group>

            <button
              type="submit"
              className="w-100 container-login-button"
              disabled={loading || !password}
            >
              {loading ? "Signing in..." : "Continue"}
            </button>
          </Form>

          <div className="text-center mt-4">
            <Button
              variant="link"
              type="button"
              onClick={onBack}
              disabled={loading}
              className="text-decoration-none small"
            >
              <ArrowLeft className="me-2" />
              Change phone number
            </Button>
          </div>

          <p className="text-center mt-4 mb-0 small text-muted">
            Your password is securely handled by ROA.
          </p>
        </Card.Body>
      </Card>
    </motion.div>
  );
}
