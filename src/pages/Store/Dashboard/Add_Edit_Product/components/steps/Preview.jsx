import { Form, Card, Row, Col } from "react-bootstrap";
import { useState } from "react";
import { motion } from "framer-motion";
import { container, fadedown } from "../../../../../../animation";
import { useNavigate } from "react-router-dom";
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
  VEHICLE: {
    cta: "Whatsapp seller",
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

// checklist items per product type
const getChecklist = (formData) => {
  const base = [
    {
      key: "type",
      label: "Product type selected",
      done: Boolean(formData.type),
    },
    { key: "name", label: "Title added", done: Boolean(formData.name?.trim()) },
    {
      key: "description",
      label: "Description added",
      done: Boolean(formData.description?.trim()),
    },
    {
      key: "condition",
      label: "Condition selected",
      done: Boolean(formData.condition),
    },
    { key: "price", label: "Price set", done: Boolean(formData.price) },
    {
      key: "images",
      label: "At least 1 photo uploaded",
      done: formData.images?.length > 0,
    },
  ];

  if (formData.type === "REGULAR") {
    base.push(
      {
        key: "category",
        label: "Category selected",
        done: Boolean(formData.category),
      },
      {
        key: "stock",
        label: "Stock set",
        done: formData.hasVariants
          ? formData.productVariants?.some((v) => v.stock)
          : Boolean(formData.stock),
      },
    );
  }

  if (formData.type === "VEHICLE") {
    base.push(
      {
        key: "make",
        label: "Vehicle make added",
        done: Boolean(formData.listingMeta?.make),
      },
      {
        key: "model",
        label: "Vehicle model added",
        done: Boolean(formData.listingMeta?.model),
      },
      {
        key: "location",
        label: "Location added",
        done: Boolean(formData.listingMeta?.location),
      },
    );
  }

  if (formData.type === "REAL_ESTATE") {
    base.push(
      {
        key: "listingType",
        label: "Listing type selected",
        done: Boolean(formData.listingMeta?.listingType),
      },
      {
        key: "propertyType",
        label: "Property type selected",
        done: Boolean(formData.listingMeta?.propertyType),
      },
      {
        key: "address",
        label: "Address added",
        done: Boolean(formData.listingMeta?.address),
      },
    );
  }

  return base;
};

export function Preview({ formData, handleSubmit, loading, handleBack }) {
  const [status, setStatus] = useState("ACTIVE");

  const checklist = getChecklist(formData);
  const allPassed = checklist.every((c) => c.done);
  const passedCount = checklist.filter((c) => c.done).length;

  const isCar = formData.type === "VEHICLE";
  const isRealEstate = formData.type === "REAL_ESTATE";

  const price = parseFloat(formData.price) || 0;
  const productTypeConfig = PRODUCT_TYPE_CONFIG[formData.type || "REGULAR"];

  return (
    <motion.div variants={container} initial="hidden" animate="visible">
      {/* Heading */}
      <motion.div variants={fadedown}>
        <h3 className="fs-1 fw-bold mb-2">Preview & publish</h3>
        <h5>Review your listing before it goes live on r.o.a.</h5>
      </motion.div>

      {/* CHECKLIST */}
      <motion.div variants={fadedown} className="my-5 py-3">
        <div
          style={{
            background: allPassed ? " #01110b" : "#13120188",
            border: `0.5px solid ${allPassed ? "#1d9e7533" : "#b6c90a33"}`,
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div className="d-flex align-items-center justify-content-between mb-3">
            <p
              className="fs-5"
              style={{
                color: allPassed ? "#1D9E75" : "#b6ab15",
              }}
            >
              {allPassed
                ? "✓ Ready to publish"
                : `${passedCount}/${checklist.length} requirements met`}
            </p>
            <div
              className="px-2 py-1"
              style={{
                borderRadius: 20,
                background: allPassed ? "#1d9e7533" : "#c9c14c38",
              }}
            >
              <p style={{ color: allPassed ? "#1D9E75" : "#b6ab15" }}>
                {" "}
                {passedCount}/{checklist.length}
              </p>
            </div>
          </div>

          <div className="d-flex flex-column gap-3">
            {checklist.map((c) => (
              <div className="d-flex align-items-center gap-3" key={c.key}>
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: c.done ? "#1D9E75" : "#ffffff0f",
                    border: `1.5px solid ${c.done ? "#1D9E75" : "#ffffff26"}`,
                  }}
                >
                  {c.done ? (
                    <Check size={25} className="text-white" />
                  ) : (
                    <X size={25} />
                  )}
                </div>
                <p
                  style={{
                    textDecoration: c.done ? "none" : "none",
                  }}
                >
                  {c.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* listing preview card */}
      <motion.div variants={fadedown} className="my-5 py-3">
        <Form.Label>How your listing card will look to buyers:</Form.Label>

        <Row className="justify-content-center">
          <Col className=" col-8 col-sm-6 ">
            <Card className="product-card pb-2">
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "16/9",
                    background: "#1a2a1a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {formData.images?.[0] ? (
                    <Card.Img src={formData.images[0]} />
                  ) : isCar ? (
                    <FaMotorcycle size={55} style={{ color: "#d810c7" }} />
                  ) : isRealEstate ? (
                    <Building size={55} style={{ color: "#d8b310" }} />
                  ) : (
                    <FaShoppingBag size={55} style={{ color: "#10d88b" }} />
                  )}
                </div>

                {/* Image count badge */}
                {formData.images?.length > 1 && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 8,
                      right: 8,
                      fontSize: 11,
                      color: "#fff",
                      background: "rgba(0,0,0,0.6)",
                      borderRadius: 20,
                      padding: "2px 8px",
                    }}
                  >
                    1 / {formData.images.length}
                  </div>
                )}
              </div>

              <Card.Body className="py-0">
                {/* Category + condition */}
                <div
                  className="my-2"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{ fontSize: 11, color: "#c9a84c", fontWeight: 600 }}
                  >
                    {formData.category || formData.type}
                  </span>
                  {formData.condition && (
                    <span
                      style={{
                        fontSize: 10,
                        padding: "2px 8px",
                        borderRadius: 20,
                        background: "rgba(29,158,117,0.1)",
                        color: "#1D9E75",
                        border: "0.5px solid rgba(29,158,117,0.3)",
                      }}
                    >
                      {formData.condition ||
                        "your product condition appears here"}
                    </span>
                  )}
                </div>

                {/* Name */}
                <div className="my-2 product-name">
                  {" "}
                  {formData.name || "Your product title will appear here"}
                </div>

                {/* CAR specs preview */}
                {isCar && formData.listingMeta && (
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                      marginBottom: 10,
                    }}
                  >
                    {[
                      formData.listingMeta.year,
                      formData.listingMeta.transmission,
                      formData.listingMeta.fuel,
                    ]
                      .filter(Boolean)
                      .map((spec) => (
                        <p
                          className="px-2 py-1 text-dark"
                          key={spec}
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            borderRadius: "10px",
                          }}
                        >
                          {spec}
                        </p>
                      ))}
                  </div>
                )}

                {/* REAL ESTATE specs preview */}
                {isRealEstate && formData.listingMeta && (
                  <div className="d-flex mb-3 gap-4">
                    {formData.listingMeta.bedrooms && (
                      <p>🛏 {formData.listingMeta.bedrooms}</p>
                    )}
                    {formData.listingMeta.bathrooms && (
                      <p>🚿 {formData.listingMeta.bathrooms}</p>
                    )}
                    {formData.listingMeta.listingType && (
                      <p
                        className="px-2 "
                        style={{
                          borderRadius: 20,
                          background: "rgba(27,27,143,0.3)",
                          color: "#aaf",
                        }}
                      >
                        {formData.listingMeta.listingType}
                      </p>
                    )}
                  </div>
                )}

                {/* Price */}
                <div
                  className="d-flex align-items-center mt-3 mb-4 gap-2 gap-md-3 flex-wrap "
                  style={{ overflow: "hidden", lineHeight: 1 }}
                >
                  <div className="price">
                    {price > 0 ? `₦ ${price.toLocaleString()}` : "₦  —"}
                  </div>

                  {formData.oldPrice &&
                    parseFloat(formData.oldPrice) > price && (
                      <small
                        className="old-price "
                        style={{ color: "#a0a0a0" }}
                      >
                        ₦ {parseFloat(formData.oldPrice).toLocaleString()}
                      </small>
                    )}

                  {isCar && formData.listingMeta?.negotiable && (
                    <span
                      style={{
                        fontSize: 10,
                        color: "#1D9E75",
                        background: "rgba(29,158,117,0.1)",
                        borderRadius: 5,
                        padding: "2px 7px",
                      }}
                    >
                      Negotiable
                    </span>
                  )}
                </div>

                {/* CTA preview */}
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

      {/* PUBLISH STATUS */}
      <motion.div variants={fadedown} className="my-5 py-3">
        <Form.Label>Publish status</Form.Label>
        <div className="d-flex mt-lg-3 gap-5 flex-wrap  justify-content-between ">
          {[
            {
              value: "ACTIVE",
              label: "Publish immediately",
              desc: "Your listing goes live right now",
              Icon: Rocket,
              color: "#1D9E75",
            },
            {
              value: "DRAFT",
              label: "Save as draft",
              desc: "Save and publish later",
              Icon: File,
              color: "#888",
            },
          ].map((opt) => (
            <Form.Check
              className=" d-flex align-items-center gap-3"
              key={opt.value}
              label={
                <div className="d-flex align-items-center gap-3">
                  <opt.Icon size={35} style={{ color: opt.color }} />
                  <div>
                    <p>{opt.label}</p>
                    <p>{opt.desc}</p>
                  </div>
                </div>
              }
              checked={status === opt.value}
              type="radio"
              value={opt.value}
              onChange={(e) => setStatus(e.target.value)}
            />
          ))}
        </div>
      </motion.div>

      {/* PUBLISH BUTTONS */}
      <motion.div variants={fadedown} className="mt-5 pt-5 mb-2">
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
              ? "0.5px solid #1a2a1a"
              : status === "DRAFT"
                ? "0.5px solid rgba(255,255,255,0.1)"
                : "none",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            color: !allPassed
              ? "#555"
              : status === "DRAFT"
                ? "#ddd"
                : "#1a1000",
            cursor: loading || !allPassed ? "not-allowed" : "pointer",
            fontFamily: "'Plus Jakarta Sans',sans-serif",
            marginBottom: 10,
            transition: "all 0.2s",
          }}
        >
          <p>
            {loading
              ? "Publishing..."
              : !allPassed
                ? `Complete ${checklist.length - passedCount} missing requirement${checklist.length - passedCount !== 1 ? "s" : ""} first`
                : status === "DRAFT"
                  ? "Save as draft"
                  : "🚀 Publish listing"}
          </p>
        </button>
      </motion.div>

      {/* not ready warning */}
      <p>Go back and complete the missing requirements above</p>

      <div className="d-flex align-items-center justify-content-between my-5 py-5">
        <button
          type="button"
          onClick={handleBack}
          className="px-3 py-2  next-btn"
        >
          <ArrowLeft style={{ color: "#facc15", fontSize: "35px" }} />
        </button>
      </div>
    </motion.div>
  );
}
