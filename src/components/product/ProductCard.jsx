import { Card, CardBody } from "react-bootstrap";
import { FaBath, FaBed, FaCar, FaHeart, FaStoreAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { PRODUCT_TYPE_CONFIG } from "./ProductPage";
import { StarFill, Star, Building } from "react-bootstrap-icons";

function formatPrice(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "₦0";
  }

  return `₦${amount.toLocaleString("en-NG")}`;
}

function calculateDiscount(oldPrice, price) {
  const oldAmount = Number(oldPrice);
  const currentAmount = Number(price);

  if (
    !Number.isFinite(oldAmount) ||
    !Number.isFinite(currentAmount) ||
    oldAmount <= currentAmount ||
    oldAmount <= 0
  ) {
    return null;
  }

  return Math.round(((oldAmount - currentAmount) / oldAmount) * 100);
}

function ProductImage({ product }) {
  if (product.images?.[0]) {
    return (
      <Card.Img
        src={product.images[0]}
        alt={product.name || "Product"}
        loading="lazy"
      />
    );
  }
  const Icon =
    product.type === "CAR"
      ? FaCar
      : product.type === "REAL_ESTATE"
        ? Building
        : FaStoreAlt;

  return (
    <div
      style={{
        width: "100%",
        aspectRatio: "1 / 1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon
        size={40}
        style={{
          color: "rgba(255,255,255,0.1)",
        }}
      />
    </div>
  );
}

function Rating({ product }) {
  const rating = Number(product.ratingAvg ?? 0);

  const ratingCount = Number(product.ratingCount ?? 0);

  if (ratingCount <= 0) {
    return null;
  }

  const rounded = Math.max(0, Math.min(5, Math.round(rating)));

  return (
    <div
      className="my-2"
      style={{ display: "flex", alignItems: "center", gap: 3 }}
    >
      {[1, 2, 3, 4, 5].map((star) =>
        star <= rounded ? (
          <StarFill
            key={star}
            size={10}
            style={{
              color: "#f3f70b",
            }}
          />
        ) : (
          <Star
            key={star}
            size={10}
            style={{
              color: "rgba(255,255,255,0.25)",
            }}
          />
        ),
      )}

      <span
        className="ms-1"
        style={{
          fontSize: 10,
          color: "rgba(255,255,255,0.45)",
        }}
      >
        ({ratingCount})
      </span>
    </div>
  );
}

export default function ProductCard({
  product,
  wished,
  handleWishlist,
  handleAddToCart,
  showWishlist,
  Store,
  onSelect,
  Shop,
}) {
  const navigate = useNavigate();

  if (!product) {
    return null;
  }

  const productTypeConfig =
    PRODUCT_TYPE_CONFIG[product.type || "REGULAR"] ||
    PRODUCT_TYPE_CONFIG.REGULAR;

  const discount = calculateDiscount(product.oldPrice, product.price);

  const stock = Number(product.stock);

  const hasStock = Number.isFinite(stock);

  const outOfStock =
    product.status === "OUT_OF_STOCK" || (hasStock && stock <= 0);

  const lowStockThreshold = Number(
    product.lowStockThreshold ?? product.lowStock ?? 5,
  );

  const lowStock = hasStock && stock > 0 && stock <= lowStockThreshold;

  const createdTime = product.createdAt
    ? new Date(product.createdAt).getTime()
    : NaN;

  const isNew =
    Number.isFinite(createdTime) &&
    Date.now() - createdTime < 7 * 24 * 60 * 60 * 1000;

  const isHot = Number(product.soldCount ?? 0) >= 20;

  const isCar = product.type === "CAR";

  const isRealEstate = product.type === "REAL_ESTATE";

  const isRegular = product.type === "REGULAR";

  const meta = product.listingMeta || {};

  // Wishlist click
  const handleWish = (e) => {
    e.stopPropagation();

    if (typeof handleWishlist === "function") {
      handleWishlist(product.id);
    }
  };

  // Cart click
  const handleCart = (e) => {
    e.stopPropagation();

    if (outOfStock) {
      return;
    }

    if (typeof handleAddToCart === "function") {
      handleAddToCart(product);
    }
  };

  //Card click
  const handleSelect = () => {
    if (typeof onSelect === "function") {
      onSelect(product);
    }
  };

  return (
    <Card
      className="product-card"
      onClick={handleSelect}
      style={{
        position: "relative",
        overflow: "hidden",
        cursor: onSelect ? "pointer" : "default",
      }}
    >
      <div style={{ position: "relative" }}>
        {/* Image area */}
        <ProductImage product={product} />

        {/* Badges */}
        {Shop && (
          <div style={{ position: "absolute", top: 8, left: 8 }}>
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
            {isNew && !discount && !isHot && (
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
              <small
                className="fw-bold text-dark py-1 px-2"
                style={{
                  background: "#ccc929",
                  borderRadius: 7,
                }}
              >
                🔥 HOT
              </small>
            )}
          </div>
        )}

        {/* Out of stock  */}
        {Shop && outOfStock && (
          <div
            className="d-flex align-items-center justify-content-center"
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              zIndex: 1,
            }}
          >
            <p
              className="px-3 py-1 "
              style={{
                background: "#151515",
                color: "#fff",
                borderRadius: 6,
              }}
            >
              Out of stock
            </p>
          </div>
        )}

        {/* low stock */}
        {Store && lowStock && (
          <div
            className="fw-bold text-white p-1 py-0"
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              background: "#d41c16d5",
              borderRadius: 7,
            }}
          >
            <small>Low stock</small>
          </div>
        )}

        {/* Wishlist button */}
        {showWishlist && Shop && (
          <div
            className="d-inline-flex d-flex align-items-center ms-2"
            style={{ position: "absolute", top: 8, right: 8 }}
          >
            <div
              className={`d-flex align-items-center justify-content-center ${wished ? "wishlist-active" : ""}`}
              aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
              onClick={handleWish}
              style={{
                background: "rgba(22, 22, 22, 0.73)",
                width: 28,
                height: 28,
                borderRadius: "50%",
                cursor: "pointer",
                color: "#fff",
              }}
            >
              <FaHeart
                size={15}
                style={{
                  fill: wished ? "#f7d932" : "transparent",
                  stroke: "currentColor",
                  strokeWidth: wished ? 0 : 20,
                }}
              />
            </div>
          </div>
        )}
      </div>

      <CardBody className="py-0">
        {/* Store + Category */}
        {Shop && (
          <div
            className="d-flex align-items-center gap-2"
            style={{ maxWidth: 0 }}
          >
            <FaStoreAlt
              style={{
                color: "#c9c74c",
                flexShrink: 0,
                fontSize: 10,
              }}
            />

            <span
              style={{
                color: "#c6c92d",
                overflow: "hidden",
                fontSize: 10,
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {" "}
              {product.store?.name || product.storeName || "ROA Store"}
            </span>

            {product.store?.verified && (
              <span
                style={{
                  color: "#1D9E75",
                  fontSize: 10,
                }}
              >
                ✓
              </span>
            )}
          </div>
        )}

        {/* Name */}
        <div className="my-2 product-name">
          {product.name || "Untitled product"}
        </div>

        {/* Rating — regular only */}
        {Shop && isRegular && <Rating product={product} />}

        {/* CAR info */}
        {Shop && isCar && (
          <div
            className="d-flex flex-wrap gap-2 my-3"
            style={{ color: "#a0a0a0", fontSize: 11 }}
          >
            {meta.year && <span>{meta.year}</span>}

            {meta.transmission && <span>• {meta.transmission}</span>}

            {meta.mileage && <span>• {meta.mileage} km</span>}
          </div>
        )}

        {/* Property listing */}
        {Shop && isRealEstate && (
          <div
            className="d-flex flex-wrap gap-3 my-3"
            style={{ color: "#a0a0a0", fontSize: 11 }}
          >
            {meta.bedrooms != null && (
              <span className="d-flex align-items-center gap-1">
                <FaBed />
                {meta.bedrooms} bed
              </span>
            )}

            {meta.bathrooms != null && (
              <span className="d-flex align-items-center gap-1">
                <FaBath />
                {meta.bathrooms} bath
              </span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="d-flex align-items-center flex-wrap gap-2">
          <div className="price">
            {formatPrice(product.price)}
            {isRealEstate &&
              product.listingMeta?.listingType === "For rent" && <>/yr</>}
          </div>

          {discount && (
            <span
              style={{
                color: "#a0a0a0",
                textDecoration: "line-through",
                fontSize: 10,
              }}
            >
              {formatPrice(product.oldPrice)}
            </span>
          )}

          {Shop && isCar && meta.negotiable && (
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
          <div
            className="mt-3 pt-2"
            style={{
              borderTop: "1px solid rgba(255, 255, 255, 0.09)",
            }}
          >
            <div className="d-flex justify-content-between">
              <p>Stock:</p>{" "}
              <span
                style={{
                  fontSize: 11,
                  color: "#fff",
                }}
              >
                {hasStock ? `${stock} units` : "N/A"}
              </span>
            </div>
            <div className="d-flex justify-content-between mt-2">
              <p>Status:</p>{" "}
              <small
                className=" "
                style={{
                  color:
                    product.status === "ACTIVE"
                      ? "#61dd0f"
                      : product.status === "OUT_OF_STOCK"
                        ? "#f00800"
                        : "#c9c74c",
                }}
              >
                {product.status || "ACTIVE"}
              </small>
            </div>
          </div>
        )}

        {/* CTA */}
        {(Shop && (
          <button
            onClick={isRegular ? handleCart : handleSelect}
            disabled={outOfStock}
            className=" py-2 text-center my-3 w-100 "
            style={{
              border: `1px solid ${productTypeConfig.ctaColor}`,
              background: outOfStock ? "#1a1a1ac0" : productTypeConfig.ctaBg,
              color: outOfStock ? "#555" : productTypeConfig.ctaText,
              borderRadius: 10,
              fontSize: 12,
              cursor: outOfStock ? "not-allowed" : "pointer",
              transition: "all 0.15s",
            }}
          >
            {outOfStock ? "Out of stock" : productTypeConfig.cta}
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
                { a: "Delete", bg: "#f0342dee", border: null, nav: null },
              ].map((cta) => {
                return !lowStock ? (
                  <button
                    type="button"
                    key={cta.a}
                    onClick={() => navigate(cta.nav)}
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
