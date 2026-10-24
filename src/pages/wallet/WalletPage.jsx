import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Container, Stack } from "react-bootstrap";
import { BsClock, BsShieldCheck } from "react-icons/bs";

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

  const parsedValue = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(Number(value) || 0);

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

/* =========================================================
   TOP UP PAGE
========================================================= */

export function TopUp() {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const numAmount = useMemo(() => parseAmount(amount), [amount]);

  const isValid = useMemo(() => numAmount >= 100, [numAmount]);

  const summary = useMemo(
    () => ({
      amount: numAmount,
      fee: 0,
      receive: numAmount,
    }),
    [numAmount],
  );

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

      // Continue to the payment provider's authorization page.
      window.location.assign(authorizationUrl);
    } catch (err) {
      console.error("Top-up initialization failed:", err);

      setError(getErrorMessage(err, "Unable to initialize your top-up."));
      setLoading(false);
    }
  }, [isValid, loading, method, numAmount]);

  return (
    <Container>
      <NavTop title="Top up" showSearchBtn={false} />

      <div className="wallet_page" style={{ margin: "20px 0" }}>
        <WalletCard mode="topup" />

        <AmountInput amount={amount} setAmount={setAmount} mode="topup" />

        <AmountPicker
          amounts={QUICK_TOPUP}
          amount={amount}
          setAmount={setAmount}
        />

        <PaymentMethod method={method} setMethod={setMethod} />

        <div
          className="p-4 rounded-4 my-5"
          style={{
            border: "1px solid #9dac167a",
            background: "#9dac1627",
            borderRadius: "17px",
          }}
        >
          <Stack gap={3}>
            <div className="d-flex justify-content-between">
              <p>Amount</p>
              <strong className="text-white">
                {formatCurrency(summary.amount)}
              </strong>
            </div>

            <div className="d-flex justify-content-between my-3">
              <p>Processing fee</p>
              <strong className="text-white">
                {formatCurrency(summary.fee)}
              </strong>
            </div>

            <div
              className="d-flex justify-content-between pt-3"
              style={{ borderTop: "1px solid #ffffff65" }}
            >
              <span>You will receive</span>
              <strong className="text-warning" style={{ fontFamily: "Syne" }}>
                {formatCurrency(summary.receive)}
              </strong>
            </div>
          </Stack>
        </div>

        <div
          className="p-4 rounded-4 my-5 p-lg-5"
          style={{ background: "#4aa14a22" }}
        >
          <Stack direction="horizontal" gap={3} className="align-items-start">
            <BsShieldCheck size={25} className="text-success flex-shrink-0" />

            <div>
              <h6 className="mb-2">Secure payment</h6>
              <small className="text-secondary">
                Your payment is securely processed by Paystack. Your wallet will
                be credited after the payment is successful.
              </small>
            </div>
          </Stack>
        </div>

        {error && (
          <div className="alert alert-danger rounded-4 my-5" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success rounded-4 my-5" role="status">
            {success}
          </div>
        )}

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
          {loading ? "Processing..." : "Top up wallet"}
        </button>
      </div>
    </Container>
  );
}

/* =========================================================
   WITHDRAW PAGE
========================================================= */

