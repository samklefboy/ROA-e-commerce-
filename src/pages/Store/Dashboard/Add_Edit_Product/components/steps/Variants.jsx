import { Form, Row, Col, Stack } from "react-bootstrap";
import { useState, useMemo } from "react";
import { BsArrowLeft, BsArrowRight, BsInfoCircle } from "react-icons/bs";
import { Check } from "react-bootstrap-icons";
import { fadedown, container } from "../../../../../../utils/animation";
import { motion } from "framer-motion";
import { FiAlertTriangle } from "react-icons/fi";

// preset values per option name
const PRESET_VALUES = {
  Sizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
  Colours: [
    "Black",
    "White",
    "Red",
    "Blue",
    "Green",
    "Yellow",
    "Grey",
    "Brown",
    "Pink",
    "Navy",
    "Purple",
    "Orange",
  ],
  Storage: ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB"],
  RAM: ["4GB", "6GB", "8GB", "12GB", "16GB", "32GB"],
  Weight: ["500g", "1kg", "2kg", "5kg", "10kg", "25kg", "50kg"],
  Type: ["Organic", "Conventional", "Premium", "Standard"],
  Material: [
    "Cotton",
    "Polyester",
    "Silk",
    "Linen",
    "Leather",
    "Canvas",
    "Nylon",
  ],
};

// suggested options per category
const CATEGORY_SUGGESTIONS = {
  Fashion: ["Sizes", "Colours", "Material"],
  Shoes: ["Sizes", "Colours"],
  Electronics: ["Storage", "Colours", "RAM"],
  Agriculture: ["Weight", "Type"],
  Beauty: ["Sizes", "Type"],
  "Home & living": ["Colours", "Sizes", "Material"],
  Sports: ["Sizes", "Colours"],
  Other: ["Sizes", "Colours"],
};

// cartesian product — generates all combinations
function cartesian(arrays) {
  return arrays.reduce(
    (acc, curr) => acc.flatMap((a) => curr.map((b) => ({ ...a, ...b }))),
    [{}],
  );
}

