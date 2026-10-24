import { Form, Row, Col } from "react-bootstrap";
import { useCallback, useRef, useState, useMemo } from "react";
import {
  BsArrowLeft,
  BsArrowRight,
  BsCloudUpload,
  BsPlus,
  BsTrash,
} from "react-icons/bs";
import { fadedown, container } from "../../../../../../utils/animation";
import { motion } from "framer-motion";
import { Check } from "react-bootstrap-icons";
import api from "../../../../../../services/api";

const MAX_IMAGES = {
  REGULAR: 3,
  CAR: 10,
  REAL_ESTATE: 10,
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const PHOTO_TIPS = {
  REGULAR: [
    "Use a clean white or plain background",
    "Show product from multiple angles",
    "Include close-up of key features",
    "Good lighting — avoid dark or blurry photos",
    "First photo = main display image",
  ],
  CAR: [
    "Exterior front, back and both sides",
    "Interior — dashboard, seats and boot",
    "Engine bay photo",
    "Odometer reading clearly visible",
    "Any scratches or dents — be honest",
  ],
  REAL_ESTATE: [
    "All rooms — wide angle",
    "All bedrooms",
    "Kitchen and bathrooms",
    "Exterior and entrance",
    "Estate or compound if applicable",
  ],
};

function getApiData(response) {
  return response?.data?.data ?? response?.data;
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.message ||
    "Image upload failed. Please try again."
  );
}

