import { Form, Row, Col } from "react-bootstrap";
import { fadedown, container } from "../../../../../../../utils/animation.js";
import { motion } from "framer-motion";
import { BsArrowLeft, BsArrowRight } from "react-icons/bs";
import { useState } from "react";

const CATEGORIES = [
  "Fashion",
  "Shoes",
  "Electronics",
  "Agriculture",
  "Auto parts",
  "Beauty",
  "Food & kitchen",
  "Home & living",
  "Sports",
  "Books",
  "Health",
  "Other",
];

const GENDER_OPTIONS = ["Men", "Women", "Unisex", "Boys", "Girls", "Baby"];

const WARRANTY_DURATIONS = [
  "3 months",
  "6 months",
  "1 year",
  "2 years",
  "Lifetime",
];

export function RegularDetails({
  setStep,
  formData,
  handleChange,
  errors,
  handleBack,
  validateStep,
}) {
  const next = () => {
    if (!validateStep()) return;

    setStep(4);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const [waranty, setWaranty] = useState("No");

  const cat = formData.category;

  return (
    <>
      <motion.div variants={container} initial="hidden" animate="visible">
        {/* Heading */}
        <motion.div variants={fadedown} className="mb-5">
          <h3 className=" fs-1 mb-3 fw-bold">Product details</h3>
          <h5> Classify your product so buyers can find it easily.</h5>
        </motion.div>

        {/* category */}
        <motion.div variants={fadedown}>
          <Form.Group>
            <Form.Label className="mb-3">Category *</Form.Label>
            <Row className="gx-5 ">
              {CATEGORIES.map((c) => {
                return (
                  <Col className="my-3 col-auto py-1 col-12 col-lg-4" key={c}>
                    {" "}
                    <Form.Check
                      label={c}
                      checked={formData.category === c}
                      value={c}
                      onChange={(e) => handleChange("category", e.target.value)}
                      type="radio"
                    />
                  </Col>
                );
              })}
            </Row>

            {errors.category && (
              <h6 className="text-danger fw-bold mt-3">{errors.category}</h6>
            )}
          </Form.Group>
        </motion.div>

        {/* gender */}
        {(cat === "Fashion" || cat === "Shoes") && (
          <motion.div variants={fadedown} className=" my-5 py-2 ">
            <Form.Group>
              <Form.Label>Gender</Form.Label>

              <div className="d-inline-flex gap-5 flex-wrap gap-lg-5 align-items-center mt-2">
                {GENDER_OPTIONS.map((g) => {
                  return (
                    <div key={g}>
                      {" "}
                      <Form.Check
                        label={g}
                        checked={formData.gender === g}
                        value={g}
                        onChange={(e) => handleChange("gender", e.target.value)}
                        type="radio"
                      />
                    </div>
                  );
                })}
              </div>
            </Form.Group>
          </motion.div>
        )}

        {/* brand */}
        {["Electronics", "Fashion", "Shoes", "Sports", "Auto parts"].includes(
          cat,
        ) && (
          <motion.div variants={fadedown} className="my-5 py-3">
            <Form.Group>
              <Form.Label>Brand</Form.Label>
              <Form.Control
                placeholder="e.g. Samsung, Nike, Toyota..."
                value={formData.brand}
                onChange={(e) => handleChange("brand", e.target.value)}
              />
            </Form.Group>
          </motion.div>
        )}

        {/* waranty - shows for Electronics */}
        {cat === "Electronics" && (
          <motion.div variants={fadedown} className="my-5 py-3">
            <h5 className="mb-2 text-white">Warranty included?</h5>

            <div className="d-flex align-items-center  gap-4 gap-sm-5">
              {" "}
              {["Yes", "No"].map((opt) => {
                return (
                  <button
                    type="button"
                    className="px-2 px-sm-3 py-1"
                    key={opt}
                    onClick={() => setWaranty(opt)}
                    style={{
                      flex: 1,
                      borderRadius: 10,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      border: `0.5px solid ${waranty === opt ? "#d1ce16" : "#064206"}`,
                      background: waranty === opt ? "#2b2a05c0" : "#111a11",
                    }}
                  >
                    <p
                      style={{
                        color: waranty === opt ? "#fffb00" : "",
                      }}
                    >
                      {opt}
                    </p>
                  </button>
                );
              })}
            </div>

            {waranty === "Yes" && (
              <Form.Group className="mt-5 py-2">
                <Form.Label>Warranty duration</Form.Label>

                {WARRANTY_DURATIONS.map((wd) => {
                  return (
                    <div key={wd} className="py-1">
                      <Form.Check
                        label={wd}
                        checked={formData.warrantyDuration === wd}
                        value={wd}
                        onChange={(e) =>
                          handleChange("warrantyDuration", e.target.value)
                        }
                        type="radio"
                      />
                    </div>
                  );
                })}
              </Form.Group>
            )}
          </motion.div>
        )}

        {/* origin — shows for Agriculture */}
        {cat === "Agriculture" && (
          <motion.div variants={fadedown} className="my-5 py-5">
            <Form.Group>
              <Form.Label>Product origin (state)</Form.Label>

              <Form.Control
                placeholder="e.g. Benue, Kano, Ogun, Jos"
                value={formData.origin}
                onChange={(e) => handleChange("origin", e.target.value)}
                type="text"
              />
            </Form.Group>

            <div className="mt-4">
              {" "}
              <h5 className="mb-2">Organic product?</h5>
              <div className="d-flex align-items-center  gap-4 gap-sm-5">
                {" "}
                {["Yes", "No"].map((opt) => {
                  return (
                    <button
                      className="px-2 px-sm-3 py-1"
                      key={opt}
                      onClick={() => handleChange("isOrganic", opt === "Yes")}
                      style={{
                        flex: 1,
                        borderRadius: 10,
                        cursor: "pointer",
                        transition: "all 0.15s",
                        border: `0.5px solid ${
                          (formData.isOrganic && opt === "Yes") ||
                          (!formData.isOrganic &&
                            opt === "No" &&
                            formData.isOrganic !== "")
                            ? "#d1ce16"
                            : "#064206"
                        }`,
                        background:
                          formData.isOrganic && opt === "Yes"
                            ? "#3a3906"
                            : "#111a11",
                      }}
                    >
                      <p
                        style={{
                          color:
                            formData.isOrganic && opt === "Yes"
                              ? "#fffb00"
                              : "",
                        }}
                      >
                        {opt}
                      </p>
                    </button>
                  );
                })}
              </div>
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
