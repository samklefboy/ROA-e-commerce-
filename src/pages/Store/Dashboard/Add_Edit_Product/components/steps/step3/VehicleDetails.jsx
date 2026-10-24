import { Form, Row, Col, Stack } from "react-bootstrap";
import { fadedown, container } from "../../../../../../../utils/animation";
import { motion } from "framer-motion";
import { BsArrowLeft, BsArrowRight } from "react-icons/bs";
import { Check } from "react-bootstrap-icons";

const CAR_MAKES = [
  "Toyota",
  "Honda",
  "Lexus",
  "Mercedes-Benz",
  "BMW",
  "Ford",
  "Hyundai",
  "Kia",
  "Nissan",
  "Volkswagen",
  "Audi",
  "Chevrolet",
  "Peugeot",
  "Mitsubishi",
  "Subaru",
  "Mazda",
  "Jeep",
  "Other",
];

const BODY_TYPES = [
  "Sedan",
  "SUV",
  "Hatchback",
  "Pickup truck",
  "Van/Bus",
  "Coupe",
  "Convertible",
  "Wagon",
  "Other",
];

const CAR_FEATURES = [
  "Air conditioning",
  "Leather seats",
  "Sunroof",
  "Reverse camera",
  "Navigation/GPS",
  "Alloy wheels",
  "Bluetooth/Android Auto",
  "Tinted windows",
  "Push start",
  "Keyless entry",
  "Cruise control",
  "Heated seats",
  "360 camera",
  "Lane assist",
];

const CONTACT_METHODS = ["WhatsApp", "Phone call", "r.o.a. chat"];

// generate year options
const YEARS = Array.from({ length: 35 }, (_, i) => String(2026 - i));

