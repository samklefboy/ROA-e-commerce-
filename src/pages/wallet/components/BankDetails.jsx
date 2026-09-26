import { Form, Stack } from "react-bootstrap";
import { BsCheckCircle, BsShieldCheck } from "react-icons/bs";

export function BankDetails({
  banks = [],
  bank,
  accountNumber,
  accountName,
  loading = false,
  resolving = false,
  onBankChange,
  onAccountNumberChange,
}) {
  return (
    <div className="my-5">
      <h5 className="mb-4">Withdraw to</h5>

      <Stack gap={4}>
        {/* -------------------- BANK ----------------------- */}{" "}
        <Form.Group>
          {" "}
          <Form.Label> Select bank </Form.Label>{" "}
          <Form.Select
            value={bank}
            onChange={(event) => {
              const selectedBank = banks.find(
                (item) => item.code === event.target.value,
              );
              onBankChange(selectedBank);
            }}
            disabled={loading}
            className="w-50"
          >
            {" "}
            <option value="">
              {" "}
              {loading ? "Loading banks..." : "Select your bank"}{" "}
            </option>{" "}
            {banks.map((item) => (
              <option key={item.code} value={item.code}>
                {" "}
                {item.name}{" "}
              </option>
            ))}{" "}
          </Form.Select>{" "}
        </Form.Group>{" "}
        {/* ------------- ACCOUNT NUMBER ---------------- */}
        <Form.Group>
          {" "}
          <Form.Label> Account number </Form.Label>{" "}
          <Form.Control
            type="text"
            inputMode="numeric"
            value={accountNumber}
            onChange={(event) => onAccountNumberChange(event.target.value)}
            placeholder="Enter 10-digit account number"
            maxLength={10}
            disabled={!bank}
          />{" "}
          {resolving && (
            <small className="text-secondary d-block mt-2">
              {" "}
              Verifying account...{" "}
            </small>
          )}{" "}
        </Form.Group>{" "}
        {/* --------------------ACCOUNT NAME ----------------------- */}
        {accountName && (
          <div
            className="p-4 rounded-4"
            style={{
              background: "#4aa14a22",
              border: "1px solid #4aa14a55",
            }}
          >
            {" "}
            <Stack direction="horizontal" gap={2}>
              {" "}
              <BsCheckCircle className="text-success" />{" "}
              <div>
                {" "}
                <p className="text-secondary d-block"> Account name </p>{" "}
                <strong className="text-white"> {accountName} </strong>{" "}
              </div>{" "}
            </Stack>{" "}
          </div>
        )}{" "}
        {/* ----------------SECURITY --------------------*/}{" "}
        <div className="p-4 rounded-4 my-5" style={{ background: "#ffffff15" }}>
          {" "}
          <Stack direction="horizontal" gap={2} className="align-items-start">
            {" "}
            <BsShieldCheck
              className="text-success flex-shrink-0"
              size={20}
            />{" "}
            <p className="text-secondary">
              {" "}
              Your bank information is used only to process your withdrawal
              securely.{" "}
            </p>{" "}
          </Stack>{" "}
        </div>{" "}
      </Stack>
    </div>
  );
}
