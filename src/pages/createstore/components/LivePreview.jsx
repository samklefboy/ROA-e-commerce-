import { Card, Container, Image } from "react-bootstrap";

export function LivePreview({ store }) {
  return (
    <>
      <Card
        className=""
        style={{
          overflowY: "auto",
          boxShadow: "-2px 1px 22px #0e0d0d",
          background: "none",
        }}
      >
        <section
          className="py-5 px-3"
          style={{
            overflow: "hidden",
            position: "relative",
            backgroundImage: `${store.bannerPreview}`,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -55,
              right: -150,
              width: 540,
              height: 540,
              borderRadius: "50%",
              background:
                "radial-gradient(circle,rgba(196, 230, 0, 0.28) ,transparent 58%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 100,
              left: 230,
              width: 520,
              height: 540,
              borderRadius: "50%",
              background:
                "radial-gradient(circle,rgba(180, 200, 0, 0.15),transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "5%",
              left: "-20%",
              width: "90%",
              height: "90%",
              borderRadius: "50%",
              background:
                "radial-gradient(circle,rgba(0,230,118,0.1)5% ,transparent 60%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: -380,
              width: "90%",
              height: "90%",
              borderRadius: "50%",
              background:
                "radial-gradient(circle,rgba(0,230,118,0.1) ,transparent 60%)",
              pointerEvents: "none",
            }}
          />
          <Container fluid>
            <div>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <div
                  className="hero-in"
                  style={{ maxWidth: 780, width: "100%", textAlign: "center" }}
                >
                  {/* Badge pill */}
                  <div style={{ marginBottom: "1.5rem" }}>
                    <span
                      style={{
                        background: "rgba(0,230,118,0.12)",
                        color: "#00E676",
                        border: "1px solid rgba(0,230,118,0.3)",
                        borderRadius: 20,
                        padding: "8px 12px",
                        fontWeight: 700,
                        fontSize: "clamp(8px, 2vw, 13px)",
                        letterSpacing: 1.4,
                        display: "inline-block",
                      }}
                    >
                      ✦ &nbsp;VERIFIED SELLER &nbsp;·&nbsp;{" "}
                      {store.Handle
                        ? `@ ${store.Handle}`
                        : "your handle shows here"}
                    </span>
                  </div>

                  {/* Logo with glow ring + status dot */}
                  <div
                    style={{
                      position: "relative",
                      display: "inline-block",
                      marginBottom: "10px",
                    }}
                  >
                    <div
                      style={{
                        width: 96,
                        height: 96,
                        borderRadius: 24,
                        overflow: "hidden",
                        margin: "0 auto",
                        border: "2.5px solid rgba(0,230,118,0.35)",
                        boxShadow:
                          "0 0 0 5px rgba(0,230,118,0.07),0 18px 50px rgba(0,0,0,0.65)",
                      }}
                    >
                      <img
                        src={store.logoPreview}
                        alt={store.logoPreview}
                        className="img-fluid"
                      />
                    </div>
                    <span
                      style={{
                        position: "absolute",
                        bottom: 4,
                        right: 4,
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        background: "#00E676",
                        border: "2.5px solid #0d1117",
                      }}
                    />
                  </div>

                  {/* Store name */}
                  <h1
                    className="fw-bold mt-1 mb-4"
                    style={{
                      color: "#f0f6fc",
                      fontSize: "clamp(2.1rem,4vw,3.8rem)",
                      lineHeight: 2,
                      letterSpacing: "-0.99px",
                    }}
                  >
                    {store.Name || "your store name appears here"}
                  </h1>

                  {/* Tagline */}
                  <p
                    className="mx-auto mb-4 text-light "
                    style={{
                      fontSize: "20px",
                      lineHeight: 1.72,
                    }}
                  >
                    {store.tagline || "your tagline appears here"}
                  </p>

                  {/* Meta */}
                  <p
                    style={{
                      color: "#a0a0a0 ",
                      fontSize: "clamp(11.3px, 3vw, 14px)",
                      lineHeight: 1.7,
                    }}
                  >
                    <span className="text-warning fs-5">
                      {" "}
                      {store.Category || "store category displays here"}
                    </span>{" "}
                    &nbsp;·&nbsp; 📍{store.state || "your state appears here"}{" "}
                    &nbsp;·&nbsp;
                    {store.city || "your country appears here"}
                  </p>

                  {/* description */}
                  <div
                    className=" mx-auto px-2 py-1 my-5 d-inline-flex "
                    style={{
                      background:
                        "linear-gradient(40deg, #f3f3aa6e, #baf7a75d)",
                    }}
                  >
                    <h6 className="text-light">
                      {store.description || "your description shows here"}
                    </h6>
                  </div>

                  {/* CTAs */}
                  <div
                    className="hero-ctas d-flex gap-3 mb-3  "
                    style={{
                      justifyContent: "center",
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        background: "#00E676",
                        border: "none",
                        color: "#000",
                        borderRadius: 12,
                        fontWeight: 700,
                        fontSize: "0.7rem",
                        padding: "15px",
                        boxShadow: "0 8px 28px rgba(0,230,118,0.38)",
                        transition: "all 0.22s",
                      }}
                    >
                      Shop All STORE_PRODUCTS
                    </div>

                    <div
                      style={{
                        background: "rgba(255,255,255,0.07)",
                        border: "1px solid rgba(255,255,255,0.18)",
                      }}
                    >
                      <h6 className=" fw-bold">♡ Follow Store</h6>
                    </div>
                  </div>

                  {/* Stats strip */}
                  <div
                    style={{
                      borderTop: "1px solid rgba(255,255,255,0.07)",
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </Container>
        </section>
      </Card>
    </>
  );
}
