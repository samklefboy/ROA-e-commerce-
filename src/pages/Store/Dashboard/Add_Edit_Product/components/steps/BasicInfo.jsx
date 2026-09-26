import { Form, Row, Col } from "react-bootstrap";
import { useState } from "react";
import {
  BsArrowLeft,
  BsArrowRight,
  BsLightbulbFill,
  BsSortDown,
  BsX,
} from "react-icons/bs";
import { Check } from "react-bootstrap-icons";
import { fadedown, container } from "../../../../../../animation";
import { motion } from "framer-motion";

const CONDITIONS = {
  REGULAR: ["Brand new", "Fairly used", "Refurbished"],
  CAR: ["Brand new", "Foreign used (Tokunbo)", "Nigerian used", "Fairly used"],
  REAL_ESTATE: ["New build", "Old build", "Renovated"],
};

export function BasicInfo({
  setStep,
  formData,
  handleChange,
  errors,
  handleBack,
  validateStep,
}) {
  const next = () => {
    if (!validateStep()) return;

    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const [keywordInput, setKeywordInput] = useState("");

  const conditions = CONDITIONS[formData.type] || CONDITIONS.REGULAR;

  // add keyword on Enter or comma
  const handleKeywordKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addKeyword();
    }
  };

  const addKeyword = () => {
    const trimmed = keywordInput.trim().replace(",", "");
    if (!trimmed) return;
    if (formData.keywords.includes(trimmed)) {
      setKeywordInput("");
      return;
    }
    if (formData.keywords.length >= 10) return;
    handleChange("keywords", [...formData.keywords, trimmed]);
    setKeywordInput("");
  };

  const removeKeyword = (kw) => {
    handleChange(
      "keywords",
      formData.keywords.filter((k) => k !== kw),
    );
  };

  return (
    <>
      <motion.div variants={container} initial="hidden" animate="visible">
        <motion.div variants={fadedown} className="mb-5">
          {/* heading */}
          <h3 className=" fs-1 mb-3 fw-bold">Basic Information</h3>
          <h5> Tell buyers what you are selling. Be clear and specific.</h5>
        </motion.div>

        {/* title */}
        <motion.div variants={fadedown}>
          <Form.Group>
            <Form.Label className="">Product Title *</Form.Label>
            <Form.Control
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              maxLength={100}
              type="text"
              required
              placeholder={
                formData.type === "CAR"
                  ? "e.g. 2019 Toyota Camry LE Sedan — Black"
                  : formData.type === "REAL_ESTATE"
                    ? "e.g. 3 Bedroom Furnished Flat — Lekki Phase 1"
                    : "e.g. Nike Air Max 270 — Men's Size 42"
              }
            />

            <p className="mt-3">{formData.name.length}/150 characters</p>

            <div
              className="p-4 mt-3 d-inline-block"
              style={{ background: "#0f0f0fd2" }}
            >
              <p>
                <BsLightbulbFill className="me-4 me-sm-5" color="yellow" /> Tips
                for a great title
              </p>

              <div>
                {formData.type === "CAR"
                  ? [
                      {
                        key: "Vehicle",
                        a: "Include year, brand, model and condition.",
                        b: "2019 Toyota Camry LE — Foreign Used, Black, Lagos",
                      },
                    ]
                  : formData.type === "Real_Estate"
                    ? [
                        {
                          key: "Real_estate",
                          a: "Include bedrooms, property type and location.",
                          b: " 3 Bedroom Duplex For Rent — Lekki Phase 1, Lagos",
                        },
                      ]
                    : [
                        {
                          key: "Regular",
                          a: "Include brand, product name and key feature.",
                          b: "Nike Air Max 270 — Men's Running Shoes, Black, Size 42",
                        },
                      ].map((tips) => {
                        return (
                          <div key={tips.key} className="my-2">
                            <BsArrowRight className="me-2" /> {tips.a}
                            <p>
                              <Check color="green" /> {tips.b}
                            </p>
                          </div>
                        );
                      })}
              </div>
            </div>

            {errors.name && (
              <h6 className="text-danger fw-bold mt-3">{errors.name}</h6>
            )}
          </Form.Group>
        </motion.div>

        {/* description */}
        <motion.div variants={fadedown} className=" my-5 py-5">
          <Form.Group>
            <Form.Label>Description *</Form.Label>

            <Form.Control
              as="textarea"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              maxLength={2000}
              rows={6}
              required
            />

            <p className="my-3">
              {formData.description.length}/2000 characters
            </p>

            {/* description tips */}
            <div
              className="p-4  d-inline-block"
              style={{ background: "#0f0f0fd2" }}
            >
              <p>
                <BsLightbulbFill className="me-4 me-sm-5" color="yellow" />{" "}
                Included in your description:
              </p>

              <Row className=" mt-2">
                {(formData.type === "CAR"
                  ? [
                      "Vehicle history",
                      "Service records",
                      "Known issues",
                      "Why selling",
                      "Import year",
                      "Current location",
                    ]
                  : formData.type === "Real_Estate"
                    ? [
                        "What is included",
                        "Estate details",
                        "Nearby landmarks",
                        "Transportation access",
                        "Agency fee info",
                        "Landlord terms",
                      ]
                    : [
                        "Key features",
                        "Dimensions/size",
                        "Materials used",
                        "Package contents",
                        "Care instructions",
                        "Warranty info",
                      ]
                ).map((tips) => {
                  return (
                    <Col key={tips} className="col-auto">
                      {" "}
                      <div className="d-flex align-items-center gap-3">
                        <p>
                          {" "}
                          <Check color="green" />{" "}
                        </p>
                        <p>{tips}</p>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </div>

            {errors.description && (
              <h6 className="text-danger fw-bold mt-3">{errors.description}</h6>
            )}
          </Form.Group>
        </motion.div>

        {/* condition */}
        <motion.div variants={fadedown}>
          <Form.Group>
            <Form.Label>Condition *</Form.Label>

            {conditions.map((c) => {
              return (
                <div key={c} className="py-2 " style={{ cursor: "pointer" }}>
                  <Form.Check
                    type="radio"
                    label={c}
                    value={c}
                    checked={formData.condition === c}
                    onChange={(e) => handleChange("condition", e.target.value)}
                    required
                    isInvalid={!!errors.condition}
                  />
                </div>
              );
            })}

            {errors.condition && (
              <h6 className="text-danger fw-bold mt-2">{errors.condition}</h6>
            )}
          </Form.Group>
        </motion.div>

        {/* keywords */}
        <motion.div variants={fadedown} className="my-5 py-5">
          <Form.Group>
            <Form.Label>
              Keywords / Tags <span>(optional · max 10)</span>{" "}
            </Form.Label>

            <div className="d-flex align-items-center gap-3">
              <Form.Control
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                type="text"
                placeholder="Type a keyword and press Enter"
                onKeyDown={handleKeywordKeyDown}
                isInvalid={!!errors.keywords}
              />
              <button
                className="px-3 py-1"
                onClick={addKeyword}
                disabled={
                  !keywordInput.trim() || formData.keywords.length >= 10
                }
                style={{
                  background: "none",
                  border: "0.5px solid #c1d31d",
                  borderRadius: 10,
                  color: "#fbff00",
                  cursor: "pointer",
                  opacity:
                    !keywordInput.trim() || formData.keywords.length >= 10
                      ? 0.4
                      : 1,
                }}
              >
                Add
              </button>
            </div>

            <Form.Control.Feedback
              className="text-danger d-block mt-2"
              type="Invalid"
            >
              {errors.keywords}
            </Form.Control.Feedback>

            {/* tags */}
            {formData.keywords.length > 0 && (
              <div className="d-flex align-items-center gap-4 my-3 flex-wrap">
                {formData.keywords.map((kw) => {
                  return (
                    <div
                      key={kw}
                      className="d-flex align-items-center gap-3 px-2 py-1"
                      style={{
                        border: "0.5px solid #14bb5a",
                        borderRadius: 8,
                      }}
                    >
                      <div>{kw}</div>

                      <p
                        className="fs-3 "
                        onClick={() => removeKeyword(kw)}
                        style={{ cursor: "pointer", opacity: 0.5 }}
                      >
                        x
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            <p>
              {formData.keywords.length}/10 keywords · Helps buyers find your
              listing through search
            </p>
          </Form.Group>
        </motion.div>
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
