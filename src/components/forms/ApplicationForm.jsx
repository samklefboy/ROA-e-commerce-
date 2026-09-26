import { Form, Button } from "react-bootstrap";
import { StepOne } from "../../pages/createstore/components/StepOne";
import { StepTwo } from "../../pages/createstore/components/StepTwo";
import { StepThree } from "../../pages/createstore/components/StepThree";
import { StepFour } from "../../pages/createstore/components/StepFour";
import { ProductType } from "../../pages/Store/Dashboard/Add_Edit_Product/components/steps/ProductType";
import { useState } from "react";
import { BasicInfo } from "../../pages/Store/Dashboard/Add_Edit_Product/components/steps/BasicInfo";
import { StepThreeCombination } from "../../pages/Store/Dashboard/Add_Edit_Product/components/steps/step3/StepThreeCombination";
import { Variants } from "../../pages/Store/Dashboard/Add_Edit_Product/components/steps/Variants";
import { Price } from "../../pages/Store/Dashboard/Add_Edit_Product/components/steps/Price";
import { ImagesUpload } from "../../pages/Store/Dashboard/Add_Edit_Product/components/steps/ImagesUpload";
import { Preview } from "../../pages/Store/Dashboard/Add_Edit_Product/components/steps/Preview";

//import { StepFive } from "./StepFive";
//import { StepSix } from "./StepSix";
//import { StepSeven } from "./StepSeven";

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

  // ---- validate current step before proceeding ----
  const validateStep = () => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.type) {
        newErrors.type = "Please select a product type";
      }
    }

    if (step === 2) {
      if (!formData.name.trim()) {
        newErrors.name = "Product title is required";
      }
      if (!formData.description.trim()) {
        newErrors.description = "Description is required";
      }
      if (!formData.condition) {
        newErrors.condition = "Please select condition";
      }
    }

    if (step === 3) {
      if (formData.type === "Regular" && !formData.category) {
        newErrors.category = "Please select a category";
      }
      if (formData.type === "CAR") {
        if (!formData.listingMeta.make) newErrors.make = "Make is required";
        if (!formData.listingMeta.model) newErrors.model = "Model is required";
        if (!formData.listingMeta.year) newErrors.year = "Year is required";
      }
      if (formData.type === "Real_Estate") {
        if (!formData.listingMeta.listingType)
          newErrors.listingType = "Select listing type";
        if (!formData.listingMeta.propertyType)
          newErrors.propertyType = "Select property type";
        if (!formData.listingMeta.address)
          newErrors.address = "Address is required";
      }
    }

    if (step === 5) {
      if (!formData.price) {
        newErrors.price = "Price is required";
      }
      if (
        formData.type === "Regular" &&
        !formData.hasVariants &&
        !formData.stock
      ) {
        newErrors.stock = "Stock quantity is required";
      }
    }

    if (step === 6) {
      if (formData.images.length === 0) {
        newErrors.images = "Please upload at least one photo";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleChangeListingMeta = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      listingMeta: { ...prev.listingMeta, [field]: value },
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setFormData((prev) => ({
      ...prev,
      logo: file,
      logoPreview: URL.createObjectURL(file),
    }));
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setFormData((prev) => ({
      ...prev,
      banner: file,
      bannerPreview: URL.createObjectURL(file),
    }));
  };

  return (
    <>
      {addProduct && (
        <Form>
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
        <Form>
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
              errors={errors}
              setErrors={setErrors}
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
                onClick={() => setIsPublish(!false)}
                className="px-5 fs-3 text-dark d-flex mt-5 ms-auto "
                type="submit"
                style={{ background: "#ffee00", border: "none" }}
              >
                publish
              </Button>
            </>
          )}
        </Form>
      )}

      {/* 
      {step === 5 && (
        <StepFive
          setStep={setStep}
          handleChange={handleChange}
          formData={formData}
        />
      )} */}

      {/*  {step === 6 && (
        <StepSix
          setStep={setStep}
          handleChange={handleChange}
          formData={formData}
        />
      )} */}

      {/* {step === 7 && (
        <StepSeven
          setStep={setStep}
          handleChange={handleChange}
          formData={formData}
        />
      )} */}
    </>
  );
}
