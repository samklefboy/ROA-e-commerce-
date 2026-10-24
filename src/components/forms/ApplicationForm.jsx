import { Form, Button } from "react-bootstrap";
import { useEffect, useState } from "react";

import api from "../../services/api";
import { getSellerCommissionRate } from "../../services/commissionPolicyService";

import { StepOne } from "../../pages/createstore/components/StepOne";
import { StepTwo } from "../../pages/createstore/components/StepTwo";
import { StepThree } from "../../pages/createstore/components/StepThree";
import { StepFour } from "../../pages/createstore/components/StepFour";

import { ProductType } from "../../pages/Store/Dashboard/Add_Edit_Product/components/steps/ProductType";
import { BasicInfo } from "../../pages/Store/Dashboard/Add_Edit_Product/components/steps/BasicInfo";
import { StepThreeCombination } from "../../pages/Store/Dashboard/Add_Edit_Product/components/steps/step3/StepThreeCombination";
import { Variants } from "../../pages/Store/Dashboard/Add_Edit_Product/components/steps/Variants";
import { Price } from "../../pages/Store/Dashboard/Add_Edit_Product/components/steps/Price";
import { ImagesUpload } from "../../pages/Store/Dashboard/Add_Edit_Product/components/steps/ImagesUpload";
import { Preview } from "../../pages/Store/Dashboard/Add_Edit_Product/components/steps/Preview";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const VALID_CONDITIONS = [
  "BRAND_NEW",
  "LIKE_NEW",
  "GOOD",
  "FAIR",
  "USED",
  "Brand new",
  "Like new",
  "Fairly used",
  "Refurbished",
  "Good",
  "Fair",
  "Used",
];

function getApiData(response) {
  return response?.data?.data ?? response?.data;
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.message ||
    "The operation failed. Please try again."
  );
}

