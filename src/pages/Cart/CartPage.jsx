import { useState, useCallback, useMemo, useEffect } from "react";
import CartPageHeader from "../../components/CartPageHeader";
import { useNavigate } from "react-router";
import { Container, Row, Col } from "react-bootstrap";
import { container, fadedown } from "../../animation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CartDash,
  Check,
  ChevronRight,
  ShieldCheck,
  Trash,
} from "react-bootstrap-icons";
import { FaShoppingBag, FaStore } from "react-icons/fa";
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  withCredentials: true,
});

// ---- build enriched cart items from backend cart data ----
function buildCartItems(rawCart) {
  return rawCart
    .map((item) => {
      const product = item.product || null;
      const store = item.store || product?.store || null;
      const price = Number(item.price ?? item.unitPrice ?? product?.price ?? 0);
      const quantity = Math.max(1, Number(item.quantity ?? 1));

      return {
        ...item,
        cartId: item.cartId ?? item.id,
        productId: item.productId ?? product?.id,
        storeId: item.storeId ?? store?.id,
        product,
        store,
        price,
        quantity,
        subtotal: Number(item.subtotal ?? price * quantity),
      };
    })
    .filter((item) => item.productId && item.product);
}

// ---- group cart items by store ----
function groupByStore(cartItems) {
  const groups = {};
  cartItems.forEach((item) => {
    const storeId = item.storeId;
    if (!groups[storeId]) {
      groups[storeId] = {
        store: item.store,
        items: [],
      };
    }
    groups[storeId].items.push(item);
  });
  return Object.values(groups);
}

