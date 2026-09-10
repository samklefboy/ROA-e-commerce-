import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Container, Form } from "react-bootstrap";
import { motion, AnimatePresence } from "framer-motion";
import { container, fadedown } from "../../animation";
import axios from "axios";
import { FiAlertTriangle, FiMapPin, FiShoppingBag } from "react-icons/fi";
import { FaStore } from "react-icons/fa";
import {
  ArrowLeft,
  Bank,
  Check,
  CheckCircle,
  CreditCard,
  Plus,
  ShieldCheck,
  Wallet,
} from "react-bootstrap-icons";

// ---- Nigerian states ----
const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT Abuja",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

// ---- payment methods ----
const PAYMENT_METHODS = [
  {
    id: "wallet",
    label: "r.o.a. wallet",
    sub: "pay directly from your r.o.a wallet",
    Icon: Wallet,
    color: "#1D9E75",
    bg: "rgba(29,158,117,0.08)",
  },
  {
    id: "card",
    label: "Debit / Credit card",
    sub: "Visa, Mastercard via Paystack",
    Icon: CreditCard,
    color: "#378ADD",
    bg: "rgba(55,138,221,0.08)",
  },
  {
    id: "transfer",
    label: "Bank transfer",
    sub: "Transfer to r.o.a. bank account",
    Icon: Bank,
    color: "#eede01",
    bg: "rgba(201,168,76,0.08)",
  },
];

