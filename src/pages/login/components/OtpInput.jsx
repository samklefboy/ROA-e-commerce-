import Form from "react-bootstrap/Form";

export default function OtpInput({ value, onChange, disabled = false }) {
  function handleChange(e) {
    const nextValue = e.target.value.replace(/\D/g, "").slice(0, 6);
    onChange(nextValue);
  }

  return (
    <Form.Group>
      {" "}
      <Form.Label> Verification code </Form.Label>{" "}
      <Form.Control
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="123456"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        required
        className="text-center fs-4"
      />{" "}
    </Form.Group>
  );
}
