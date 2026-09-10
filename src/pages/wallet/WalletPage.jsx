import { Container, Stack, Row, Col, Form, Button } from "react-bootstrap";
import MainHeader from "../../components/MainHeader";
import { BsWallet, BsArrowLeft, BsShieldCheck, BsClock } from "react-icons/bs";
import NavTop from "../../components/PageNav";
import { useState } from "react";
import { WalletCard } from "./components/WalletCard";
import { AmountInput } from "./components/AmountInput";
import { AmountPicker } from "./components/AmountPicker";
import { PaymentMethod } from "./components/PaymentMethod";
import { BankDetails } from "./components/BankDetails";

const QUICK_TOPUP = [1000, 2000, 5000, 10000, 20000, 50000];

const QUICK_WITHDRAW = ["All", 1000, 2000, 5000, 10000];

const BANKS = [
  "GTBank",
  "Access Bank",
  "First Bank",
  "Zenith Bank",
  "UBA",
  "Opay",
  "Palmpay",
  "Kuda Bank",
  "Moniepoint",
  "Sterling Bank",
  "",
];

const PAYMENT_METHOD = [
  { id: "card", Icon: "💳", label: "Debit card", sub: "Visa, Mastercard " },
  { id: "transfer", Icon: "🏦", label: "Bank transfer", sub: "Instant USSD " },
  { id: "mobile", Icon: "📱", label: "Opay / Palmpay", sub: "Mobile wallet " },
  { id: "ussd", Icon: "🔗", label: "USSD", sub: "no internet needed " },
];

{
  /* TopUp function */
}

