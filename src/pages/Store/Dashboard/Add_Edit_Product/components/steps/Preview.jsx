import { Form, Card, Row, Col } from "react-bootstrap";
import { useState } from "react";
import { motion } from "framer-motion";
import { container, fadedown } from "../../../../../../utils/animation";
import {
  ArrowLeft,
  Building,
  Check,
  File,
  Rocket,
  X,
} from "react-bootstrap-icons";
import { FaMotorcycle, FaShoppingBag } from "react-icons/fa";

const PRODUCT_TYPE_CONFIG = {
  REGULAR: {
    cta: "Add to cart",
    ctaColor: "#ecf01f",
    ctaBg: "#202001e8",
    ctaText: "#fbff00",
  },
  CAR: {
    cta: "WhatsApp seller",
    ctaColor: "#29f7b6",
    ctaBg: "transparent",
    ctaText: "#00ffae",
  },
  REAL_ESTATE: {
    cta: "Schedule visit",
    ctaColor: "#6df84a",
    ctaBg: "transparent",
    ctaText: "#33fd00",
  },
};

const hasText = (value) => typeof value === "string" && value.trim().length > 0;

const isPositiveNumber = (value) => {
  if (value === "" || value === null || value === undefined) {
    return false;
  }

  const number = Number(value);
  return Number.isFinite(number) && number > 0;
};

const isValidStock = (value) => {
  if (value === "" || value === null || value === undefined) {
    return false;
  }

  const number = Number(value);
  return Number.isInteger(number) && number > 0;
};

const getChecklist = (formData) => {
  const type = formData.type;
  const variants = Array.isArray(formData.productVariants)
    ? formData.productVariants
    : [];
  const images = Array.isArray(formData.images) ? formData.images : [];
  const keywords = Array.isArray(formData.keywords) ? formData.keywords : [];
  const listingMeta = formData.listingMeta ?? {};

  const checks = [
    {
      key: "type",
      label: "Product type selected",
      done: ["REGULAR", "CAR", "REAL_ESTATE"].includes(type),
    },
    {
      key: "name",
      label: "Title added",
      done: hasText(formData.name) && formData.name.trim().length <= 100,
    },
    {
      key: "description",
      label: "Description added",
      done:
        hasText(formData.description) &&
        formData.description.trim().length <= 2000,
    },
    {
      key: "condition",
      label: "Condition selected",
      done: hasText(formData.condition),
    },
    {
      key: "price",
      label: "Valid price set",
      done: isPositiveNumber(formData.price),
    },
    {
      key: "images",
      label: "At least one photo uploaded",
      done:
        images.length > 0 &&
        images.every(
          (image) => typeof image === "string" && image.trim().length > 0,
        ),
    },
    {
      key: "keywords",
      label: "Keyword limit respected",
      done: keywords.length <= 10,
    },
  ];

  if (type === "REGULAR") {
    checks.push(
      {
        key: "category",
        label: "Category selected",
        done: Boolean(formData.categoryId || formData.category),
      },
      {
        key: "stock",
        label: "Valid stock quantity set",
        done: formData.hasVariants
          ? variants.length > 0 &&
            variants.every(
              (variant) =>
                isValidStock(variant.stock) &&
                hasText(variant.sku) &&
                variant.combination !== null &&
                typeof variant.combination === "object" &&
                Object.keys(variant.combination).length > 0 &&
                (variant.price === "" ||
                  variant.price === null ||
                  variant.price === undefined ||
                  isPositiveNumber(variant.price)),
            )
          : isValidStock(formData.stock),
      },
    );
  }

  if (type === "CAR") {
    checks.push(
      {
        key: "make",
        label: "Vehicle make added",
        done: hasText(listingMeta.make),
      },
      {
        key: "model",
        label: "Vehicle model added",
        done: hasText(listingMeta.model),
      },
      {
        key: "year",
        label: "Vehicle year added",
        done: isPositiveNumber(listingMeta.year),
      },
      {
        key: "location",
        label: "Location added",
        done: hasText(listingMeta.location),
      },
    );
  }

  if (type === "REAL_ESTATE") {
    checks.push(
      {
        key: "listingType",
        label: "Listing type selected",
        done: hasText(listingMeta.listingType),
      },
      {
        key: "propertyType",
        label: "Property type selected",
        done: hasText(listingMeta.propertyType),
      },
      {
        key: "address",
        label: "Property address added",
        done: hasText(listingMeta.address),
      },
    );
  }

  return checks;
};

