import {
  Container,
  Row,
  Col,
  Stack,
  Badge,
  Button,
  Card,
} from "react-bootstrap";
import { useState, useEffect } from "react";
import { ApplicationForm } from "./ApplicationForm";
import { ApplicationStepper } from "./ApplicationStepper";
import { LivePreview } from "../../pages/createstore/components/LivePreview";
import { Footer } from "../../pages/Home/components/Footer";
import { fadeUp, zoomIn } from "../../animation";
import { motion } from "framer-motion";
import { BsCheckCircleFill } from "react-icons/bs";
import { ArrowLeft } from "react-bootstrap-icons";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

export default function FormCreation({
  formData,
  setFormData,
  getStore = true,
  addProduct = true,
  title,
  isEditMode,
}) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [isPublish, setIsPublish] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    if (
      (formData.type === "CAR" && step === 5) ||
      (formData.type === "Real_Estate" && step === 5)
    ) {
      setStep === 3;
    }
    setStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ---- submit to backend ----
  const handleSubmit = async (publishStatus) => {
    try {
      setLoading(true);

      const payload = {
        ...formData,

        //type cannot change in edit mode
        ...(isEditMode && { type: undefined }),

        //parse numbers properlybefore sending
        price: parseFloat(formData.price) || 0,
        oldPrice: parseFloat(formData.oldPrice) || null,
        costPrice: parseFloat(formData.costPrice) || null,
        stock: parseInt(formData.stock) || null,

        status: publishStatus, // "ACTIVE" or "DRAFT"
      };

      //remove undefined fields before sending
      Object.keys(payload).forEach(
        (key) => payload[key] === undefined && delete payload[key],
      );

      if (isEditMode) {
        await axios.put(`/api/store/products/${id}`, payload);
      } else {
        await axios.post("/api/store/products", payload);
      }

      // success — navigate to products list
      navigate("/dashboard", {
        state: {
          message: isEditMode
            ? "Product updated successfully  ✓"
            : publishStatus === "DRAFT"
              ? "Product saved as draft"
              : "Product published successfully 🎉",
        },
      });
    } catch (err) {
      console.error("Submit error", err);
    } finally {
      setLoading(false);
    }
  };

  {
    /* if (fetching) {
    return (
      <div
        className="d-flex align-items-center justift-content-center"
        style={{ background: "#0a1a0a", minHeight: "100vh" }}
      >
        <div className="text-center">
          <div
            style={{
              width: 40,
              height: 40,
              border: "0.5px solid #1a2a1a",
              borderTopColor: "#c9a84c",
              borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
              margin: "0 auto 12px",
            }}
          />
          <p>Loading Product...</p>
        </div>
      </div>
    );
  } */
  }

  // if edit mode — fetch existing product and prefill
  {
    /* useEffect(() => {
    if (!isEditMode) return;

    const fetchProduct = async () => {
      try {
        setFetching(true);
        const { data } = await axios.get(`/api/store/products/${id}`);

        // prefill form with existing data
        setFormData(prev => ({
          ...prev,
          ...data,
          listingMeta: data.listingMeta
            ? { ...prev.listingMeta, ...data.listingMeta }
            : prev.listingMeta,
            hasVariants:Boolean(data.productVariants?.length),
        }));

        // skip to step 2 in edit mode
        // type cannot change after publish
        setstep(2);

      } catch (err) {
        console.error("Failes to fetch product:",err);
      } finally {
        setFetching(false);
      }
    };

    fetchProduct();
  }, [id]); */
  }

  return (
    <section>
      <div
        className="fixed-top py-3"
        style={{
          background: "#06240dd7",
          backdropFilter: "blur(30px)",
          WebkitBackdropFilter: "blur(30px)",
        }}
      >
        <Container>
          <div className="d-flex align-items-center gap-5">
            <ArrowLeft
              onClick={step === 1 ? () => navigate(-1) : handleBack}
              color="white"
              size={30}
            />
            <h6 className="text-white">{title}</h6>
          </div>
        </Container>
      </div>
      <section id="store_open" className="form_ref py-5 mt-5">
        <Container>
          <ApplicationStepper
            step={step}
            setStep={setStep}
            addProduct={addProduct}
          />

          <Row className="g-5 align-items-center">
            <Col className={`${addProduct ? "col-12" : "col-lg-6"}`}>
              <ApplicationForm
                setStep={setStep}
                step={step}
                setFormData={setFormData}
                formData={formData}
                setIsPublish={setIsPublish}
                getStore={getStore}
                addProduct={addProduct}
                handleBack={handleBack}
                handleSubmit={handleSubmit}
                loading={loading}
              />
            </Col>

            <Col lg={6} className={`${addProduct ? "d-none" : "d-block"}`}>
              <h1 className="text-center mb-5 text-white">
                Have a glimpse of how your{" "}
                <span style={{ color: "#eeff00" }}> storefront</span> looks
                like{" "}
              </h1>
              <LivePreview store={formData} />
            </Col>
          </Row>
        </Container>
      </section>

      {isPublish && (
        <div className="d-flex justify-content-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            viewport={{ once: true }}
            className="text-center p-5 m-5"
            style={{ boxShadow: "0 0 22px #85831d5e" }}
          >
            <motion.div
              variants={zoomIn}
              initial="hidden"
              animate="visible"
              viewport={{ once: true, amount: 0.25 }}
            >
              <BsCheckCircleFill size={200} className="text-success mb-5" />
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              viewport={{ once: true }}
            >
              <p className="my-5 fs-1 " style={{ color: "#02ffab" }}>
                CONGRATULATIONS !
              </p>
              <h1 className="text-white my-5 py-5">
                Your <span style={{ color: "#ffee00" }}>store</span> have been
                created
              </h1>

              <button
                className="border-0 p-3 fs-4 mb-5"
                style={{
                  background: "#fcf160",
                  fontWeight: 700,
                  borderRadius: "20px",
                }}
              >
                Go to Dashboard
              </button>
            </motion.div>
          </motion.div>
        </div>
      )}

      {getStore && <Footer />}
    </section>
  );
}
