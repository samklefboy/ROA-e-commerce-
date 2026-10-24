import { Form, Spinner } from "react-bootstrap";
import { BsArrowRight } from "react-icons/bs";

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";

export function StepTwo({
  setStep,
  handleLogoChange,
  handleBannerChange,
  errors = {},
  uploadingField = "",
  formData = {},
}) {
  const uploading = Boolean(uploadingField);

  const renderImagePreview = (src, label) => {
    if (!src) return null;

    return (
      <div className="mt-3">
        <img
          src={src}
          alt={`${label} preview`}
          style={{
            width: "100%",
            maxWidth: label === "Store Logo" ? 160 : 360,
            height: label === "Store Logo" ? 160 : 150,
            objectFit: "cover",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        />
      </div>
    );
  };

  return (
    <>
      <div className="d-flex justify-content-between">
        <div>
          <h3 className="fs-3 mb-2">Branding</h3>
          <p className="mb-5">Make your store attractive</p>
        </div>

        <button
          type="button"
          onClick={() => setStep(3)}
          disabled={uploading}
          className="border-0 bg-transparent align-self-start"
          style={{
            cursor: uploading ? "not-allowed" : "pointer",
            color: "#ffee00",
          }}
        >
          Skip
        </button>
      </div>

      <Form.Group>
        <Form.Label>Store Logo</Form.Label>

        <Form.Control
          type="file"
          accept={IMAGE_ACCEPT}
          onChange={handleLogoChange}
          disabled={uploading}
        />

        <Form.Text className="text-white-50">
          JPG, PNG or WebP. Maximum size: 5 MB.
        </Form.Text>

        {uploadingField === "logo" && (
          <div className="mt-2 text-info">
            <Spinner size="sm" className="me-2" />
            Uploading and verifying logo...
          </div>
        )}

        {errors.logo && (
          <div className="text-danger mt-2" role="alert">
            {errors.logo}
          </div>
        )}

        {renderImagePreview(
          formData.logoPreview || formData.logo,
          "Store Logo",
        )}
      </Form.Group>

      <Form.Group className="my-5">
        <Form.Label>Store Banner / Cover</Form.Label>

        <Form.Control
          type="file"
          accept={IMAGE_ACCEPT}
          onChange={handleBannerChange}
          disabled={uploading}
        />

        <Form.Text className="text-white-50">
          Choose an attractive cover image. Maximum size: 5 MB.
        </Form.Text>

        {uploadingField === "banner" && (
          <div className="mt-2 text-info">
            <Spinner size="sm" className="me-2" />
            Uploading and verifying cover...
          </div>
        )}

        {errors.banner && (
          <div className="text-danger mt-2" role="alert">
            {errors.banner}
          </div>
        )}

        {renderImagePreview(
          formData.bannerPreview || formData.banner,
          "Store Banner",
        )}
      </Form.Group>

      <div className="d-flex">
        <button
          type="button"
          onClick={() => setStep(3)}
          disabled={uploading}
          className="px-3 py-2 mt-5 ms-auto next-btn"
          aria-label="Continue to next step"
          title={uploading ? "Wait for the image upload to finish" : "Continue"}
        >
          <BsArrowRight style={{ color: "#facc15", fontSize: 35 }} />
        </button>
      </div>
    </>
  );
}
