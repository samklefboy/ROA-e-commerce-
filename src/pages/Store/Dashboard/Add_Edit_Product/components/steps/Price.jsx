import { Form } from "react-bootstrap";
import { useMemo } from "react";
import { BsArrowLeft, BsArrowRight, BsInfo } from "react-icons/bs";
import { fadedown, container } from "../../../../../../utils/animation";
import { motion } from "framer-motion";
import { LockFill } from "react-bootstrap-icons";
import { FiPackage } from "react-icons/fi";

const PRICE_DISPLAY_OPTIONS = [
  {
    value: "exact",
    label: "Show exact price",
    desc: "Buyers see your listing price.",
  },
  {
    value: "contact",
    label: "Contact for price",
    desc: "Buyers must contact you.",
  },
  {
    value: "on_request",
    label: "Price on request",
    desc: "Shows POA on the listing.",
  },
];

const formatNaira = (amount) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

const toNumber = (value) => {
  if (value === "" || value === null || value === undefined) return 0;

  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
};

export function Price({
  setStep,
  formData,
  handleChange,
  errors,
  handleBack,
  validateStep,

  // Pass this value from the backend's PlatformCommissionPolicy.rateBps.
  // Example: 500 = 5%, 250 = 2.5%.
  commissionRateBps = null,

  // Optional status props from the parent.
  commissionLoading = false,
  commissionError = null,
}) {
  const isRegular = formData.type === "REGULAR";
  const isCar = formData.type === "CAR";
  const isRealEstate =
    formData.type === "REAL_ESTATE" || formData.type === "REALESTATE";

  const hasExactPrice =
    formData.priceDisplay !== "contact" &&
    formData.priceDisplay !== "on_request";

  const price = toNumber(formData.price);
  const costPrice = toNumber(formData.costPrice);

  const validCommissionRate =
    commissionRateBps !== null &&
    commissionRateBps !== undefined &&
    commissionRateBps !== "" &&
    Number.isInteger(Number(commissionRateBps)) &&
    Number(commissionRateBps) >= 0 &&
    Number(commissionRateBps) <= 10_000;

  // rateBps is expressed in basis points: 10,000 bps = 100%.
  const commissionRate = validCommissionRate
    ? Number(commissionRateBps) / 10_000
    : null;

  const calculations = useMemo(() => {
    if (!hasExactPrice || price <= 0 || commissionRate === null) {
      return null;
    }

    const commissionAmount = price * commissionRate;
    const estimatedPayout = price - commissionAmount;

    const estimatedProfit = costPrice > 0 ? estimatedPayout - costPrice : null;

    const estimatedProfitMargin =
      estimatedProfit !== null ? (estimatedProfit / price) * 100 : null;

    return {
      commissionAmount,
      estimatedPayout,
      estimatedProfit,
      estimatedProfitMargin,
      commissionPercentage: commissionRate * 100,
    };
  }, [hasExactPrice, price, costPrice, commissionRate]);

  const next = () => {
    if (!validateStep()) return;

    if (commissionLoading) return;

    if (commissionError || !validCommissionRate) {
      return;
    }

    setStep(6);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <motion.div variants={container} initial="hidden" animate="visible">
        <motion.div variants={fadedown} className="mb-5">
          <h3 className="fs-1 mb-3 fw-bold">
            {isRegular
              ? "Pricing & stock"
              : isCar
                ? "Asking price"
                : "Listing price"}
          </h3>

          <h5>
            {isRegular
              ? "Set your price and stock. Your cost price is private — only you can see it."
              : "Set your asking price and how it appears to buyers."}
          </h5>
        </motion.div>

        {/* Price display options are for car and property listings. */}
        {(isCar || isRealEstate) && (
          <motion.div variants={fadedown} className="my-5 py-3">
            <Form.Label>How to display price</Form.Label>

            <div>
              {PRICE_DISPLAY_OPTIONS.map((option) => (
                <Form.Check
                  key={option.value}
                  className="py-2 d-flex gap-3 align-items-center"
                  type="radio"
                  name="priceDisplay"
                  value={option.value}
                  checked={(formData.priceDisplay || "exact") === option.value}
                  onChange={(event) =>
                    handleChange("priceDisplay", event.target.value)
                  }
                  label={
                    <>
                      <p className="mb-1">{option.label}</p>
                      <p className="mb-0">{option.desc}</p>
                    </>
                  }
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Main price */}
        {hasExactPrice && (
          <motion.div variants={fadedown} className="my-5 py-3">
            <Form.Label>
              {isRegular
                ? "Selling price (₦) *"
                : isCar
                  ? "Asking price (₦) *"
                  : isRealEstate &&
                      formData.listingMeta?.listingType === "For rent"
                    ? "Price per year (₦) *"
                    : "Sale price (₦) *"}
            </Form.Label>

            <div className="d-flex align-items-center gap-3 gap-lg-5">
              <h4>₦</h4>

              <Form.Control
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.price ?? ""}
                onChange={(event) => handleChange("price", event.target.value)}
                aria-invalid={Boolean(errors.price)}
              />
            </div>

            {errors.price && (
              <p className="text-danger fw-bold">{errors.price}</p>
            )}
          </motion.div>
        )}

        {/* Private cost price: regular products only */}
        {isRegular && (
          <motion.div variants={fadedown} className="my-5 py-3">
            <Form.Label>
              Your cost price (₦)
              <p className="mb-0">Private — only you can see this.</p>
            </Form.Label>

            <div className="d-flex align-items-center gap-3 gap-lg-5">
              <h4>₦</h4>

              <Form.Control
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.costPrice ?? ""}
                onChange={(event) =>
                  handleChange("costPrice", event.target.value)
                }
              />
            </div>

            <div className="d-flex align-items-center gap-4 mt-3">
              <LockFill size={20} />
              <p className="mb-0">
                Used for your estimated profit calculation. Never shown to
                buyers.
              </p>
            </div>
          </motion.div>
        )}

        {/* Earnings estimate: only shown when the backend rate is available. */}
        {hasExactPrice && price > 0 && (
          <motion.div variants={fadedown} className="my-5 py-3">
            <div
              className="p-3 p-sm-4"
              style={{
                background: "#072208fc",
                border: "0.5px solid #d6da1b6b",
                borderRadius: 12,
              }}
            >
              <p
                className="mb-3"
                style={{
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Estimated earnings
              </p>

              {commissionLoading ? (
                <p className="mb-0">Loading ROA commission policy...</p>
              ) : commissionError ? (
                <p className="text-warning mb-0">
                  The commission policy could not be loaded. Your earnings
                  estimate is temporarily unavailable.
                </p>
              ) : !validCommissionRate ? (
                <p className="mb-0">
                  Your earnings estimate will appear when ROA's commission
                  policy is available.
                </p>
              ) : calculations ? (
                <>
                  {[
                    {
                      label: "Listing price",
                      value: formatNaira(price),
                      color: "#eee",
                    },
                    {
                      label: `Estimated ROA commission (${calculations.commissionPercentage.toLocaleString(
                        "en-NG",
                        { maximumFractionDigits: 4 },
                      )}%)`,
                      value: `−${formatNaira(calculations.commissionAmount)}`,
                      color: "#f08b83",
                    },
                    {
                      label: "Estimated payout before adjustments",
                      value: formatNaira(calculations.estimatedPayout),
                      color: "#1D9E75",
                      bold: true,
                    },
                    ...(calculations.estimatedProfit !== null
                      ? [
                          {
                            label: "Estimated profit per sale",
                            value: formatNaira(calculations.estimatedProfit),
                            color: "#c9a84c",
                          },
                        ]
                      : []),
                    ...(calculations.estimatedProfitMargin !== null
                      ? [
                          {
                            label: "Estimated profit margin",
                            value: `${calculations.estimatedProfitMargin.toFixed(
                              1,
                            )}%`,
                            color: "#c9a84c",
                          },
                        ]
                      : []),
                  ].map((row, index) => (
                    <div
                      className="d-flex justify-content-between align-items-center gap-3"
                      key={row.label}
                      style={{
                        padding: "8px 0",
                        borderTop:
                          index === 2 ? "0.5px solid #d6da1b6b" : "none",
                        marginTop: index === 2 ? 4 : 0,
                      }}
                    >
                      <p className="mb-0">{row.label}</p>

                      <p
                        className="mb-0 text-end"
                        style={{
                          fontSize: row.bold ? 15 : 13,
                          color: row.color,
                          fontWeight: row.bold ? 700 : 500,
                          fontFamily: row.bold
                            ? "'Syne',sans-serif"
                            : "inherit",
                        }}
                      >
                        {row.value}
                      </p>
                    </div>
                  ))}

                  <p className="small mt-3 mb-0">
                    This is an estimate, not a guaranteed settlement amount.
                    Refunds, disputes, and other applicable adjustments may
                    affect the final payout.
                  </p>
                </>
              ) : null}
            </div>
          </motion.div>
        )}

        {/* Stock: regular products without variants */}
        {isRegular && !formData.hasVariants && (
          <motion.div variants={fadedown} className="my-5 py-3">
            <Form.Label>Stock quantity *</Form.Label>

            <div
              className="d-flex align-items-center gap-2 gap-sm-4"
              style={{
                background: "#011401",
                borderRadius: 10,
                padding: "12px 14px",
              }}
            >
              <FiPackage size={30} />

              <Form.Control
                type="number"
                min="1"
                step="1"
                placeholder="How many units do you have?"
                value={formData.stock ?? ""}
                onChange={(event) => handleChange("stock", event.target.value)}
                aria-invalid={Boolean(errors.stock)}
              />
            </div>

            {errors.stock && (
              <p className="text-danger fw-bold">{errors.stock}</p>
            )}

            <div className="mt-5">
              <Form.Label>
                Low stock alert
                <p className="mb-0">
                  Notify me when stock reaches this number.
                </p>
              </Form.Label>

              {[3, 5, 10, 15, 20].map((quantity) => (
                <Form.Check
                  key={quantity}
                  className="py-2"
                  type="radio"
                  name="lowStockAlert"
                  checked={Number(formData.lowStockAlert) === quantity}
                  value={quantity}
                  label={`${quantity} units`}
                  onChange={() => handleChange("lowStockAlert", quantity)}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Stock information for variants */}
        {isRegular &&
          formData.hasVariants &&
          formData.productVariants?.length > 0 && (
            <motion.div variants={fadedown} className="my-5 py-3">
              <div
                className="d-flex align-items-center gap-3 gap-lg-5"
                style={{
                  background: "rgba(29, 158, 117, 0.2)",
                  border: "0.5px solid rgba(29, 158, 117, 0.44)",
                  borderRadius: 10,
                  padding: "12px 14px",
                }}
              >
                <BsInfo size={40} />

                <p style={{ lineHeight: 1.6 }} className="mb-0">
                  You set stock per variant in Step 4. Total stock across all
                  variants:
                  <strong style={{ color: "#b4c70a", marginLeft: 4 }}>
                    {formData.productVariants.reduce(
                      (total, variant) => total + toNumber(variant.stock),
                      0,
                    )}{" "}
                    units
                  </strong>
                </p>
              </div>
            </motion.div>
          )}

        {/* SKU: regular products only */}
        {isRegular && (
          <motion.div variants={fadedown} className="my-5 py-3">
            <Form.Label>
              SKU / Product code
              <p className="mb-0">Optional — your internal reference code.</p>
            </Form.Label>

            <Form.Control
              type="text"
              placeholder="e.g. NK-AM-270-BLK-42"
              value={formData.sku ?? ""}
              onChange={(event) => handleChange("sku", event.target.value)}
            />
          </motion.div>
        )}

        {/* Car negotiability reminder */}
        {isCar && (
          <motion.div variants={fadedown} className="my-5 py-3">
            <div
              className="d-flex align-items-center gap-3 p-2"
              style={{
                background: "rgba(55, 138, 221, 0.1)",
                border: "0.5px solid rgba(55, 138, 221, 0.71)",
                borderRadius: 10,
              }}
            >
              <BsInfo size={50} />

              <p style={{ lineHeight: 1.6 }} className="mb-0">
                {formData.listingMeta?.negotiable
                  ? "Your listing shows as negotiable."
                  : "Your listing shows as a fixed price."}
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>

      <div className="d-flex align-items-center justify-content-between">
        <button
          type="button"
          onClick={handleBack}
          className="px-3 py-2 next-btn"
          aria-label="Go back"
        >
          <BsArrowLeft style={{ color: "#facc15", fontSize: "35px" }} />
        </button>

        <button
          type="button"
          onClick={next}
          disabled={
            commissionLoading ||
            Boolean(commissionError) ||
            !validCommissionRate
          }
          className="px-3 py-2 next-btn"
          aria-label="Continue to next step"
        >
          <BsArrowRight style={{ color: "#facc15", fontSize: "35px" }} />
        </button>
      </div>
    </>
  );
}
