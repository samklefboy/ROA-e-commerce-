import { Container, Row, Col } from "react-bootstrap";
import { useState } from "react";
import { ApplicationForm } from "./ApplicationForm";
import { ApplicationStepper } from "./ApplicationStepper";
import { Footer } from "../../pages/Home/components/Footer";
import { zoomIn } from "../../utils/animation";
import { motion } from "framer-motion";
import { BsCheckCircleFill } from "react-icons/bs";
import { ArrowLeft } from "react-bootstrap-icons";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";

const CONDITION_MAP = {
  REGULAR: {
    "Brand new": "BRAND_NEW",
    "Fairly used": "FAIR",
    Refurbished: "LIKE_NEW",
    BRAND_NEW: "BRAND_NEW",
    LIKE_NEW: "LIKE_NEW",
    GOOD: "GOOD",
    FAIR: "FAIR",
    USED: "USED",
  },
  CAR: {
    "Brand new": "BRAND_NEW",
    "Foreign used (Tokunbo)": "USED",
    "Nigerian used": "USED",
    "Fairly used": "FAIR",
    BRAND_NEW: "BRAND_NEW",
    LIKE_NEW: "LIKE_NEW",
    GOOD: "GOOD",
    FAIR: "FAIR",
    USED: "USED",
  },
  REAL_ESTATE: {
    "New build": "BRAND_NEW",
    "Old build": "USED",
    Renovated: "GOOD",
    BRAND_NEW: "BRAND_NEW",
    LIKE_NEW: "LIKE_NEW",
    GOOD: "GOOD",
    FAIR: "FAIR",
    USED: "USED",
  },
};

function parseOptionalNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getApiErrorMessage(error) {
  const data = error?.response?.data;

  if (typeof data?.message === "string" && data.message.trim()) {
    return data.message;
  }

  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return data.errors
      .map((item) => item.message || item.msg || item.path)
      .filter(Boolean)
      .join(". ");
  }

  if (Array.isArray(data?.issues) && data.issues.length > 0) {
    return data.issues
      .map((item) => {
        const path = Array.isArray(item.path) ? item.path.join(".") : item.path;

        return path ? `${path}: ${item.message}` : item.message;
      })
      .filter(Boolean)
      .join(". ");
  }

  if (!error?.response) {
    return "Unable to reach the server. Check your connection and try again.";
  }

  return "We couldn't save your product. Please review your information and try again.";
}

function getCondition(type, condition) {
  if (!condition) return undefined;

  const normalizedType = type === "REALESTATE" ? "REAL_ESTATE" : type;

  return CONDITION_MAP[normalizedType]?.[condition] ?? condition;
}

function getProductType(type) {
  return type === "REAL_ESTATE" ? "REALESTATE" : type;
}

function getCategoryId(formData) {
  if (formData.categoryId) {
    return formData.categoryId;
  }

  if (
    formData.category &&
    typeof formData.category === "object" &&
    formData.category.id
  ) {
    return formData.category.id;
  }

  // Do not send a category label as a database foreign key.
  return undefined;
}

function cleanListingMeta(listingMeta = {}) {
  if (!listingMeta || typeof listingMeta !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(listingMeta).filter(([, value]) => value !== undefined),
  );
}

