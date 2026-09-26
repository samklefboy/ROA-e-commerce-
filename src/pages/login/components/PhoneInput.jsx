import Form from "react-bootstrap/Form";

export default function PhoneInput({ value, onChange, disabled = false }) {
  return (
    <Form.Group>
      {" "}
      <Form.Label> Phone number </Form.Label>{" "}
      <Form.Control
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="08012345678"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        required
      />{" "}
      <Form.Text style={{ color: "#a0a0a0" }}>
        We'll send a verification code to this number.{" "}
      </Form.Text>{" "}
    </Form.Group>
  );
}