export function VehicleDetails({
  setStep,
  formData,
  errors,
  handleBack,
  handleChangeListingMeta,
  validateStep,
}) {
  const meta = formData.listingMeta;

  const toggleFeature = (feature) => {
    const current = meta.features;
    if (current.includes(feature)) {
      handleChangeListingMeta(
        "features",
        current.filter((f) => f !== feature),
      );
    } else {
      handleChangeListingMeta("features", [...current, feature]);
    }
  };

  const toggleContact = (method) => {
    const current = meta.contactMethod;
    if (current.includes(method)) {
      handleChangeListingMeta(
        "contactMethod",
        current.filter((m) => m !== method),
      );
    } else {
      handleChangeListingMeta("contactMethod", [...current, method]);
    }
  };

  const next = () => {
    if (!validateStep()) return;

    setStep(5);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <motion.div variants={container} initial="hidden" animate="visible">
        <motion.div variants={fadedown} className="mb-3">
          <h3 className=" fs-1 mb-3 fw-bold">Vehicle details</h3>
          <h5>
            Provide accurate details so serious buyers can make informed
            decisions.
          </h5>
        </motion.div>

        {/* make */}
        <motion.div variants={fadedown} className="my-5 py-3">
          <Form.Label className="mb-2 text-white">Make (brand) *</Form.Label>
          <Row className="gx-5 mt-3">
            {CAR_MAKES.map((make) => {
              return (
                <Col
                  className=" mb-4 col-6 col-md-4  col-lg-2 "
                  key={make}
                  onClick={() => handleChangeListingMeta("make", make)}
                >
                  <div
                    className="d-flex align-items-center justify-content-center  py-2 "
                    style={{
                      background:
                        meta.make === make ? "#28290256" : "#04300459",
                      border: `0.5px solid ${meta.make === make ? "#d3d604" : "#2ba32b"}`,
                      borderRadius: 10,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      flexWrap: "nowrap",
                    }}
                  >
                    <p
                      className="mx-2"
                      style={{
                        color: meta.make === make ? "#fbff01" : "",
                        fontWeight: meta.make === make ? 600 : 500,
                        lineHeight: 1.4,
                      }}
                    >
                      {make}
                    </p>
                    {meta.make === make && (
                      <Check
                        size={25}
                        style={{ fontSize: 13, color: "#fbff01" }}
                      />
                    )}
                  </div>
                </Col>
              );
            })}
          </Row>
          {errors.make && (
            <h6 className="text-danger mt-2 fw-bold">{errors.make}</h6>
          )}
        </motion.div>

        {/* model */}
        <motion.div variants={fadedown} className="my-5 py-4">
          <Form.Group>
            <Form.Label className="">Model *</Form.Label>
            <Form.Control
              value={meta.model}
              onChange={(e) => handleChangeListingMeta("model", e.target.value)}
              required
              placeholder="e.g. Camry, Civic, RX350, Hilux"
            />

            {errors.model && (
              <h6 className="text-danger fw-bold mt-3">{errors.model}</h6>
            )}
          </Form.Group>
        </motion.div>

        {/* year */}
        <motion.div variants={fadedown}>
          <Form.Group>
            <Form.Label className="">Year *</Form.Label>
            <Form.Select
              value={meta.year}
              onChange={(e) => handleChangeListingMeta("year", e.target.value)}
              required
            >
              <option value="">Select year</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Form.Select>

            {errors.year && (
              <h6 className="text-danger fw-bold mt-3">{errors.year}</h6>
            )}
          </Form.Group>
        </motion.div>

        {/* mileage*/}
        <motion.div variants={fadedown} className="my-5 py-4">
          <Form.Group>
            <Form.Label>Mileage (km) (leave blank if brand new)</Form.Label>
            <Form.Control
              value={meta.mileage}
              onChange={(e) =>
                handleChangeListingMeta("mileage", e.target.value)
              }
              type="number"
              placeholder="e.g. 45000"
            />
          </Form.Group>
        </motion.div>

        {/* transmission */}
        <motion.div variants={fadedown}>
          <Form.Label>Transmission </Form.Label>
          <div className="d-flex gap-4">
            {["Automatic", "Manual"].map((t) => (
              <button
                type="button"
                className="px-2 px-sm-3 py-1"
                key={t}
                onClick={() => handleChangeListingMeta("transmission", t)}
                style={{
                  flex: 1,
                  borderRadius: 10,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  border: `0.5px solid ${meta.transmission === t ? "#d1ce16" : "#064206"}`,
                  background: meta.transmission === t ? "#2b2a0388" : "#111a11",
                }}
              >
                <p
                  style={{
                    color: meta.transmission === t ? "#fffb00" : "",
                  }}
                >
                  {t}
                </p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* fuel type */}
        <motion.div variants={fadedown} className="my-5 py-4">
          <Form.Label className="mb-2 text-white">Fuel type *</Form.Label>
          <div className="d-flex flex-wrap gap-4">
            {["Petrol", "Diesel", "Electric", "Hybrid", "CNG"].map((f) => (
              <button
                type="button"
                className="px-2 px-sm-3 py-1"
                key={f}
                onClick={() => handleChangeListingMeta("fuel", f)}
                style={{
                  borderRadius: 12,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  border: `0.5px solid ${meta.fuel === f ? "#d1ce16" : "#058005"}`,
                  background: meta.fuel === f ? "#2e2d0488" : "transparent",
                }}
              >
                <p
                  style={{
                    color: meta.fuel === f ? "#fffb00" : "",
                  }}
                >
                  {f}
                </p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* colour */}
        <motion.div variants={fadedown}>
          <Form.Group>
            <Form.Label className="">Colour</Form.Label>
            <Form.Control
              value={meta.color}
              onChange={(e) => handleChangeListingMeta("color", e.target.value)}
              placeholder="e.g. Black, White, Silver, Red"
            />
          </Form.Group>
        </motion.div>

        {/* body type */}
        <motion.div variants={fadedown} className="my-5 py-4">
          <Form.Label className="mb-2 text-white">Body type </Form.Label>
          <div className="d-flex flex-wrap gap-4">
            {BODY_TYPES.map((b) => (
              <button
                type="button"
                className="px-3 py-1"
                key={b}
                onClick={() => handleChangeListingMeta("fuel", b)}
                style={{
                  borderRadius: 12,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  border: `0.5px solid ${meta.fuel === b ? "#d1ce16" : "#0aa10a"}`,
                  background: meta.fuel === b ? "#252503a2" : "transparent",
                }}
              >
                <p
                  style={{
                    color: meta.fuel === b ? "#fffb00" : "",
                  }}
                >
                  {b}
                </p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* additional features */}
        <motion.div variants={fadedown} className="my-5 py-3">
          <Form.Label>Additional features (select all that apply)</Form.Label>

          <Row className="g-4 g-sm-5 mt-1">
            {CAR_FEATURES.map((feature) => {
              const checked = meta.features.includes(feature);
              return (
                <Col
                  className="col-12 col-sm-6 col-md-4 col-lg-3 "
                  key={feature}
                  onClick={() => toggleFeature(feature)}
                >
                  <div
                    className="d-flex align-items-center justify-content-center gap-2 gap-md-3  py-2"
                    style={{
                      background: checked ? "#53580331" : "#0424049d",
                      border: `0.5px solid ${checked ? "#fffb00c7" : "#09c009"}`,
                      borderRadius: 10,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {checked && (
                      <div
                        className="d-flex align-items-center justify-content-center"
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: "50%",
                          flexShrink: 0,
                          color: checked ? "#fffb00" : "",
                        }}
                      >
                        <Check size={30} />
                      </div>
                    )}

                    <p
                      className="mx-3"
                      style={{ color: checked ? "#fffb00" : "" }}
                    >
                      {feature}
                    </p>
                  </div>
                </Col>
              );
            })}
          </Row>
        </motion.div>

        {/* location */}
        <motion.div variants={fadedown}>
          <Form.Group>
            <Form.Label className="">Location *</Form.Label>
            <Form.Control
              value={meta.location}
              onChange={(e) =>
                handleChangeListingMeta("location", e.target.value)
              }
              required
              placeholder="e.g. Lagos Island, Lagos"
            />
          </Form.Group>
        </motion.div>

        {/* negotiable */}
        <motion.div variants={fadedown} className="my-5 py-3">
          <Stack
            direction="horizontal"
            className="d-flex align-items-center justify-content- between"
          >
            <Form.Label>Is price negotiable</Form.Label>
            <Form.Check
              className="ms-auto form-switch"
              checked={meta.negotiable}
              onChange={() =>
                handleChangeListingMeta("negotiable", !meta.negotiable)
              }
              type="switch"
            />
          </Stack>
        </motion.div>

        {/* preffered contact method */}
        <motion.div variants={fadedown}>
          <Form.Group>
            <Form.Label className="">How should buyers contact you?</Form.Label>

            {CONTACT_METHODS.map((method) => {
              return (
                <Form.Check
                  className="py-1"
                  key={method}
                  label={method}
                  checked={meta.contactMethod.includes(method)}
                  value={method}
                  onChange={(e) => toggleContact(e.target.value)}
                  type="checkbox"
                />
              );
            })}
          </Form.Group>
        </motion.div>
      </motion.div>

      <div className="d-flex align-items-center justify-content-between my-5">
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
