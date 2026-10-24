import { Form, Row, Col } from "react-bootstrap";
import { useState } from "react";
import { BsArrowLeft, BsArrowRight, BsLightbulbFill } from "react-icons/bs";
import { Check } from "react-bootstrap-icons";
import { fadedown, container } from "../../../../../../utils/animation";
import { motion } from "framer-motion";

const CONDITIONS = {
  REGULAR: ["Brand new", "Fairly used", "Refurbished"],
  CAR: ["Brand new", "Foreign used (Tokunbo)", "Nigerian used", "Fairly used"],
  REAL_ESTATE: ["New build", "Old build", "Renovated"],
};

const DESCRIPTION_TIPS = {
  REGULAR: [
    "Key features",
    "Dimensions / size",
    "Materials used",
    "Package contents",
    "Care instructions",
    "Warranty information",
  ],
  CAR: [
    "Vehicle history",
    "Service records",
    "Known issues",
    "Reason for selling",
    "Import year",
    "Current location",
  ],
  REAL_ESTATE: [
    "What is included",
    "Estate details",
    "Nearby landmarks",
    "Transportation access",
    "Agency fee information",
    "Landlord terms",
  ],
};

const TITLE_TIPS = {
  REGULAR: {
    description: "Include the brand, product name and a key feature.",
    example: "Nike Air Max 270 — Running Shoes, Black, Size 42",
  },
  CAR: {
    description: "Include the year, make, model and condition.",
    example: "2019 Toyota Camry LE — Foreign Used, Black, Lagos",
  },
  REAL_ESTATE: {
    description: "Include the bedrooms, property type and location.",
    example: "3 Bedroom Duplex for Rent — Lekki Phase 1, Lagos",
  },
};

