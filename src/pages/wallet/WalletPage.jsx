import { Container, Stack } from "react-bootstrap";
import { BsShieldCheck, BsClock } from "react-icons/bs";
import { useCallback, useEffect, useMemo, useState } from "react";
import NavTop from "../../components/PageNav";
import { WalletCard } from "./components/WalletCard";
import { AmountInput } from "./components/AmountInput";
import { AmountPicker } from "./components/AmountPicker";
import { PaymentMethod } from "./components/PaymentMethod";
import { BankDetails } from "./components/BankDetails";
import {
  getWalletSummary,
  getBanks,
  resolveBankAccount,
  initializeTopUp,
  withdrawFunds,
} from "../../services/walletService";

const QUICK_TOPUP = [1000, 2000, 5000, 10000, 20000, 50000];

const QUICK_WITHDRAW = ["All", 1000, 2000, 5000, 10000];

const parseAmount = (value) => {
  if (!value) return 0;
  const cleanedValue = String(value).replace(/,/g, "");
  const parsedValue = Number(cleanedValue);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};
const formatCurrency = (value) => {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount);
};

/* ========================== TOP UP PAGE ========================= */
export function TopUp() {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const numAmount = useMemo(() => parseAmount(amount), [amount]);

  /* ------------------------- Validation -------------------------- */
  const isValid = useMemo(() => {
    return numAmount >= 100;
  }, [numAmount]);

  /* ------------------- Submit Top Up ------------------ */
  const handleTopUp = useCallback(async () => {
    if (!isValid || loading) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await initializeTopUp({
        amount: numAmount,
        paymentMethod: method,
      });
      const authorizationUrl =
        response?.data?.authorizationUrl || response?.authorizationUrl;
      if (!authorizationUrl) {
        throw new Error("Payment authorization could not be created.");
      }

      window.location.href = authorizationUrl;
    } catch (err) {
      console.error("Top up initialization failed:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to initialize your top up.",
      );
      setLoading(false);
    }
  }, [isValid, loading, method, numAmount]);

  /* ----------------------- Amount Summary ------------------------- */
  const summary = useMemo(() => {
    return { amount: numAmount, fee: 0, receive: numAmount };
  }, [numAmount]);

  return (
    <Container>
      {" "}
      <NavTop title="Top up" showSearchBtn={false} />{" "}
      <div className="wallet_page" style={{ margin: "20px 0" }}>
        {" "}
        <WalletCard mode="topup" />
        <AmountInput amount={amount} setAmount={setAmount} mode="topup" />{" "}
        <AmountPicker
          amounts={QUICK_TOPUP}
          amount={amount}
          setAmount={setAmount}
        />{" "}
        <PaymentMethod method={method} setMethod={setMethod} />{" "}
        {/* ------------------- Summary ------------------------*/}{" "}
        <div
          className="p-4 rounded-4 my-5"
          style={{
            border: "1px solid #9dac167a",
            background: "#9dac1627",
            borderRadius: "17px",
          }}
        >
          {" "}
          <Stack gap={3}>
            {" "}
            <div className="d-flex justify-content-between">
              {" "}
              <p>Amount</p>{" "}
              <strong className="text-white">
                {" "}
                {formatCurrency(summary.amount)}{" "}
              </strong>{" "}
            </div>{" "}
            <div className="d-flex justify-content-between my-3">
              {" "}
              <p>Processing fee</p>{" "}
              <strong className="text-white">
                {" "}
                {formatCurrency(summary.fee)}{" "}
              </strong>{" "}
            </div>{" "}
            <div
              className="d-flex justify-content-between pt-3"
              style={{ borderTop: "1px solid #ffffff65" }}
            >
              {" "}
              <span>You will receive</span>{" "}
              <strong className="text-warning" style={{ fontFamily: "Syne" }}>
                {" "}
                {formatCurrency(summary.receive)}{" "}
              </strong>{" "}
            </div>{" "}
          </Stack>{" "}
        </div>{" "}
        {/* ------------------------------------------------- Security Notice ------------------------------------------------- */}{" "}
        <div
          className="p-4 rounded-4 my-5 p-lg-5"
          style={{ background: "#4aa14a22" }}
        >
          {" "}
          <Stack direction="horizontal" gap={3} className="align-items-start">
            {" "}
            <BsShieldCheck
              size={25}
              className="text-success flex-shrink-0"
            />{" "}
            <div>
              {" "}
              <h6 className="mb-2"> Secure payment </h6>{" "}
              <small className="text-secondary">
                {" "}
                Your payment is securely processed by Paystack. Your wallet will
                be credited after the payment is successfull.{" "}
              </small>{" "}
            </div>{" "}
          </Stack>{" "}
        </div>{" "}
        {/* --------------------- Error & success ------------------------- */}{" "}
        {error && (
          <div className="alert alert-danger rounded-4 my-5"> {error} </div>
        )}{" "}
        {success && (
          <div className="alert alert-success rounded-4 my-5"> {success} </div>
        )}{" "}
        {/* ------------------------- Submit -------------------------- */}{" "}
        <button
          type="button"
          onClick={handleTopUp}
          disabled={!isValid || loading}
          className="w-100 border-0 py-3 rounded-4 fw-bold mb-5"
          style={{
            background: !isValid || loading ? "#ffffff20" : "#c7c53cd3",
            color: !isValid || loading ? "#777" : "#131200",
            cursor: !isValid || loading ? "not-allowed" : "pointer",
            fontSize: 20,
          }}
        >
          {" "}
          {loading ? "Processing..." : "Top up wallet"}{" "}
        </button>{" "}
      </div>{" "}
    </Container>
  );
}

