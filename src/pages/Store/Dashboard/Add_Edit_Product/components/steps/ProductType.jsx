import { Row, Col, Container } from "react-bootstrap";
import { BsArrowRight, BsBuilding } from "react-icons/bs";
import { FaTruckMoving } from "react-icons/fa";
import { FiAlertTriangle, FiShoppingBag } from "react-icons/fi";
import { fadedown, container } from "../../../../../../animation";
import { motion } from "framer-motion";

import { Check } from "react-bootstrap-icons";

export function ProductType({
  setStep,
  formData,
  handleChange,
  validateStep,
  errors,
}) {
  const next = () => {
    if (!validateStep()) return;

    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <motion.div variants={container} initial="hidden" animate="visible">
        <motion.div variants={fadedown} className="mb-5">
          <h3 className=" fs-1 mb-3 fw-bold">What Are You Listing</h3>

          <h5>
            Choose the type that best describes your listings, as this
            determines your provided informations
          </h5>
        </motion.div>

        <Row className="g-5">
          {[
            {
              Icon: FiShoppingBag,
              a: "Regular Products",
              b: "Physical products for sale, fashion, electronics, agriculture, beauty, food,autoparts, and more...",
              c: "Buyer add to cart and pays immediately",
              value: "REGULAR",
              key: "Regular",
            },
            {
              Icon: FaTruckMoving,
              a: "Vehicle Listing",
              b: "Vehicles for sale, cars, buses, trucks, motorcycles and more...",
              c: "Buyer contacts you directly",
              value: "CAR",
              key: "Vehicle",
            },
            {
              Icon: BsBuilding,
              a: "Property Listing",
              b: "Property for sale or rent, houses, flats, land and more...",
              c: "Buyer schedule a visit",
              value: "REAL_ESTATE",
              key: "Real_Estate",
            },
          ].map((ty) => {
            const isSelected = formData.type === ty.value;
            return (
              <>
                <Col
                  className="col-12 "
                  key={ty.key}
                  onClick={() => handleChange("type", ty.value)}
                >
                  <motion.div
                    variants={fadedown}
                    style={{
                      background: "#0b490eda",
                      cursor: "pointer",
                      borderRadius: 14,
                      border: `${isSelected ? "3px solid #fffb00" : "0.5px solid #fff"}`,
                      transition: "all 0.1s",
                    }}
                  >
                    <div className="p-4 p-sm-5 ">
                      <div className="d-flex align-items-center">
                        <ty.Icon
                          className="me-3 me-sm-4 me-md-5"
                          style={{
                            color:
                              ty.value === "REGULAR"
                                ? "#f3489d"
                                : ty.value === "CAR"
                                  ? "#57c1cf"
                                  : "#c3ff20",
                            fontSize: "clamp(20px,  5vw, 35px)",
                          }}
                        />
                        <h3 className="text-white">{ty.a}</h3>
                        {isSelected && (
                          <div
                            className="ms-auto"
                            style={{
                              background: "#d8d516ab",
                              border: "0.5px solid #fffb00",
                              borderRadius: "50%",
                            }}
                          >
                            <Check size={30} style={{ color: "#fffb00" }} />
                          </div>
                        )}
                      </div>

                      <h6 className="my-4">{ty.b}</h6>

                      <small>{ty.c}</small>
                    </div>
                  </motion.div>
                </Col>
              </>
            );
          })}
        </Row>

        {errors.type && (
          <h6 className="text-danger fw-bold mt-3">{errors.type}</h6>
        )}
      </motion.div>

      <div className="d-flex align-items-center gap-4 text-warning mt-5">
        <FiAlertTriangle size={30} />
        You cannot change product type after publishing. Choose carefully.
      </div>

      <div className="d-flex">
        <button onClick={next} className="px-3 py-2 mt-5 ms-auto next-btn">
          <BsArrowRight style={{ color: "#facc15", fontSize: "35px" }} />
        </button>
      </div>
    </>
  );
}