export function BasicInfo({
  setStep,
  formData,
  handleChange,
  errors = {},
  handleBack,
  validateStep,
}) {
  const [keywordInput, setKeywordInput] = useState("");

  const keywords = Array.isArray(formData.keywords) ? formData.keywords : [];

  const type = CONDITIONS[formData.type] ? formData.type : "REGULAR";
  const conditions = CONDITIONS[type];
  const titleTips = TITLE_TIPS[type];
  const descriptionTips = DESCRIPTION_TIPS[type];

  const next = () => {
    if (!validateStep()) return;

    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const addKeyword = () => {
    const keyword = keywordInput.trim().replace(/,+$/, "").trim();

    if (!keyword) return;

    const duplicate = keywords.some(
      (item) => item.toLowerCase() === keyword.toLowerCase(),
    );

    if (duplicate) {
      setKeywordInput("");
      return;
    }

    if (keywords.length >= 10) return;

    handleChange("keywords", [...keywords, keyword]);
    setKeywordInput("");
  };

  const handleKeywordKeyDown = (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addKeyword();
    }
  };

  const removeKeyword = (keywordToRemove) => {
    handleChange(
      "keywords",
      keywords.filter((keyword) => keyword !== keywordToRemove),
    );
  };

  return (
    <>
      <motion.div variants={container} initial="hidden" animate="visible">
        <motion.div variants={fadedown} className="mb-5">
          <h3 className="fs-1 mb-3 fw-bold">Basic Information</h3>
          <h5>Tell buyers what you are selling. Be clear and specific.</h5>
        </motion.div>

        {/* Product title */}
        <motion.div variants={fadedown}>
          <Form.Group controlId="productTitle">
            <Form.Label>Product Title *</Form.Label>

            <Form.Control
              type="text"
              value={formData.name ?? ""}
              onChange={(event) => handleChange("name", event.target.value)}
              maxLength={100}
              required
              isInvalid={Boolean(errors.name)}
              placeholder={
                type === "CAR"
                  ? "e.g. 2019 Toyota Camry LE Sedan — Black"
                  : type === "REAL_ESTATE"
                    ? "e.g. 3 Bedroom Furnished Flat — Lekki Phase 1"
                    : "e.g. Nike Air Max 270 — Men's Size 42"
              }
            />

            <div className="mt-2 text-end">
              <small>{(formData.name ?? "").length}/100 characters</small>
            </div>

            <div
              className="p-4 mt-3 d-inline-block rounded"
              style={{ background: "#0f0f0fd2" }}
            >
              <p className="fw-semibold">
                <BsLightbulbFill className="me-3" color="yellow" />
                Tips for a great title
              </p>

              <div className="my-2">
                <p>
                  <BsArrowRight className="me-2" />
                  {titleTips.description}
                </p>

                <p className="mb-0">
                  <Check color="green" className="me-2" />
                  {titleTips.example}
                </p>
              </div>
            </div>

            {errors.name && (
              <div className="text-danger fw-bold mt-3" role="alert">
                {errors.name}
              </div>
            )}
          </Form.Group>
        </motion.div>

        {/* Description */}
        <motion.div variants={fadedown} className="my-5 py-3">
          <Form.Group controlId="productDescription">
            <Form.Label>Description *</Form.Label>

            <Form.Control
              as="textarea"
              value={formData.description ?? ""}
              onChange={(event) =>
                handleChange("description", event.target.value)
              }
              maxLength={2000}
              rows={6}
              required
              isInvalid={Boolean(errors.description)}
              placeholder="Describe the item, its features, condition and any important details buyers should know."
            />

            <div className="my-2 text-end">
              <small>
                {(formData.description ?? "").length}/2000 characters
              </small>
            </div>

            <div className="p-4 rounded" style={{ background: "#0f0f0fd2" }}>
              <p className="fw-semibold">
                <BsLightbulbFill className="me-3" color="yellow" />
                Include these details in your description
              </p>

              <Row className="mt-3 g-2">
                {descriptionTips.map((tip) => (
                  <Col key={tip} xs={12} sm={6} lg={4}>
                    <div className="d-flex align-items-start gap-2">
                      <Check color="green" className="mt-1 flex-shrink-0" />
                      <span>{tip}</span>
                    </div>
                  </Col>
                ))}
              </Row>
            </div>

            {errors.description && (
              <div className="text-danger fw-bold mt-3" role="alert">
                {errors.description}
              </div>
            )}
          </Form.Group>
        </motion.div>

        {/* Condition */}
        <motion.div variants={fadedown}>
          <Form.Group>
            <Form.Label>Condition *</Form.Label>

            {conditions.map((condition) => (
              <Form.Check
                key={condition}
                type="radio"
                name="productCondition"
                id={`condition-${condition
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")}`}
                className="py-2"
                label={condition}
                value={condition}
                checked={formData.condition === condition}
                onChange={() => handleChange("condition", condition)}
                isInvalid={Boolean(errors.condition)}
              />
            ))}

            {errors.condition && (
              <div className="text-danger fw-bold mt-2" role="alert">
                {errors.condition}
              </div>
            )}

            {type === "CAR" && (
              <small className="d-block mt-2 text-secondary">
                Select the vehicle's usage condition. Keep details such as
                import history and registration status in the listing
                description or vehicle details.
              </small>
            )}

            {type === "REAL_ESTATE" && (
              <small className="d-block mt-2 text-secondary">
                Describe the property's building condition accurately in the
                description as well.
              </small>
            )}
          </Form.Group>
        </motion.div>

        {/* Keywords */}
        <motion.div variants={fadedown} className="my-5 py-3">
          <Form.Group controlId="productKeywords">
            <Form.Label>
              Keywords / Tags <span>(optional · max 10)</span>
            </Form.Label>

            <div className="d-flex align-items-start gap-3">
              <div className="flex-grow-1">
                <Form.Control
                  value={keywordInput}
                  onChange={(event) => setKeywordInput(event.target.value)}
                  onKeyDown={handleKeywordKeyDown}
                  type="text"
                  maxLength={40}
                  placeholder="Type a keyword and press Enter"
                  isInvalid={Boolean(errors.keywords)}
                />
              </div>

              <button
                type="button"
                onClick={addKeyword}
                disabled={!keywordInput.trim() || keywords.length >= 10}
                className="px-3 py-2"
                style={{
                  background: "none",
                  border: "0.5px solid #c1d31d",
                  borderRadius: 10,
                  color: "#fbff00",
                  cursor: "pointer",
                  opacity:
                    !keywordInput.trim() || keywords.length >= 10 ? 0.4 : 1,
                }}
              >
                Add
              </button>
            </div>

            {errors.keywords && (
              <div className="text-danger mt-2" role="alert">
                {errors.keywords}
              </div>
            )}

            {keywords.length > 0 && (
              <div className="d-flex align-items-center gap-3 my-3 flex-wrap">
                {keywords.map((keyword) => (
                  <div
                    key={keyword}
                    className="d-flex align-items-center gap-2 px-3 py-1"
                    style={{
                      border: "0.5px solid #14bb5a",
                      borderRadius: 8,
                    }}
                  >
                    <span>{keyword}</span>

                    <button
                      type="button"
                      aria-label={`Remove ${keyword}`}
                      onClick={() => removeKeyword(keyword)}
                      className="border-0 bg-transparent"
                      style={{
                        color: "inherit",
                        cursor: "pointer",
                        fontSize: 18,
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <small>
              {keywords.length}/10 keywords · Helps buyers find your listing
              through search
            </small>
          </Form.Group>
        </motion.div>
      </motion.div>

      <div className="d-flex align-items-center justify-content-between">
        <button
          type="button"
          onClick={handleBack}
          className="px-3 py-2 next-btn"
          aria-label="Go back"
        >
          <BsArrowLeft style={{ color: "#facc15", fontSize: 35 }} />
        </button>

        <button
          type="button"
          onClick={next}
          className="px-3 py-2 next-btn"
          aria-label="Continue to the next step"
        >
          <BsArrowRight style={{ color: "#facc15", fontSize: 35 }} />
        </button>
      </div>
    </>
  );
}