export function TopUp() {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("card");
  const [loading, setLoading] = useState(false);

  const numAmount = parseFloat(amount || 0);

  const handleTopUp = () => {
    if (numAmount < 100) return;
    try {
      //paystack integration goes here
      //const response = await axios.post("", {amount : numAmount})
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <NavTop title="Top up" />

      <div className="wallet_page" style={{ margin: "20px 0" }}>
        {/* wallet card */}
        <WalletCard withdraw={!true} />

        {/* Amount Input */}

        <AmountInput amount={amount} setAmount={setAmount} withdraw={!true} />

        {/* Quick amounts picker */}

        <AmountPicker
          amount={amount}
          setAmount={setAmount}
          QUICK_TOPUP={QUICK_TOPUP}
        />

        {/* payment methods */}

        <PaymentMethod
          method={method}
          setMethod={setMethod}
          PAYMENT_METHOD={PAYMENT_METHOD}
        />

        {/* payment estimate */}

        <div
          className="p-4 p-sm-5"
          style={{
            border: "1px solid #9dac167a",
            background: "#9dac1627",
            borderRadius: "17px",
            margin: "110px 0",
          }}
        >
          <div className="d-flex justify-content-between align-itens-center">
            <h6>Amount</h6>
            <h5 className="text-white"> ₦ {numAmount.toLocaleString()}.00</h5>
          </div>

          <div className="d-flex justify-content-between align-itens-center my-5">
            <h6>Processing fee</h6>
            <h5 className="text-white"> ₦ 0.00</h5>
          </div>

          <div style={{ border: "0.5px solid #ffffff65" }} />

          <div className="d-flex justify-content-between align-itens-center mt-4">
            <h6>You will receive</h6>
            <h5 style={{ color: "#ffee00" }}>
              {" "}
              ₦ {numAmount.toLocaleString()}.00
            </h5>
          </div>
        </div>

        {/* notice */}

        <div
          className="p-4 p-sm-5 "
          style={{
            border: "1px solid #52ac168f",
            background: "#39ac161e",
            borderRadius: "17px",
            margin: "110px 0",
          }}
        >
          <Stack direction="horizontal" gap={3} className="align-items-start">
            <BsShieldCheck
              className="mt-2"
              size={30}
              style={{ color: "#00ff88" }}
            />

            <h6>
              Your payment is secured and processed by Paystack. Funds reflect
              in your wallet instantly.
            </h6>
          </Stack>
        </div>

        {/* CTA */}

        <button
          onClick={handleTopUp}
          disabled={numAmount > 100 || loading}
          className="p-4 w-100  "
          style={{
            background: "#c7c53c",
            border: "none",
            borderRadius: "12px",
            margin: "20px 0",
            color: "#1a1000",
            fontSize: "1.2rem",
            fontWeight: 700,
          }}
        >
          {loading ? "processing..." : "Top up wallet"}
        </button>
      </div>
    </Container>
  );
}

{
  /* withdraw function */
}

export function Withdraw() {
  const [bank, setBank] = useState("");
  const [accNumber, setAccNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [accName, setAccName] = useState("");

  const walletBalance = 12400;
  const [loading, setLoading] = useState(false);
  const numAmount = parseFloat(amount || 0);
  const fee = numAmount > 0 ? 50 : 0;
  const receive = Math.max(0, numAmount - fee);

  const isValid =
    numAmount >= 1000 &&
    numAmount <= walletBalance &&
    bank &&
    accNumber.length === 10;

  const handleWithdraw = () => {
    if (!isValid) return;

    try {
      setLoading(!false);
      //await axios.post("", {amount : numAmount, bank, accNumber});
    } catch (err) {
      console.err(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <NavTop title="Withdraw" />

      <div className="wallet_page" style={{ margin: "20px 0" }}>
        {/* wallet card */}
        <WalletCard topup={!true} withdraw={true} />

        {/* Amount Input */}

        <AmountInput amount={amount} setAmount={setAmount} topup={!true} />

        {/* Quick amounts picker */}

        <AmountPicker
          amount={amount}
          setAmount={setAmount}
          QUICK_WITHDRAW={QUICK_WITHDRAW}
          walletBalance={walletBalance}
        />

        {/* Bank Details */}

        <BankDetails
          BANKS={BANKS}
          accNumber={accNumber}
          setAccNumber={setAccNumber}
          bank={bank}
          setBank={setBank}
          accName={accName}
          setAccName={setAccName}
          loading={loading}
          setLoading={setLoading}
        />

        {/* Summary */}

        <div
          className="p-4 p-sm-5"
          style={{
            border: "1px solid #9dac167a",
            background: "#9dac1627",
            borderRadius: "17px",
            margin: "110px 0",
          }}
        >
          <div className="d-flex justify-content-between align-itens-center">
            <h6>Withdrawal amount</h6>
            <h5 className="text-white"> ₦ {numAmount.toLocaleString()}.00</h5>
          </div>

          <div className="d-flex justify-content-between align-itens-center my-5">
            <h6>Withdrawal fee</h6>
            <h5 className="text-white"> ₦ {fee}.00</h5>
          </div>

          <div style={{ border: "0.5px solid #ffffff65" }} />

          <div className="d-flex mt-4">
            <h5 className="ms-auto" style={{ color: "#ffee00" }}>
              {" "}
              ₦ {receive.toLocaleString()}.00
            </h5>
          </div>
        </div>

        {/* notice */}

        <div
          className="p-4 p-sm-5"
          style={{
            border: "1px solid #52ac168f",
            background: "#39ac161e",
            borderRadius: "17px",
            margin: "110px 0",
          }}
        >
          <Stack direction="horizontal" gap={3} className="align-items-start">
            <BsClock size={40} className="mt-1" style={{ color: "#ffee00" }} />

            <h6>
              Withdrawal are processed within 24n hours on business days.
              minimum withdrawal is ₦ 1,000
            </h6>
          </Stack>
        </div>

        {/* CTA */}

        <button
          onClick={handleWithdraw}
          disabled={numAmount > 100 || loading}
          className="p-4 w-100"
          style={{
            background: "#c7c53c",
            border: "none",
            borderRadius: "12px",
            margin: "20px 0",
            color: "#1a1000",
            fontSize: "1.2rem",
            fontWeight: 700,
          }}
        >
          {loading ? "processing..." : "Withdraw funds"}
        </button>
      </div>
    </Container>
  );
}