function cleanProductPayload(formData, publishStatus = "ACTIVE") {
  const type = getProductType(formData.type);
  const isRegular = type === "REGULAR";
  const hasVariants = isRegular && Boolean(formData.hasVariants);

  const price = parseOptionalNumber(formData.price);
  const costPrice = parseOptionalNumber(formData.costPrice);
  const stock = parseOptionalNumber(formData.stock);

  const images = Array.isArray(formData.images)
    ? formData.images
        .filter((image) => typeof image === "string")
        .map((image) => image.trim())
        .filter(Boolean)
    : [];

  const keywords = Array.isArray(formData.keywords)
    ? [
        ...new Set(
          formData.keywords
            .filter((keyword) => typeof keyword === "string")
            .map((keyword) => keyword.trim())
            .filter(Boolean),
        ),
      ].slice(0, 10)
    : [];

  const payload = {
    type,
    name: typeof formData.name === "string" ? formData.name.trim() : "",
    description:
      typeof formData.description === "string"
        ? formData.description.trim()
        : "",
    condition: getCondition(formData.type, formData.condition),
    images,
    keywords,
    price,
    status: publishStatus,
  };

  const categoryId = getCategoryId(formData);

  if (categoryId) {
    payload.categoryId = categoryId;
  }

  if (isRegular) {
    payload.hasVariants = hasVariants;

    if (hasVariants) {
      const variants = Array.isArray(formData.productVariants)
        ? formData.productVariants
        : [];

      payload.variants =
        formData.variants &&
        typeof formData.variants === "object" &&
        !Array.isArray(formData.variants)
          ? formData.variants
          : {};

      payload.productVariants = variants.map((variant) => {
        const variantPrice =
          variant.price === "" ||
          variant.price === null ||
          variant.price === undefined
            ? price
            : parseOptionalNumber(variant.price);

        return {
          combination:
            variant.combination &&
            typeof variant.combination === "object" &&
            !Array.isArray(variant.combination)
              ? variant.combination
              : {},
          price: variantPrice,
          stock: parseOptionalNumber(variant.stock),
          sku: typeof variant.sku === "string" ? variant.sku.trim() : "",
        };
      });

      // Variant inventory is managed per variant.
      // Do not send top-level stock or SKU in this case.
    } else {
      payload.hasVariants = false;
      payload.stock = stock;
      payload.variants = {};
      payload.productVariants = [];

      if (costPrice !== null) {
        payload.costPrice = costPrice;
      } else if (
        formData.costPrice === "" ||
        formData.costPrice === null ||
        formData.costPrice === undefined
      ) {
        payload.costPrice = null;
      }
    }
  } else {
    payload.hasVariants = false;

    const listingMeta = cleanListingMeta(formData.listingMeta);

    payload.listingMeta = listingMeta;

    if (
      typeof listingMeta.location === "string" &&
      listingMeta.location.trim()
    ) {
      payload.location = listingMeta.location.trim();
    }
  }

  // Never submit oldPrice: ROA's discount functionality manages it.
  delete payload.oldPrice;

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  );
}

