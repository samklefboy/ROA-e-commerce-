import { Button, Offcanvas, Container, Row, Col, Image } from "react-bootstrap";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import axios from "axios";
import { PRODUCT_TYPE_CONFIG } from "./ProductPage";
import NotFoundState from "./NotFoundState";
import { motion } from "framer-motion";
import { container, fadedown } from "../../animation";
import {
  BorderLeft,
  Building,
  Calendar,
  CarFront,
  Check,
  ChevronRight,
  Phone,
  Share,
  ShieldCheck,
  Star,
  StarFill,
  Whatsapp,
  X,
} from "react-bootstrap-icons";
import {
  FaBath,
  FaBed,
  FaHeart,
  FaMapPin,
  FaShoppingBag,
  FaStarHalfAlt,
  FaStore,
} from "react-icons/fa";
import { FiRefreshCcw, FiTruck } from "react-icons/fi";

export default function ProductDetails({ show, product, onClose, navigate }) {
  const panelRef = useRef(null);

  // ---- states ----
  const [activeImage, setActiveImage] = useState(0);
  const [wished, setWished] = useState(product.isWishlisted || false);
  const [selectedVars, setSelectedVars] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("description");
  const [reviews, setReviews] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);

  // ---- reset when product changes ----
  useEffect(() => {
    if (!product) return;

    // set default variant selections
    if (product.variants && Object.keys(product.variants).length > 0) {
      const defaults = {};
      Object.entries(product.variants).forEach(([key, values]) => {
        if (values?.length > 0) defaults[key] = values[0];
      });
      setSelectedVars(defaults);
    } else {
      setSelectedVars({});
    }

    // scroll to top when new product opens
    if (panelRef.current) {
      panelRef.current.scrollTop = 0;
    }
  }, [product?.id, product]);

  // ---- load reviews when tab changes ----
  useEffect(() => {
    if (activeTab !== "reviews" || !product) return;
    const fetchReviews = async () => {
      try {
        setReviewLoading(true);
        const { data } = await axios.get(`/api/products/${product.id}/reviews`);
        setReviews(data);
      } catch (err) {
        console.error(err);
      } finally {
        setReviewLoading(false);
      }
    };
    fetchReviews();
  }, [activeTab, product]);

  // ---- matched variant — useMemo ----
  const matchedVariant = useMemo(() => {
    if (!product?.productVariants?.length) return null;
    return (
      product.productVariants.find((v) => {
        return Object.entries(selectedVars).every(
          ([key, val]) => v.combination[key] === val,
        );
      }) || null
    );
  }, [product, selectedVars]);

  // ---- display price — useMemo ----
  const currentPrice = useMemo(() => {
    return matchedVariant?.price ?? product?.price ?? 0;
  }, [matchedVariant, product]);

  // ---- variant stock — useMemo ----
  const currentStock = useMemo(() => {
    if (matchedVariant) return matchedVariant.stock ?? 0;
    return product?.stock ?? 999;
  }, [matchedVariant, product]);

  // ---- all variants selected — useMemo ----
  const allSelected = useMemo(() => {
    if (!product?.hasVariants || !product?.variants) return true;
    return Object.keys(product.variants).every((key) =>
      Boolean(selectedVars[key]),
    );
  }, [product, selectedVars]);

  // ---- out of stock — useMemo ----
  const isOutOfStock = useMemo(() => {
    return product?.status === "OUT_OF_STOCK" || currentStock === 0;
  }, [product, currentStock]);

  // ---- discount — useMemo ----
  const discount = useMemo(() => {
    if (!product?.oldPrice) return null;
    return Math.round(
      ((product.oldPrice - product.price) / product.oldPrice) * 100,
    );
  }, [product]);

  // ---- type config — useMemo ----
  const config = useMemo(() => {
    return PRODUCT_TYPE_CONFIG[product.type || "REGULAR"];
  }, [product.type]);

  // buy now — add to cart then go to checkout
  const handleBuyNow = useCallback(async () => {
    if (!allSelected || isOutOfStock) return;
    try {
      setCartLoading(true);
      await axios.post("/api/cart", {
        productId: product.id,
        quantity,
        variant: matchedVariant ? matchedVariant.combination : null,
        variantId: matchedVariant?.id || null,
      });
      navigate("/checkout");
    } catch (err) {
      console.error(err);
    } finally {
      setCartLoading(false);
    }
  }, [
    product.id,
    quantity,
    matchedVariant,
    allSelected,
    isOutOfStock,
    navigate,
  ]);

  // ---- handleAddToCart — useCallback ----
  const handleAddToCart = useCallback(async () => {
    if (!allSelected || isOutOfStock || cartLoading) return;
    try {
      setCartLoading(true);
      await axios.post("/api/cart", {
        productId: product.id,
        quantity,
        variant: Object.keys(selectedVars).length > 0 ? selectedVars : null,
        //  variant:      matchedVariant ? matchedVariant.combination : null,
        variantId: matchedVariant?.id || null,
      });
      setCartSuccess(true);
      setTimeout(() => setCartSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setCartLoading(false);
    }
  }, [
    product.id,
    selectedVars,
    quantity,
    matchedVariant,
    allSelected,
    isOutOfStock,
    cartLoading,
  ]);

  // ---- handleWishlistToggle — useCallback ----
  const handleWishlist = useCallback(async () => {
    try {
      setWished((prev) => !prev);
      await axios.post("/api/wishlist/toggle", { productId: product.id });
    } catch (err) {
      setWished((prev) => !prev);
    }
  }, [product.id]);

  // ---- handleWhatsApp — useCallback ----
  const handleWhatsApp = useCallback(() => {
    const phone = product?.store?.whatsapp?.replace(/\D/g, "");
    const message = encodeURIComponent(
      `Hello, I am interested in your listing: *${product.name}* on r.o.a.\n\nCan you provide more details?`,
    );
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  }, [product]);

  // ---- handleCall — useCallback ----
  const handleCall = useCallback(() => {
    window.open(`tel:${product?.store?.whatsapp}`, "_self");
  }, [product]);

  // ---- handleScheduleVisit — useCallback ----
  const handleScheduleVisit = useCallback(() => {
    onClose();
    navigate(`/product/${product.id}/schedule`);
  }, [product, navigate, onClose]);

  // ---- handleViewStore — useCallback ----
  const handleViewStore = useCallback(() => {
    onClose();
    navigate(`/store/${product.storeId}`);
  }, [product, navigate, onClose]);

  if (!product) return null;

  const isRegular = product.type === "REGULAR" || !product.type;
  const isCar = product.type === "VEHICLE";
  const isRealEstate = product.type === "REAL_ESTATE";

  const tabs = [
    { key: "description", label: "Details" },
    {
      key: "specs",
      label: isRealEstate ? "Amenities" : "Specs",
      show: isCar || isRealEstate,
    },
    {
      key: "reviews",
      label: `Reviews (${product.ratingCount || 0})`,
      show: isRegular,
    },
  ].filter((t) => t.show !== false);

  const screenSize = window.innerWidth < 750;

  if (!product) return <NotFoundState />;

  return (
    <Offcanvas
      key="panel"
      ref={panelRef}
      show={show}
      onHide={onClose}
      placement={screenSize ? "bottom" : "end"}
      className={`product-details offcanvas-product-details ${screenSize && (!screenSize ? "d-none" : "d-flex")}  h-100`}
    >
      {/* ---- DRAG HANDLE + CLOSE ---- */}
      <div
        className="py-4"
        style={{
          position: "sticky",
          top: 0,
          background: "rgba(7, 17, 7, 0.47)",
          backdropFilter: "blur(10px)",
          webkitBackdropFilter: "blur(10px)",
          borderBottom: "0.5px solid #034b03",
          padding: "12px 16px",
          zIndex: 10,
        }}
      >
        <Container>
          {" "}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <p
                className="text-white"
                style={{
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                {isRegular
                  ? product.category
                  : isCar
                    ? "Vehicle listing"
                    : "Property listing"}
              </p>
            </div>
            <div className="d-flex align-items-center gap-4 gap-lg-5">
              {/* Wishlist */}
              <div onClick={handleWishlist} style={{ cursor: "pointer" }}>
                <FaHeart
                  style={{
                    fontSize: 25,
                    color: wished ? "#e6e209" : "#ffffff9c",
                  }}
                />
              </div>
              {/* Share */}
              <div
                onClick={() =>
                  navigator.share?.({
                    title: product.name,
                    url: `${window.location.origin}/product/${product.id}`,
                  })
                }
                style={{ cursor: "pointer" }}
              >
                <Share style={{ fontSize: 25, color: "#ffffff9c" }} />
              </div>
              {/* Close */}
              <div
                onClick={onClose}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.07)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={25} style={{ color: "#ffffff9c" }} />
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Offcanvas.Body className="p-0 py-4 px-2">
        {/* ---- IMAGE GALLERY ---- */}
        <div
          className="px-2 "
          style={{
            position: "relative",
            width: "100%",
            height: "400px",
            background: "#111a11",
            overflow: "hidden",
          }}
        >
          {product.images?.length > 0 ? (
            <Image
              src={product.images[activeImage]}
              alt={product.name}
              style={{
                objectFit: "cover",
                borderRadius: 12,
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #111a11, #1a2a1a)",
              }}
            >
              {isCar ? (
                <CarFront
                  style={{ fontSize: 70, color: "rgba(255,255,255,0.06)" }}
                />
              ) : isRealEstate ? (
                <Building
                  style={{ fontSize: 70, color: "rgba(255,255,255,0.06)" }}
                />
              ) : (
                <FaShoppingBag
                  style={{ fontSize: 70, color: "rgba(255,255,255,0.06)" }}
                />
              )}
            </div>
          )}

          <div
            className="d-flex align-items-center gap-3"
            style={{ position: "absolute", top: 12, left: 12 }}
          >
            {" "}
            {/* Condition/type badge */}
            {(product.condition || product.listingMeta?.listingType) && (
              <div
                className="p-1 px-2"
                style={{
                  fontWeight: 700,
                  borderRadius: 20,
                  background: isRealEstate
                    ? "rgba(27,27,143,0.85)"
                    : "rgba(201, 198, 27, 0.85)",
                }}
              >
                <span
                  style={{
                    color: isRealEstate ? "#fff" : "#1a1a00",
                  }}
                >
                  {product.listingMeta?.listingType || product.condition}
                </span>
              </div>
            )}
            {/* Discount badge */}
            {discount && isRegular && (
              <div
                className="p-1 px-2"
                style={{
                  fontWeight: 700,
                  background: "#c0392b",
                  borderRadius: 20,
                }}
              >
                <span className="text-white"> -{discount}% OFF</span>
              </div>
            )}
          </div>

          {/* Image dots */}
          {product.images?.length > 1 && (
            <div
              style={{
                position: "absolute",
                bottom: 38,
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                gap: 5,
              }}
            >
              {product.images.map((_, i) => (
                <div
                  key={i}
                  onClick={() => setActiveImage(i)}
                  style={{
                    height: 8,
                    borderRadius: 5,
                    cursor: "pointer",
                    width: activeImage === i ? 25 : 10,
                    background: activeImage === i ? "#d7da07" : "#31da07",
                    transition: "all 0.2s",
                  }}
                />
              ))}
            </div>
          )}

          <div
            className="d-flex align-items-center gap-2 justify-content-between w-100 "
            style={{
              position: "absolute",
              bottom: 10,
              left: 20,
            }}
          >
            {/* Keywords */}
            <div>
              {product.keywords?.length > 0 && (
                <div
                  className="py-1 px-2"
                  style={{
                    display: "-webkit-flex",
                    webkitKLineClamp: 1,
                    webkitBoxOrient: "vertical",
                    flexWrap: "no wrap",
                    gap: 12,
                    borderRadius: 5,
                    background: "#00000085",
                  }}
                >
                  {product.keywords.map((kw) => (
                    <p
                      key={kw}
                      style={{
                        color: "rgb(214, 183, 6)",
                      }}
                    >
                      {kw}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Image count */}
            {product.images?.length > 1 && (
              <div
                className=" px-2 me-5"
                style={{
                  background: "rgba(0,0,0,0.5)",
                  borderRadius: 20,
                }}
              >
                <span className="text-white" style={{ fontSize: 15 }}>
                  {activeImage + 1}/{product.images.length}
                </span>
              </div>
            )}
          </div>
        </div>
        <Container>
          <div className="py-4 ">
            {/* Thumbnail row */}
            {product.images?.length > 1 && (
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  overflowX: "auto",
                }}
                className="hide-scrollbar py-3"
              >
                {product.images.map((img, i) => (
                  <div
                    key={i}
                    onClick={() => setActiveImage(i)}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 8,
                      overflow: "hidden",
                      flexShrink: 0,
                      cursor: "pointer",
                      border: `2.5px solid ${activeImage === i ? "#c7ca18" : "transparent"}`,
                    }}
                  >
                    <img
                      src={img}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Main Content */}
            <motion.div
              variants={container}
              initial="hidden"
              animate="visible"
              className="p-3 p-lg-4"
            >
              {/* Category + verified */}
              <motion.div
                variants={fadedown}
                className="d-flex align-items-center justify-content-between"
              >
                <h6 style={{ fontSize: 11, color: "#c9c74c", fontWeight: 600 }}>
                  {product.category} · {product.store?.name}
                </h6>
                {product.store?.verified && (
                  <span
                    style={{
                      fontSize: 12,
                      padding: "2px 8px",
                      borderRadius: 20,
                      background: "rgba(29,158,117,0.1)",
                      color: "#1D9E75",
                      border: "0.5px solid rgba(29,158,117,0.3)",
                    }}
                  >
                    ✓ Verified
                  </span>
                )}
              </motion.div>

              {/* Name */}
              <motion.h2
                variants={fadedown}
                className="text-white my-4 "
                style={{
                  fontSize: "clamp(17px,4vw,22px)",
                  fontWeight: 800,
                  lineHeight: 1.2,
                  marginBottom: 10,
                  fontStyle: "oblique",
                }}
              >
                {product.name}
              </motion.h2>

              {/* Price */}
              <motion.div
                variants={fadedown}
                className="d-flex align-items-center gap-4 my-4 "
              >
                <span
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    color: "#d5d80f",
                  }}
                >
                  ₦{currentPrice.toLocaleString()}
                  {isRealEstate &&
                    product.listingMeta?.listingType === "For rent" && (
                      <span>/yr</span>
                    )}
                </span>
                {product.oldPrice && (
                  <p
                    style={{
                      textDecoration: "line-through",
                    }}
                  >
                    ₦{product.oldPrice.toLocaleString()}
                  </p>
                )}
                {isCar && product.listingMeta?.negotiable && (
                  <p
                    className="p-2"
                    style={{
                      color: "#21c08e",
                      background: "rgba(29, 158, 117, 0.19)",
                      borderRadius: 5,
                    }}
                  >
                    Negotiable
                  </p>
                )}
              </motion.div>

              {/* Rating row — regular only */}
              {isRegular && product.ratingCount > 0 && (
                <motion.div
                  variants={fadedown}
                  className="d-flex align-items-center gap-3 my-4 py-2 py-xl-1 my-xl-5 gap-sm-4"
                >
                  <div style={{ display: "flex", gap: 2 }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <>
                        {s <= Math.round(product.ratingStars) ? (
                          <StarFill
                            style={{ fontSize: 15, color: "#d4d11a" }}
                          />
                        ) : (
                          <Star style={{ fontSize: 15, color: "#d4d11a" }} />
                        )}
                      </>
                    ))}
                  </div>
                  <p>
                    {product.ratingStars} · {product.ratingCount} reviews
                  </p>
                  {product.soldCount > 0 && (
                    <p
                      className="ms-auto fs-sm-5"
                      style={{
                        color: "#1D9E75",
                      }}
                    >
                      ✓ {product.soldCount} sold
                    </p>
                  )}
                </motion.div>
              )}

              <div
                style={{
                  height: "0.5px",
                  background: "#0a960a",
                  margin: "12px 0",
                }}
              />

              {/* ---- VARIANTS — REGULAR only ---- */}
              {config?.showVariants &&
                product.variants &&
                Object.keys(product.variants).length > 0 && (
                  <motion.div
                    variants={fadedown}
                    className="my-4 py-2 py-xl-1 my-xl-5"
                  >
                    {Object.entries(product.variants).map(
                      ([optName, values]) => (
                        <div key={optName} className="py-3">
                          <p className="mb-3">
                            {optName}:
                            <strong style={{ color: "#eee", marginLeft: 6 }}>
                              {selectedVars[optName] || "Select"}
                            </strong>
                          </p>

                          {/* Color swatches */}
                          {optName === "Colours" ? (
                            <div className="d-flex gap-3">
                              {values.map((val) => {
                                const colorMap = {
                                  beige: "#D4B896",
                                  black: "#1a1a1a",
                                  white: "#f5f5f5",
                                  navy: "#1B2A4A",
                                  "awesome navy": "#1B2A4A",
                                  "awesome lilac": "#C8B2D6",
                                  "awesome iceblue": "#A8D4E6",
                                  grey: "#888",
                                  red: "#c0392b",
                                  blue: "#378ADD",
                                  green: "#1D9E75",
                                  yellow: "#e7db28",
                                  orange: "#c9ad33",
                                };
                                const bg =
                                  colorMap[val.toLowerCase()] || "#888";
                                return (
                                  <div
                                    key={val}
                                    onClick={() =>
                                      setSelectedVars((prev) => ({
                                        ...prev,
                                        [optName]: val,
                                      }))
                                    }
                                    title={val}
                                    style={{
                                      width: 31,
                                      height: 31,
                                      borderRadius: "50%",
                                      background: bg,
                                      cursor: "pointer",
                                      border: `2.5px solid ${selectedVars[optName] === val ? "#c9a84c" : "transparent"}`,
                                      outline:
                                        selectedVars[optName] === val
                                          ? "2px solid rgba(201,168,76,0.3)"
                                          : "none",
                                      transition: "all 0.15s",
                                    }}
                                  />
                                );
                              })}
                            </div>
                          ) : (
                            <div className="d-flex flex-wrap gap-3">
                              {values.map((val) => {
                                const isSelected =
                                  selectedVars[optName] === val;
                                // check if out of stock
                                const variantOut =
                                  product.productVariants?.find(
                                    (v) => v.combination[optName] === val,
                                  )?.stock === 0;

                                return (
                                  <button
                                    key={val}
                                    type="button"
                                    onClick={() => {
                                      if (!variantOut) {
                                        setSelectedVars((prev) => ({
                                          ...prev,
                                          [optName]: val,
                                        }));
                                      }
                                    }}
                                    style={{
                                      padding: "7px 16px",
                                      borderRadius: 8,
                                      cursor: variantOut
                                        ? "not-allowed"
                                        : "pointer",
                                      opacity: variantOut ? 0.4 : 1,
                                      textDecoration: variantOut
                                        ? "line-through"
                                        : "none",
                                      border: `0.5px solid ${isSelected ? "#b8b529" : "rgba(255, 255, 255, 0.17)"}`,
                                      background: isSelected
                                        ? "rgba(90, 89, 2, 0.08)"
                                        : "transparent",
                                      transition: "all 0.15s",
                                    }}
                                  >
                                    <p
                                      style={{
                                        color: isSelected ? "#e6e20c" : "",
                                      }}
                                    >
                                      {" "}
                                      {val}
                                    </p>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ),
                    )}

                    {/* Stock info */}
                    {matchedVariant && (
                      <h6
                        className="mt-md-3 mt-1"
                        style={{
                          color: currentStock < 5 ? "#e8d90b" : "#1D9E75",
                          marginTop: 4,
                        }}
                      >
                        {currentStock === 0
                          ? "Out of stock"
                          : currentStock < 5
                            ? `Only ${currentStock} left`
                            : `${currentStock} in stock`}
                      </h6>
                    )}
                  </motion.div>
                )}

              {/* QUANTITY SELECTOR — REGULAR only */}
              {product.type === "REGULAR" && !isOutOfStock && (
                <motion.div variants={fadedown} className="my-4 py-2">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <p className="text-white mb-2">Quantity</p>
                      <p
                        style={{
                          color: currentStock <= 5 ? "#c9c74c" : "",
                          margin: 0,
                        }}
                      >
                        {currentStock <= 5
                          ? `⚠️ Only ${currentStock} left in stock`
                          : `${currentStock} in stock`}
                      </p>
                    </div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 14 }}
                    >
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          background: "#1a2a1a",
                          border: "0.5px solid #015301a2",
                          color: "#cfcc22",
                          fontSize: 18,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        -
                      </button>
                      <span
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: "#eee",
                          minWidth: 24,
                          textAlign: "center",
                        }}
                      >
                        {quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setQuantity((q) => Math.min(currentStock, q + 1))
                        }
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          background: "#1a2a1a",
                          border: "0.5px solid #015301a2",
                          color: "#cfcc22",
                          fontSize: 18,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ---- STORE ROW ---- */}
              <motion.div
                variants={fadedown}
                className="my-4 py-2 py-xl-1 my-xl-5 d-flex align-items-center gap-4 p-3"
                onClick={handleViewStore}
                style={{
                  background: "#001100",
                  border: "0.5px solid #026d0280",
                  borderRadius: 12,
                  cursor: "pointer",
                }}
              >
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 12,
                    background: "linear-gradient(135deg, #1a4a1a, #2a6a0a)",
                    flexShrink: 0,
                  }}
                >
                  {isCar ? (
                    <CarFront style={{ fontSize: 20, color: "#4aaa4a" }} />
                  ) : isRealEstate ? (
                    <Building style={{ fontSize: 20, color: "#4aaa4a" }} />
                  ) : (
                    <FaStore style={{ fontSize: 20, color: "#4aaa4a" }} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <h6
                    style={{
                      fontSize: 13,
                      color: "#ddd",
                      fontWeight: 500,
                      marginBottom: 2,
                    }}
                  >
                    {product.store?.name}
                  </h6>
                  <p className="mt-1 mt-md-2 mt-xl-3 ">
                    {product.store?.verified ? "✓ Verified · " : ""}
                    {product.store?.ratingStars} ★ ·{" "}
                    {isRealEstate
                      ? `${product.store?.totalListings || 0} listings`
                      : isCar
                        ? `${product.store?.totalListings || 0} vehicles`
                        : `${product.store?.followerCount || 0} followers`}
                  </p>
                </div>
                <ChevronRight style={{ color: "#555", fontSize: 20 }} />
              </motion.div>

              {/* Delivery info — regular only */}
              {isRegular && (
                <>
                  <Row className="my-4 py-2 py-xl-1 my-xl-5 g-3">
                    {[
                      {
                        Icon: FiTruck,
                        color: "#c7d133",
                        label: "Delivery",
                        val: product.deliveryTime || "2-3 days",
                      },
                      {
                        Icon: FiRefreshCcw,
                        color: "#1D9E75",
                        label: "Returns",
                        val: "30 days",
                      },
                      {
                        Icon: ShieldCheck,
                        color: "#378ADD",
                        label: "Warranty",
                        val: product.warranty ? "Included" : "N/A",
                      },
                    ].map((d) => (
                      <Col key={d.label}>
                        {" "}
                        <motion.div
                          variants={fadedown}
                          style={{
                            background: "#001600",
                            border: "0.5px solid #04850469",
                            borderRadius: 10,
                            padding: "10px 8px",
                            textAlign: "center",
                          }}
                        >
                          <d.Icon
                            className="mx-auto"
                            style={{
                              fontSize: 22,
                              color: d.color,
                            }}
                          />
                          <p
                            className="py-3"
                            style={{
                              textTransform: "uppercase",
                              letterSpacing: 1,
                            }}
                          >
                            {d.label}
                          </p>
                          <p
                            className="text-white"
                            style={{
                              fontWeight: 500,
                            }}
                          >
                            {d.val}
                          </p>
                        </motion.div>
                      </Col>
                    ))}
                  </Row>
                  <div
                    style={{
                      height: "0.5px",
                      background: "#0a960a",
                      margin: "12px 0",
                    }}
                  />
                </>
              )}

              {/* ---- CAR SPECS ---- */}
              {isCar && product.listingMeta && (
                <motion.div
                  variants={fadedown}
                  className="my-4 py-2 py-xl-1 my-xl-5"
                >
                  {/* Car features */}
                  {product.listingMeta.features?.length > 0 && (
                    <div className="my-4 py-2 py-xl-1 my-xl-5">
                      <p className="fs-5 mb-3">Features</p>
                      <div className="d-flex flex-wrap gap-3">
                        {product.listingMeta.features.map((f) => (
                          <span
                            key={f}
                            style={{
                              fontSize: 13,
                              color: "#1D9E75",
                              background: "rgba(29,158,117,0.08)",
                              border: "0.5px solid rgba(29,158,117,0.2)",
                              borderRadius: 6,
                              padding: "3px 9px",
                            }}
                          >
                            ✓ {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Location map placeholder */}
                  <div className="my-4 py-2 py-xl-1 my-xl-5">
                    <p className="mb-3 fs-5">Location</p>
                    <div
                      style={{
                        height: 100,
                        background: "#001100",
                        border: "0.5px solid #026d0280",
                        borderRadius: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div style={{ textAlign: "center" }}>
                        <FaMapPin
                          className="mb-3"
                          style={{
                            fontSize: 22,
                            color: "#ccc926",
                          }}
                        />
                        <p>{product.listingMeta.location}</p>
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      height: "0.5px",
                      background: "#0a960a",
                      margin: "12px 0",
                    }}
                  />
                </motion.div>
              )}

              {/* ---- REAL ESTATE SPECS ---- */}
              {isRealEstate && product.listingMeta && (
                <>
                  {/* Quick facts */}
                  <Row className="g-3 my-4 py-2 py-xl-1 my-xl-5">
                    {[
                      {
                        Icon: FaBed,
                        color: "#c9a84c",
                        label: "Beds",
                        val: product.listingMeta.bedrooms,
                      },
                      {
                        Icon: FaBath,
                        color: "#378ADD",
                        label: "Baths",
                        val: product.listingMeta.bathrooms,
                      },
                      {
                        Icon: Building,
                        color: "#D4537E",
                        label: "Floor",
                        val: product.listingMeta.floor,
                      },
                      {
                        Icon: CarFront,
                        color: "#1D9E75",
                        label: "Parking",
                        val: product.listingMeta.amenities?.includes(
                          "Parking space",
                        )
                          ? "Yes"
                          : "No",
                      },
                    ]
                      .filter((s) => s.val)
                      .map((s) => (
                        <Col key={s.label} className="col-6">
                          {" "}
                          <motion.div
                            variants={fadedown}
                            className="p-3"
                            style={{
                              background: "#001100",
                              border: "0.5px solid #026d0280",
                              borderRadius: 10,
                              textAlign: "center",
                            }}
                          >
                            <s.Icon
                              style={{
                                fontSize: 22,
                                color: s.color,
                              }}
                            />
                            <p className="text-white fw-bold my-3">{s.val}</p>
                            <p
                              style={{
                                textTransform: "uppercase",
                                letterSpacing: 1,
                                margin: 0,
                              }}
                            >
                              {s.label}
                            </p>
                          </motion.div>
                        </Col>
                      ))}
                  </Row>

                  {/* Location */}
                  <motion.div
                    variants={fadedown}
                    className="my-4 py-2 py-xl-1 my-xl-5"
                  >
                    <p className="fs-5 mb-3">Location</p>
                    <div
                      style={{
                        height: 100,
                        background: "#001100",
                        border: "0.5px solid #026d0280",
                        borderRadius: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div style={{ textAlign: "center" }}>
                        <i
                          className="ti ti-map-pin"
                          style={{
                            fontSize: 22,
                            color: "#c9a84c",
                            display: "block",
                            marginBottom: 5,
                          }}
                        />
                        <p
                          style={{
                            fontSize: 12,
                            color: "rgba(255,255,255,0.4)",
                            margin: 0,
                          }}
                        >
                          {product.listingMeta.hideExactAddress
                            ? product.listingMeta.location
                            : product.listingMeta.address}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Agency/caution fee */}
                  {(product.listingMeta.agencyFee ||
                    product.listingMeta.cautionFee) && (
                    <motion.div
                      variants={fadedown}
                      className="my-4 py-2 py-xl-1 my-xl-5 p-3"
                      style={{
                        background: "#c9c74c2a",
                        border: "0.5px solid #c9c74cd8",
                        borderRadius: 10,
                      }}
                    >
                      <div
                        className="mb-2"
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <p>Agency fee</p>
                        <span style={{ fontSize: 15, color: "#ddd" }}>
                          {product.listingMeta.agencyFee}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <p>Caution fee</p>
                        <span style={{ fontSize: 15, color: "#ddd" }}>
                          {product.listingMeta.cautionFee}
                        </span>
                      </div>
                    </motion.div>
                  )}

                  <div
                    style={{
                      height: "0.5px",
                      background: "#0a960a",
                      margin: "12px 0",
                    }}
                  />
                </>
              )}

              {/* ---- TABS ---- */}
              <motion.div
                variants={fadedown}
                className="mt-4 mt-xl-5 mb-3 mb-xl-4 "
                style={{
                  display: "flex",
                  borderBottom: "0.5px solid #023302",
                }}
              >
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    style={{
                      flex: 1,
                      padding: "10px 8px",
                      fontSize: 12,
                      fontWeight: activeTab === tab.key ? 600 : 400,
                      background: "transparent",
                      border: "none",
                      borderBottom: `2px solid ${activeTab === tab.key ? "#c3c530" : "transparent"}`,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <p
                      style={{ color: activeTab === tab.key ? "#c3c530" : "" }}
                    >
                      {" "}
                      {tab.label}
                    </p>
                  </button>
                ))}
              </motion.div>

              {/* Description tab */}
              {activeTab === "description" && (
                <motion.div variants={fadedown} className="mb-4 mb-xl-5">
                  <p
                    style={{
                      lineHeight: 1.8,
                      display: expanded ? "block" : "-webkit-box",
                      WebkitLineClamp: expanded ? "unset" : 2,
                      WebkitBoxOrient: "vertical",
                      overflow: expanded ? "visible" : "hidden",
                    }}
                  >
                    {product.description}
                  </p>
                  {!expanded && (
                    <span
                      onClick={() => setExpanded(true)}
                      style={{
                        fontSize: 15,
                        color: "#c1c94c",
                        cursor: "pointer",
                        marginTop: 6,
                        display: "inline-block",
                      }}
                    >
                      Read more ↓
                    </span>
                  )}
                </motion.div>
              )}

              {/* Reviews tab — vehicle only */}
              {activeTab === "specs" && isCar && (
                <motion.div variants={fadedown} className="mb-4 mb-xl-5">
                  <Row className="g-3 ">
                    {[
                      { label: "Year", val: product.listingMeta.year },
                      {
                        label: "Mileage",
                        val: product.listingMeta.mileage
                          ? `${Number(product.listingMeta.mileage).toLocaleString()} km`
                          : null,
                      },
                      {
                        label: "Transmission",
                        val: product.listingMeta.transmission,
                      },
                      { label: "Fuel type", val: product.listingMeta.fuel },
                      { label: "Colour", val: product.listingMeta.color },
                      { label: "Body type", val: product.listingMeta.bodyType },
                    ]
                      .filter((s) => s.val)
                      .map((spec) => (
                        <Col key={spec.label} className=" col-6 col-sm-4">
                          {" "}
                          <motion.div
                            variants={fadedown}
                            className="p-3 "
                            style={{
                              background: "#001100",
                              border: "0.5px solid #026d0280",
                              borderRadius: 10,
                            }}
                          >
                            <p
                              className="mb-2 mb-lg-3 "
                              style={{
                                textTransform: "uppercase",
                                letterSpacing: 1,
                              }}
                            >
                              {spec.label}
                            </p>
                            <p
                              style={{
                                fontSize: 13,
                                color: "#ddd",
                                fontWeight: 500,
                                margin: 0,
                              }}
                            >
                              {spec.val}
                            </p>
                          </motion.div>
                        </Col>
                      ))}
                  </Row>
                </motion.div>
              )}

              {/* Reviews tab — real estate only */}
              {activeTab === "specs" && isRealEstate && (
                <motion.div variants={fadedown} className="mb-4 mb-xl-5">
                  {product.listingMeta.amenities?.length > 0 && (
                    <div className="my-4 py-2 py-xl-1 my-xl-5">
                      <Row className="g-3">
                        {product.listingMeta.amenities.map((a) => (
                          <Col key={a} className="col-4">
                            {" "}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <Check
                                style={{ fontSize: 20, color: "#1D9E75" }}
                              />
                              <p> {a}</p>
                            </div>
                          </Col>
                        ))}
                      </Row>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Reviews tab — regular only */}
              {activeTab === "reviews" && isRegular && (
                <motion.div variants={fadedown} style={{ marginBottom: 14 }}>
                  {reviewLoading ? (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        padding: 20,
                      }}
                    >
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          border: "2px solid #1a2a1a",
                          borderTopColor: "#c7c94cfd",
                          borderRadius: "50%",
                          animation: "spin 0.7s linear infinite",
                        }}
                      />
                    </div>
                  ) : reviews.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "30px 0" }}>
                      <FaStarHalfAlt
                        style={{
                          fontSize: 36,
                          color: "rgba(255,255,255,0.1)",
                          display: "block",
                          marginBottom: 10,
                        }}
                      />
                      <p
                        style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}
                      >
                        No reviews yet
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Rating summary */}
                      <div
                        className="p-3"
                        style={{
                          display: "flex",
                          gap: 16,
                          alignItems: "center",
                          marginBottom: 16,
                          background: "rgb(0, 17, 0)",
                          border: " 0.5px solid rgba(2, 109, 2, 0.5)",
                          borderRadius: 12,
                        }}
                      >
                        <div style={{ textAlign: "center" }}>
                          <p
                            style={{
                              fontSize: 40,
                              fontWeight: 800,
                              color: "#c2c521",
                              margin: 0,
                              lineHeight: 1,
                            }}
                          >
                            {product.ratingStars?.toFixed(1)}
                          </p>
                          <div
                            className="my-1"
                            style={{
                              display: "flex",
                              gap: 2,
                              justifyContent: "center",
                              margin: "4px 0",
                            }}
                          >
                            {[1, 2, 3, 4, 5].map((s) => (
                              <>
                                {" "}
                                {s <= Math.round(product.ratingStars) ? (
                                  <StarFill
                                    style={{ fontSize: 11, color: "#c9a84c" }}
                                  />
                                ) : (
                                  <Star
                                    style={{ fontSize: 11, color: "#c9a84c" }}
                                  />
                                )}
                              </>
                            ))}
                          </div>
                          <p>{product.ratingCount} reviews</p>
                        </div>
                        <div style={{ flex: 1 }}>
                          {[5, 4, 3, 2, 1].map((star) => {
                            const count = reviews.filter(
                              (r) => Math.round(r.rating) === star,
                            ).length;
                            const pct = reviews.length
                              ? (count / reviews.length) * 100
                              : 0;
                            return (
                              <div
                                key={star}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                  marginBottom: 3,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 12,
                                    color: "rgba(255,255,255,0.25)",
                                    width: 10,
                                  }}
                                >
                                  {star}
                                </span>
                                <div
                                  style={{
                                    flex: 1,
                                    height: 4,
                                    background: "#1a2a1a",
                                    borderRadius: 2,
                                    overflow: "hidden",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: `${pct}%`,
                                      height: "100%",
                                      background: "#c9c74c",
                                      borderRadius: 2,
                                    }}
                                  />
                                </div>
                                <span
                                  style={{
                                    fontSize: 12,
                                    color: "rgba(255,255,255,0.25)",
                                    width: 22,
                                  }}
                                >
                                  {Math.round(pct)}%
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Review list */}
                      {reviews.map((review) => (
                        <div
                          className="py-3"
                          key={review.id}
                          style={{
                            borderBottom: "0.5px solid #044904",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              marginBottom: 12,
                            }}
                          >
                            <div
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: "50%",
                                background: "#1a2a1a",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <p
                                style={{
                                  fontWeight: 700,
                                  color: "#c9c74c",
                                }}
                              >
                                {review.user?.name?.charAt(0)?.toUpperCase()}
                              </p>
                            </div>
                            <div style={{ flex: 1 }}>
                              <p className="text-white ">{review.user?.name}</p>
                              <span
                                style={{
                                  fontSize: 11,
                                  color: "rgba(255,255,255,0.25)",
                                  margin: 0,
                                }}
                              >
                                {new Date(review.createdAt).toLocaleDateString(
                                  "en-NG",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )}
                              </span>
                            </div>
                            <div style={{ display: "flex", gap: 2 }}>
                              {[1, 2, 3, 4, 5].map((s) => (
                                <>
                                  {" "}
                                  {s <= Math.round(product.ratingStars) ? (
                                    <StarFill
                                      style={{ fontSize: 11, color: "#c9a84c" }}
                                    />
                                  ) : (
                                    <Star
                                      style={{ fontSize: 11, color: "#c9a84c" }}
                                    />
                                  )}
                                </>
                              ))}
                            </div>
                          </div>
                          <p
                            style={{
                              lineHeight: 1.6,
                            }}
                          >
                            {review.comment}
                          </p>
                        </div>
                      ))}
                    </>
                  )}
                </motion.div>
              )}
            </motion.div>
          </div>
        </Container>
      </Offcanvas.Body>
      {/* ---- STICKY BOTTOM CTA ---- */}
      <div
        style={{
          position: "sticky",
          bottom: 0,
          background: "rgba(7, 17, 7, 0.47)",
          backdropFilter: "blur(10px)",
          webkitBackdropFilter: "blur(10px)",
          borderTop: "0.5px solid #034b03",
          padding: "12px 16px",
          zIndex: 10,
        }}
      >
        {/* REGULAR — cart + buy now */}
        {config?.cta === "Add to cart" && (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ flexShrink: 0 }}>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#c7c94c",
                }}
              >
                ₦{(currentPrice * quantity).toLocaleString()}
              </span>
              <p
                style={{
                  fontSize: 10,
                }}
              >
                {quantity > 1
                  ? `${quantity} × ₦${currentPrice.toLocaleString()}`
                  : "Total"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={cartLoading || isOutOfStock || !allSelected}
              style={{
                flex: 1,
                padding: 12,
                background: cartSuccess
                  ? "#1D9E75"
                  : isOutOfStock || !allSelected
                    ? "#1a2a1a"
                    : config?.ctaBg,
                border: `0.5px solid ${cartSuccess ? "rgba(29,158,117,0.4)" : isOutOfStock || !allSelected ? "#1a2a1a" : config?.ctaColor}`,
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 700,
                color: cartSuccess
                  ? "#fff"
                  : isOutOfStock || !allSelected
                    ? "#555"
                    : config?.ctaText,
                cursor:
                  cartLoading || isOutOfStock || !allSelected
                    ? "not-allowed"
                    : "pointer",
                fontFamily: "'Plus Jakarta Sans',sans-serif",
                transition: "all 0.2s",
              }}
            >
              {cartSuccess
                ? "✓ Added to cart"
                : cartLoading
                  ? "Adding..."
                  : isOutOfStock
                    ? "Out of stock"
                    : !allSelected
                      ? "Select all options"
                      : "Add to cart"}
            </button>
            <button
              onClick={handleBuyNow}
              type="button"
              disabled={isOutOfStock || !allSelected}
              style={{
                flex: 1,
                padding: 12,
                background:
                  isOutOfStock || !allSelected ? "#1a2a1a" : "#c6c922",
                border: "none",
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 700,
                color: isOutOfStock || !allSelected ? "#555" : "#191a01",
                cursor:
                  isOutOfStock || !allSelected ? "not-allowed" : "pointer",
              }}
            >
              Buy now
            </button>
          </div>
        )}

        {/* CAR — call + whatsapp */}
        {config?.cta === "Contact seller" && (
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={handleCall}
              style={{
                flex: 1,
                padding: 13,
                background: "rgba(55,138,221,0.12)",
                border: "0.5px solid rgba(55,138,221,0.3)",
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 700,
                color: "#378ADD",
                cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans',sans-serif",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}
            >
              <Phone size={15} /> Call
            </button>
            <button
              type="button"
              onClick={handleWhatsApp}
              style={{
                flex: 2,
                padding: 13,
                background: "linear-gradient(135deg, #1a4a1a, #2d7a0a)",
                border: config?.ctaColor,
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 700,
                color: " #fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}
            >
              <Whatsapp size={15} /> WhatsApp seller
            </button>
          </div>
        )}

        {/* REAL ESTATE — whatsapp + schedule */}
        {config.cta === "Schedule visit " && (
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={handleWhatsApp}
              style={{
                flex: 1,
                padding: 13,
                background: "rgba(55,138,221,0.12)",
                border: "0.5px solid rgba(55,138,221,0.3)",
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 700,
                color: "#378ADD",
                cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans',sans-serif",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}
            >
              <Whatsapp size={15} /> WhatsApp
            </button>
            <button
              type="button"
              onClick={handleScheduleVisit}
              style={{
                flex: 2,
                padding: 13,
                background: "linear-gradient(135deg, #1a4a1a, #2d7a0a)",
                border: "none",
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 700,
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}
            >
              <Calendar size={15} /> Schedule visit
            </button>
          </div>
        )}
      </div>
    </Offcanvas>
  );
}
