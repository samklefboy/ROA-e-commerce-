import { Card, CardBody } from "react-bootstrap";
import { FaBath, FaBed, FaHeart, FaStore, FaStoreAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { PRODUCT_TYPE_CONFIG } from "./ProductPage";
import { StarFill } from "react-bootstrap-icons";

export default function ProductCard({
  product,
  wished,
  handleWishlist,
  handleAddToCart,
  showWishlist,
  Store,
  Shop,
}) {
  const navigate = useNavigate();

  const productTypeConfig = PRODUCT_TYPE_CONFIG[product.type || "REGULAR"];

  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : null;

  const lowStock = product.stock < product.lowStock;
  const outOfStock = product.stock === 0;

  const isNew =
    product.createdAt &&
    Date.now() - new Date(product.createdAt).getTime() < 7 * 86400000;

  const isHot = (product.soldCount || 0) >= 20;

  const isRegular = !product.type || product.type === "REGULAR";
  const isRealEstate = product.type === "REAL_ESTATE";

  return (
    <Card className="product-card">
      <div style={{ position: "relative" }}>
        {/* Image area */}
        {product.images?.[0] ? (
          <Card.Img src={product.images[0]} alt={product.name} loading="lazy" />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <categoryConfig.Icon
              style={{ fontSize: 40, color: "rgba(255,255,255,0.08)" }}
            />
          </div>
        )}

        {/* Badges */}
        <div style={{ position: "absolute", top: 8, left: 8 }}>
          {Shop && discount && (
            <>
              {discount && (
                <div
                  className={` p-1 fw-bold text-white mb-2  ${isHot ? "d-none" : "d-inline-block"} `}
                  style={{
                    background: "#c0392b",
                    borderRadius: 7,
                  }}
                >
                  <small>-{discount}%</small>
                </div>
              )}
              {isNew && !discount && (
                <small
                  className="fw-bold text-white p-1"
                  style={{
                    background: "#1D9E75",
                    borderRadius: 7,
                  }}
                >
                  NEW
                </small>
              )}
              {isHot && (
                <div>
                  {" "}
                  <small
                    className="fw-bold text-dark py-1 px-2"
                    style={{
                      background: "#ccc929",
                      borderRadius: 7,
                    }}
                  >
                    🔥 HOT
                  </small>
                </div>
              )}
            </>
          )}
        </div>

        {/* Out of stock  */}
        {(Shop && product.status === "OUT_OF_STOCK" && (
          <div
            className="d-flex align-items-center justify-content-center"
            style={{
              position: "absolute",
              inset: 0,
            }}
          >
            <p
              className="px-3 py-1 "
              style={{
                background: "#1a1a1a",
                border: "0.5px solid #2a2a2a",
                borderRadius: 6,
              }}
            >
              Out of stock
            </p>
          </div>
        )) ||
          (Store && outOfStock && (
            <>
              <div
                className="fw-bold text-white p-1 py-0"
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  background: "#f00800",
                  borderRadius: 7,
                }}
              >
                <small>Low stock</small>
              </div>
            </>
          ))}

        {/* low stock */}
        {Store && lowStock && (
          <div
            className="fw-bold text-white p-1 py-0"
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              background: "#f09c00",
              borderRadius: 7,
            }}
          >
            <small>Low stock</small>
          </div>
        )}

        {/* Wishlist button */}
        {showWishlist && (
          <div
            className="d-inline-flex d-flex align-items-center ms-2"
            style={{ position: "absolute", top: 8, right: 8 }}
          >
            <div
              clas
              className={`d-flex align-items-center justify-content-center ${wished ? "wishlist-active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                handleWishlist(product.id);
              }}
              style={{
                background: "rgba(22, 22, 22, 0.73)",
                width: 28,
                height: 28,
                borderRadius: "50%",
                cursor: "pointer",
                color: "#fff",
              }}
            >
              <FaHeart size={15} />
            </div>
          </div>
        )}
      </div>

      <CardBody className="py-0">
        {/* Store + Category */}
        {Shop && (
          <span
            style={{
              display: " -webkit-box",
              WebkitLineClamp: 1,
              webBoxOrient: "vertical",
              color: "#c6c92d",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <FaStoreAlt className="me-2" /> {product.store?.name}
          </span>
        )}

        {/* Name */}
        <div className="my-2 product-name">{product.name}</div>

        {/* Rating — regular only */}
        {Shop && isRegular && product.ratingCount > 0 && (
          <div
            className="my-2"
            style={{ display: "flex", alignItems: "center", gap: 3 }}
          >
            {[1, 2, 3, 4, 5].map((s) =>
              s <= Math.round(product.ratingStars) ? (
                <StarFill key={s} style={{ fontSize: 10, color: "#f3f70b" }} />
              ) : (
                <Star key={s} style={{ fontSize: 10 }} />
              ),
            )}
            <p className="ms-1">({product.ratingCount})</p>
          </div>
        )}

        {/* CAR specs */}
        {Shop && product.type === "VEHICLE" && product.listingMeta && (
          <div className="d-flex flex-column gap-3 my-3">
            {[product.listingMeta.year, product.listingMeta.transmission]
              .filter(Boolean)
              .map((spec) => {
                return (
                  <p className="fs-5" key={spec}>
                    {spec}
                  </p>
                );
              })}
          </div>
        )}

        {/* REAL ESTATE specs preview */}
        {Shop && product.type === "REAL_ESTATE" && product.listingMeta && (
          <div className="d-flex flex-column gap-3 my-3">
            {product.listingMeta.bedrooms && (
              <div className="d-flex align-items-center gap-2">
                <FaBed className="text-white" />{" "}
                <p className="fs-5"> {product.listingMeta.bedrooms}</p>
              </div>
            )}
            {product.listingMeta.bathrooms && (
              <div className="d-flex align-items-center gap-2">
                <FaBath className="text-white" />{" "}
                <p className="fs-5">
                  {" "}
                  {product.listingMeta.bathrooms} bathroom
                  {product.listingMeta.bathrooms !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Price */}
        <div>
          <div className="price">
            ₦{product.price.toLocaleString()}{" "}
            {isRealEstate &&
              product.listingMeta?.listingType === "For rent" && <>/yr</>}
          </div>

          {Shop &&
            product.type === "VEHICLE" &&
            product.listingMeta.negotiable && (
              <span
                className="my-2"
                style={{
                  position: "absolute",
                  top: 240,
                  left: 0,
                  fontSize: 11,
                  color: "#d1e2dd",
                  background: "rgb(29, 158, 117)",
                  borderRadius: 5,
                  padding: "2px 7px",
                }}
              >
                Negotiable
              </span>
            )}
        </div>

        {/* stock and status */}
        {Store && (
          <>
            <div className="d-flex align-items-center gap-2">
              <p>Stock:</p> <p>24 units</p>
            </div>
            <div className="d-flex align-items-center gap-2 mt-3">
              <p>Status:</p>{" "}
              <small
                className=" "
                style={{
                  color: "#61dd0f",
                }}
              >
                Active
              </small>
            </div>
          </>
        )}

        {/* CTA */}
        {(Shop && (
          <button
            onClick={() => handleAddToCart(product)}
            disabled={product.status === "OUT_OF_STOCK"}
            className=" py-1 text-center my-3 d-flex w-100 justify-content-center"
            style={{
              border: `1px solid ${product.status === "OUT_OF_STOCK" ? "#2a2a2a" : productTypeConfig.ctaColor}`,
              background:
                product.status === "OUT_OF_STOCK"
                  ? "#1a1a1ac0"
                  : productTypeConfig.ctaBg,
              color:
                product.status === "OUT_OF_STOCK"
                  ? "#555"
                  : productTypeConfig.ctaText,
              borderRadius: "10px",
              cursor: product.status === "OUT_OF_STOCK" ? "default" : "pointer",
              transition: "all 0.15s",
            }}
          >
            {product.status === "OUT_OF_STOCK"
              ? "Out of stock"
              : productTypeConfig.cta}
          </button>
        )) ||
          (Store && (
            <div>
              {[
                {
                  a: "Edit",
                  bg: "#149ec0e0",
                  border: null,
                  nav: `/seller/products/${product.id}/edit`,
                },
                {
                  a: "Pause",
                  bg: "transparent",
                  border: "#ffffff96",
                  nav: null,
                },
                { a: "Delete", bg: "#f00800de", border: null, nav: null },
              ].map((cta) => {
                return !lowStock ? (
                  <button
                    type="button"
                    key={cta.a}
                    className=" py-1  mx-auto my-4 d-flex w-100 justify-content-center "
                    style={{
                      background: cta.bg,
                      border: cta.border ? `0.5px solid ${cta.border}` : "none",
                      color: "#fff",
                      borderRadius: "12px",
                    }}
                  >
                    {cta.a}
                  </button>
                ) : (
                  <button
                    type="button"
                    key={cta.a}
                    onClick={() => navigate(cta.nav)}
                    className=" py-1  mx-auto my-4 d-flex w-100 justify-content-center "
                    style={{
                      background: "#f00800",
                      border: "none",
                      color: "#fff",
                      borderRadius: "12px",
                    }}
                  >
                    {cta.a}
                  </button>
                );
              })}
            </div>
          ))}
      </CardBody>
    </Card>
  );
}