export function Preview({ formData, handleSubmit, loading, handleBack }) {
  const [status, setStatus] = useState("ACTIVE");

  const checklist = getChecklist(formData);
  const allPassed = checklist.every((item) => item.done);
  const passedCount = checklist.filter((item) => item.done).length;
  const missingCount = checklist.length - passedCount;

  const isCar = formData.type === "CAR";
  const isRealEstate = formData.type === "REAL_ESTATE";

  const price = Number(formData.price);
  const validPrice = Number.isFinite(price) && price > 0;

  const productTypeConfig =
    PRODUCT_TYPE_CONFIG[formData.type] ?? PRODUCT_TYPE_CONFIG.REGULAR;

  const imageCount = Array.isArray(formData.images)
    ? formData.images.length
    : 0;

  const formatPrice = (amount) =>
    new Intl.NumberFormat("en-NG", {
      maximumFractionDigits: 2,
    }).format(amount);

  return (
    <motion.div variants={container} initial="hidden" animate="visible">
      <motion.div variants={fadedown}>
        <h3 className="fs-1 fw-bold mb-2">Preview &amp; publish</h3>
        <h5>Review your listing before it goes live on r.o.a.</h5>
      </motion.div>

      {/* Readiness checklist */}
      <motion.div variants={fadedown} className="my-5 py-3">
        <div
          style={{
            background: allPassed ? "#01110b" : "#13120188",
            border: `1px solid ${allPassed ? "#1d9e7555" : "#b6c90a55"}`,
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
            <p
              className="fs-5 mb-0"
              style={{ color: allPassed ? "#1D9E75" : "#b6ab15" }}
            >
              {allPassed
                ? "✓ Ready to publish"
                : `${passedCount}/${checklist.length} requirements met`}
            </p>

            <span
              className="px-3 py-1"
              style={{
                borderRadius: 20,
                background: allPassed ? "#1d9e7533" : "#c9c14c38",
                color: allPassed ? "#1D9E75" : "#b6ab15",
                whiteSpace: "nowrap",
              }}
            >
              {passedCount}/{checklist.length}
            </span>
          </div>

          <div className="d-flex flex-column gap-3">
            {checklist.map((item) => (
              <div className="d-flex align-items-center gap-3" key={item.key}>
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: item.done ? "#1D9E75" : "#ffffff0f",
                    border: `1.5px solid ${
                      item.done ? "#1D9E75" : "#ffffff26"
                    }`,
                  }}
                >
                  {item.done ? (
                    <Check size={14} className="text-white" />
                  ) : (
                    <X size={14} />
                  )}
                </div>

                <span style={{ opacity: item.done ? 1 : 0.8 }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Listing card preview */}
      <motion.div variants={fadedown} className="my-5 py-3">
        <Form.Label>How your listing card will look to buyers</Form.Label>

        <Row className="justify-content-center">
          <Col xs={12} sm={8} md={7} lg={6}>
            <Card className="product-card pb-2 h-100">
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "16 / 9",
                  background: "#1a2a1a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {formData.images?.[0] ? (
                  <Card.Img
                    src={formData.images[0]}
                    alt={formData.name || "Product preview"}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: 0,
                    }}
                  />
                ) : isCar ? (
                  <FaMotorcycle size={55} color="#d810c7" />
                ) : isRealEstate ? (
                  <Building size={55} color="#d8b310" />
                ) : (
                  <FaShoppingBag size={55} color="#10d88b" />
                )}

                {imageCount > 1 && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: 8,
                      right: 8,
                      fontSize: 11,
                      color: "#fff",
                      background: "rgba(0,0,0,0.7)",
                      borderRadius: 20,
                      padding: "3px 9px",
                    }}
                  >
                    1 / {imageCount}
                  </span>
                )}
              </div>

              <Card.Body className="py-2">
                <div className="my-2 d-flex align-items-center justify-content-between gap-2">
                  <span
                    style={{
                      fontSize: 11,
                      color: "#c9a84c",
                      fontWeight: 600,
                    }}
                  >
                    {formData.category || formData.type || "Category"}
                  </span>

                  {formData.condition && (
                    <span
                      style={{
                        fontSize: 10,
                        padding: "3px 8px",
                        borderRadius: 20,
                        background: "rgba(29,158,117,0.1)",
                        color: "#1D9E75",
                        border: "1px solid rgba(29,158,117,0.3)",
                      }}
                    >
                      {formData.condition}
                    </span>
                  )}
                </div>

                <div className="my-2 product-name">
                  {formData.name?.trim() ||
                    "Your product title will appear here"}
                </div>

                {isCar && formData.listingMeta && (
                  <div className="d-flex gap-2 flex-wrap mb-3">
                    {[
                      formData.listingMeta.year,
                      formData.listingMeta.transmission,
                      formData.listingMeta.fuel,
                    ]
                      .filter(
                        (value) =>
                          value !== null &&
                          value !== undefined &&
                          String(value).trim() !== "",
                      )
                      .map((spec) => (
                        <span
                          className="px-2 py-1"
                          key={spec}
                          style={{
                            background: "rgba(255,255,255,0.06)",
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                        >
                          {spec}
                        </span>
                      ))}
                  </div>
                )}

                {isRealEstate && formData.listingMeta && (
                  <div className="d-flex flex-wrap mb-3 gap-3">
                    {formData.listingMeta.bedrooms !== "" &&
                      formData.listingMeta.bedrooms !== null &&
                      formData.listingMeta.bedrooms !== undefined && (
                        <span>🛏 {formData.listingMeta.bedrooms} bedrooms</span>
                      )}

                    {formData.listingMeta.bathrooms !== "" &&
                      formData.listingMeta.bathrooms !== null &&
                      formData.listingMeta.bathrooms !== undefined && (
                        <span>
                          🚿 {formData.listingMeta.bathrooms} bathrooms
                        </span>
                      )}

                    {formData.listingMeta.listingType && (
                      <span
                        className="px-2 py-1"
                        style={{
                          borderRadius: 20,
                          background: "rgba(27,27,143,0.3)",
                          color: "#aaf",
                          fontSize: 12,
                        }}
                      >
                        {formData.listingMeta.listingType}
                      </span>
                    )}
                  </div>
                )}

                <div className="d-flex align-items-center mt-3 mb-4 gap-2 flex-wrap">
                  <span className="price">
                    {validPrice ? `₦ ${formatPrice(price)}` : "₦ —"}
                  </span>

                  {isCar && formData.listingMeta?.negotiable && (
                    <span
                      style={{
                        fontSize: 10,
                        color: "#1D9E75",
                        background: "rgba(29,158,117,0.1)",
                        borderRadius: 5,
                        padding: "3px 7px",
                      }}
                    >
                      Negotiable
                    </span>
                  )}
                </div>

                <div
                  className="text-center"
                  style={{
                    width: "100%",
                    padding: "10px 0",
                    background: productTypeConfig.ctaBg,
                    border: `1px solid ${productTypeConfig.ctaColor}`,
                    borderRadius: 10,
                    fontWeight: 700,
                    color: productTypeConfig.ctaText,
                  }}
                >
                  {productTypeConfig.cta}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </motion.div>

      {/* Publish status */}
      <motion.div variants={fadedown} className="my-5 py-3">
        <Form.Label>Publish status</Form.Label>

        <div className="d-flex mt-3 gap-4 flex-wrap justify-content-between">
          {[
            {
              value: "ACTIVE",
              label: "Publish immediately",
              description: "Your listing goes live right now.",
              Icon: Rocket,
              color: "#1D9E75",
            },
            {
              value: "DRAFT",
              label: "Save as draft",
              description: "Save your listing to finish later.",
              Icon: File,
              color: "#888",
            },
          ].map((option) => (
            <Form.Check
              key={option.value}
              id={`publish-status-${option.value.toLowerCase()}`}
              name="publishStatus"
              type="radio"
              value={option.value}
              checked={status === option.value}
              onChange={() => setStatus(option.value)}
              className="d-flex align-items-center gap-3"
              label={
                <div className="d-flex align-items-center gap-3">
                  <option.Icon size={32} style={{ color: option.color }} />

                  <div>
                    <div>{option.label}</div>
                    <small className="text-secondary">
                      {option.description}
                    </small>
                  </div>
                </div>
              }
            />
          ))}
        </div>
      </motion.div>

      {/* Submit */}
      <motion.div variants={fadedown} className="mt-5 pt-3 mb-2">
        <button
          type="button"
          onClick={() => handleSubmit(status)}
          disabled={loading || !allPassed}
          style={{
            width: "100%",
            padding: 14,
            background: !allPassed
              ? "#1a2a1a"
              : status === "DRAFT"
                ? "rgba(255,255,255,0.06)"
                : "#c9a84c",
            border: !allPassed
              ? "1px solid #1a2a1a"
              : status === "DRAFT"
                ? "1px solid rgba(255,255,255,0.1)"
                : "none",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            color: !allPassed
              ? "#777"
              : status === "DRAFT"
                ? "#ddd"
                : "#1a1000",
            cursor: loading || !allPassed ? "not-allowed" : "pointer",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            marginBottom: 10,
            transition: "all 0.2s",
          }}
        >
          {loading
            ? "Saving listing..."
            : !allPassed
              ? `Complete ${missingCount} missing requirement${
                  missingCount === 1 ? "" : "s"
                } first`
              : status === "DRAFT"
                ? "Save as draft"
                : "🚀 Publish listing"}
        </button>

        {!allPassed && (
          <p className="text-secondary text-center mt-2">
            Go back and complete the missing requirements above.
          </p>
        )}
      </motion.div>

      <div className="d-flex align-items-center justify-content-between my-5 py-3">
        <button
          type="button"
          onClick={handleBack}
          className="px-3 py-2 next-btn"
          aria-label="Go back to edit your listing"
        >
          <ArrowLeft style={{ color: "#facc15", fontSize: 35 }} />
        </button>
      </div>
    </motion.div>
  );
}