function isValidImageUrl(value) {
  if (typeof value !== "string" || !value.trim()) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isValidNumber(value) {
  return (
    value !== "" &&
    value !== null &&
    value !== undefined &&
    Number.isFinite(Number(value))
  );
}

export function ApplicationForm({
  step,
  setStep,
  setFormData,
  formData,
  setIsPublish,
  getStore,
  addProduct,
  handleBack,
  handleSubmit,
  loading,
}) {
  const [errors, setErrors] = useState({});

  const [brandingUploading, setBrandingUploading] = useState("");
  const [brandingErrors, setBrandingErrors] = useState({
    logo: "",
    banner: "",
  });

  const [commissionRateBps, setCommissionRateBps] = useState(null);
  const [commissionLoading, setCommissionLoading] = useState(false);
  const [commissionError, setCommissionError] = useState("");

  useEffect(() => {
    if (!addProduct || step !== 5) {
      return undefined;
    }

    let cancelled = false;

    async function fetchCommissionRate() {
      setCommissionLoading(true);
      setCommissionError("");

      try {
        const result = await getSellerCommissionRate();

        if (cancelled) return;

        if (
          !result ||
          !Number.isInteger(result.rateBps) ||
          result.rateBps < 0 ||
          result.rateBps > 10000
        ) {
          throw new Error("The server returned an invalid commission rate.");
        }

        setCommissionRateBps(result.rateBps);
      } catch (error) {
        if (cancelled) return;

        setCommissionRateBps(null);

        const status = error?.response?.status;
        const message = getErrorMessage(error);

        if (status === 401) {
          setCommissionError(
            "Your session could not be authenticated. Please sign in again.",
          );
        } else if (status === 403) {
          setCommissionError(
            message || "Your store must be active to view the commission rate.",
          );
        } else if (status === 409) {
          setCommissionError(
            message || "The ROA commission policy is not configured.",
          );
        } else {
          setCommissionError(message);
        }
      } finally {
        if (!cancelled) {
          setCommissionLoading(false);
        }
      }
    }

    void fetchCommissionRate();

    return () => {
      cancelled = true;
    };
  }, [addProduct, step]);

  const isRegular = formData.type === "REGULAR";
  const isCar = formData.type === "CAR";
  const isRealEstate =
    formData.type === "REAL_ESTATE" || formData.type === "REALESTATE";

  const validateStep = () => {
    const newErrors = {};

    if (step === 1) {
      if (
        !["REGULAR", "CAR", "REAL_ESTATE", "REALESTATE"].includes(formData.type)
      ) {
        newErrors.type = "Please select a valid listing type.";
      }
    }

    if (step === 2) {
      const name = formData.name?.trim() || "";
      const description = formData.description?.trim() || "";

      if (name.length < 2) {
        newErrors.name = "Enter a title with at least 2 characters.";
      } else if (name.length > 200) {
        newErrors.name = "Title cannot exceed 200 characters.";
      }

      if (description.length < 10) {
        newErrors.description =
          "Enter a description with at least 10 characters.";
      }

      if (!VALID_CONDITIONS.includes(formData.condition)) {
        newErrors.condition = "Please select a valid product condition.";
      }
    }

    if (step === 3) {
      if (isRegular) {
        const category = formData.categoryId || formData.category;

        if (!category || (typeof category === "string" && !category.trim())) {
          newErrors.category = "Please select a category.";
        }
      }

      const meta = formData.listingMeta || {};

      if (isCar) {
        if (!meta.make?.trim()) {
          newErrors.make = "Make is required.";
        }

        if (!meta.model?.trim()) {
          newErrors.model = "Model is required.";
        }

        const year = Number(meta.year);
        const currentYear = new Date().getFullYear() + 1;

        if (
          !meta.year ||
          !Number.isInteger(year) ||
          year < 1886 ||
          year > currentYear
        ) {
          newErrors.year = "Enter a valid vehicle year.";
        }
      }

      if (isRealEstate) {
        if (!meta.listingType) {
          newErrors.listingType = "Select a listing type.";
        }

        if (!meta.propertyType) {
          newErrors.propertyType = "Select a property type.";
        }

        if (!meta.address?.trim()) {
          newErrors.address = "Property address is required.";
        }
      }
    }

    if (step === 4 && isRegular && formData.hasVariants) {
      const variants = formData.productVariants || [];

      if (!variants.length) {
        newErrors.productVariants =
          "Generate at least one variant combination, or turn variants off.";
      } else {
        const seenSkus = new Set();

        const invalidVariant = variants.some((variant) => {
          const stock = Number(variant.stock);
          const hasValidStock =
            variant.stock !== "" &&
            variant.stock !== null &&
            Number.isInteger(stock) &&
            stock >= 0;

          const priceIsEmpty =
            variant.price === "" ||
            variant.price === null ||
            variant.price === undefined;

          const hasValidPrice =
            priceIsEmpty ||
            (isValidNumber(variant.price) && Number(variant.price) > 0);

          const sku = variant.sku?.trim().toLowerCase() || "";
          const duplicateSku = sku && seenSkus.has(sku);

          if (sku) seenSkus.add(sku);

          return (
            !hasValidStock ||
            !hasValidPrice ||
            !sku ||
            duplicateSku ||
            !variant.combination ||
            Object.keys(variant.combination).length === 0
          );
        });

        if (invalidVariant) {
          newErrors.productVariants =
            "Each variant needs a valid stock quantity, a unique SKU, an option combination, and a valid optional price.";
        }
      }
    }

    if (step === 5) {
      if (!isValidNumber(formData.price) || Number(formData.price) <= 0) {
        newErrors.price = "Enter a valid price greater than zero.";
      }

      if (isRegular && !formData.hasVariants) {
        const stock = Number(formData.stock);

        if (
          formData.stock === "" ||
          formData.stock === null ||
          !Number.isInteger(stock) ||
          stock < 0
        ) {
          newErrors.stock = "Enter a valid stock quantity.";
        }
      }

      if (
        isRegular &&
        formData.costPrice !== "" &&
        formData.costPrice !== null &&
        formData.costPrice !== undefined &&
        (!isValidNumber(formData.costPrice) || Number(formData.costPrice) < 0)
      ) {
        newErrors.costPrice = "Cost price cannot be negative.";
      }
    }

    if (step === 6) {
      const images = formData.images || [];

      if (!images.length) {
        newErrors.images = "Please upload at least one photo.";
      } else if (images.some((image) => !isValidImageUrl(image))) {
        newErrors.images =
          "Please wait for every image to finish uploading and verifying.";
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return false;
    }

    return true;
  };

  const handleChange = (field, value) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));

    setErrors((previous) => {
      if (!(field in previous)) return previous;

      const next = { ...previous };
      delete next[field];
      return next;
    });
  };

  const handleChangeListingMeta = (field, value) => {
    setFormData((previous) => ({
      ...previous,
      listingMeta: {
        ...(previous.listingMeta || {}),
        [field]: value,
      },
    }));

    setErrors((previous) => {
      if (!(field in previous)) return previous;

      const next = { ...previous };
      delete next[field];
      return next;
    });
  };

  const uploadBrandingImage = async (event, field) => {
    const file = event.target.files?.[0];

    // Allow the same file to be selected again after an error.
    event.target.value = "";

    if (!file) return;

    setBrandingErrors((previous) => ({
      ...previous,
      [field]: "",
    }));

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setBrandingErrors((previous) => ({
        ...previous,
        [field]: "Only JPG, PNG and WEBP images are allowed.",
      }));
      return;
    }

    if (file.size <= 0 || file.size > MAX_IMAGE_SIZE) {
      setBrandingErrors((previous) => ({
        ...previous,
        [field]: "The image must be larger than 0 bytes and no more than 5 MB.",
      }));
      return;
    }

    const purpose = field === "logo" ? "STORE_LOGO" : "STORE_COVER";
    const previewField = field === "logo" ? "logoPreview" : "bannerPreview";

    const previousImage = formData[field] || null;
    const previousPreview = formData[previewField] || "";
    const localPreview = URL.createObjectURL(file);

    setFormData((previous) => ({
      ...previous,
      [previewField]: localPreview,
    }));

    setBrandingUploading(field);

    try {
      const signResponse = await api.post("/media/uploads/sign", {
        purpose,
        contentType: file.type,
        fileSize: file.size,
      });

      const signedUpload = getApiData(signResponse);

      if (
        !signedUpload?.uploadUrl ||
        !signedUpload?.fields ||
        !signedUpload?.key
      ) {
        throw new Error("The server returned invalid upload authorization.");
      }

      const uploadForm = new FormData();

      Object.entries(signedUpload.fields).forEach(([key, value]) => {
        uploadForm.append(key, String(value));
      });

      uploadForm.append("file", file);

      const uploadResponse = await fetch(signedUpload.uploadUrl, {
        method: "POST",
        body: uploadForm,
      });

      if (!uploadResponse.ok) {
        throw new Error("Image upload failed. Please try again.");
      }

      const verifyResponse = await api.post("/media/uploads/verify", {
        purpose,
        key: signedUpload.key,
      });

      const verifiedImage = getApiData(verifyResponse);

      if (!isValidImageUrl(verifiedImage?.imageUrl)) {
        throw new Error("The server could not verify the uploaded image URL.");
      }

      setFormData((previous) => ({
        ...previous,
        [field]: verifiedImage.imageUrl,
        [previewField]: verifiedImage.imageUrl,
      }));

      URL.revokeObjectURL(localPreview);
    } catch (error) {
      console.error(`Store ${field} upload failed:`, error);

      setFormData((previous) => ({
        ...previous,
        [field]: previousImage,
        [previewField]: previousPreview,
      }));

      URL.revokeObjectURL(localPreview);

      setBrandingErrors((previous) => ({
        ...previous,
        [field]: getErrorMessage(error),
      }));
    } finally {
      setBrandingUploading("");
    }
  };

  const handleLogoChange = (event) => {
    void uploadBrandingImage(event, "logo");
  };

  const handleBannerChange = (event) => {
    void uploadBrandingImage(event, "banner");
  };

  return (
    <>
      {addProduct && (
        <Form onSubmit={(event) => event.preventDefault()}>
          {step === 1 && (
            <ProductType
              setStep={setStep}
              handleChange={handleChange}
              formData={formData}
              errors={errors}
              validateStep={validateStep}
            />
          )}

          {step === 2 && (
            <BasicInfo
              setStep={setStep}
              handleChange={handleChange}
              formData={formData}
              errors={errors}
              validateStep={validateStep}
              handleBack={handleBack}
            />
          )}

          {step === 3 && (
            <StepThreeCombination
              setStep={setStep}
              handleChangeListingMeta={handleChangeListingMeta}
              formData={formData}
              errors={errors}
              validateStep={validateStep}
              handleBack={handleBack}
            />
          )}

          {step === 4 && (
            <Variants
              setStep={setStep}
              handleChange={handleChange}
              formData={formData}
              errors={errors}
              validateStep={validateStep}
              handleBack={handleBack}
            />
          )}

          {step === 5 && (
            <Price
              setStep={setStep}
              handleChange={handleChange}
              formData={formData}
              errors={errors}
              validateStep={validateStep}
              handleBack={handleBack}
              commissionRateBps={commissionRateBps}
              commissionLoading={commissionLoading}
              commissionError={commissionError}
            />
          )}

          {step === 6 && (
            <ImagesUpload
              setStep={setStep}
              handleChange={handleChange}
              formData={formData}
              errors={errors}
              validateStep={validateStep}
              handleBack={handleBack}
            />
          )}

          {step === 7 && (
            <Preview
              handleSubmit={handleSubmit}
              loading={loading}
              formData={formData}
              handleBack={handleBack}
            />
          )}
        </Form>
      )}

      {getStore && (
        <Form onSubmit={(event) => event.preventDefault()}>
          {step === 1 && (
            <StepOne
              setStep={setStep}
              handleChange={handleChange}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
            />
          )}

          {step === 2 && (
            <StepTwo
              setStep={setStep}
              handleLogoChange={handleLogoChange}
              handleBannerChange={handleBannerChange}
              errors={brandingErrors}
              uploadingField={brandingUploading}
              formData={formData}
            />
          )}

          {step === 3 && (
            <StepThree
              setStep={setStep}
              handleChange={handleChange}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
            />
          )}

          {step === 4 && (
            <>
              <StepFour
                setStep={setStep}
                handleChange={handleChange}
                formData={formData}
                errors={errors}
                setErrors={setErrors}
              />

              <Button
                type="button"
                onClick={() => setIsPublish(true)}
                disabled={Boolean(brandingUploading)}
                className="px-4 fs-4 d-flex mt-5 ms-auto"
                style={{
                  background: "#1f1d00",
                  border: "none",
                }}
              >
                Publish
              </Button>
            </>
          )}
        </Form>
      )}
    </>
  );
}