export function Variants({
  setStep,
  formData,
  handleChange,
  handleBack,
  validateStep,
}) {
  const next = () => {
    if (!validateStep()) return;

    setStep(6);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const [customOptionName, setCustomOptionName] = useState("");
  const [customValueInputs, setCustomValueInputs] = useState({});
  // { "Sizes": "XXS", "Colours": "Teal" }

  const suggestions = CATEGORY_SUGGESTIONS[formData.category] || [
    "Sizes",
    "Colours",
    "Storage",
    "Weight",
  ];

  const handleHasVariants = () => {
    handleChange("hasVariants", !formData.hasVariants);
    if (formData.hasVariants) {
      handleChange("variants", {});
      handleChange("productVariants", []);
    }
  };

  // ---- add a new option (e.g. "Sizes") ----
  const addOption = (optionName) => {
    if (!optionName.trim()) return;
    if (formData.variants[optionName] !== undefined) return; // already exists
    handleChange("variants", {
      ...formData.variants,
      [optionName]: [],
    });
  };

  // ---- remove an option entirely ----
  const removeOption = (optionName) => {
    const updated = { ...formData.variants };
    delete updated[optionName];
    handleChange("variants", updated);
    // also clear generated combinations
    handleChange("productVariants", []);
  };

  // ---- add a value to an option ----
  const addValue = (optionName, value) => {
    if (!value.trim()) return;
    const current = formData.variants[optionName] || [];
    if (current.includes(value)) return;
    handleChange("variants", {
      ...formData.variants,
      [optionName]: [...current, value],
    });
    setCustomValueInputs((prev) => ({ ...prev, [optionName]: "" }));
    // clear combinations when options change
    handleChange("productVariants", []);
  };

  // ---- remove a value from an option ----
  const removeValue = (optionName, value) => {
    handleChange("variants", {
      ...formData.variants,
      [optionName]: formData.variants[optionName].filter((v) => v !== value),
    });
    handleChange("productVariants", []);
  };

  // ---- generate all variant combinations ----
  const generateCombinations = () => {
    const optionArrays = Object.entries(formData.variants).map(
      ([name, values]) => values.map((val) => ({ [name]: val })),
    );

    if (optionArrays.some((arr) => arr.length === 0)) return;

    const combos = cartesian(optionArrays);
    const productVariants = combos.map((combo) => ({
      combination: combo,
      price: "",
      stock: "",
      sku: "",
    }));

    handleChange("productVariants", productVariants);
  };

  // ---- update a specific combination row ----
  const updateVariant = (index, field, value) => {
    const updated = [...formData.productVariants];
    updated[index] = { ...updated[index], [field]: value };
    handleChange("productVariants", updated);
  };

  // ---- count of combinations to be generated ----
  const comboCount = useMemo(() => {
    const values = Object.values(formData.variants);
    if (values.some((v) => v.length === 0)) return 0;
    return values.reduce((acc, v) => acc * v.length, 1);
  }, [formData.variants]);

  const hasOptions = Object.keys(formData.variants).length > 0;

  const allOptionsHaveValues =
    hasOptions && Object.values(formData.variants).every((v) => v.length > 0);

  return (
    <>
      <motion.div variants={container} initial="hidden" animate="visible">
        <motion.div variants={fadedown} className="mb-5">
          {/* heading */}
          <h3 className=" fs-1 mb-3 fw-bold">Basic Information</h3>
          <h5>
            {" "}
            Does your product come in different sizes, colours or other options?
            Add them here so buyers can choose.
          </h5>
        </motion.div>

        {/* Has variants toggle */}
        <motion.div variants={fadedown}>
          <Stack direction="horizontal" className="d-flex align-items-start">
            <span>
              <Form.Label className="mb-0">
                This product has multiple options
              </Form.Label>
              <h6 className="text-white">
                e.g. different sizes, colours, storage
              </h6>
            </span>
            <Form.Check
              className="ms-auto"
              checked={formData.hasVariants}
              onChange={() => handleHasVariants()}
              type="switch"
            />
          </Stack>
        </motion.div>

        {formData.hasVariants && (
          <>
            {/* category suggestion*/}
            <motion.div variants={fadedown} className=" my-5 ">
              <Form.Group>
                <Form.Label>
                  {" "}
                  Quick add for {formData.category || "your product"}:
                </Form.Label>
                <div className="d-flex align-items-center gap-4 gap-sm-5 flex-wrap mt-2">
                  {" "}
                  {suggestions.map((opt) => {
                    const alreadyAdded = formData.variants[opt] !== undefined;
                    return (
                      <button
                        type="button"
                        className="px-3 px-sm-4 py-1"
                        key={opt}
                        onClick={() => !alreadyAdded && addOption(opt)}
                        style={{
                          borderRadius: 10,
                          cursor: alreadyAdded ? "default" : "pointer",
                          transition: "all 0.15s",
                          border: `0.5px solid ${alreadyAdded ? "#d1ce16" : "#064206"}`,
                          background: alreadyAdded ? "#3a3906" : "#111a11",
                        }}
                      >
                        <p
                          style={{
                            color: alreadyAdded ? "#fffb00" : "",
                            textWrap: "nowrap",
                          }}
                        >
                          {alreadyAdded ? "✓" : "+"} {opt}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </Form.Group>
            </motion.div>

            {/* custom option input */}
            <motion.div variants={fadedown} className="my-5 py-5">
              <Form.Group>
                <Form.Label>Or add a custom option:</Form.Label>

                <div className="d-flex align-items-center gap-3">
                  <Form.Control
                    placeholder="e.g. Finish, Pattern, Bundle size"
                    value={customOptionName}
                    onChange={(e) => setCustomOptionName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addOption(customOptionName);
                        setCustomOptionName("");
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="px-3 py-1"
                    onClick={() => {
                      (addOption(customOptionName), setCustomOptionName(""));
                    }}
                    disabled={!customOptionName.trim()}
                    style={{
                      background: "none",
                      border: "0.5px solid #c1d31d",
                      borderRadius: 10,
                      color: "#fbff00",
                      cursor: "pointer",
                      opacity: !customOptionName.trim() ? 0.4 : 1,
                    }}
                  >
                    Add
                  </button>
                </div>
              </Form.Group>
            </motion.div>

            {/* each option with values */}
            {Object.entries(formData.variants).map(([optionName, values]) => (
              <motion.div
                variants={fadedown}
                className="my-5 px-4 py-3"
                key={optionName}
                variants={fadedown}
                style={{
                  background: "#011401ec",
                  border: "0.5px solid #4c5019",
                  borderRadius: 14,
                }}
              >
                {/* Option header */}
                <Stack className="pb-2 pb-sm-4 " direction="horizontal">
                  <h6 className="text-white">{optionName}</h6>
                  <p
                    className="ms-auto fs-5 text-white"
                    onClick={() => removeOption(optionName)}
                    style={{
                      cursor: "pointer",
                    }}
                  >
                    X
                  </p>
                </Stack>

                {/* Preset values for this option */}
                {PRESET_VALUES[optionName] && (
                  <div className="mb-4 mb-md-5">
                    <p className="pb-3 pb-sm-4 ">Quick select:</p>
                    <div className="d-flex flex-wrap gap-3">
                      {PRESET_VALUES[optionName].map((val) => {
                        const selected = values.includes(val);
                        return (
                          <p
                            className="p-2"
                            key={val}
                            onClick={() =>
                              selected
                                ? removeValue(optionName, val)
                                : addValue(optionName, val)
                            }
                            style={{
                              borderRadius: 10,
                              cursor: "pointer",
                              transition: "all 0.15s",
                              border: `0.5px solid ${selected ? "#fffb04" : "rgba(255, 255, 255, 0.16)"}`,
                              color: selected ? "#fffb04" : "",
                              background: selected
                                ? "#2020027e"
                                : "transparent",
                            }}
                          >
                            {val}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Selected values as badges */}
                {values.length > 0 && (
                  <div className="d-flex gap-4 gap-md-5 flex-wrap mb-4 mb-md-5">
                    {values.map((val) => (
                      <div
                        className="d-flex align-items-center gap-3 px-3 py-1"
                        key={val}
                        style={{
                          borderRadius: 20,
                          background: "#2020027e",
                          border: "0.5px solid #d3d604",
                        }}
                      >
                        <p style={{ color: "#fffb04" }}>{val}</p>
                        <p
                          className="fw-bold text-white"
                          onClick={() => removeValue(optionName, val)}
                          style={{
                            cursor: "pointer",
                          }}
                        >
                          ✕
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Custom value input */}
                <div className="d-flex align-items-center gap-4 gap-md-5 mb-3">
                  <Form.Control
                    placeholder={`Add custom ${optionName.toLowerCase()} value`}
                    value={customValueInputs[optionName] || ""}
                    onChange={(e) =>
                      setCustomValueInputs((prev) => ({
                        ...prev,
                        [optionName]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addValue(
                          optionName,
                          customValueInputs[optionName] || "",
                        );
                      }
                    }}
                  />
                  <button
                    className="px-3 py-1"
                    type="button"
                    onClick={() =>
                      addValue(optionName, customValueInputs[optionName] || "")
                    }
                    style={{
                      background: "none",
                      border: "0.5px solid #c1d31d9c",
                      borderRadius: 10,
                      color: "#fbff00ce",
                      cursor: "pointer",
                    }}
                  >
                    Add
                  </button>
                </div>
              </motion.div>
            ))}

            {/*generate combination button */}
            {hasOptions && allOptionsHaveValues && (
              <motion.div variants={fadedown} className="my-5 py-5">
                <button
                  type="button"
                  className="text-center p-3 fw-bold fs-5"
                  onClick={generateCombinations}
                  style={{
                    width: "100%",
                    background: "#161602a1",
                    border: "0.5px solid #d3d604",
                    borderRadius: 12,
                    color: "#fbff01",
                  }}
                >
                  Generate {comboCount} variant combination
                  {comboCount !== 1 ? "s" : ""}
                </button>
              </motion.div>
            )}

            {/*combinations table */}
            {formData.productVariants.length > 0 && (
              <motion.div variants={fadedown} className="my-5 py-3">
                <h6 className="text-white mb-3">
                  Set price and stock per variant:
                </h6>
                <Form.Label>
                  Leave price blank to use your base price from the next step.
                </Form.Label>

                {/* Header */}
                <div className="mt-5" style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                    }}
                  >
                    <thead>
                      <tr style={{ borderBottom: "0.5px solid #adab14" }}>
                        <th
                          className="text-start px-3"
                          style={{ whiteSpace: "nowrap" }}
                        >
                          <p className="pb-3"> Variant</p>
                        </th>
                        <th
                          className="text-start px-3  "
                          style={{ whiteSpace: "nowrap" }}
                        >
                          <p className="pb-3"> Price (₦ )</p>
                        </th>
                        <th
                          className="text-start  px-3 "
                          style={{ whiteSpace: "nowrap" }}
                        >
                          <p className="pb-3">Stock</p>
                        </th>
                        <th
                          className="text-start  px-3 "
                          style={{ whiteSpace: "nowrap" }}
                        >
                          <p className="pb-3"> SKU</p>
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {formData.productVariants.map((variant, i) => (
                        <tr
                          key={i}
                          style={{
                            borderBottom: "0.5px solid  #adab14)",
                          }}
                        >
                          {/* Combination label */}
                          <td
                            className=" px-3 "
                            style={{ whiteSpace: "nowrap" }}
                          >
                            <div className="d-flex gap-5 flex-wrap">
                              {Object.entries(variant.combination).map(
                                ([key, val]) => (
                                  <h5 className="px-2 mt-4" key={key}>
                                    {val}
                                  </h5>
                                ),
                              )}
                            </div>
                          </td>

                          {/* Price */}
                          <td className="p-2">
                            <Form.Control
                              className="p-2 px-3 mt-4"
                              type="number"
                              placeholder="Base"
                              value={variant.price}
                              onChange={(e) =>
                                updateVariant(i, "price", e.target.value)
                              }
                              style={{
                                minWidth: 100,
                              }}
                            />
                          </td>

                          {/* Stock */}
                          <td className="p-2">
                            <Form.Control
                              className="p-2 px-3 mt-4"
                              type="number"
                              placeholder="0"
                              value={variant.stock}
                              onChange={(e) =>
                                updateVariant(i, "stock", e.target.value)
                              }
                              style={{
                                minWidth: 80,
                              }}
                            />
                          </td>

                          {/* SKU */}
                          <td className="p-2 ">
                            <Form.Control
                              className="p-2 mt-4 px-3"
                              placeholder="Optional"
                              value={variant.sku}
                              onChange={(e) =>
                                updateVariant(i, "sku", e.target.value)
                              }
                              style={{
                                minWidth: 100,
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* info */}
            <motion.div variants={fadedown}>
              <div
                className="d-flex gap-4 align-items-start p-3"
                style={{
                  background: "rgba(2, 61, 42, 0.42)",
                  border: "0.5px solid rgba(29, 158, 117, 0.59)",
                  borderRadius: 10,
                }}
              >
                <BsInfoCircle size={60} />
                <p>
                  {" "}
                  If a variant have no stock, it will show as out of stock to
                  buyers. You can update stock anytime from your products page
                </p>
              </div>
            </motion.div>
          </>
        )}

        {/* skip note */}
        <motion.div variants={fadedown} className="my-5 py-3">
          <div className="d-flex align-items-center gap-4 text-warning mt-5 ">
            <FiAlertTriangle size={50} />
            Variants are optional. You can add or update them later from your
            dashboard's product page
          </div>
        </motion.div>
      </motion.div>

      <div className="d-flex align-items-center justify-content-between my-5 py-5">
        <button
          type="button"
          onClick={handleBack}
          className="px-3 py-2  next-btn"
        >
          <BsArrowLeft style={{ color: "#facc15", fontSize: "35px" }} />
        </button>

        <button type="button" onClick={next} className="px-3 py-2 next-btn">
          <BsArrowRight style={{ color: "#facc15", fontSize: "35px" }} />
        </button>
      </div>
    </>
  );
}
