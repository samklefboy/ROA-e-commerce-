import { useState } from "react";
import { Card, Form, Alert, Container } from "react-bootstrap";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeSlash } from "react-bootstrap-icons";

import { createPassword } from "../../../services/authService";
import { useAuthStore } from "../../../store/authStore";
import { zoomIn } from "../../../utils/animation";

export default function CreatePasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const setSession = useAuthStore((state) => state.setSession);

  const phone = location.state?.phone;
  const token = location.state?.token;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!phone || !token) {
    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!password) {
      setError("Please create a password.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      // Important: createPassword expects (token, password)
      const data = await createPassword(token, password);

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
          "Unable to create your password. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container className="d-flex align-items-center justify-content-center min-vh-100">
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
          className="shadow-sm border-0"
          style={{
            background: "none",
            borderRadius: 22,
          }}
        >
          <Card.Body>
            <div className="mb-5 text-center">
              <h1 className="fw-bold">Create your password</h1>

              <p className="my-3">Create a secure password for your account.</p>

              <p className="small text-muted mb-0">Account: {phone}</p>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
              {/* Password */}
              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>

                <div className="position-relative">
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    disabled={loading}
                    autoComplete="new-password"
                    style={{
                      paddingRight: 48,
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    disabled={loading}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
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

              {/* Confirm Password */}
              <Form.Group className="mb-4">
                <Form.Label>Confirm password</Form.Label>

                <div className="position-relative">
                  <Form.Control
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Re-enter your password"
                    disabled={loading}
                    autoComplete="new-password"
                    style={{
                      paddingRight: 48,
                    }}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((previous) => !previous)
                    }
                    disabled={loading}
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                    className="position-absolute top-50 end-0 translate-middle-y border-0 bg-transparent d-flex align-items-center justify-content-center"
                    style={{
                      width: 45,
                      height: 45,
                      color: "#6c757d",
                      cursor: loading ? "default" : "pointer",
                    }}
                  >
                    {showConfirmPassword ? (
                      <EyeSlash size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>
                </div>
              </Form.Group>

              <button
                type="submit"
                className="w-100 container-login-button"
                disabled={loading || !password || !confirmPassword}
              >
                {loading ? "Creating account..." : "Create account"}
              </button>
            </Form>

            <p className="text-center mt-4 mb-0 small text-muted">
              Your password is securely encrypted before it is stored.
            </p>
          </Card.Body>
        </Card>
      </motion.div>
    </Container>
  );
}
