import { Form, Row, Col, Stack } from "react-bootstrap";
import { fadedown, container } from "../../../../../../../utils/animation";
import { motion } from "framer-motion";
import { BsArrowLeft, BsArrowRight } from "react-icons/bs";
import { Check } from "react-bootstrap-icons";
import { FiMinus, FiPlus } from "react-icons/fi";

const LISTING_TYPES = ["For rent", "For sale", "Short let"];
const PROPERTY_TYPES = [
  "Flat / Apartment",
  "Duplex",
  "Bungalow",
  "Terraced house",
  "Semi-detached",
  "Fully detached",
  "Land",
  "Commercial property",
  "Office space",
  "Warehouse",
];
const BEDROOM_OPTIONS = [
  "Self contain",
  "1 bedroom",
  "2 bedrooms",
  "3 bedrooms",
  "4 bedrooms",
  "5+ bedrooms",
];
const FLOOR_OPTIONS = [
  "Ground floor",
  "1st floor",
  "2nd floor",
  "3rd floor",
  "4th floor+",
  "Penthouse",
];
const FURNISHED_OPTIONS = ["Fully furnished", "Semi furnished", "Unfurnished"];
const AMENITIES = [
  "24hr security",
  "Generator",
  "Borehole water",
  "Estate",
  "Swimming pool",
  "Gym",
  "Boys quarters",
  "CCTV",
  "Solar power",
  "Elevator",
  "Air conditioning",
  "Parking space",
  "Fence & gate",
  "Garden",
  "Intercom",
  "Backup power",
  "Water heater",
  "Satellite dish",
];
const AGENCY_FEE_OPTIONS = ["Included in price", "Not included", "Negotiable"];
const CAUTION_FEE_OPTIONS = ["Required", "Not required", "Negotiable"];