const STEPS = [
  { num: 1, label: "Delivery" },
  { num: 2, label: "Payment" },
  { num: 3, label: "Review" },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();

  //Authenticated user
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  //checkout state
  const [step, setStep] = useState(1);
  const [placing, setPlacing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [error, setError] = useState("");

  //Address state
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [addNewAddress, setAddNewAddress] = useState(false);

  const [delivery, setDelivery] = useState({
    email: "",
    fullName: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    country: "Nigeria",
    note: "",
    saveAddress: true,
  });

  const [errors, setErrors] = useState({});

  // ---- payment state ----
  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const [walletBalance, setWalletBalance] = useState(0);

  //Promo state
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");

  //Bank transfer state
  const [bankTransferDetails, setBankTransferDetails] = useState(null);
  const [transferPending, setTransferPending] = useState(false);

  //---Load user----
  useEffect(() => {
    let mounted = true;

    const loadCurrentUser = async () => {
      try {
        setAuthLoading(true);
        setError("");

        const { data } = await axios.get("/api/auth/me");

        if (!mounted) return;

        const currentUser = data.user ?? data;

        setUser(currentUser);

        // Populate checkout fields from REAL authenticated user
        setDelivery((prev) => ({
          ...prev,
          email: currentUser?.email || "",
          fullName: currentUser?.name || "",
          phone: currentUser?.phone || "",
          street: currentUser?.address?.street || "",
          city: currentUser?.address?.city || "",
          state: currentUser?.address?.state || "",
        }));
      } catch (err) {
        console.error("Failed to load user:", err);

        if (!mounted) return;

        if (err.response?.status === 401) {
          navigate("/login", {
            replace: true,
            state: {
              from: location.pathname,
            },
          });

          return;
        }

        setError(
          err.response?.data?.message ||
            "Unable to load your account. Please try again.",
        );
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    };

    loadCurrentUser();

    return () => {
      mounted = false;
    };
  }, [navigate, location.pathname]);

  // ---- get cart data from navigation state ----
  const {
    cartItems = [],
    storeGroups = [],
    summary = {},
  } = location.state || {};

  // ----Load wallet balance ----
  useEffect(() => {
    if (!user) return;

    const loadWalletBalance = async () => {
      try {
        const { data } = await axios.get("/api/wallet/balance");
        setWalletBalance(Number(data?.balance || 0));
      } catch (err) {
        console.error("Failed to load wallet balance:", err);
        setWalletBalance(0);
      }
    };
    loadWalletBalance();
  }, [user]);

  // -----Load saved address ----
  useEffect(() => {
    if (!user) return;

    const loadSavedAddresses = async () => {
      try {
        const { data } = await axios.get("/api/user/addresses");
        const addresses = Array.isArray(data) ?? data ?? data?.addresses ?? [];

        setSavedAddresses(addresses);

        // Automatically select default address
        const defaultAddress = addresses.find(
          (address) => address.isDefault === true,
        );

        if (defaultAddress) {
          setSelectedAddress(defaultAddress.id);

          setDelivery((prev) => ({
            ...prev,
            fullName:
              defaultAddress.name ||
              defaultAddress.fullName ||
              user?.name ||
              "",
            phone: defaultAddress.phone || user?.phone || "",
            street: defaultAddress.street || "",
            city: defaultAddress.city || "",
            state: defaultAddress.state || "",
            country: defaultAddress.country || "Nigeria",
          }));
        }
      } catch (err) {
        console.error("Failed to load saved addresses:", err);

        if (err.response?.status === 401) {
          navigate("/login", {
            replace: true,
            state: {
              from: location.pathname,
            },
          });
        }
      }
    };
    loadSavedAddresses();
  }, [user, navigate, location.pathname]);

  // ---- redirect if no cart items ----
  useEffect(() => {
    if (!authLoading && (!location.state || cartItems.length === 0)) {
      navigate("/cart", { replace: true });
    }
  }, [authLoading, location.state, cartItems.length, navigate]);

  // ---- final summary with potential promo ----
  const finalSummary = useMemo(() => {
    const promo = promoApplied ? Number(promoDiscount || 0) : 0;
    const discount = Number(summary.discount || 0) + promo;
    return {
      ...summary,
      total: Math.max(
        0,
        Number(summary?.subtotal || 0) +
          Number(summary?.deliveryFee || 0) -
          discount,
      ),
    };
  }, [summary, promoApplied, promoDiscount]);

  // ---- update delivery field ----
  const updateDelivery = useCallback(
    (field, value) => {
      setDelivery((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    },
    [errors],
  );

  // select saved address
  const handleSelectAddress = useCallback((address) => {
    setSelectedAddress(address.id);
    setAddNewAddress(false);
    setDelivery((prev) => ({
      ...prev,
      fullName: address.name || "",
      phone: address.phone || "",
      street: address.street || "",
      city: address.city || "",
      state: address.state || "",
    }));
    setErrors({});
  }, []);

  //---Add new address----
  const handleAddNewAddress = useCallback(() => {
    setAddNewAddress(true);
    setSelectedAddress("");

    setDelivery((prev) => ({
      ...prev,
      fullName: "",
      phone: "",
      street: "",
      city: "",
      state: "",
    }));

    setErrors({});
  }, []);

  // ---- validate delivery step ----
  const validateDelivery = useCallback(() => {
    const errs = {};
    if (!delivery.fullName.trim()) errs.fullName = "Full name is required";
    if (!delivery.phone.trim()) errs.phone = "Phone number is required";
    if (!delivery.street.trim()) errs.street = "Street address is required";
    if (!delivery.city.trim()) errs.city = "City is required";
    if (!delivery.state) errs.state = "State is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [delivery]);

  // ---- apply promo code ----
  const handlePromoApply = useCallback(async () => {
    if (!promoCode.trim() || promoLoading) return;
    setPromoLoading(true);
    setPromoError("");
    try {
      const { data } = await axios.post("/api/promo/validate", {
        code: promoCode,
        cartItems: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          variant: item.variant || null,
        })),
      });
      setPromoApplied(true);
      setPromoDiscount(data?.discount || 0); // use dynamic discount
    } catch (err) {
      setPromoError(
        err.response?.data?.message || "Invalid or expired promo code",
      );
      setPromoApplied(false);
      setPromoDiscount(0);
    } finally {
      setPromoLoading(false);
    }
  }, [promoCode, cartItems, promoLoading]);

  // ---- step navigation ----
  const handleNext = useCallback(() => {
    if (step === 1 && !validateDelivery()) return;
    setStep((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step, validateDelivery]);

  const handleBack = useCallback(() => {
    if (step === 1) {
      navigate(-1);
      return;
    }
    setStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step, navigate]);

  //----- seve address-----
  const saveAddress = useCallback(async () => {
    if (!delivery.saveAddress || !addNewAddress) {
      return;
    }
    await axios.post("/api/user/addresses", {
      label: "Home",
      name: delivery.fullName,
      phone: delivery.phone,
      street: delivery.street,
      city: delivery.city,
      state: delivery.state,
      country: delivery.country,
    });
  }, [delivery, addNewAddress]);

  // ---- place order ----
  const handlePlaceOrder = useCallback(async () => {
    if (placing) return;

    if (!user) {
      navigate("/login", {
        replace: true,
        state: {
          from: location.pathname,
        },
      });

      return;
    }

    if (!validateDelivery()) {
      setStep(1);
      return;
    }

    setPlacing(true);
    setError("");

    try {
      setPlacing(true);

      const payload = {
        items: cartItems.map((i) => ({
          productId: i.productId,
          storeId: i.storeId,
          quantity: Number(i.quantity),
          price: i.price,
          variant: i.variant || null,
        })),
        deliveryAddress: {
          fullName: delivery.fullName.trim(),
          phone: delivery.phone.trim(),
          street: delivery.street.trim(),
          city: delivery.city.trim(),
          state: delivery.state.trim(),
          country: delivery.country.trim() || "Nigeria",
        },
        deliveryNote: delivery.note.trim || "",
        paymentMethod,
        promoCode: promoApplied && promoCode.trim() ? promoCode.trim() : null,
      };

      if (paymentMethod === "wallet") {
        // Step 1 — verify wallet has enough balance
        if (walletBalance < finalSummary.total) {
          throw new Error("Insufficient wallet balance");
        }

        // Step 2 — create order with wallet payment
        const { data } = await axios.post("/api/orders", {
          payload,
        });

        setOrderNumber(data?.order?.orderNumber || data?.orderNumber || "");
        await saveAddress();
        setOrderSuccess(true);

        return;
      } else if (paymentMethod === "card") {
        //   Step 1 — create order first (status: PENDING_PAYMENT)
        const { data } = await axios.post("/api/payments/paystack/initialize", {
          payload,
        });

        const order = data?.order || data;
        const accessCode = data?.payment?.accessCode || data?.accessCode;
        const returnedOrderNumber = order?.orderNumber;
        const orderId = order?.id;

        const authorizationUrl =
          data?.payment?.authorizationUrl || data?.authorizationUrl;

        if (authorizationUrl) {
          window.location.href = authorizationUrl;
          return;
        }

        if (!accessCode) {
          throw new Error("Unable to initialize card payment");
        }
        if (!orderId) {
          throw new Error("Payment order was not created");
        }
        setOrderNumber(returnedOrderNumber || "");

        if (!window.PaystackPop) {
          throw new Error("Paystack is not available");
        }

        // Step 2 — initialize Paystack
        const handler = window.PaystackPop.setup({
          key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
          access_code: accessCode,

          onSuccess: async (transaction) => {
            //Step 3 — verify payment on backend
            try {
              setPlacing(true);
              const { data: verified } = await axios.post(
                "/api/payments/paystack/verify",
                { reference: transaction.reference, orderId },
              );

              if (
                verified?.paymentStatus !== "PAID" &&
                verified?.status !== "success"
              ) {
                throw new Error("Payment verification is still pending.");
              }

              await saveAddress();
              setOrderNumber(
                verified?.order?.orderNumber || returnedOrderNumber || "",
              );

              setOrderSuccess(true);
            } catch (err) {
              console.error("Payment verification failed:", err);
              setError(
                err.response?.data?.message ||
                  err.message ||
                  "Payment verification failed, Please check your order status",
              );
            } finally {
              setPlacing(false);
            }
          },

          onCancel: () => {
            setPlacing(false);
            setError("Payment was cancelled.");
          },
        });
        handler.openIframe();
        return;
      } else if (paymentMethod === "transfer") {
        // Step 1 — create order (status: PENDING_PAYMENT)
        const { data } = await axios.post("/api/orders", {
          payload,
        });

        const order = data?.order || data;
        const transfer =
          data?.transfer ||
          data?.transferDetails ||
          data?.payment?.transferDetails;
        if (!order?.id) {
          throw new Error("Unable to create transfer order");
        }
        if (!transfer) {
          throw new Error("Bank transfer details could not be generated");
        }
        setOrderNumber(order?.orderNumber || "");
        setBankTransferDetails(transfer);
        setTransferPending(true);
        await saveAddress();

        return;
      }
      throw new Error("Please select a valid payment method");
    } catch (err) {
      console.error("Checkout failed:", err);

      if (err.response?.status === 401) {
        navigate("/login", {
          replace: true,
          state: {
            from: location.pathname,
          },
        });

        return;
      }

      setError(
        err.response?.data?.message ||
          err.message ||
          "Something went wrong while processing your order.",
      );
    } finally {
      if (paymentMethod !== "card") {
        setPlacing(false);
      }
    }
  }, [
    placing,
    cartItems,
    validateDelivery,
    saveAddress,
    delivery,
    location.pathname,
    navigate,
    user,
    paymentMethod,
    finalSummary,
    promoCode,
    promoApplied,
    walletBalance,
  ]);

  //---- bank transfer pending screen----
  if (transferPending && bankTransferDetails) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        {" "}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 20 }}
          style={{ width: "100%", maxWidth: 520, textAlign: "center" }}
        >
          {" "}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "rgba(238,222,1,0.12)",
              border: "2px solid #eede01",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            {" "}
            <Bank style={{ fontSize: 38, color: "#eede01" }} />{" "}
          </div>{" "}
          <h2
            className="text-white"
            style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800 }}
          >
            {" "}
            Complete your transfer{" "}
          </h2>{" "}
          <p style={{ lineHeight: 1.7 }}>
            {" "}
            Your order has been created and is waiting for payment
            confirmation.{" "}
          </p>{" "}
          <div
            className="p-4 my-4"
            style={{
              background: "rgba(1,158,1,0.12)",
              border: "0.5px solid #035303",
              borderRadius: 12,
              textAlign: "left",
            }}
          >
            {" "}
            <p>
              {" "}
              Account name:{" "}
              <strong> {bankTransferDetails.accountName} </strong>{" "}
            </p>{" "}
            <p>
              {" "}
              Account number:{" "}
              <strong> {bankTransferDetails.accountNumber} </strong>{" "}
            </p>{" "}
            <p>
              {" "}
              Bank: <strong> {bankTransferDetails.bankName} </strong>{" "}
            </p>{" "}
            <p>
              {" "}
              Reference:{" "}
              <strong>
                {" "}
                {bankTransferDetails.reference || orderNumber}{" "}
              </strong>{" "}
            </p>{" "}
            <p className="mb-0">
              {" "}
              Amount:{" "}
              <strong>
                {" "}
                ₦{" "}
                {Number(
                  bankTransferDetails.amount || finalSummary.total,
                ).toLocaleString()}{" "}
              </strong>{" "}
            </p>{" "}
          </div>{" "}
          <div
            className="d-flex align-items-start gap-2 p-3 mb-4"
            style={{
              background: "rgba(238,222,1,0.08)",
              border: "0.5px solid rgba(238,222,1,0.3)",
              borderRadius: 10,
              textAlign: "left",
            }}
          >
            {" "}
            <ShieldCheck
              style={{ color: "#eede01", flexShrink: 0, marginTop: 2 }}
            />{" "}
            <p className="mb-0" style={{ fontSize: 13, lineHeight: 1.6 }}>
              {" "}
              Your order will be confirmed after r.o.a. receives and verifies
              the transfer.{" "}
            </p>{" "}
          </div>{" "}
          <button
            type="button"
            onClick={() => navigate("/orders")}
            style={{
              width: "100%",
              padding: 13,
              background: "#eede01",
              border: "none",
              borderRadius: 12,
              fontWeight: 700,
              color: "#1a1000",
              cursor: "pointer",
            }}
          >
            {" "}
            View my orders →{" "}
          </button>{" "}
          <button
            type="button"
            onClick={() => navigate("/shop")}
            style={{
              width: "100%",
              padding: 13,
              marginTop: 10,
              background: "transparent",
              border: "0.5px solid rgba(255,255,255,0.19)",
              borderRadius: 12,
              color: "rgba(255,255,255,0.5)",
              cursor: "pointer",
            }}
          >
            {" "}
            Continue shopping{" "}
          </button>{" "}
        </motion.div>{" "}
      </div>
    );
  }

  // ---- order success screen ----
  if (orderSuccess) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 20 }}
          style={{ textAlign: "center", maxWidth: "80%" }}
        >
          {/* Success icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 15, delay: 0.2 }}
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "rgba(29,158,117,0.15)",
              border: "2px solid #1D9E75",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <CheckCircle style={{ fontSize: 40, color: "#1D9E75" }} />
          </motion.div>

          <h2
            className="mb-1 text-white mb-lg-2"
            style={{
              fontFamily: "'Syne',sans-serif",
              fontWeight: 800,
              marginBottom: 8,
            }}
          >
            Order placed! 🎉
          </h2>
          <p
            style={{
              lineHeight: 1.7,
              marginBottom: 6,
            }}
          >
            Your order has been placed successfully. The seller will confirm it
            shortly.
          </p>
          <p
            style={{
              fontFamily: "'Syne',sans-serif",
              fontSize: 16,
              fontWeight: 700,
              color: "#eede01",
            }}
          >
            {orderNumber}
          </p>

          {/* Payment confirmed */}
          <div
            className="my-4 px-3 py-2"
            style={{
              background: "rgba(29,158,117,0.06)",
              border: "0.5px solid rgba(29,158,117,0.2)",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <ShieldCheck style={{ fontSize: 16, color: "#1D9E75" }} />
            <p style={{ fontSize: 12, color: "#1D9E75", margin: 0 }}>
              Payment confirmed via{" "}
              {PAYMENT_METHODS.find((p) => p.id === paymentMethod)?.label}
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
            <button
              type="button"
              onClick={() => navigate("/orders")}
              style={{
                width: "100%",
                padding: 12,
                background: "#eede01",
                border: "none",
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                color: "#1a1000",
                cursor: "pointer",
              }}
            >
              Track my order →
            </button>
            <button
              type="button"
              onClick={() => navigate("/shop")}
              style={{
                width: "100%",
                padding: 13,
                background: "transparent",
                border: "0.5px solid rgba(255, 255, 255, 0.19)",
                borderRadius: 12,
                fontSize: 15,
                color: "rgba(255,255,255,0.4)",
                cursor: "pointer",
              }}
            >
              Continue shopping
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      {/* --------------------------------------------------
          TOPBAR
      -------------------------------------------------- */}

      <div
        className="py-3"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          background: "rgba(1, 27, 1, 0.97)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderBottom: "0.5px solid #012201de",
        }}
      >
        <Container>
          <div className="d-flex align-items-center gap-4">
            <div
              onClick={handleBack}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.07)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <ArrowLeft
                style={{
                  fontSize: 20,
                  color: "#eee",
                }}
              />
            </div>

            <h3
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                color: "#eee",
                margin: 0,
              }}
            >
              Checkout
            </h3>
          </div>
        </Container>
      </div>

      <Container>
        {/* ------------------------------------------------
            STEP INDICATOR
        ------------------------------------------------ */}

        <div
          className="my-5"
          style={{
            display: "flex",
            alignItems: "center",
          }}
        >
          {STEPS.map((item, index) => {
            const isDone = step > item.num;

            const isCurrent = step === item.num;

            return (
              <div
                key={item.num}
                style={{
                  display: "flex",
                  alignItems: "center",
                  flex: index < STEPS.length - 1 ? 1 : "none",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 7,
                  }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      background: isDone
                        ? "#1D9E75"
                        : isCurrent
                          ? "#eede01"
                          : "#1a2a1a",
                      border: `2px solid ${
                        isDone ? "#1D9E75" : isCurrent ? "#eede01" : "#ffffff40"
                      }`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.3s",
                    }}
                  >
                    {isDone ? (
                      <Check
                        style={{
                          fontSize: 20,
                          color: "#fff",
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          fontWeight: 700,
                          color: isCurrent ? "#1a1000" : "#aaa",
                        }}
                      >
                        {item.num}
                      </span>
                    )}
                  </div>

                  <span
                    style={{
                      fontSize: 10,
                      color: isCurrent
                        ? "#eede01"
                        : isDone
                          ? "#1D9E75"
                          : "#aaa",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.label}
                  </span>
                </div>

                {index < STEPS.length - 1 && (
                  <div
                    style={{
                      flex: 1,
                      height: 2,
                      background: isDone ? "#1D9E75" : "#ffffff40",
                      margin: "0 8px",
                      marginBottom: 18,
                      transition: "background 0.3s",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* ------------------------------------------------
            ERROR
        ------------------------------------------------ */}

        {error && (
          <div
            className="d-flex align-items-start gap-2 p-3 mb-4"
            style={{
              background: "rgba(192,58,43,0.15)",
              border: "0.5px solid rgba(192,58,43,0.5)",
              borderRadius: 10,
            }}
          >
            <FiAlertTriangle
              style={{
                color: "#c0392b",
                fontSize: 20,
                flexShrink: 0,
              }}
            />

            <p
              className="mb-0"
              style={{
                lineHeight: 1.5,
              }}
            >
              {error}
            </p>
          </div>
        )}

        {/* ------------------------------------------------
            STEPS
        ------------------------------------------------ */}

        <div className="my-5">
          <AnimatePresence mode="wait">
            {/* ==================================================
                STEP 1 — DELIVERY
            ================================================== */}

            {step === 1 && (
              <motion.div
                className="pb-5"
                key="step1"
                variants={container}
                initial="hidden"
                animate="visible"
                exit={{
                  opacity: 0,
                  x: -20,
                }}
              >
                {/* Saved addresses */}

                {savedAddresses.length > 0 && !addNewAddress && (
                  <motion.div variants={fadedown} className="my-5">
                    <p>Saved addresses</p>

                    {savedAddresses.map((address) => (
                      <div
                        className="d-flex align-items-start p-3 gap-3 my-3 mt-2"
                        key={address.id}
                        onClick={() => handleSelectAddress(address)}
                        style={{
                          background:
                            selectedAddress === address.id
                              ? "#eede0118"
                              : "#10991021",
                          border: `0.5px solid ${
                            selectedAddress === address.id
                              ? "#eede01"
                              : "#045504"
                          }`,
                          borderRadius: 12,
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        <div
                          className="mt-1 p-1"
                          style={{
                            borderRadius: "50%",
                            border: `2px solid ${
                              selectedAddress === address.id
                                ? "#eede01"
                                : "#ffffff44"
                            }`,
                            background:
                              selectedAddress === address.id
                                ? "#eede01"
                                : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {selectedAddress === address.id && (
                            <div
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: "#1a1a00",
                              }}
                            />
                          )}
                        </div>

                        <div
                          style={{
                            flex: 1,
                          }}
                        >
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <h6
                              style={{
                                fontWeight: 600,
                                color:
                                  selectedAddress === address.id
                                    ? "#eede01"
                                    : "#ddd",
                              }}
                            >
                              {address.label}
                            </h6>

                            <span
                              className="px-2"
                              style={{
                                fontSize: 11,
                                color: "rgba(255,255,255,0.56)",
                                background: "rgba(255,255,255,0.1)",
                                borderRadius: 5,
                              }}
                            >
                              {address.phone}
                            </span>
                          </div>

                          <p
                            style={{
                              lineHeight: 1.5,
                            }}
                          >
                            {address.street}, {address.city}, {address.state}
                          </p>
                        </div>
                      </div>
                    ))}

                    <button
                      className="mt-4"
                      type="button"
                      onClick={handleAddNewAddress}
                      style={{
                        width: "100%",
                        padding: 12,
                        background: "transparent",
                        border: "0.5px dashed #eede0183",
                        borderRadius: 12,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                      }}
                    >
                      <Plus
                        style={{
                          fontSize: 15,
                          color: "#eede01",
                        }}
                      />

                      <span
                        style={{
                          color: "#eede01",
                        }}
                      >
                        Add new address
                      </span>
                    </button>
                  </motion.div>
                )}

                {/* New address */}

                {(addNewAddress || savedAddresses.length === 0) && (
                  <motion.div
                    variants={fadedown}
                    style={{
                      marginBottom: 16,
                    }}
                  >
                    {savedAddresses.length > 0 && (
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <p>New delivery address</p>

                        <button
                          type="button"
                          onClick={() => {
                            setAddNewAddress(false);
                            setSelectedAddress(savedAddresses[0]?.id || "");
                          }}
                          style={{
                            border: "none",
                            background: "transparent",
                            color: "#eede01",
                            cursor: "pointer",
                          }}
                        >
                          Use saved →
                        </button>
                      </div>
                    )}

                    <div className="d-flex flex-column gap-3 gap-lg-4">
                      {/* Full name */}

                      <div>
                        <label>Full name *</label>

                        <Form.Control
                          placeholder="e.g. Samuel Adeolu"
                          value={delivery.fullName}
                          onChange={(e) =>
                            updateDelivery("fullName", e.target.value)
                          }
                          style={{
                            borderColor: errors.fullName ? "#b62717" : "",
                          }}
                        />

                        {errors.fullName && (
                          <p className="text-danger mt-1">{errors.fullName}</p>
                        )}
                      </div>

                      {/* Phone */}

                      <div>
                        <label>Phone number *</label>

                        <Form.Control
                          type="tel"
                          placeholder="e.g. 08012345678"
                          value={delivery.phone}
                          onChange={(e) =>
                            updateDelivery("phone", e.target.value)
                          }
                          style={{
                            borderColor: errors.phone ? "#c0392b" : "",
                          }}
                        />

                        {errors.phone && (
                          <p className="text-danger mt-1">{errors.phone}</p>
                        )}
                      </div>

                      {/* Street */}

                      <div>
                        <label>Street address *</label>

                        <Form.Control
                          placeholder="e.g. 7 Ifelodun Street"
                          value={delivery.street}
                          onChange={(e) =>
                            updateDelivery("street", e.target.value)
                          }
                          style={{
                            borderColor: errors.street ? "#c0392b" : "",
                          }}
                        />

                        {errors.street && (
                          <p className="text-danger mt-1">{errors.street}</p>
                        )}
                      </div>

                      {/* City + state */}

                      <div className="d-flex align-items-start gap-4">
                        <div
                          style={{
                            flex: 1,
                          }}
                        >
                          <label>City *</label>

                          <Form.Control
                            placeholder="e.g. Ijegun"
                            value={delivery.city}
                            onChange={(e) =>
                              updateDelivery("city", e.target.value)
                            }
                            style={{
                              borderColor: errors.city ? "#c0392b" : "",
                            }}
                          />

                          {errors.city && (
                            <p className="text-danger mt-1">{errors.city}</p>
                          )}
                        </div>

                        <div
                          style={{
                            flex: 1,
                          }}
                        >
                          <label>State *</label>

                          <Form.Select
                            value={delivery.state}
                            onChange={(e) =>
                              updateDelivery("state", e.target.value)
                            }
                            style={{
                              borderColor: errors.state ? "#c0392b" : "",
                            }}
                          >
                            <option value="">Select</option>

                            {NIGERIAN_STATES.map((state) => (
                              <option key={state} value={state}>
                                {state}
                              </option>
                            ))}
                          </Form.Select>

                          {errors.state && (
                            <p className="text-danger mt-1">{errors.state}</p>
                          )}
                        </div>
                      </div>

                      {/* Delivery note */}

                      <div>
                        <label>
                          Delivery note{" "}
                          <span
                            style={{
                              color: "rgba(255,255,255,0.36)",
                              fontWeight: 400,
                              marginLeft: 6,
                            }}
                          >
                            optional
                          </span>
                        </label>

                        <Form.Control
                          as="textarea"
                          rows={2}
                          placeholder="e.g. Call before delivery, leave with security..."
                          value={delivery.note}
                          onChange={(e) =>
                            updateDelivery("note", e.target.value)
                          }
                          style={{
                            resize: "none",
                          }}
                        />
                      </div>

                      {/* Save address */}

                      <div
                        onClick={() =>
                          updateDelivery("saveAddress", !delivery.saveAddress)
                        }
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 6,
                            border: `2px solid ${
                              delivery.saveAddress ? "#eede01" : "#ffffff4a"
                            }`,
                            background: delivery.saveAddress
                              ? "#eede01"
                              : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {delivery.saveAddress && (
                            <Check
                              style={{
                                fontSize: 18,
                                color: "#1a1000",
                              }}
                            />
                          )}
                        </div>

                        <span
                          style={{
                            fontSize: 13,
                            color: "rgba(255,255,255,0.5)",
                          }}
                        >
                          Save this address for future orders
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Items */}

                <motion.div variants={fadedown} className="my-5">
                  <p className="mb-3">Items ({cartItems.length})</p>

                  {cartItems.map((item) => (
                    <div
                      className="p-3 mb-3 d-flex gap-2 align-items-start"
                      key={item.cartId}
                      style={{
                        background: "#0ab40433",
                        borderLeft: "0.5px solid #02ff0275",
                        borderBottom: "0.5px solid #02ff0275",
                        borderRadius: "12px 0",
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          background: "#1a2a1a",
                          overflow: "hidden",
                          flexShrink: 0,
                        }}
                      >
                        {item.product?.images?.[0] ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name || "Product"}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <FiShoppingBag
                              style={{
                                fontSize: 18,
                                color: "rgba(255,255,255,0.15)",
                              }}
                            />
                          </div>
                        )}
                      </div>

                      <div
                        style={{
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        <p className="text-white mb-1">{item.product?.name}</p>

                        {item.variant && (
                          <p>{Object.values(item.variant).join(" · ")}</p>
                        )}
                      </div>

                      <div
                        style={{
                          textAlign: "right",
                          flexShrink: 0,
                        }}
                      >
                        <p
                          style={{
                            fontWeight: 600,
                            color: "#eede01",
                          }}
                        >
                          ₦{Number(item.subtotal || 0).toLocaleString()}
                        </p>

                        <p>Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </motion.div>
            )}

            {/* ==================================================
                STEP 2 — PAYMENT
            ================================================== */}

            {step === 2 && (
              <motion.div
                className="pb-5"
                key="step2"
                variants={container}
                initial="hidden"
                animate="visible"
                exit={{
                  opacity: 0,
                  x: -20,
                }}
              >
                {/* Payment methods */}

                <motion.div variants={fadedown} className="my-5">
                  <p className="mb-3">Choose payment method</p>

                  <div className="d-flex flex-column gap-4">
                    {PAYMENT_METHODS.map((method) => (
                      <div
                        className="d-flex align-items-center gap-2 p-3"
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        style={{
                          background:
                            paymentMethod === method.id
                              ? method.bg
                              : "#019e0134",
                          border: `0.5px solid ${
                            paymentMethod === method.id
                              ? method.color
                              : "#4b554b"
                          }`,
                          borderRadius: 12,
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            background: method.bg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <method.Icon
                            style={{
                              fontSize: 20,
                              color: method.color,
                            }}
                          />
                        </div>

                        <div
                          style={{
                            flex: 1,
                          }}
                        >
                          <p
                            className="mb-1"
                            style={{
                              fontWeight: 600,
                              color:
                                paymentMethod === method.id
                                  ? method.color
                                  : "#ddd",
                            }}
                          >
                            {method.label}
                          </p>

                          <p>{method.description}</p>

                          {method.id === "wallet" && (
                            <p
                              style={{
                                color: "#1D9E75",
                                fontSize: 12,
                                marginTop: 4,
                              }}
                            >
                              Balance: ₦{walletBalance.toLocaleString()}
                            </p>
                          )}
                        </div>

                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            border: `2px solid ${
                              paymentMethod === method.id
                                ? method.color
                                : "#ffffff50"
                            }`,
                            background:
                              paymentMethod === method.id
                                ? method.color
                                : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {paymentMethod === method.id && (
                            <div
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: "#fff",
                              }}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Wallet warning */}

                {paymentMethod === "wallet" &&
                  finalSummary.total > walletBalance && (
                    <motion.div variants={fadedown}>
                      <div
                        className="d-flex align-items-start gap-2 p-3"
                        style={{
                          background: "rgba(192,58,43,0.17)",
                          border: "0.5px solid rgba(192,58,43,0.58)",
                          borderRadius: 10,
                        }}
                      >
                        <FiAlertTriangle
                          className="mt-1"
                          style={{
                            fontSize: 20,
                            color: "#c0392b",
                            flexShrink: 0,
                          }}
                        />

                        <p
                          style={{
                            lineHeight: 1.5,
                            margin: 0,
                          }}
                        >
                          Insufficient wallet balance. Your balance is ₦
                          {walletBalance.toLocaleString()} but the displayed
                          order total is ₦{finalSummary.total.toLocaleString()}.
                          <span
                            onClick={() => navigate("/wallet/topup")}
                            style={{
                              color: "#eede01",
                              cursor: "pointer",
                              marginLeft: 4,
                            }}
                          >
                            Top up wallet →
                          </span>
                        </p>
                      </div>
                    </motion.div>
                  )}

                {/* Promo */}

                <motion.div variants={fadedown} className="my-5">
                  <p className="mb-3">Promo code</p>

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                    }}
                  >
                    <Form.Control
                      placeholder="Enter promo code"
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value.toUpperCase());

                        setPromoApplied(false);

                        setPromoDiscount(0);

                        setPromoError("");
                      }}
                      style={{
                        flex: 1,
                        borderColor: promoError
                          ? "#c0392b"
                          : promoApplied
                            ? "#1D9E75"
                            : "",
                      }}
                    />

                    <button
                      type="button"
                      onClick={handlePromoApply}
                      disabled={
                        !promoCode.trim() || promoLoading || promoApplied
                      }
                      style={{
                        padding: "0 16px",
                        background: promoApplied
                          ? "rgba(29,158,117,0.1)"
                          : "#c9c14c25",
                        border: `0.5px solid ${
                          promoApplied ? "rgba(29,158,117,0.3)" : "#c9c74c4d"
                        }`,
                        borderRadius: 10,
                        fontSize: 12,
                        fontWeight: 700,
                        color: promoApplied ? "#1D9E75" : "#eede01",
                        cursor:
                          !promoCode.trim() || promoLoading || promoApplied
                            ? "default"
                            : "pointer",
                        opacity: !promoCode.trim() ? 0.5 : 1,
                      }}
                    >
                      {promoLoading
                        ? "..."
                        : promoApplied
                          ? "✓ Applied"
                          : "Apply"}
                    </button>
                  </div>

                  {promoError && (
                    <p
                      className="text-danger"
                      style={{
                        marginTop: 5,
                      }}
                    >
                      {promoError}
                    </p>
                  )}

                  {promoApplied && (
                    <p
                      style={{
                        color: "#1D9E75",
                        marginTop: 5,
                      }}
                    >
                      ₦{promoDiscount.toLocaleString()} discount applied 🎉
                    </p>
                  )}
                </motion.div>

                {/* Summary */}

                <motion.div variants={fadedown} className="mb-5 pb-5">
                  <p className="mb-3">Order summary</p>

                  <div
                    className="p-3"
                    style={{
                      background: "#cbe9cb25",
                      border: "0.5px solid #012701",
                      borderRadius: 12,
                    }}
                  >
                    {[
                      {
                        label: "Subtotal",
                        value: finalSummary.subtotal,
                      },
                      {
                        label: "Delivery fee",
                        value: finalSummary.deliveryFee,
                      },
                    ].map((row) => (
                      <div
                        className="py-3 d-flex justify-content-between"
                        key={row.label}
                        style={{
                          borderBottom: "0.5px solid rgba(255,255,255,0.15)",
                        }}
                      >
                        <p>{row.label}</p>

                        <p>₦{Number(row.value || 0).toLocaleString()}</p>
                      </div>
                    ))}

                    {finalSummary.discount > 0 && (
                      <div
                        className="py-3 d-flex justify-content-between"
                        style={{
                          borderBottom: "0.5px solid rgba(255,255,255,0.15)",
                        }}
                      >
                        <p>Discount</p>

                        <p
                          style={{
                            color: "#1D9E75",
                          }}
                        >
                          -₦
                          {finalSummary.discount.toLocaleString()}
                        </p>
                      </div>
                    )}

                    <div className="py-3 d-flex justify-content-between">
                      <h6 className="text-white fw-bold">Total</h6>

                      <span
                        style={{
                          fontFamily: "'Syne', sans-serif",
                          fontSize: 18,
                          fontWeight: 800,
                          color: "#eede01",
                        }}
                      >
                        ₦{finalSummary.total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* ==================================================
                STEP 3 — REVIEW
            ================================================== */}

            {step === 3 && (
              <motion.div
                key="step3"
                variants={container}
                initial="hidden"
                animate="visible"
                exit={{
                  opacity: 0,
                  x: -20,
                }}
              >
                {/* Delivery review */}

                <motion.div variants={fadedown}>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <p>Delivery address</p>

                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "#eede01",
                        cursor: "pointer",
                      }}
                    >
                      Change
                    </button>
                  </div>

                  <div
                    className="p-3"
                    style={{
                      background: "#019e0142",
                      borderRadius: 12,
                    }}
                  >
                    <div className="d-flex align-items-start gap-2">
                      <FiMapPin
                        className="mt-1"
                        style={{
                          fontSize: 18,
                          color: "#eede01",
                          flexShrink: 0,
                        }}
                      />

                      <div>
                        <p
                          className="text-white mb-1"
                          style={{
                            fontWeight: 600,
                          }}
                        >
                          {delivery.fullName} · {delivery.phone}
                        </p>

                        <p
                          style={{
                            lineHeight: 1.5,
                          }}
                        >
                          {delivery.street}
                          <br />
                          {delivery.city}, {delivery.state}
                        </p>

                        {delivery.note && (
                          <p
                            style={{
                              color: "#eede01",
                              marginTop: 5,
                              marginBottom: 0,
                            }}
                          >
                            📝 {delivery.note}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Payment review */}

                <motion.div variants={fadedown} className="my-5">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <p>Payment method</p>

                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "#eede01",
                        cursor: "pointer",
                      }}
                    >
                      Change
                    </button>
                  </div>

                  {(() => {
                    const method = PAYMENT_METHODS.find(
                      (item) => item.id === paymentMethod,
                    );

                    if (!method) return null;

                    return (
                      <div
                        className="p-3 d-flex align-items-start gap-2"
                        style={{
                          background: "#019e0142",
                          border: "0.5px solid #1a2a1a",
                          borderRadius: 12,
                        }}
                      >
                        <method.Icon
                          className="mt-2"
                          style={{
                            fontSize: 18,
                            color: method.color,
                          }}
                        />

                        <div>
                          <p
                            style={{
                              fontWeight: 600,
                              color: "#ddd",
                            }}
                          >
                            {method.label}
                          </p>

                          <p>{method.description}</p>
                        </div>
                      </div>
                    );
                  })()}
                </motion.div>

                {/* Items by store */}

                <motion.div variants={fadedown}>
                  <p className="mb-3">Your items ({cartItems.length})</p>

                  {storeGroups.map((group) => (
                    <div
                      key={group.store?.id}
                      style={{
                        background: "#019e0142",
                        borderRadius: 12,
                        overflow: "hidden",
                        marginBottom: 15,
                      }}
                    >
                      <div
                        className="px-3 py-2"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          borderBottom: "0.5px solid #001400ad",
                        }}
                      >
                        <FaStore
                          style={{
                            fontSize: 14,
                            color: "#888",
                          }}
                        />

                        <p
                          style={{
                            fontWeight: 600,
                            color: "#ddd",
                          }}
                        >
                          {group.store?.name}
                        </p>
                      </div>

                      {group.items
                        ?.filter((item) =>
                          cartItems.some(
                            (cartItem) => cartItem.cartId === item.cartId,
                          ),
                        )
                        .map((item, index) => (
                          <div
                            className="p-3 d-flex align-items-start gap-2"
                            key={item.cartId}
                            style={{
                              borderTop:
                                index > 0 ? "0.5px solid #011801c0" : "none",
                            }}
                          >
                            <div
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: 8,
                                background: "#1a2a1a",
                                overflow: "hidden",
                                flexShrink: 0,
                              }}
                            >
                              {item.product?.images?.[0] ? (
                                <img
                                  src={item.product.images[0]}
                                  alt={item.product.name || "Product"}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                />
                              ) : (
                                <FiShoppingBag
                                  style={{
                                    margin: 12,
                                    color: "rgba(255,255,255,0.15)",
                                  }}
                                />
                              )}
                            </div>

                            <div
                              style={{
                                flex: 1,
                                minWidth: 0,
                              }}
                            >
                              <p className="mb-1 text-white">
                                {item.product?.name}
                              </p>

                              {item.variant && (
                                <p>{Object.values(item.variant).join(" · ")}</p>
                              )}
                            </div>

                            <div
                              style={{
                                textAlign: "right",
                              }}
                            >
                              <p
                                style={{
                                  fontWeight: 600,
                                  color: "#eede01",
                                }}
                              >
                                ₦{Number(item.subtotal || 0).toLocaleString()}
                              </p>

                              <p>x{item.quantity}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  ))}
                </motion.div>

                {/* Final total */}

                <motion.div variants={fadedown} className="mt-5">
                  <div
                    className="p-3"
                    style={{
                      background: "rgba(201,199,76,0.1)",
                      border: "0.5px solid rgba(199,199,76,0.46)",
                      borderRadius: 12,
                    }}
                  >
                    {[
                      {
                        label: "Subtotal",
                        value: finalSummary.subtotal,
                      },
                      {
                        label: "Delivery",
                        value: finalSummary.deliveryFee,
                      },
                    ].map((row) => (
                      <div
                        className="py-3 d-flex justify-content-between"
                        key={row.label}
                      >
                        <p>{row.label}</p>

                        <p>₦{Number(row.value || 0).toLocaleString()}</p>
                      </div>
                    ))}

                    {finalSummary.discount > 0 && (
                      <div className="py-3 d-flex justify-content-between">
                        <p>Discount</p>

                        <p
                          style={{
                            color: "#1D9E75",
                          }}
                        >
                          -₦
                          {finalSummary.discount.toLocaleString()}
                        </p>
                      </div>
                    )}

                    <div className="py-3 d-flex justify-content-between">
                      <p
                        style={{
                          fontWeight: 700,
                          color: "#eee",
                        }}
                      >
                        Total to pay
                      </p>

                      <span
                        style={{
                          fontSize: 22,
                          fontWeight: 800,
                          color: "#eede01",
                          fontFamily: "'Syne', sans-serif",
                        }}
                      >
                        ₦{finalSummary.total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Terms */}

                <motion.div variants={fadedown} className="py-5">
                  <p
                    style={{
                      lineHeight: 1.7,
                      textAlign: "center",
                    }}
                  >
                    By placing this order you agree to r.o.a.'s terms of service
                    and privacy policy. Your payment is protected by r.o.a.
                    buyer protection.
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Container>

      {/* --------------------------------------------------
          STICKY BOTTOM BAR
      -------------------------------------------------- */}

      <div
        className="py-3"
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          background: "rgba(2,34,2,0.54)",
          backdropFilter: "blur(10px)",
          borderTop: "0.5px solid #035303",
          zIndex: 20,
        }}
      >
        <Container>
          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              style={{
                width: "100%",
                padding: 12,
                background: "#eede01ce",
                border: "none",
                borderRadius: 12,
                fontSize: 17,
                fontWeight: 700,
                color: "#1a1000",
                cursor: "pointer",
              }}
            >
              {step === 1 ? "Continue to payment →" : "Review my order →"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={
                placing ||
                (paymentMethod === "wallet" &&
                  finalSummary.total > walletBalance)
              }
              style={{
                width: "100%",
                padding: 12,
                background: placing
                  ? "rgba(201,199,76,0.6)"
                  : paymentMethod === "wallet" &&
                      finalSummary.total > walletBalance
                    ? "#1a2a1a"
                    : "#eede01ce",
                border: "none",
                borderRadius: 12,
                fontSize: 17,
                fontWeight: 700,
                color:
                  paymentMethod === "wallet" &&
                  finalSummary.total > walletBalance
                    ? "#555"
                    : "#1a1000",
                cursor:
                  placing ||
                  (paymentMethod === "wallet" &&
                    finalSummary.total > walletBalance)
                    ? "not-allowed"
                    : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {placing ? (
                <>
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      border: "2px solid rgba(26,26,0,0.3)",
                      borderTopColor: "#0f1a00",
                      borderRadius: "50%",
                      animation: "spin 0.7s linear infinite",
                    }}
                  />
                  Processing...
                </>
              ) : paymentMethod === "wallet" &&
                finalSummary.total > walletBalance ? (
                "Insufficient wallet balance"
              ) : (
                `Place order · ₦${finalSummary.total.toLocaleString()}`
              )}
            </button>
          )}
        </Container>
      </div>
    </div>
  );
}
