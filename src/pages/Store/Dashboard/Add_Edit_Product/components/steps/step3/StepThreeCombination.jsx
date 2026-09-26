import { VehicleDetails } from "../step3/VehicleDetails";
import { RealEstateDetails } from "../step3/Real_Estate";
import { RegularDetails } from "../step3/RegularDetails";

export function StepThreeCombination({
  setStep,
  handleChangeListingMeta,
  formData,
  errors,
  validateStep,
  handleBack,
}) {
  return (
    <>
      {formData.type === "REGULAR" && (
        <RegularDetails
          setStep={setStep}
          handleChangeListingMeta={handleChangeListingMeta}
          formData={formData}
          errors={errors}
          validateStep={validateStep}
          handleBack={handleBack}
        />
      )}

      {/*    {formData.type === "CAR" && (
        <VehicleDetails
          setStep={setStep}
          handleChangeListingMeta={handleChangeListingMeta}
          formData={formData}
          errors={errors}
          validateStep={validateStep}
          handleBack={handleBack}
        />
      )} 

      {formData.type === "REAL_ESTATE" && (
        <RealEstateDetails
          setStep={setStep}
          handleChangeListingMeta={handleChangeListingMeta}
          formData={formData}
          errors={errors}
          validateStep={validateStep}
          handleBack={handleBack}
        />
      )} */}
    </>
  );
}