export function Withdraw() {
  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accNumber, setAccNumber] = useState("");
  const [accName, setAccName] = useState("");

  const [banks, setBanks] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);

  const [loading, setLoading] = useState(false);

  // Start true because the bank list is fetched on initial mount.
  // This avoids setting loading state synchronously inside the effect.
  const [loadingBanks, setLoadingBanks] = useState(true);

  const [resolvingAccount, setResolvingAccount] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Incremented whenever a newer account lookup supersedes an older one.
  const accountRequestId = useRef(0);

  const numAmount = useMemo(() => parseAmount(amount), [amount]);

  /* ---------------------- LOAD WALLET ---------------------- */

  const loadWallet = useCallback(async (isActive = () => true) => {
    try {
      const response = await getWalletSummary();
      const walletData = response?.data || response;

      if (!isActive()) return;

      setWalletBalance(Number(walletData?.balance) || 0);
    } catch (err) {
      if (!isActive()) return;

      console.error("Failed to load wallet summary:", err);

      setError(getErrorMessage(err, "Unable to load wallet balance."));
    }
  }, []);

  //INITIAL DATA LOADING
  useEffect(() => {
    let active = true;

    const loadInitialData = async () => {
      const walletRequest = (async () => {
        try {
          const response = await getWalletSummary();

          if (!active) return;

          const walletData = response?.data || response;
          setWalletBalance(Number(walletData?.balance) || 0);
        } catch (err) {
          if (!active) return;

          console.error("Failed to load wallet summary:", err);
          setError(
            err?.response?.data?.message || "Unable to load wallet balance.",
          );
        }
      })();

      const banksRequest = (async () => {
        try {
          const response = await getBanks();

          if (!active) return;

          const bankData = response?.data || response;
          setBanks(Array.isArray(bankData) ? bankData : bankData?.banks || []);
        } catch (err) {
          if (!active) return;

          console.error("Failed to load banks:", err);
          setError(err?.response?.data?.message || "Unable to load banks.");
        } finally {
          if (active) {
            setLoadingBanks(false);
          }
        }
      })();

      await Promise.all([walletRequest, banksRequest]);
    };

    void loadInitialData();

    return () => {
      active = false;
      accountRequestId.current += 1;
    };
  }, []);

  /* ----------------------- VALIDATION ---------------------- */

  const isValid = useMemo(
    () =>
      numAmount >= 1000 &&
      numAmount <= walletBalance &&
      Boolean(bankCode) &&
      /^\d{10}$/.test(accNumber) &&
      Boolean(accName.trim()) &&
      !loadingBanks &&
      !resolvingAccount,
    [
      numAmount,
      walletBalance,
      bankCode,
      accNumber,
      accName,
      loadingBanks,
      resolvingAccount,
    ],
  );

  /* ---------------- WITHDRAWAL SUMMARY --------------------- */

  const withdrawalSummary = useMemo(() => {
    const estimatedFee = numAmount > 0 ? 50 : 0;

    return {
      amount: numAmount,
      fee: estimatedFee,
      receive: Math.max(0, numAmount - estimatedFee),
    };
  }, [numAmount]);

  /* ---------------------- BANK SELECTION ------------------- */

  const handleBankChange = useCallback((bankData) => {
    // Invalidate any outstanding account-resolution request.
    accountRequestId.current += 1;

    setBank(bankData?.name || "");
    setBankCode(bankData?.code || "");
    setAccName("");
    setResolvingAccount(false);
    setError("");
  }, []);

  /* --------------------- ACCOUNT NUMBER -------------------- */

  const handleAccountNumberChange = useCallback(
    async (value) => {
      const cleanedValue = String(value).replace(/\D/g, "").slice(0, 10);

      // Every input change invalidates the previous request.
      const requestId = ++accountRequestId.current;

      setAccNumber(cleanedValue);
      setAccName("");
      setError("");

      if (cleanedValue.length !== 10 || !bankCode) {
        setResolvingAccount(false);
        return;
      }

      setResolvingAccount(true);

      try {
        const response = await resolveBankAccount({
          accountNumber: cleanedValue,
          bankCode,
        });

        // Ignore responses for outdated account numbers or banks.
        if (requestId !== accountRequestId.current) return;

        const accountData = response?.data || response;
        const resolvedName =
          accountData?.accountName || accountData?.account_name || "";

        setAccName(typeof resolvedName === "string" ? resolvedName.trim() : "");

        if (!resolvedName) {
          setError("We could not verify this bank account.");
        }
      } catch (err) {
        if (requestId !== accountRequestId.current) return;

        console.error("Account resolution failed:", err);

        setError(getErrorMessage(err, "Unable to verify this bank account."));
      } finally {
        if (requestId === accountRequestId.current) {
          setResolvingAccount(false);
        }
      }
    },
    [bankCode],
  );

  /* ---------------------- SUBMIT WITHDRAWAL ---------------- */

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

      // Refresh the displayed balance after a successful request.
      await loadWallet();

      // Clear the account details after the withdrawal is accepted.
      setAmount("");
      setAccNumber("");
      setAccName("");
      accountRequestId.current += 1;
      setResolvingAccount(false);
    } catch (err) {
      console.error("Withdrawal failed:", err);

      setError(getErrorMessage(err, "Unable to process your withdrawal."));
    } finally {
      setLoading(false);
    }
  }, [isValid, loading, numAmount, bankCode, bank, accNumber, loadWallet]);

  return (
    <Container>
      <NavTop title="Withdraw" showSearchBtn={false} />

      <div className="wallet_page" style={{ margin: "20px 0" }}>
        <WalletCard mode="withdraw" balance={walletBalance} />

        <AmountInput amount={amount} setAmount={setAmount} mode="withdraw" />

        <AmountPicker
          amounts={QUICK_WITHDRAW}
          amount={amount}
          setAmount={setAmount}
          walletBalance={walletBalance}
        />

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
        />

        <div className="p-4 rounded-4 my-5" style={{ background: "#26350ea4" }}>
          <Stack gap={3}>
            <div className="d-flex justify-content-between">
              <p>Withdrawal amount</p>
              <strong className="text-white">
                {formatCurrency(withdrawalSummary.amount)}
              </strong>
            </div>

            <div className="d-flex justify-content-between my-3">
              <p>Withdrawal fee</p>
              <strong className="text-white">
                {formatCurrency(withdrawalSummary.fee)}
              </strong>
            </div>

            <div
              className="d-flex justify-content-between pt-3"
              style={{ borderTop: "1px solid #ffffff20" }}
            >
              <p>You will receive</p>
              <strong className="text-warning" style={{ fontFamily: "Syne" }}>
                {formatCurrency(withdrawalSummary.receive)}
              </strong>
            </div>
          </Stack>
        </div>

        <div className="p-4 rounded-4 my-5" style={{ background: "#ffffff1a" }}>
          <Stack direction="horizontal" gap={3} className="align-items-start">
            <BsClock size={25} className="text-warning flex-shrink-0" />

            <div>
              <h6 className="mb-2">Withdrawal processing</h6>
              <small className="text-secondary">
                Withdrawals are processed within 24 hours on business days.
                Minimum withdrawal is ₦1,000.
              </small>
            </div>
          </Stack>
        </div>

        {error && (
          <div className="alert alert-danger rounded-4 my-5" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success rounded-4 my-5" role="status">
            {success}
          </div>
        )}

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
          {loading ? "Processing..." : "Withdraw funds"}
        </button>
      </div>
    </Container>
  );
}