const CartPage = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [rawCart, setRawCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState(null);
  const [selected, setSelected] = useState({});

  // ---- verify authenticated user ----
  useEffect(() => {
    let mounted = true;

    const loadCurrentUser = async () => {
      try {
        setAuthLoading(true);
        setError("");

        const { data } = await api.get("/api/auth/me");
        const currentUser = data?.user ?? data;

        if (!mounted) return;

        if (!currentUser?.id) {
          navigate("/login", {
            replace: true,
            state: { from: "/cart" },
          });
          return;
        }

        setUser(currentUser);
      } catch (err) {
        if (!mounted) return;

        if (err.response?.status === 401) {
          navigate("/login", {
            replace: true,
            state: { from: "/cart" },
          });
          return;
        }

        console.error("Authentication check failed:", err);
        setError(
          err.response?.data?.message ||
            "Unable to verify your account. Please try again.",
        );
      } finally {
        if (mounted) setAuthLoading(false);
      }
    };

    loadCurrentUser();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  // ---- load authenticated user's cart ----
  useEffect(() => {
    if (!user?.id) return;

    let mounted = true;

    const loadCart = async () => {
      try {
        setLoading(true);
        setError("");

        const { data } = await api.get("/api/cart");
        const items = Array.isArray(data) ? data : data?.items || [];

        if (!mounted) return;

        setRawCart(items);
        const sel = {};
        items.forEach((item) => {
          const cartId = item.cartId ?? item.id;
          if (cartId) sel[cartId] = true;
        });
        setSelected(sel);
      } catch (err) {
        if (!mounted) return;

        console.error("Cart loading failed:", err);
        setError(
          err.response?.data?.message ||
            "Unable to load your cart. Please try again.",
        );
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadCart();

    return () => {
      mounted = false;
    };
  }, [user]);

  // ---- enrich cart items — useMemo ----
  const cartItems = useMemo(() => buildCartItems(rawCart), [rawCart]);

  // ---- group by store — useMemo ----
  const storeGroups = useMemo(() => groupByStore(cartItems), [cartItems]);

  // ---- selected items — useMemo ----
  const selectedItems = useMemo(() => {
    return cartItems.filter((i) => selected[i.cartId]);
  }, [cartItems, selected]);

  // ---- cart summary ----
  const summary = useMemo(() => {
    const subtotal = selectedItems.reduce(
      (sum, item) => sum + Number(item.subtotal || 0),
      0,
    );

    return {
      subtotal,
      roaProtected: selectedItems.length > 0,
    };
  }, [selectedItems]);

  // ---- select all toggle ----
  const allSelected =
    cartItems.length > 0 && cartItems.every((i) => selected[i.cartId]);

  const toggleSelectAll = useCallback(() => {
    const sel = {};
    cartItems.forEach((i) => {
      sel[i.cartId] = !allSelected;
    });
    setSelected(sel);
  }, [cartItems, allSelected]);

  // ---- select single item ----
  const toggleSelect = useCallback((cartId) => {
    setSelected((prev) => ({ ...prev, [cartId]: !prev[cartId] }));
  }, []);

  // ---- update quantity — useCallback ----
  const updateQuantity = useCallback(
    async (cartId, delta) => {
      const item = rawCart.find((i) => (i.cartId ?? i.id) === cartId);
      if (!item) return;
      const newQty = Math.max(1, Number(item.quantity || 1) + delta);

      // optimistic update first
      setRawCart((prev) =>
        prev.map((i) =>
          (i.cartId ?? i.id) === cartId ? { ...i, quantity: newQty } : i,
        ),
      );

      try {
        await api.patch(`/api/cart/${cartId}`, { quantity: newQty });
      } catch (err) {
        // revert if fails
        setRawCart((prev) =>
          prev.map((i) =>
            (i.cartId ?? i.id) === cartId
              ? { ...i, quantity: item.quantity }
              : i,
          ),
        );
      }
    },
    [rawCart],
  );

  // ---- remove item — useCallback ----
  const removeItem = useCallback(async (cartId) => {
    setRemoving(cartId);
    try {
      await api.delete(`/api/cart/${cartId}`);
      setRawCart((prev) => prev.filter((i) => (i.cartId ?? i.id) !== cartId));
      setSelected((prev) => {
        const updated = { ...prev };
        delete updated[cartId];
        return updated;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setRemoving(null);
    }
  }, []);

  // ---- remove all selected ----
  const removeSelected = useCallback(async () => {
    const toRemove = Object.keys(selected).filter((id) => selected[id]);
    if (toRemove.length === 0) return;

    try {
      const results = await Promise.allSettled(
        toRemove.map((id) => api.delete(`/api/cart/${id}`)),
      );

      const removedIds = toRemove.filter(
        (_, index) => results[index].status === "fulfilled",
      );

      setRawCart((prev) =>
        prev.filter((item) => !removedIds.includes(item.cartId ?? item.id)),
      );

      setSelected((prev) => {
        const updated = { ...prev };
        removedIds.forEach((id) => delete updated[id]);
        return updated;
      });
    } catch (err) {
      console.error("Removing selected cart items failed:", err);
    }
  }, [selected]);

  // ---- proceed to checkout ----
  const handleCheckout = useCallback(() => {
    if (selectedItems.length === 0) return;
    // pass selected items to checkout via state
    navigate("/checkout", {
      state: {
        cartItems: selectedItems,
        storeGroups: groupByStore(selectedItems),
        summary: {
          subtotal: summary.subtotal,
          roaProtected: summary.roaProtected,
        },
      },
    });
  }, [selectedItems, summary, navigate]);

  // ---- empty cart ----
  const isEmpty = !loading && cartItems.length === 0;

  return (
    <>
      {(authLoading || loading) && (
        <div style={{ padding: "20px 16px" }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: 110,
                background: "#111a11",
                border: "0.5px solid #0e7a0e",
                borderRadius: 14,
                marginBottom: 10,
              }}
            />
          ))}
        </div>
      )}

      {error && !authLoading && (
        <Container>
          <div
            className="p-3 my-4"
            style={{
              background: "rgba(192, 58, 43, 0.12)",
              border: "0.5px solid rgba(192, 58, 43, 0.45)",
              borderRadius: 12,
              color: "#ddd",
            }}
          >
            {error}
          </div>
        </Container>
      )}

      {!authLoading && user && (
        <CartPageHeader
          cartItems={cartItems}
          selectedItems={selectedItems}
          removeSelected={removeSelected}
        />
      )}

      <div className="cart-items-section">
        <Container>
          {/* ---- LOADING ---- */}
          {loading && (
            <div style={{ padding: "20px 16px" }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    height: 110,
                    background: "#111a11",
                    border: "0.5px solid #0e7a0e",
                    borderRadius: 14,
                    marginBottom: 10,
                  }}
                />
              ))}
            </div>
          )}

          {/* ---- EMPTY CART ---- */}
          {isEmpty && (
            <div style={{ textAlign: "center", padding: "80px 24px" }}>
              <CartDash
                className="mb-3"
                style={{
                  fontSize: 60,
                  color: "rgba(255,255,255,0.07)",
                  display: "block",
                }}
              />
              <p
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                Your cart is empty
              </p>
              <p className="mb-2">
                You have not added any products yet. Browse our marketplace to
                find what you need.
              </p>
              <button
                type="button"
                onClick={() => navigate("/shop")}
                style={{
                  padding: "12px 28px",
                  background: "#c7bd39",
                  border: "none",
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#1f1d01",
                  cursor: "pointer",
                }}
              >
                Browse marketplace →
              </button>
            </div>
          )}

          {/* ---- CART CONTENT ---- */}
          {!loading && !isEmpty && (
            <>
              {/* Select all bar */}
              <div
                className="p-3"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "0.5px solid #0e7a0e",
                }}
              >
                <div
                  className="d-flex align-items-center gap-3"
                  style={{
                    cursor: "pointer",
                  }}
                  onClick={toggleSelectAll}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      border: `2px solid ${allSelected ? "#d4d234c5" : "rgba(255,255,255,0.2)"}`,
                      background: allSelected ? "#c9c617e7" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.15s",
                    }}
                  >
                    {allSelected && (
                      <Check style={{ fontSize: 20, color: "#1a1800" }} />
                    )}
                  </div>
                  <p
                    style={{
                      color: allSelected ? "#c9c617e7" : "",
                      fontWeight: allSelected ? 600 : 400,
                    }}
                  >
                    Select all
                  </p>
                </div>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
                  {selectedItems.length} of {cartItems.length} selected
                </span>
              </div>

              {/* Store groups */}
              <div className="my-5">
                <Row className="g-4">
                  <Col className="col-12 col-md-7">
                    <Row>
                      {" "}
                      {storeGroups.map((group) => (
                        <Col>
                          <motion.div
                            variants={container}
                            initial="hidden"
                            animate="visible"
                          >
                            <motion.div
                              variants={fadedown}
                              className="cart-col"
                            >
                              {/* Store header */}
                              <div
                                className="d-flex align-items-center gap-4 p-3 py-2 py-sm-3"
                                onClick={() =>
                                  navigate(`/store/${group.store?.id}`)
                                }
                                style={{
                                  borderBottom: "0.5px solid #0e7a0e",
                                  cursor: "pointer",
                                }}
                              >
                                <div
                                  style={{
                                    width: 35,
                                    height: 35,
                                    borderRadius: 8,
                                    background:
                                      "linear-gradient(135deg, #1a4a1a, #2a6a0a)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                  }}
                                >
                                  <FaStore
                                    style={{ fontSize: 15, color: "#4aaa4a" }}
                                  />
                                </div>
                                <div style={{ flex: 1 }}>
                                  <p
                                    className="text-white mb-sm-1"
                                    style={{
                                      fontWeight: 600,
                                    }}
                                  >
                                    {group.store?.name}
                                  </p>
                                  {group.store?.verified && (
                                    <span
                                      style={{
                                        fontSize: 13,
                                        color: "#1D9E75",
                                        margin: 0,
                                      }}
                                    >
                                      ✓ Verified store
                                    </span>
                                  )}
                                </div>
                                <ChevronRight
                                  style={{ fontSize: 14, color: "#a7a7a7" }}
                                />
                              </div>

                              {/* Cart items in this store */}
                              {group.items.map((item, i) => (
                                <AnimatePresence key={item.cartId}>
                                  {removing !== item.cartId && (
                                    <motion.div
                                      initial={{ opacity: 1, height: "auto" }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.3 }}
                                    >
                                      <div
                                        className="p-3 d-flex gap-3 gap-lg-4"
                                        style={{
                                          borderTop:
                                            i > 0
                                              ? "0.5px solid #0e7a0e"
                                              : "none",
                                          opacity:
                                            removing === item.cartId ? 0.5 : 1,
                                          transition: "opacity 0.2s",
                                        }}
                                      >
                                        {/* Checkbox */}
                                        <div
                                          className="d-flex align-items-center justify-content-center mt-2"
                                          onClick={() =>
                                            toggleSelect(item.cartId)
                                          }
                                          style={{
                                            width: 20,
                                            height: 20,
                                            borderRadius: 6,
                                            border: `2px solid ${selected[item.cartId] ? "#c9c617e7" : "rgba(255, 255, 255, 0.25)"}`,
                                            background: selected[item.cartId]
                                              ? "#c9c617e7"
                                              : "transparent",
                                            cursor: "pointer",
                                            flexShrink: 0,
                                            transition: "all 0.15s",
                                          }}
                                        >
                                          {selected[item.cartId] && (
                                            <Check
                                              style={{
                                                fontSize: 20,
                                                color: "#1a1800",
                                              }}
                                            />
                                          )}
                                        </div>

                                        {/* Product image */}
                                        <div
                                          onClick={() =>
                                            navigate(
                                              `/product/${item.productId}`,
                                            )
                                          }
                                          style={{
                                            width: 72,
                                            height: 72,
                                            borderRadius: 12,
                                            background: "#0e7a0e",
                                            flexShrink: 0,
                                            overflow: "hidden",
                                            cursor: "pointer",
                                          }}
                                        >
                                          {item.product?.images?.[0] ? (
                                            <img
                                              src={item.product.images[0]}
                                              alt={item.product.name}
                                              style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                              }}
                                            />
                                          ) : (
                                            <div
                                              className="d-flex align-items-center justify-content-center"
                                              style={{
                                                width: "100%",
                                                height: "100%",
                                              }}
                                            >
                                              <FaShoppingBag
                                                style={{
                                                  fontSize: 24,
                                                  color:
                                                    "rgba(255,255,255,0.15)",
                                                }}
                                              />
                                            </div>
                                          )}
                                        </div>

                                        {/* Product info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <h5 className="mb-2">
                                            {item.product?.name}
                                          </h5>

                                          {/* Variant badges */}
                                          {item.variant && (
                                            <div className="d-flex flex-wrap gap-2 mb-2">
                                              {Object.entries(item.variant).map(
                                                ([k, v]) => (
                                                  <span
                                                    key={k}
                                                    style={{
                                                      fontSize: 12,
                                                      color:
                                                        "rgba(255, 255, 255, 0.48)",
                                                      background:
                                                        "rgba(255,255,255,0.05)",
                                                      border:
                                                        "0.5px solid rgba(255,255,255,0.08)",
                                                      borderRadius: 5,
                                                      padding: "1px 6px",
                                                    }}
                                                  >
                                                    {k}: {v}
                                                  </span>
                                                ),
                                              )}
                                            </div>
                                          )}

                                          {/* Price + quantity */}
                                          <div className="d-flex align-items-center justify-content-between">
                                            <div>
                                              <span
                                                className="fw-bold "
                                                style={{
                                                  fontSize: 16,
                                                  fontWeight: 700,
                                                  color: "#c9c617e7",
                                                }}
                                              >
                                                ₦
                                                {item.subtotal.toLocaleString()}
                                              </span>
                                              {item.quantity > 1 && (
                                                <span
                                                  className="d-block"
                                                  style={{
                                                    fontSize: 12,
                                                    color:
                                                      "rgba(255, 255, 255, 0.42)",
                                                    margin: 0,
                                                  }}
                                                >
                                                  ₦{item.price.toLocaleString()}{" "}
                                                  each
                                                </span>
                                              )}
                                            </div>

                                            {/* Quantity stepper */}
                                            <div
                                              style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 10,
                                                background: "#0a1a0a",
                                                border: "0.5px solid #0e7a0e",
                                                borderRadius: 10,
                                                padding: "5px 12px",
                                              }}
                                            >
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  updateQuantity(
                                                    item.cartId,
                                                    -1,
                                                  )
                                                }
                                                style={{
                                                  background: "transparent",
                                                  border: "none",
                                                  color:
                                                    item.quantity <= 1
                                                      ? "#333"
                                                      : "#c9c617e7",
                                                  fontSize: 18,
                                                  cursor:
                                                    item.quantity <= 1
                                                      ? "default"
                                                      : "pointer",
                                                  lineHeight: 1,
                                                  padding: 0,
                                                }}
                                              >
                                                −
                                              </button>
                                              <span
                                                style={{
                                                  fontSize: 14,
                                                  fontWeight: 700,
                                                  color: "#eee",
                                                  minWidth: 16,
                                                  textAlign: "center",
                                                }}
                                              >
                                                {item.quantity}
                                              </span>
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  updateQuantity(item.cartId, 1)
                                                }
                                                style={{
                                                  background: "transparent",
                                                  border: "none",
                                                  color: "#c9c617e7",
                                                  fontSize: 18,
                                                  cursor: "pointer",
                                                  lineHeight: 1,
                                                  padding: 0,
                                                }}
                                              >
                                                +
                                              </button>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Remove button */}
                                        <div
                                          onClick={() =>
                                            removeItem(item.cartId)
                                          }
                                          style={{
                                            cursor: "pointer",
                                            flexShrink: 0,
                                          }}
                                        >
                                          <Trash
                                            style={{
                                              fontSize: 16,
                                              color:
                                                "rgba(255, 255, 255, 0.55)",
                                            }}
                                          />
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              ))}

                              {/* Store subtotal */}
                              <div
                                className="px-3 py-2 d-flex align-items-center justify-content-between"
                                style={{
                                  borderTop: "0.5px solid #0e7a0e",
                                }}
                              >
                                <p>Store subtotal</p>
                                <span
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: "#ddd",
                                  }}
                                >
                                  ₦
                                  {group.items
                                    .filter((i) => selected[i.cartId])
                                    .reduce((sum, i) => sum + i.subtotal, 0)
                                    .toLocaleString()}
                                </span>
                              </div>
                            </motion.div>
                          </motion.div>
                        </Col>
                      ))}
                    </Row>
                  </Col>

                  {/* Order summary */}
                  <Col className="col-12 col-md-5">
                    <div>
                      <div
                        className="p-3"
                        style={{
                          background: "#013301ea",
                          border: "0.5px solid #059c05",
                          borderRadius: 14,
                        }}
                      >
                        <p
                          className="mb-2"
                          style={{
                            textTransform: "uppercase",
                            letterSpacing: 1,
                          }}
                        >
                          Order summary
                        </p>

                        {[
                          {
                            label: "Subtotal",
                            val: `₦${summary.subtotal.toLocaleString()}`,
                            color: "#ddd",
                          },
                          {
                            label: "Delivery fee",
                            val: "Calculated at checkout",
                            color: "#ddd",
                          },
                          {
                            label: "Discount",
                            val: "Applied at checkout",
                            color: "#1D9E75",
                          },
                        ].map((row) => (
                          <div
                            key={row.label}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "8px 0",
                              borderBottom:
                                "0.5px solid rgba(255, 255, 255, 0.13)",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 13,
                                color: "rgba(255,255,255,0.4)",
                              }}
                            >
                              {row.label}
                            </span>
                            <p
                              style={{
                                color: row.color,
                              }}
                            >
                              {row.val}
                            </p>
                          </div>
                        ))}

                        <div className="d-flex align-items-center justify-content-between pt-2">
                          <span
                            style={{
                              fontFamily: "'Syne',sans-serif",
                              fontSize: 15,
                              fontWeight: 700,
                              color: "#eee",
                            }}
                          >
                            Subtotal
                          </span>
                          <span
                            style={{
                              fontFamily: "'Syne',sans-serif",
                              fontSize: 20,
                              fontWeight: 800,
                              color: "#c9c617e7",
                            }}
                          >
                            ₦{summary.subtotal.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>

              {/* r.o.a. protection */}
              <div
                className="p-3 d-flex align-items-start gap-3 my-5"
                style={{
                  background: "rgba(29, 158, 117, 0.15)",
                  border: "0.5px solid rgba(29, 158, 117, 0.33)",
                  borderRadius: 12,
                }}
              >
                <ShieldCheck
                  style={{ fontSize: 20, color: "#1D9E75", flexShrink: 0 }}
                />
                <div>
                  <p
                    style={{
                      fontSize: 13,
                      color: "#1D9E75",
                      fontWeight: 600,
                      marginBottom: 3,
                    }}
                  >
                    Protected by r.o.a.
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.35)",
                      lineHeight: 1.5,
                      margin: 0,
                    }}
                  >
                    Your payment is secure. If your order does not arrive or is
                    not as described we will refund you in full.
                  </p>
                </div>
              </div>

              {/* Continue shopping */}
              <div className="my-5">
                <button
                  className="p-3 d-flex align-items-center justify-content-center gap-3"
                  type="button"
                  onClick={() => navigate("/shop")}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "0.5px solid rgba(255, 255, 255, 0.31)",
                    borderRadius: 12,
                    cursor: "pointer",
                    fontFamily: "'Plus Jakarta Sans',sans-serif",
                  }}
                >
                  <ArrowLeft className="text-white" style={{ fontSize: 14 }} />
                  <p className="text-white"> Continue shopping</p>
                </button>
              </div>
            </>
          )}

          {/* ---- STICKY CHECKOUT BAR ---- */}
          {!loading && !isEmpty && (
            <div
              className="py-2"
              style={{
                position: "fixed",
                bottom: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: "100%",
                background: "rgba(10, 26, 10, 0.85)",
                backdropFilter: "blur(10px)",
                borderTop: "0.5px solid #0e7a0e",
                zIndex: 20,
              }}
            >
              <Container>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flexShrink: 0 }}>
                    <p
                      style={{
                        fontFamily: "'Syne',sans-serif",
                        fontWeight: 800,
                        color: "#c9c617e7",
                      }}
                    >
                      ₦{summary.subtotal.toLocaleString()}
                    </p>
                    <p
                      style={{
                        fontSize: 10,
                        color: "rgba(255,255,255,0.3)",
                        margin: 0,
                      }}
                    >
                      {selectedItems.length} item
                      {selectedItems.length !== 1 ? "s" : ""} selected
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={selectedItems.length === 0}
                    style={{
                      flex: 1,
                      padding: 13,
                      background:
                        selectedItems.length === 0 ? "#0e7a0e" : "#c9c617e7",
                      border: "none",
                      borderRadius: 12,
                      fontSize: 14,
                      fontWeight: 700,
                      color: selectedItems.length === 0 ? "#eee" : "#1a1800",
                      cursor:
                        selectedItems.length === 0 ? "not-allowed" : "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {selectedItems.length === 0
                      ? "Select items to checkout"
                      : `Checkout (${selectedItems.length}) →`}
                  </button>
                </div>
              </Container>
            </div>
          )}
        </Container>
      </div>
    </>
  );
};

export default CartPage;
