import { Container, Row, Col, Stack } from "react-bootstrap";
import { container, fadeUp } from "../../../utils/animation";
import { motion } from "framer-motion";

const categories = [
  { c: "#f10909", a: "Electronics" },
  { c: "#f16609", a: "Fashion" },
  { c: "#0981f1", a: "Phones" },
  { c: "#09f1a4", a: "Beauty" },
  { c: "#c309f1", a: "Home & Kitchen" },
  { c: "#e2f109", a: "Automobiles" },
  { c: "#f10975", a: "Groceries" },
  { c: "#3ff109", a: "Real Estate" },
  { c: "#c6f109", a: "Agriculture" },
];

export function Categories() {
  return (
    <section style={{ background: "#00331bc2" }}>
      <Container>
        <div className="py-3 pt-5">
          <h3 style={{ color: "#00ffb3" }}>Explore Popular Categories</h3>

          <motion.div
            className="d-flex gap-4 flex-wrap py-5 "
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {categories.map((c) => {
              return (
                <motion.div
                  variants={fadeUp}
                  className="px-3 py-2 my-3 me-2"
                  style={{
                    border: "1px solid #00f84af6",
                    borderRadius: "20px",
                    boxShadow: "0px 5px 11px #00f84a3b",
                  }}
                >
                  <Stack direction="horizontal" gap={3}>
                    <div
                      className="p-1"
                      style={{ background: `${c.c}`, borderRadius: "50%" }}
                    />
                    <p>{c.a}</p>
                  </Stack>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