export function RealEstateDetails({
  setStep,
  formData,
  errors,
  handleBack,
  handleChangeListingMeta,
  validateStep,
}) {
  const meta = formData.listingMeta;

  const toggleAmenity = (amenity) => {
    const current = meta.amenities;
    if (current.includes(amenity)) {
      handleChangeListingMeta(
        "amenities",
        current.filter((a) => a !== amenity),
      );
    } else {
      handleChangeListingMeta("amenities", [...current, amenity]);
    }
  };

  const isLand = meta.propertyType === "Land";

  const isCommercial = [
    "Commercial property",
    "Office space",
    "Warehouse",
  ].includes(meta.propertyType);

  const isForRent = meta.listingType === "For rent";

  const next = () => {
    if (!validateStep()) return;

    setStep(5);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <motion.div variants={container} initial="hidden" animate="visible">
        <motion.div variants={fadedown} className="">
          <h3 className=" fs-1 mb-3 fw-bold">Property details</h3>
          <h5>
            Accurate details attract serious buyers and reduce back-and-forth
            enquiries.
          </h5>
        </motion.div>

        {/* listing type */}
        <motion.div variants={fadedown} className="my-5 py-3">
          <Form.Label className="mb-2">Listing type *</Form.Label>

          <div className="d-flex align-items-center  gap-4 gap-sm-5  mt-3">
            {" "}
            {LISTING_TYPES.map((ty) => {
              return (
                <button
                  type="button"
                  className="px-2 px-sm-3 py-1"
                  key={ty}
                  onClick={() => handleChangeListingMeta("listingType", ty)}
                  style={{
                    flex: 1,
                    borderRadius: 10,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    border: `0.5px solid ${meta.listingType === ty ? "#d1ce16" : "#064206"}`,
                    background: meta.listingType === ty ? "#252503" : "#0b110b",
                  }}
                >
                  <p
                    style={{
                      color: meta.listingType === ty ? "#fffb00" : "",
                    }}
                  >
                    {ty}
                  </p>
                </button>
              );
            })}
          </div>

          {errors.listingType && (
            <h6 className="text-danger fw-bold mt-3">{errors.listingType}</h6>
          )}
        </motion.div>

        {/* property type */}
        <motion.div variants={fadedown} className="my-5 py-4">
          <Form.Label className="mb-2">Property type *</Form.Label>

          <Row className="g-3 g-md-5 mt-2">
            {" "}
            {PROPERTY_TYPES.map((ty) => {
              return (
                <Col key={ty} className="col-6 text-center">
                  {" "}
                  <div
                    className="px-3 py-1 py-md-2  d-flex align-items-center justify-content-between"
                    onClick={() => handleChangeListingMeta("propertyType", ty)}
                    style={{
                      flex: 1,
                      borderRadius: 10,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      border: `0.5px solid ${meta.propertyType === ty ? "#d1ce16d2" : "#064206"}`,
                      background:
                        meta.propertyType === ty ? "#1f1e02" : "#030803b7",
                    }}
                  >
                    <p
                      style={{
                        color: meta.propertyType === ty ? "#ece803" : "",
                      }}
                    >
                      {ty}
                    </p>
                    {meta.propertyType === ty && (
                      <Check size={15} style={{ color: "#d1ce16" }} />
                    )}
                  </div>
                </Col>
              );
            })}
          </Row>

          {errors.propertyType && (
            <h6 className="text-danger fw-bold mt-3">{errors.propertyType}</h6>
          )}
        </motion.div>

        {/*  bedrooms — hide for land and commercial  */}
        {!isLand && !isCommercial && (
          <motion.div variants={fadedown} className="my-5 py-3">
            <Form.Label className="mb-2">Bedrooms</Form.Label>

            <div className="d-inline-flex align-items-center gap-4 gap-sm-5 flex-wrap mt-2">
              {" "}
              {BEDROOM_OPTIONS.map((b) => {
                return (
                  <button
                    type="button"
                    className="px-2 px-sm-3 py-1"
                    key={b}
                    onClick={() => handleChangeListingMeta("bedrooms", b)}
                    style={{
                      flex: 1,
                      borderRadius: 10,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      border: `0.5px solid ${meta.bedrooms === b ? "#d1ce16" : "#064206"}`,
                      background: meta.bedrooms === b ? "#3a3906" : "#111a11",
                    }}
                  >
                    <p
                      style={{
                        color: meta.bedrooms === b ? "#fffb00" : "",
                        textWrap: "nowrap",
                      }}
                    >
                      {b}
                    </p>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* bathrooms and toilet — hide for land */}
        {!isLand && (
          <motion.div variants={fadedown} className="my-5 py-4">
            <Row className="g-5">
              {/* Bathrooms stepper */}
              <Col className="col-12 col-sm-6">
                <Form.Label>Bathrooms</Form.Label>

                <div className="d-flex align-items-center gap-5 mt-3">
                  <button
                    type="button"
                    className="d-flex align-items-center justify-content-center stepperBtnStyle  px-3 py-2"
                    onClick={() =>
                      handleChangeListingMeta(
                        "bathrooms",
                        Math.max(1, meta.bathrooms - 1),
                      )
                    }
                    style={{
                      cursor: "pointer",
                    }}
                  >
                    <FiMinus size={20} style={{ color: "#fffb00" }} />
                  </button>
                  <p className="fs-3"> {String(meta.bathrooms)} </p>
                  <button
                    type="button"
                    className="d-flex align-items-center justify-content-center stepperBtnStyle px-3 py-2"
                    onClick={() =>
                      handleChangeListingMeta("bathrooms", meta.bathrooms + 1)
                    }
                  >
                    <FiPlus size={20} style={{ color: "#fffb00" }} />
                  </button>
                </div>
              </Col>

              {/* toilets stepper */}
              <Col className="col-12 col-sm-6">
                <Form.Label>Toilets</Form.Label>

                <div className="d-flex align-items-center gap-5 mt-3">
                  <button
                    type="button"
                    className="d-flex align-items-center justify-content-center stepperBtnStyle  px-3 py-2"
                    onClick={() =>
                      handleChangeListingMeta(
                        "toilets",
                        Math.max(1, meta.toilets - 1),
                      )
                    }
                    style={{
                      cursor: "pointer",
                    }}
                  >
                    <FiMinus size={20} style={{ color: "#fffb00" }} />
                  </button>
                  <p className="fs-3"> {String(meta.toilets)}</p>
                  <button
                    type="button"
                    className="d-flex align-items-center justify-content-center stepperBtnStyle px-3 py-2"
                    onClick={() =>
                      handleChangeListingMeta("toilets", meta.toilets + 1)
                    }
                  >
                    <FiPlus size={20} style={{ color: "#fffb00" }} />
                  </button>
                </div>
              </Col>
            </Row>
          </motion.div>
        )}

        {/* furnished — hide for land and commercial */}
        <motion.div variants={fadedown} className="my-5 py-4">
          <Form.Label>Furnished status</Form.Label>

          <div className="d-inline-flex align-items-center  gap-4  flex-wrap">
            {" "}
            {FURNISHED_OPTIONS.map((f) => {
              return (
                <button
                  type="button"
                  className="px-3 px-sm-4 py-1 "
                  key={f}
                  onClick={() => handleChangeListingMeta("furnished", f)}
                  style={{
                    borderRadius: 10,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    border: `0.5px solid ${meta.furnished === f ? "#d1ce16" : "#026102"}`,
                    background:
                      meta.furnished === f ? "#3130037e" : "#111a119c",
                  }}
                >
                  <p
                    style={{
                      color: meta.furnished === f ? "#fffb00" : "",
                      textWrap: "nowrap",
                    }}
                  >
                    {f}
                  </p>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Floor — for apartmentsfuel type */}
        {meta.propertyType === "Flat / Apartment" && (
          <motion.div variants={fadedown} className="my-5 py-4">
            <Form.Label>Floor</Form.Label>
            <div className="d-flex align-items-center  gap-4 gap-sm-5 flex-wrap">
              {" "}
              {FLOOR_OPTIONS.map((f) => {
                return (
                  <button
                    type="button"
                    className="px-3 px-sm-4 py-1"
                    key={f}
                    onClick={() => handleChangeListingMeta("floor", f)}
                    style={{
                      flex: 1,
                      borderRadius: 10,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      border: `0.5px solid ${meta.floor === f ? "#d1ce0b" : "#064206"}`,
                      background: meta.floor === f ? "#161602" : "#041104c4",
                    }}
                  >
                    <p
                      style={{
                        color: meta.floor === f ? "#fffb00" : "",
                        textWrap: "nowrap",
                      }}
                    >
                      {f}
                    </p>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* size */}
        <motion.div variants={fadedown}>
          <Form.Group>
            <Form.Label> Property size (optional)</Form.Label>
            <div className="d-flex align-items-center gap-4">
              {" "}
              <Form.Control
                type="number"
                placeholder="e.g. 120"
                value={meta.sizeInSqm}
                onChange={(e) =>
                  handleChangeListingMeta("sizeInSqm", e.target.value)
                }
              />
              <p style={{ flexShrink: 0 }}>sqm</p>
            </div>
          </Form.Group>
        </motion.div>

        {/* amenities*/}
        <motion.div variants={fadedown} className="my-5 py-4">
          <Form.Group>
            <Form.Label> Amenities (select all that apply)</Form.Label>

            <Row className="g-3 g-sm-4 g-md-5">
              {AMENITIES.map((amenity) => {
                return (
                  <Col
                    key={amenity}
                    className=" col-12 col-sm-6 col-md-4 col-lg-3"
                  >
                    {" "}
                    <Form.Check
                      label={amenity}
                      checked={meta.amenities.includes(amenity)}
                      value={amenity}
                      onChange={(e) => toggleAmenity(e.target.value)}
                      type="checkbox"
                    />
                  </Col>
                );
              })}
            </Row>
          </Form.Group>
        </motion.div>

        {/*address */}
        <motion.div variants={fadedown} className="my-5 py-4">
          <Form.Group>
            <Form.Label>Full address *</Form.Label>

            <Form.Control
              required
              placeholder="e.g. 15 Ifelodun str, Ijagemo road, Ijegun, Lagos."
              value={meta.address}
              onChange={(e) =>
                handleChangeListingMeta("address", e.target.value)
              }
              rows={3}
              type="textArea"
            />

            {errors.address && (
              <h6 className="text-danger fw-bold my-3">{errors.address}</h6>
            )}

            {/* Hide exact address toggle */}
            <Stack
              direction="horizontal"
              className="d-flex align-items-center justify-content- between "
            >
              <div className="mt-4">
                <h5>Hide exact address</h5>
                <p>Buyers will only see the area — not the full address</p>
              </div>
              <Form.Check
                className="ms-auto"
                checked={meta.hideExactAddress}
                onChange={() =>
                  handleChangeListingMeta(
                    "hideExactAddress",
                    !meta.hideExactAddress,
                  )
                }
                type="switch"
              />
            </Stack>
          </Form.Group>
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
        <motion.div variants={fadedown} className="my-5 py-4">
          <Stack direction="horizontal" className="d-flex align-items-center">
            <Form.Label>Is price negotiable</Form.Label>
            <Form.Check
              className="ms-auto"
              checked={meta.negotiable}
              onChange={() =>
                handleChangeListingMeta("negotiable", !meta.negotiable)
              }
              type="switch"
            />
          </Stack>
        </motion.div>

        {/* agency fee — for rent only */}
        {isForRent && (
          <motion.div variants={fadedown} className="my-5 py-4">
            <Form.Label>Agency fee</Form.Label>
            <div className="d-flex align-items-center gap-4 gap-sm-5 flex-wrap">
              {" "}
              {AGENCY_FEE_OPTIONS.map((opt) => {
                return (
                  <button
                    type="button"
                    className="px-3 px-sm-4 py-1"
                    key={opt}
                    onClick={() => handleChangeListingMeta("agencyFee", opt)}
                    style={{
                      borderRadius: 10,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      border: `0.5px solid ${meta.agencyFee === opt ? "#d1ce16" : "#064206"}`,
                      background:
                        meta.agencyFee === opt ? "#3a3906" : "#111a11",
                    }}
                  >
                    <p
                      style={{
                        color: meta.agencyFee === opt ? "#fffb00" : "",
                        textWrap: "nowrap",
                      }}
                    >
                      {opt}
                    </p>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* caution — for rent only */}
        {isForRent && (
          <motion.div variants={fadedown} className="my-5 py-4">
            <Form.Label>Caution fee</Form.Label>
            <div className="d-flex align-items-center  gap-4 gap-sm-5 flex-wrap">
              {" "}
              {CAUTION_FEE_OPTIONS.map((c) => {
                return (
                  <button
                    type="button"
                    className="px-3 px-sm-4 py-1"
                    key={c}
                    onClick={() => handleChangeListingMeta("cautionFee", c)}
                    style={{
                      borderRadius: 10,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      border: `0.5px solid ${meta.cautionFee === c ? "#d1ce16" : "#064206"}`,
                      background: meta.cautionFee === c ? "#3a3906" : "#111a11",
                    }}
                  >
                    <p
                      style={{
                        color: meta.cautionFee === c ? "#fffb00" : "",
                        textWrap: "nowrap",
                      }}
                    >
                      {c}
                    </p>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </motion.div>

      <div className="d-flex align-items-center justify-content-between my-5 py-5">
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