export function ImagesUpload({
  setStep,
  formData,
  handleChange,
  errors,
  handleBack,
  validateStep,
}) {
  const fileInputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const maxImages = MAX_IMAGES[formData.type] || 3;
  const tips = PHOTO_TIPS[formData.type] || PHOTO_TIPS.REGULAR;
  const images = useMemo(
    () => (Array.isArray(formData.images) ? formData.images : []),
    [formData.images],
  );

  const next = () => {
    if (!validateStep()) return;

    setStep(7);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const uploadImageToS3 = useCallback(async (file) => {
    const signResponse = await api.post("/media/uploads/sign", {
      purpose: "PRODUCT",
      contentType: file.type,
      fileSize: file.size,
    });

    const signedUpload = getApiData(signResponse);

    if (
      !signedUpload?.uploadUrl ||
      !signedUpload?.fields ||
      !signedUpload?.key
    ) {
      throw new Error("The server returned an invalid upload authorization.");
    }

    const uploadForm = new FormData();

    Object.entries(signedUpload.fields).forEach(([key, value]) => {
      uploadForm.append(key, value);
    });

    uploadForm.append("file", file);

    const s3Response = await fetch(signedUpload.uploadUrl, {
      method: "POST",
      body: uploadForm,
    });

    if (!s3Response.ok) {
      throw new Error(
        "Could not upload the image to storage. Please try again.",
      );
    }

    const verifyResponse = await api.post("/media/uploads/verify", {
      purpose: "PRODUCT",
      key: signedUpload.key,
    });

    const verifiedImage = getApiData(verifyResponse);

    if (!verifiedImage?.imageUrl) {
      throw new Error("The server could not verify the uploaded image.");
    }

    return verifiedImage.imageUrl;
  }, []);

  const handleFiles = useCallback(
    async (fileList) => {
      setUploadError("");

      const selectedFiles = Array.from(fileList || []);

      if (selectedFiles.length === 0) return;

      const remaining = maxImages - images.length;

      if (remaining <= 0) {
        setUploadError(`Maximum ${maxImages} photos allowed.`);
        return;
      }

      if (selectedFiles.length > remaining) {
        setUploadError(
          `You can add ${remaining} more photo${remaining === 1 ? "" : "s"}. Maximum ${maxImages} allowed.`,
        );
        return;
      }

      for (const file of selectedFiles) {
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
          setUploadError("Only JPG, PNG and WEBP images are allowed.");
          return;
        }

        if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
          setUploadError(
            "Each image must be larger than 0 bytes and no more than 5 MB.",
          );
          return;
        }
      }

      try {
        setUploading(true);

        // Preserve selection order, so the first selected photo
        // becomes the cover if the user has not added photos yet.
        const uploadedUrls = await Promise.all(
          selectedFiles.map((file) => uploadImageToS3(file)),
        );

        handleChange("images", [...images, ...uploadedUrls]);
      } catch (error) {
        console.error("Product image upload failed:", error);
        setUploadError(getErrorMessage(error));
      } finally {
        setUploading(false);

        // Allow selecting the same file again after an error.
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [handleChange, images, maxImages, uploadImageToS3],
  );

  const removeImage = (index) => {
    const updated = images.filter((_, i) => i !== index);
    handleChange("images", updated);
    setUploadError("");
  };

  const moveImage = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= images.length) return;

    const updated = [...images];
    const [moved] = updated.splice(fromIndex, 1);

    if (moved === undefined) return;

    updated.splice(toIndex, 0, moved);
    handleChange("images", updated);
  };

  const handleDragOver = (event) => {
    event.preventDefault();

    if (!uploading && images.length < maxImages) {
      setDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);

    if (!uploading) {
      void handleFiles(event.dataTransfer.files);
    }
  };

  const openFilePicker = () => {
    if (!uploading && images.length < maxImages) {
      fileInputRef.current?.click();
    }
  };

  return (
    <>
      <motion.div variants={container} initial="hidden" animate="visible">
        {/* Heading */}
        <motion.div variants={fadedown} className="mb-5">
          <h3 className="fs-1 mb-3 fw-bold">Product photos</h3>
          <h5>
            Great photos help customers shop confidently. Add up to {maxImages}{" "}
            photos.
          </h5>
        </motion.div>

        {/* Upload zone */}
        <motion.div variants={fadedown} className="my-5 py-3">
          <div
            className="p-5"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={openFilePicker}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openFilePicker();
              }
            }}
            style={{
              border: `1.5px dashed ${
                dragOver
                  ? "#c7c420b9"
                  : errors.images
                    ? "#e62510b9"
                    : images.length >= maxImages
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(255,255,255,0.35)"
              }`,
              borderRadius: 14,
              textAlign: "center",
              cursor:
                images.length >= maxImages || uploading
                  ? "not-allowed"
                  : "pointer",
              background: dragOver ? "rgba(26,25,2,0.67)" : "#011301",
              transition: "all 0.2s",
            }}
          >
            {uploading ? (
              <div className="text-center">
                <div
                  style={{
                    width: 40,
                    height: 40,
                    border: "2px solid #046904c4",
                    borderTopColor: "#e4e000",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                    margin: "0 auto 12px",
                  }}
                />
                <p>Uploading and verifying photos...</p>
                <p className="small text-white-50">
                  Please keep this page open until the upload finishes.
                </p>
              </div>
            ) : images.length >= maxImages ? (
              <div className="text-center">
                <Check
                  className="mx-auto"
                  style={{
                    fontSize: 40,
                    color: "#0cc58a",
                    display: "block",
                    marginBottom: 8,
                  }}
                />
                <p
                  style={{
                    fontSize: 13,
                    color: "#0cc58a",
                    fontWeight: 600,
                    margin: 0,
                  }}
                >
                  Maximum photos reached ({maxImages}/{maxImages})
                </p>
              </div>
            ) : (
              <>
                <BsCloudUpload
                  style={{
                    fontSize: 30,
                    display: "block",
                    margin: "0 auto 10px",
                  }}
                />
                <div className="pb-4">
                  <p className="text-white mb-1">
                    Tap to upload or drag photos here
                  </p>
                  <p className="mb-3">JPG, PNG or WEBP · Max 5 MB each</p>

                  <div
                    className="d-inline-block px-2 py-1"
                    style={{
                      background: "#171802",
                      border: "0.5px solid #a0a723d0",
                      borderRadius: 20,
                      fontSize: 12,
                      color: "#c5cc43",
                      fontWeight: 600,
                      letterSpacing: 1,
                    }}
                  >
                    {images.length}/{maxImages} photos added
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={uploading || images.length >= maxImages}
            onChange={(event) => {
              void handleFiles(event.target.files);
            }}
            style={{ display: "none" }}
          />

          {/* Upload error */}
          {uploadError && (
            <p
              role="alert"
              style={{ fontSize: 12, color: "#e57373", marginTop: 8 }}
            >
              {uploadError}
            </p>
          )}

          {/* Validation error */}
          {errors.images && (
            <p
              role="alert"
              style={{ fontSize: 12, color: "#e57373", marginTop: 6 }}
            >
              {errors.images}
            </p>
          )}
        </motion.div>

        {/* Image grid */}
        <motion.div variants={fadedown} className="my-5 py-3">
          <div className="d-sm-flex align-items-center justify-content-sm-between mb-4">
            <Form.Label className="mb-1">
              Your photos — use the arrows to reorder
            </Form.Label>
            <p>First photo = cover image</p>
          </div>

          <Row className="g-3">
            {images.map((url, index) => (
              <Col key={`${url}-${index}`} className="col-6 col-sm-4 col-lg-3">
                <div
                  style={{
                    position: "relative",
                    aspectRatio: "1 / 1",
                    borderRadius: 10,
                    overflow: "hidden",
                    border:
                      index === 0 ? "2px solid #c9c74c" : "0.5px solid #1a2a1a",
                  }}
                >
                  <img
                    src={url}
                    alt={`Product ${index + 1}`}
                    loading="lazy"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />

                  {/* Cover badge */}
                  {index === 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: 5,
                        left: 5,
                        fontSize: 9,
                        fontWeight: 700,
                        color: "#1a1a00",
                        background: "#b2c94c",
                        borderRadius: 4,
                        padding: "2px 6px",
                      }}
                    >
                      COVER
                    </div>
                  )}

                  {/* Image controls */}
                  <div
                    className="d-flex align-items-center justify-content-center gap-3"
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(0,0,0,0.62)",
                      opacity: 0,
                      transition: "opacity 0.2s",
                    }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.opacity = 1;
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.opacity = 0;
                    }}
                  >
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => moveImage(index, index - 1)}
                        title="Move left"
                        aria-label={`Move photo ${index + 1} left`}
                        className="text-white next-btn"
                        style={{ fontSize: 24 }}
                      >
                        <BsArrowLeft />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="text-danger"
                      title="Remove photo"
                      aria-label={`Remove photo ${index + 1}`}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: 23,
                      }}
                    >
                      <BsTrash />
                    </button>

                    {index < images.length - 1 && (
                      <button
                        type="button"
                        onClick={() => moveImage(index, index + 1)}
                        title="Move right"
                        aria-label={`Move photo ${index + 1} right`}
                        className="text-white next-btn"
                        style={{ fontSize: 24 }}
                      >
                        <BsArrowRight />
                      </button>
                    )}
                  </div>

                  {/* Image number */}
                  <p
                    className="p-1 px-3 text-white"
                    style={{
                      position: "absolute",
                      bottom: 5,
                      right: 5,
                      background: "rgba(0,0,0,0.6)",
                      borderRadius: 20,
                      margin: 0,
                    }}
                  >
                    {index + 1}
                  </p>
                </div>
              </Col>
            ))}

            {/* Add more slot */}
            {images.length < maxImages && (
              <Col className="col-6 col-sm-4 col-lg-3">
                <button
                  type="button"
                  onClick={openFilePicker}
                  disabled={uploading}
                  className="d-flex flex-column align-items-center justify-content-center w-100 text-white"
                  style={{
                    aspectRatio: "1 / 1",
                    position: "relative",
                    borderRadius: 10,
                    border: "1px dashed rgba(255,255,255,0.32)",
                    cursor: uploading ? "not-allowed" : "pointer",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <BsPlus size={25} />
                  <span>Add more</span>
                </button>
              </Col>
            )}
          </Row>
        </motion.div>

        {/* Photo tips */}
        <motion.div variants={fadedown} className="my-5 py-3">
          <div
            className="p-4 text-sm-center"
            style={{
              background: "rgba(29,158,117,0.24)",
              border: "0.5px solid rgba(29,158,117,0.46)",
              borderRadius: 12,
            }}
          >
            <h5 className="mb-3" style={{ color: "#1D9E75", fontWeight: 600 }}>
              📸 Tips for great{" "}
              {formData.type === "CAR"
                ? "vehicle"
                : formData.type === "REAL_ESTATE"
                  ? "property"
                  : "product"}{" "}
              photos:
            </h5>

            <div className="d-flex flex-column gap-3">
              {tips.map((tip) => (
                <div className="d-flex align-items-center gap-3" key={tip}>
                  <Check
                    style={{
                      fontSize: 20,
                      color: "#1D9E75",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  />
                  <p className="text-start" style={{ lineHeight: 1.5 }}>
                    {tip}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Navigation */}
      <div className="d-flex align-items-center justify-content-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={uploading}
          className="px-3 py-2 next-btn"
        >
          <BsArrowLeft style={{ color: "#facc15", fontSize: 35 }} />
        </button>

        <button
          type="button"
          onClick={next}
          disabled={uploading}
          className="px-3 py-2 next-btn"
        >
          <BsArrowRight style={{ color: "#facc15", fontSize: 35 }} />
        </button>
      </div>
    </>
  );
}
