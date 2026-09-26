import { Form, Row, Col } from "react-bootstrap";
import { useCallback, useState, useRef } from "react";
import {
  BsArrowLeft,
  BsArrowRight,
  BsCloudUpload,
  BsPlus,
} from "react-icons/bs";
import { fadedown, container } from "../../../../../../animation";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "react-bootstrap-icons";
//import axios from "axios";

const MAX_IMAGES = {
  REGULAR: 3,
  CAR: 10,
  REAL_ESTATE: 10,
};

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
    "All room — wide angle",
    "All bedrooms",
    "Kitchen and bathrooms",
    "Exterior and entrance",
    "Estate or compound if applicable",
  ],
};

export function ImagesUpload({
  setStep,
  formData,
  handleChange,
  errors,
  handleBack,
  validateStep,
}) {
  const next = () => {
    if (!validateStep()) return;

    setStep(7);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const maxImages = MAX_IMAGES[formData.type] || 3;
  const tips = PHOTO_TIPS[formData.type] || PHOTO_TIPS.REGULAR;

  // upload to Cloudinary
  {
    /*  const uploadToCloudinary = async (file) => {
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", "roa_products"); // your Cloudinary preset
      data.append("cloud_name", "your_cloud_name"); // your Cloudinary name
  
      const res = await fetch(
        "https://api.cloudinary.com/v1_1/your_cloud_name/image/upload",
        { method: "POST", body: data }
      );
      const json = await res.json();
      return json.secure_url;
    }; */
  }

  // handle file selection

  {
    /*  const handleFiles = useCallback(
    async (files) => {
      setUploadError("");

      const remaining = maxImages - formData.images.length;
      if (remaining <= 0) {
        setUploadError(`Maximum ${maxImages} photos allowed`);
        return;
      }

      const selected = Array.from(files).slice(0, remaining);

      // validate each file
      for (const file of selected) {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
          setUploadError("Only JPG, PNG and WEBP images are allowed");
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          setUploadError("Each image must be under 5MB");
          return;
        }
      }

      try {
        setUploading(true);

        // upload all selected files
        const urls = await Promise.all(
          selected.map((file) => uploadToCloudinary(file)),
        );

        handleChange("images", [...formData.images, ...urls]);
      } catch (err) {
        console.error(err);
        setUploadError("Upload failed. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [formData.images, maxImages, handleChange],
  ); */
  }

  // remove image
  const removeImage = (index) => {
    const updated = formData.images.filter((_, i) => i !== index);
    handleChange("images", updated);
  };

  // move image (reorder)
  const moveImage = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= formData.images.length) return;
    const updated = [...formData.images];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    handleChange("images", updated);
  };

  // drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = () => {
    setDragOver(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <>
      <motion.div variants={container} initial="hidden" animate="visible">
        {/* heading */}
        <motion.div variants={fadedown} className="mb-5">
          <h3 className=" fs-1 mb-3 fw-bold">Product photos</h3>
          <h5>
            Great photos increase your chances of selling by 80%. Add up to{" "}
            {maxImages} photos.
          </h5>
        </motion.div>

        {/* UPLOAD ZONE */}
        <motion.div variants={fadedown} className="my-5 py-3">
          <div
            className="p-5"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            style={{
              border: `1.5px dashed ${
                dragOver
                  ? "#c7c420b9"
                  : errors.images
                    ? "#e62510b9"
                    : formData.images.length >= maxImages
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(255, 255, 255, 0.35)"
              }`,
              borderRadius: 14,
              textAlign: "center",
              cursor:
                formData.images.length >= maxImages || uploading
                  ? "not-allowed"
                  : "pointer",
              background: dragOver ? "rgba(26, 25, 2, 0.67)" : "#011301",
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
                <p>Uploading photos...</p>
              </div>
            ) : formData.images.length >= maxImages ? (
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
                    marginBottom: 10,
                  }}
                />
                <div className="pb-4">
                  <p className="text-white mb-1">
                    Tap to upload or drag photos here
                  </p>
                  <p className="mb-3">JPG, PNG or WEBP · Max 5MB each</p>
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
                    {formData.images.length}/{maxImages} photos added
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
            onChange={(e) => handleFiles(e.target.files)}
            style={{ display: "none" }}
          />

          {/* Upload error */}
          {uploadError && (
            <p style={{ fontSize: 12, color: "#c0392b", marginTop: 6 }}>
              {uploadError}
            </p>
          )}

          {/* Validation error */}
          {errors.images && (
            <p style={{ fontSize: 12, color: "#c0392b", marginTop: 6 }}>
              {errors.images}
            </p>
          )}
        </motion.div>

        {/* IMAGE GRID */}
        <motion.div variants={fadedown} className="my-5 py-3">
          <div className="d-sm-flex align-items-center justify-content-sm-between mb-4">
            <Form.Label className="mb-1">
              Your photos — drag to reorder
            </Form.Label>
            <p>First photo = cover image</p>
          </div>

          <Row className="g-3">
            {formData.images.map((url, index) => (
              <Col key={url} className="col-6 col-sm-4 col-lg-3">
                {" "}
                <div
                  style={{
                    position: "relative",
                    aspectRatio: "1/1",
                    borderRadius: 10,
                    overflow: "hidden",
                    border:
                      index === 0 ? "2px solid #c9c74c" : "0.5px solid #1a2a1a",
                  }}
                >
                  <img
                    src={url}
                    alt={`Product ${index + 1}`}
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

                  {/* Controls overlay */}
                  <div
                    className="d-flex align-items-center justify-content-center gap-4 gap-lg-5"
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(0, 0, 0, 0.46)",
                      borderRadius: 10,
                      opacity: 0,
                      transition: "opacity 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = 0)}
                  >
                    {/* Move left */}
                    {index > 0 && (
                      <button
                        onClick={() => moveImage(index, index - 1)}
                        type="button"
                        title="Move left"
                        className="text-white next-btn"
                        style={{ fontSize: 25 }}
                      >
                        <ArrowLeft />
                      </button>
                    )}

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="text-danger"
                      style={{
                        background: "none",
                        border: "none",
                      }}
                      title="Remove"
                    >
                      <Trash style={{ fontSize: 25 }} />
                    </button>

                    {/* Move right */}
                    {index < formData.images.length - 1 && (
                      <button
                        type="button"
                        onClick={() => moveImage(index, index + 1)}
                        title="Move right"
                        className="text-white next-btn"
                      >
                        <ArrowRight style={{ fontSize: 25 }} />
                      </button>
                    )}
                  </div>

                  {/* Image number */}
                  <p
                    className="p-1 px-3 p-sm-1 px-sm-3 px-lg-4 p-lg-2 text-white text-white"
                    style={{
                      position: "absolute",
                      bottom: 5,
                      right: 5,
                      background: "rgba(0,0,0,0.5)",
                      borderRadius: "50%",
                    }}
                  >
                    {index + 1}
                  </p>
                </div>
              </Col>
            ))}

            {/* Add more slot */}
            {formData.images.length < maxImages && (
              <Col className="col-6 col-sm-4 col-lg-3">
                <div
                  className="d-flex flex-column align-items-center justify-content-center"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    aspectRatio: "1/1",
                    position: "relative",
                    borderRadius: 10,
                    border: "1px dashed rgba(255, 255, 255, 0.32)",
                    cursor: "pointer",
                    background: "rgba(255,255,255,0.02)",
                    transition: "all 0.15s",
                  }}
                >
                  <BsPlus size={25} />
                  <p>Add more</p>
                </div>
              </Col>
            )}
          </Row>
        </motion.div>

        {/* PHOTO TIPS */}
        <motion.div variants={fadedown} className="my-5 py-3">
          <div
            className="p-4  text-sm-center"
            style={{
              background: "rgba(29, 158, 117, 0.24)",
              border: "0.5px solid rgba(29, 158, 117, 0.46)",
              borderRadius: 12,
            }}
          >
            <h5
              className="mb-3"
              style={{
                color: "#1D9E75",
                fontWeight: 600,
              }}
            >
              📸 Tips for great{" "}
              {formData.type === "CAR"
                ? "vehicle"
                : formData.type === "REAL_ESTATE"
                  ? "property"
                  : "product"}{" "}
              photos:
            </h5>

            <div className="d-flex flex-column gap-3 ">
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
                  <p
                    className="text-start"
                    style={{
                      lineHeight: 1.5,
                    }}
                  >
                    {tip}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>

      <div className="d-flex align-items-center justify-content-between">
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
