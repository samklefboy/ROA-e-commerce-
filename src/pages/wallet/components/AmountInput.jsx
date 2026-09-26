// AmountInput.jsx
import { Form } from "react-bootstrap";

export function AmountInput({ amount, setAmount, mode = "topup" }) {
  const isWithdraw = mode === "withdraw";

  const handleChange = (e) => {
    const value = e.target.value.replace(/[^\d.]/g, "");
    const parts = value.split(".");

    const cleaned =
      parts.length > 1 ? `${parts[0]}.${parts.slice(1).join("")}` : value;

    setAmount(cleaned);
  };

  const displayAmount = amount ? Number(amount).toLocaleString("en-NG") : "";

  return (
    <div className="my-5">
      <Form.Group>
        <p className="mb-3">
          {isWithdraw ? "Withdraw amount" : "Enter amount"}
        </p>

        <div
          className="d-flex gap-3 align-items-center p-4 py-1"
          style={{
            background: "#101606a4",
            borderRadius: "12px",
          }}
        >
          <h4
            className="fw-bold fs-4"
            style={{ color: "#facc15", fontFamily: "Syne" }}
          >
            ₦
          </h4>

          <Form.Control
            type="text"
            inputMode="decimal"
            className="py-3 border-0 shadow-none"
            style={{
              letterSpacing: 2,
              background: "transparent",
              color: "#fff",
            }}
            value={displayAmount}
            onChange={handleChange}
            placeholder="0.00"
          />
        </div>
      </Form.Group>
    </div>
  );
}