export function FormCreation({
  formData,
  setFormData,
  getStore = true,
  addProduct = true,
  title,
  isEditMode = false,
}) {
  const [step, setStep] = useState(1);
  const [isPublish, setIsPublish] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();
  const { id } = useParams();

  const handleBack = () => {
    if (step > 1) {
      setStep((currentStep) => currentStep - 1);
      setSubmitError("");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else {
      navigate(-1);
    }
  };

  const handleSubmit = async (publishStatus = "ACTIVE") => {
    if (loading) return;

    setSubmitError("");
    setSuccessMessage("");

    if (!addProduct) {
      setSubmitError("This form is not configured for product submission.");
      return;
    }

    if (isEditMode && !id) {
      setSubmitError(
        "The product ID is missing. Please reopen the product and try again.",
      );
      return;
    }

    const payload = cleanProductPayload(formData, publishStatus);

    // Basic submission checks before calling the API.
    if (!payload.name) {
      setSubmitError("Enter a product title before saving.");
      return;
    }

    if (!payload.description) {
      setSubmitError("Enter a product description before saving.");
      return;
    }

    if (
      typeof payload.price !== "number" ||
      !Number.isFinite(payload.price) ||
      payload.price <= 0
    ) {
      setSubmitError("Enter a valid price greater than zero.");
      return;
    }

    if (!payload.condition) {
      setSubmitError("Select a valid product condition.");
      return;
    }

    if (!payload.images.length) {
      setSubmitError("Upload at least one product image before saving.");
      return;
    }

    if (payload.type === "REGULAR" && !payload.categoryId) {
      setSubmitError(
        "A valid product category ID is required. Please select a category from the category selector.",
      );
      return;
    }

    if (payload.type === "REGULAR" && payload.hasVariants) {
      if (!payload.productVariants?.length) {
        setSubmitError("Add at least one product variant or disable variants.");
        return;
      }

      const invalidVariant = payload.productVariants.some(
        (variant) =>
          !variant.combination ||
          Object.keys(variant.combination).length === 0 ||
          !variant.sku ||
          !Number.isInteger(variant.stock) ||
          variant.stock < 1 ||
          typeof variant.price !== "number" ||
          !Number.isFinite(variant.price) ||
          variant.price <= 0,
      );

      if (invalidVariant) {
        setSubmitError(
          "Every variant needs an option combination, a unique SKU, a valid price, and a positive whole-number stock quantity.",
        );
        return;
      }

      const skuValues = payload.productVariants.map((variant) =>
        variant.sku.toLowerCase(),
      );

      if (new Set(skuValues).size !== skuValues.length) {
        setSubmitError("Each product variant must have a unique SKU.");
        return;
      }
    }

    if (
      payload.type === "REGULAR" &&
      !payload.hasVariants &&
      (!Number.isInteger(payload.stock) || payload.stock < 1)
    ) {
      setSubmitError(
        "Enter a positive whole-number stock quantity for this product.",
      );
      return;
    }

    if (
      payload.type === "CAR" &&
      (!payload.listingMeta?.make ||
        !payload.listingMeta?.model ||
        !payload.listingMeta?.year ||
        !payload.listingMeta?.location)
    ) {
      setSubmitError(
        "Complete the vehicle make, model, year, and location before saving.",
      );
      return;
    }

    if (
      payload.type === "REALESTATE" &&
      (!payload.listingMeta?.listingType ||
        !payload.listingMeta?.propertyType ||
        !payload.listingMeta?.address)
    ) {
      setSubmitError(
        "Complete the property listing type, property type, and address before saving.",
      );
      return;
    }

    setLoading(true);

    try {
      if (isEditMode) {
        // Keep the existing product type unchanged during editing.
        delete payload.type;

        await api.patch(`/products/${id}`, payload);

        setSuccessMessage(
          publishStatus === "DRAFT"
            ? "Your product changes have been saved as a draft."
            : "Your product has been updated successfully.",
        );
      } else {
        await api.post("/products", payload);

        setSuccessMessage(
          publishStatus === "DRAFT"
            ? "Your product has been saved as a draft."
            : "Your product has been published successfully.",
        );
      }

      setIsPublish(true);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      setSubmitError(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (isPublish) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col xs={12} md={9} lg={7}>
            <motion.div
              variants={zoomIn}
              initial="hidden"
              animate="visible"
              className="text-center py-5"
            >
              <BsCheckCircleFill size={70} color="#1D9E75" className="mb-4" />

              <h2 className="fw-bold mb-3">
                {publishStatusLabel(successMessage)}
              </h2>

              <p className="mb-4">{successMessage}</p>

              <button
                type="button"
                className="next-btn px-4 py-3"
                onClick={() => navigate("/dashboard")}
              >
                Go to dashboard
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary ms-2 px-4 py-3"
                onClick={() => navigate("/dashboard/products")}
              >
                View products
              </button>
            </motion.div>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <>
      <Container className="py-4">
        <div className="d-flex align-items-center gap-3 mb-4">
          <button
            type="button"
            onClick={handleBack}
            className="next-btn px-3 py-2"
            aria-label="Go back"
            disabled={loading}
          >
            <ArrowLeft
              style={{
                color: "#facc15",
                fontSize: 25,
              }}
            />
          </button>

          <div>
            <h2 className="fw-bold mb-1">
              {title || (isEditMode ? "Edit product" : "Create product")}
            </h2>

            <p className="text-secondary mb-0">
              {isEditMode
                ? "Update your listing details."
                : "Create a complete and accurate listing for your buyers."}
            </p>
          </div>
        </div>

        <ApplicationStepper step={step} setStep={setStep} formData={formData} />

        {submitError && (
          <div className="alert alert-danger mt-4" role="alert">
            {submitError}
          </div>
        )}

        <ApplicationForm
          step={step}
          setStep={setStep}
          formData={formData}
          setFormData={setFormData}
          setIsPublish={setIsPublish}
          getStore={getStore}
          addProduct={addProduct}
          handleBack={handleBack}
          handleSubmit={handleSubmit}
          loading={loading}
        />
      </Container>

      {getStore && <Footer />}
    </>
  );
}

function publishStatusLabel(message) {
  if (message?.toLowerCase().includes("draft")) {
    return "Draft saved";
  }

  return "Success!";
}
