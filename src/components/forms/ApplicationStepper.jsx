import { useEffect, useRef } from "react";

const STEPS_BY_TYPE = {
  REGULAR: [2, 3, 4, 5, 6, 7],
  CAR: [1, 2, 3, 5, 6, 7],
  REALESTATE: [1, 2, 3, 5, 6, 7],
  REAL_ESTATE: [1, 2, 3, 5, 6, 7],
};

const STORE_STEPS = [1, 2, 3, 4];

export function ApplicationStepper({
  step,
  setStep,
  addProduct = false,
  formData,
  getStore = false,
}) {
  const stepRefs = useRef({});

  const productType = formData?.type;
  const productSteps = STEPS_BY_TYPE[productType] ?? STEPS_BY_TYPE.REGULAR;

  const steps = addProduct ? productSteps : getStore ? STORE_STEPS : [];

  useEffect(() => {
    stepRefs.current[step]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [step]);

  if (steps.length === 0) {
    return null;
  }

  return (
    <div
      className="d-flex mb-5"
      style={{ overflowX: "auto", scrollbarWidth: "none" }}
    >
      {steps.map((num, i) => (
        <div
          key={num}
          ref={(element) => {
            stepRefs.current[num] = element;
          }}
          className="d-flex align-items-center flex-shrink-0 "
        >
          <button
            type="button"
            //  onClick={() => setStep(num)}
            aria-current={step === num ? "step" : undefined}
            aria-label={`Go to step ${num}`}
            className={`d-flex align-items-center justify-content-center text-white px-3 py-1 ${
              step === num ? "step_active" : ""
            }`}
            style={{
              border: "1px solid #facc15",
              borderRadius: "50%",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            <span style={{ color: "#fff" }}>{num}</span>
          </button>

          <div
            className={`me-2 ${i === steps.length - 1 ? "d-none" : "d-flex"}`}
            style={{
              flex: "1",
              padding: "3px",
              width: "150px",
              background: "#facc15",
            }}
          />
        </div>
      ))}
    </div>
  );
}
