import { Form, Row, Col } from "react-bootstrap";
import { useMemo } from "react";
import { BsArrowLeft, BsArrowRight, BsInfo } from "react-icons/bs";
import { fadedown, container } from "../../../../../../animation";
import { motion } from "framer-motion";
import { LockFill } from "react-bootstrap-icons";
import { FiPackage } from "react-icons/fi";

const PRICE_DISPLAY_OPTIONS = [
  { value: "exact", label: "Show exact price", desc: "Buyers see ₦ 8,500,000" },
  {
    value: "contact",
    label: "Contact for price",
    desc: "Buyers must message you",
  },
  {
    value: "on_request",
    label: "Price on request",
    desc: "Shows POA on listing",
  },
];

export function Price({
  setStep,
  formData,
  handleChange,
  errors,
  handleBack,
  validateStep,
}) {
  const next = () => {
    if (!validateStep()) return;

    setStep(6);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isRegular = formData.type === "REGULAR";
  const isCar = formData.type === "CAR";
  const isRealEstate = formData.type === "REAL_ESTATE";

  const price = parseFloat(formData.price) || 0;
  const oldPrice = parseFloat(formData.oldPrice) || 0;
  const costPrice = parseFloat(formData.costPrice) || 0;

  // auto calculations — useMemo
  const calculations = useMemo(() => {
    if (!price) return null;

    const roaCommission = price * 0.05;
    const youReceive = price - roaCommission;
    const profitPerSale = costPrice ? youReceive - costPrice : null;
    const profitMargin =
      costPrice && profitPerSale
        ? ((profitPerSale / price) * 100).toFixed(1)
        : null;
    const discountPercent =
      oldPrice > price
        ? Math.round(((oldPrice - price) / oldPrice) * 100)
        : null;

    return {
      roaCommission,
      youReceive,
      profitPerSale,
      profitMargin,
      discountPercent,
    };
  }, [price, oldPrice, costPrice]);

  return (
    <>
      <motion.div variants={container} initial="hidden" animate="visible">
        <motion.div variants={fadedown} className="mb-5">
          {/* heading */}
          <h3 className=" fs-1 mb-3 fw-bold">
            {" "}
            {isRegular
              ? "Pricing & stock"
              : isCar
                ? "Asking price"
                : "Listing price"}
          </h3>
          <h5>
            {" "}
            {isRegular
              ? "Set your price and stock. Your cost price is private — only you can see it."
              : "Set your asking price and how it appears to buyers."}
          </h5>
        </motion.div>

        {/* Price display — car and  real_eastate only */}
        {(isCar || isRealEstate) && (
          <motion.div variants={fadedown} className="my-5 py-3">
            <Form.Label>How to display price</Form.Label>
            <div>
              {PRICE_DISPLAY_OPTIONS.map((opt) => {
                return (
                  <Form.Check
                    className="py-2 d-flex gap-3 align-items-center"
                    value={opt.value}
                    checked={formData.priceDisplay === opt.value}
                    onChange={(e) =>
                      handleChange("priceDisplay", e.target.value)
                    }
                    label={
                      <>
                        <p>{opt.label}</p>
                        <p>{opt.desc}</p>
                      </>
                    }
                    type="radio"
                  />
                );
              })}
            </div>
          </motion.div>
        )}

        {/* main price */}
        {formData.priceDisplay !== "contact" &&
          formData.priceDisplay !== "on_request" && (
            <motion.div variants={fadedown} className="my-5 py-3">
              <Form.Label>
                {" "}
                {isRegular
                  ? "Selling price (₦ ) *"
                  : isCar
                    ? "Asking price (₦ ) *"
                    : isRealEstate &&
                        formData.listingMeta?.listingType === "For rent"
                      ? "Price per year (₦ ) *"
                      : "Sale price (₦ ) *"}
              </Form.Label>

              <div className="d-flex align-items-center gap-3 gap-lg-5">
                <h4>₦ </h4>
                <Form.Control
                  type="number"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => handleChange("price", e.target.value)}
                />
              </div>
              {errors.price && (
                <p className="text-danger fw-bold">{errors.price}</p>
              )}
            </motion.div>
          )}

        {/* comparison at prices - regular only */}
        {isRegular && (
          <motion.div variants={fadedown} className="my-5 py-3">
            <Form.Label>
              Original / old price (₦ )
              <p>optional — shows strikethrough to buyers</p>
            </Form.Label>

            <div className="d-flex align-items-center gap-3 gap-lg-5">
              <h4>₦ </h4>
              <Form.Control
                type="number"
                placeholder="0.00"
                value={formData.oldPrice}
                onChange={(e) => handleChange("oldPrice", e.target.value)}
              />
            </div>
          </motion.div>
        )}

        {/* cost price - regular, private */}
        {isRegular && (
          <motion.div variants={fadedown} className="my-5 py-3">
            <Form.Label>
              {" "}
              Your cost price (₦ )<p>private — only you can see this</p>
            </Form.Label>

            <div className="d-flex align-items-center gap-3 gap-lg-5">
              <h4>₦ </h4>
              <Form.Control
                type="number"
                placeholder="0.00"
                value={formData.costPrice}
                onChange={(e) => handleChange("costPrice", e.target.value)}
              />
            </div>

            <div className="d-flex align-items-center gap-4 mt-3">
              <LockFill size={20} />
              <p>
                {" "}
                Used to calculate your profit margin. Never shown to buyers.
              </p>
            </div>
          </motion.div>
        )}

        {/* AUTO CALCULATION CARD */}
        {calculations && price > 0 && (
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
                Earnings breakdown
              </p>

              {[
                {
                  label: "Selling price",
                  val: `₦ ${price.toLocaleString()}`,
                  color: "#eee",
                },
                {
                  label: "r.o.a. commission (5%)",
                  val: `-₦ ${calculations.roaCommission.toLocaleString()}`,
                  color: "#c0392b",
                },
                {
                  label: "You receive",
                  val: `₦ ${calculations.youReceive.toLocaleString()}`,
                  color: "#1D9E75",
                  bold: true,
                },
                ...(calculations.profitPerSale !== null
                  ? [
                      {
                        label: "Profit per sale",
                        val: `₦ ${calculations.profitPerSale.toLocaleString()}`,
                        color: "#c9a84c",
                      },
                    ]
                  : []),
                ...(calculations.profitMargin !== null
                  ? [
                      {
                        label: "Profit margin",
                        val: `${calculations.profitMargin}%`,
                        color: "#c9a84c",
                      },
                    ]
                  : []),
              ].map((row, i) => (
                <div
                  className="d-flex justify-content-between align-items-center"
                  key={row.label}
                  style={{
                    padding: "8px 0",
                    borderTop: i === 2 ? "0.5px solid #d6da1b6b" : "none",
                    marginTop: i === 2 ? 4 : 0,
                  }}
                >
                  <p>{row.label}</p>
                  <p
                    style={{
                      fontSize: row.bold ? 15 : 13,
                      color: row.color,
                      fontWeight: row.bold ? 700 : 500,
                      fontFamily: row.bold ? "'Syne',sans-serif" : "inherit",
                    }}
                  >
                    {row.val}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* STOCK — REGULAR only and no variants */}

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
                placeholder="How many units do you have?"
                value={formData.stock}
                onChange={(e) => handleChange("stock", e.target.value)}
                min={1}
              />
            </div>
            {errors.stock && (
              <p className="text-danger fw-bold">{errors.stock}</p>
            )}

            {/* Low stock alert */}
            <div className="mt-5">
              <Form.Label>
                Low stock alert
                <p>notify me when stock reaches this number</p>
              </Form.Label>
              {[3, 5, 10, 15, 20].map((n) => (
                <Form.Check
                  className="py-2 "
                  type="radio"
                  key={n}
                  checked={formData.lowStockAlert === n}
                  value={n}
                  label={<>{n} units</>}
                  onChange={(e) =>
                    handleChange("lowStockAlert", e.target.value)
                  }
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* variants stock info */}
        {isRegular &&
          formData.hasVariants &&
          formData.productVariants.length > 0 && (
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
                <p
                  style={{
                    lineHeight: 1.6,
                  }}
                >
                  You set stock per variant in Step 4. Total stock across all
                  variants:
                  <strong style={{ color: "#b4c70a", marginLeft: 4 }}>
                    {formData.productVariants.reduce(
                      (sum, v) => sum + (parseInt(v.stock) || 0),
                      0,
                    )}{" "}
                    units
                  </strong>
                </p>
              </div>
            </motion.div>
          )}

        {/* Sku */}
        {isRegular && (
          <motion.div variants={fadedown} className="my-5 py-3">
            <Form.Label>
              SKU / Product code
              <p>optional — your internal reference code</p>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g. NK-AM-270-BLK-42"
              value={formData.sku}
              onChange={(e) => handleChange("sku", e.target.value)}
            />
          </motion.div>
        )}

        {/* CAR — negotiable reminder */}
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
              <p
                style={{
                  lineHeight: 1.6,
                }}
              >
                If you set whether the price is negotiable.
                {formData.listingMeta?.negotiable
                  ? " Your listing shows as negotiable ✓"
                  : " Your listing shows as fixed price."}
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>

      <div className="d-flex align-items-center justify-content-between">
        <button onClick={handleBack} className="px-3 py-2  next-btn">
          <BsArrowLeft style={{ color: "#facc15", fontSize: "35px" }} />
        </button>

        <button onClick={next} className="px-3 py-2 next-btn">
          <BsArrowRight style={{ color: "#facc15", fontSize: "35px" }} />
        </button>
      </div>
    </>
  );
}
