import { Form } from "react-bootstrap";

export function AmountInput({
  amount,
  setAmount,
  topup = true,
  withdraw = true,
}) {
  return (
    <div style={{ margin: "110px 0" }}>
      <Form.Group>
        <Form.Label>
          {topup && <h5>Enter Amount</h5>}
          {withdraw && <h5>Withdraw Amount</h5>}
        </Form.Label>
        <div
          className="d-flex gap-3 align-items-center p-4"
          style={{ background: "#101606a4" }}
        >
          <h2 style={{ color: "#facc15" }}> ₦</h2>
          <Form.Control
            className="py-3"
            style={{ letterSpacing: 2 }}
            value={amount.toLocaleString()}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>
      </Form.Group>
    </div>
  );
}
