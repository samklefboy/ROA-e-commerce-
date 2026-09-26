import { Row, Col, Stack } from "react-bootstrap";
import { Bank, CreditCard, Link45deg } from "react-bootstrap-icons";

const PAYMENT_METHODS = [
  {
    id: "card",
    Icon: CreditCard,
    color: "#b7b921",
    label: "Debit card",
    sub: "Visa, Mastercard",
  },
  {
    id: "transfer",
    Icon: Bank,
    color: "#9d2bc0",
    label: "Bank transfer",
    sub: "Instant bank transfer",
  },
  {
    id: "ussd",
    Icon: Link45deg,
    color: "#999797",
    label: "USSD",
    sub: "No internet needed",
  },
];

export function PaymentMethod({ method, setMethod }) {
  return (
    <div className="my-5 py-4">
      <h6 className="mb-4">Pay with</h6>

      <Row className="g-4 g-md-5">
        {PAYMENT_METHODS.map((m) => {
          return (
            <Col key={m.id} className="col-auto " xs={6} md={4}>
              <div
                className="p-3 py-4"
                onClick={() => setMethod(m.id)}
                style={{
                  background: method === m.id ? "#4aa14a55" : "#4aa14a20",
                  border: `0.5px solid ${method == m.id ? "#dbc712" : "#ffffff15"}`,
                  borderRadius: "22px",
                  cursor: "pointer",
                }}
              >
                <Stack className="text-center">
                  <m.Icon
                    className="mx-auto"
                    style={{ color: m.color, fontSize: 26 }}
                  />
                  <h6 className="my-3 my-lg-4 text-white">{m.label}</h6>
                  <p>{m.sub}</p>
                </Stack>
              </div>
            </Col>
          );
        })}
      </Row>
    </div>
  );
}
