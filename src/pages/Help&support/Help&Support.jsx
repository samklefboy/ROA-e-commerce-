import { Container, Stack, Accordion, Form, Row, Col } from "react-bootstrap";
import { useState } from "react";
import {
  FaArrowLeft,
  FaSearch,
  FaShoppingBag,
  FaStore,
  FaWhatsapp,
} from "react-icons/fa";
import {
  FiCreditCard,
  FiMail,
  FiMessageCircle,
  FiShield,
  FiShoppingBag,
  FiTag,
  FiTruck,
  FiTwitter,
} from "react-icons/fi";
import NavTop from "../../components/PageNav";

const FAQS = [
  {
    q: "How do i track my order?",
    a: "Go to my orders, tap the order you want and you'll see a live status showing exactly where your package is. ",
  },
  {
    q: "How do i get a refund",
    a: "Refunds are processed to your wallet within 24-48hrs after the return is confirmed.you can withdraw to your bank anytime.",
  },
  {
    q: "Can i sell on r.o.a?",
    a: "Yes. Tap 'My Store' from the menu to set up your storefront. It's free to open. You only pay a small commission per sale",
  },
  {
    q: "How do i cancel an order?",
    a: "You can cancel within 1 hour of placing it before the store confirms. Go to My Orders -> select order -> tap cancel.",
  },
];

export default function Help_Support() {
  const [search, setSearch] = useState("");

  const filteredFaqs = FAQS.filter((f) =>
    f.q.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
  );

  return (
    <>
      <Container>
        <section className="help_support">
          <NavTop title="Help & support" />

          <div
            style={{
              borderRadius: "27px 27px 0 0",
              background: "#c4bebe1a",
              marginTop: "50px",
              padding: "60px 50px",
            }}
          >
            <h5 className="text-light">
              <b>How can we help?</b>
            </h5>

            <div
              className="d-flex align-items-center gap-2 mt-4 px-3 py-2"
              style={{ border: "1px solid #a0a0a091", borderRadius: "15px" }}
            >
              <FaSearch />{" "}
              <Form.Control
                value={search}
                type="text"
                placeholder="search for answers..."
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div
            className="mb-5"
            style={{
              borderRadius: "0 0 27px 27px ",
              background: "#0000002f",
              padding: "50px",
            }}
          >
            <Row className="g-5">
              {[
                {
                  Icon: FiShoppingBag,
                  topic: "Orders",
                  subTopic: "track, cancel, returns",
                  color: "#f5d106f3",
                  shadow: "#f5d1061a",
                },
                {
                  Icon: FiCreditCard,
                  topic: "Payments",
                  subTopic: "wallets, refunds, cards",
                  color: "#f506e1f3",
                  shadow: "#f506e118",
                },
                {
                  Icon: FaStore,
                  topic: "Selling",
                  subTopic: "store setup, listings",
                  color: "#8403fdf3",
                  shadow: "#8403fd27",
                },
                {
                  Icon: FiTruck,
                  topic: "Delivery",
                  subTopic: "shipping, tracking",
                  color: "#f50626f3",
                  shadow: "#f5062618",
                },
                {
                  Icon: FiShield,
                  topic: "Account & security",
                  subTopic: "login, password, 2FA",
                  color: "#c6c6c9",
                  shadow: "#c6c6c913",
                },
                {
                  Icon: FiTag,
                  topic: "Promos & deals",
                  subTopic: "coupons, flash sales",
                  color: "#3206f5f3",
                  shadow: "#3206f51e",
                },
              ].map((t) => {
                return (
                  <Col className="col-12 col-sm-6 col-md-4">
                    <Stack
                      className="py-5 px-4"
                      style={{
                        background: "#ffffff0e",
                        borderRadius: "20px",
                        letterSpacing: 1.2,
                        boxShadow: `-0 0  12px ${t.shadow}`,
                      }}
                    >
                      <t.Icon size={25} style={{ color: `${t.color}` }} />
                      <h5 className="text-white mt-4">
                        <b>{t.topic}</b>
                      </h5>
                      <small style={{ letterSpacing: 0.7 }}>{t.subTopic}</small>
                    </Stack>
                  </Col>
                );
              })}
            </Row>
          </div>

          <div className="mb-5">
            <h6 className="my-3">FREQUENTLY ASKED</h6>
            <Accordion flush>
              {filteredFaqs.map((faq, i) => {
                return (
                  <Accordion.Item key={i} eventKey={String(i)} className="py-1">
                    <Accordion.Header>{faq.q}</Accordion.Header>
                    <Accordion.Body>{faq.a}</Accordion.Body>
                  </Accordion.Item>
                );
              })}
            </Accordion>
          </div>

          <div>
            <div className="mb-5">
              <h6 className="mb-3">CONTACT US</h6>
              <Row g-5 className="g-4">
                {[
                  {
                    Icon: FiMessageCircle,
                    mode: "Live chat",
                    reach: "Avg. reply 2 min",
                    color: "#06f53af3",
                    avaialable: "online",
                  },
                  {
                    Icon: FaWhatsapp,
                    mode: "Whatsapp",
                    reach: "Mon-Fri, 9am-6pm",
                    color: "#c9f506f3",
                  },
                  {
                    Icon: FiMail,
                    mode: "Email us",
                    reach: "Rely within 24hr",
                    color: "#2903fdf3",
                  },
                  {
                    Icon: FiTwitter,
                    mode: "Twitter / X",
                    reach: "shipping, tracking",
                    color: "#b1acac",
                  },
                ].map((t) => {
                  return (
                    <Col xs={12} className=" col-6 col-lg-3">
                      <Stack
                        className="py-3 px-4"
                        style={{
                          background: "#ffffff0e",
                          borderRadius: "20px",
                          letterSpacing: 1.2,
                          height: "170px",
                        }}
                      >
                        <t.Icon size={25} style={{ color: `${t.color}` }} />
                        <h6 className="text-white mt-4">
                          <b>{t.mode}</b>
                        </h6>
                        <small style={{ letterSpacing: 0.7 }}>{t.reach}</small>

                        {t.avaialable && (
                          <div
                            className="me-auto px-2 mt-3"
                            style={{
                              background: "#06f53a36",
                              color: "#06f53aee",
                              borderRadius: "12px",
                            }}
                          >
                            <Stack direction="horizontal" gap={2}>
                              <div
                                style={{
                                  background: "#06f53aee",
                                  padding: 3,
                                  borderRadius: "50%",
                                }}
                              />
                              <p>{t.avaialable}</p>
                            </Stack>
                          </div>
                        )}
                      </Stack>
                    </Col>
                  );
                })}
              </Row>
            </div>
          </div>
        </section>
      </Container>
    </>
  );
}