/* ====================WITHDRAW PAGE ===================== */

export function Withdraw() {
  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accNumber, setAccNumber] = useState("");
  const [accName, setAccName] = useState("");
  const [banks, setBanks] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [resolvingAccount, setResolvingAccount] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const numAmount = useMemo(() => parseAmount(amount), [amount]);

  /* ====================LOAD WALLET ===========================*/
  const loadWallet = useCallback(async () => {
    try {
      const response = await getWalletSummary();
      const walletData = response?.data || response;
      setWalletBalance(Number(walletData?.balance) || 0);
    } catch (err) {
      console.error("Failed to load wallet summary:", err);
      setError(
        err?.response?.data?.message || "Unable to load wallet balance.",
      );
    }
  }, []);

  /* ======================LOAD BANKS ======================= */
  const loadBanks = useCallback(async () => {
    setLoadingBanks(true);
    try {
      const response = await getBanks();
      const bankData = response?.data || response;
      setBanks(Array.isArray(bankData) ? bankData : bankData?.banks || []);
    } catch (err) {
      console.error("Failed to load banks:", err);
      setError(err?.response?.data?.message || "Unable to load banks.");
    } finally {
      setLoadingBanks(false);
    }
  }, []);

  useEffect(() => {
    loadWallet();
    loadBanks();
  }, [loadWallet, loadBanks]);

  /* ===================== VALIDATION ========================= */
  const isValid = useMemo(() => {
    return (
      numAmount >= 1000 &&
      numAmount <= walletBalance &&
      Boolean(bankCode) &&
      accNumber.length === 10 &&
      Boolean(accName)
    );
  }, [numAmount, walletBalance, bankCode, accNumber, accName]);

  /* ========================= WITHDRAWAL SUMMARY =========================*/
  const withdrawalSummary = useMemo(() => {
    const estimatedFee = numAmount > 0 ? 50 : 0;
    const estimatedReceive = Math.max(0, numAmount - estimatedFee);
    return {
      amount: numAmount,
      fee: estimatedFee,
      receive: estimatedReceive,
    };
  }, [numAmount]);

  /* ======================== BANK SELECTION ======================== */
  const handleBankChange = useCallback((bankData) => {
    setBank(bankData?.name || "");
    setBankCode(bankData?.code || "");
    /* * Clear account name when bank changes because the * previously resolved account may no longer be valid. */
    setAccName("");
  }, []);

  /* =============================ACCOUNT NUMBER ======================= */
  const handleAccountNumberChange = useCallback(
    async (value) => {
      const cleanedValue = String(value).replace(/\D/g, "").slice(0, 10);
      setAccNumber(cleanedValue);
      setAccName("");
      if (cleanedValue.length !== 10 || !bankCode) {
        return;
      }
      setResolvingAccount(true);
      setError("");
      try {
        const response = await resolveBankAccount({
          accountNumber: cleanedValue,
          bankCode,
        });
        const accountData = response?.data || response;
        setAccName(accountData?.accountName || accountData?.account_name || "");
      } catch (err) {
        console.error("Account resolution failed:", err);
        setError(
          err?.response?.data?.message || "Unable to verify this bank account.",
        );
      } finally {
        setResolvingAccount(false);
      }
    },
    [bankCode],
  );

  /* ======================= WITHDRAW ================= */
  const handleWithdraw = useCallback(async () => {
    if (!isValid || loading) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await withdrawFunds({
        amount: numAmount,
        bankCode,
        bankName: bank,
        accountNumber: accNumber,
      });
      const withdrawalData = response?.data || response;
      setSuccess(
        withdrawalData?.message ||
          "Your withdrawal request has been submitted.",
      );
      /* * Refresh wallet balance after successful request. */ await loadWallet();
      /* * Clear sensitive form values after submission. */ setAmount("");
      setAccNumber("");
      setAccName("");
    } catch (err) {
      console.error("Withdrawal failed:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to process your withdrawal.",
      );
    } finally {
      setLoading(false);
    }
  }, [isValid, loading, numAmount, bankCode, bank, accNumber, loadWallet]);

  return (
    <Container>
      {" "}
      <NavTop title="Withdraw" showSearchBtn={false} />{" "}
      <div className="wallet_page" style={{ margin: "20px 0" }}>
        {" "}
        <WalletCard mode="withdraw" balance={walletBalance} />{" "}
        <AmountInput amount={amount} setAmount={setAmount} mode="withdraw" />{" "}
        <AmountPicker
          amounts={QUICK_WITHDRAW}
          amount={amount}
          setAmount={setAmount}
          walletBalance={walletBalance}
        />{" "}
        <BankDetails
          banks={banks}
          bank={bank}
          bankCode={bankCode}
          accountNumber={accNumber}
          accountName={accName}
          loading={loadingBanks}
          resolving={resolvingAccount}
          onBankChange={handleBankChange}
          onAccountNumberChange={handleAccountNumberChange}
        />{" "}
        {/* ----------------- Summary ---------------------- */}{" "}
        <div className="p-4 rounded-4 my-5" style={{ background: "#26350ea4" }}>
          {" "}
          <Stack gap={3}>
            {" "}
            <div className="d-flex justify-content-between">
              {" "}
              <p>Withdrawal amount</p>{" "}
              <strong className="text-white">
                {" "}
                {formatCurrency(withdrawalSummary.amount)}{" "}
              </strong>{" "}
            </div>{" "}
            <div className="d-flex justify-content-between my-3">
              {" "}
              <p>Withdrawal fee</p>{" "}
              <strong className="text-white">
                {" "}
                {formatCurrency(withdrawalSummary.fee)}{" "}
              </strong>
            </div>{" "}
            <div
              className="d-flex justify-content-between pt-3"
              style={{ borderTop: "1px solid #ffffff20" }}
            >
              {" "}
              <p>You will receive</p>{" "}
              <strong className="text-warning" style={{ fontFamily: "Syne" }}>
                {" "}
                {formatCurrency(withdrawalSummary.receive)}{" "}
              </strong>{" "}
            </div>{" "}
          </Stack>{" "}
        </div>{" "}
        {/* ------------------------------------------------- Information ------------------------------------------------- */}{" "}
        <div className="p-4 rounded-4 my-5" style={{ background: "#ffffff1a" }}>
          {" "}
          <Stack direction="horizontal" gap={3} className="align-items-start">
            {" "}
            <BsClock size={25} className="text-warning flex-shrink-0" />{" "}
            <div>
              {" "}
              <h6 className="mb-2"> Withdrawal processing </h6>{" "}
              <small className="text-secondary">
                {" "}
                Withdrawals are processed within 24 hours on business days.
                Minimum withdrawal is ₦1,000.{" "}
              </small>{" "}
            </div>{" "}
          </Stack>{" "}
        </div>{" "}
        {/* -------------------Error ------------------ */}{" "}
        {error && (
          <div className="alert alert-danger rounded-4 my-5"> {error} </div>
        )}{" "}
        {success && (
          <div className="alert alert-success rounded-4 my-5"> {success} </div>
        )}{" "}
        {/* -----------------Submit ------------------*/}{" "}
        <button
          type="button"
          onClick={handleWithdraw}
          disabled={!isValid || loading || resolvingAccount}
          className="w-100 border-0 py-3 rounded-4 fw-bold"
          style={{
            background:
              !isValid || loading || resolvingAccount ? "#ffffff20" : "#c5c33f",
            color: !isValid || loading || resolvingAccount ? "#777" : "#131200",
            cursor:
              !isValid || loading || resolvingAccount
                ? "not-allowed"
                : "pointer",
          }}
        >
          {" "}
          {loading ? "Processing..." : "Withdraw funds"}{" "}
        </button>{" "}
      </div>{" "}
    </Container>
  );
}
