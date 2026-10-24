import MainHeader from "../../components/MainHeader";
import { Container, Row, Col, Form } from "react-bootstrap";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import ProductPage from "../../components/product/ProductPage";
import { motion, AnimatePresence } from "framer-motion";
import { FaStore } from "react-icons/fa";
import {
  Filter,
  SortAlphaDownAlt,
  X,
  ArrowClockwise,
} from "react-bootstrap-icons";
import {
  getProducts,
  getProductCategories,
  getFeaturedStores,
  getShoppingBanners,
} from "../../services/shoppingService";

const PAGE_SIZE = 20;

const PRICE_RANGES = [
  { label: "Under ₦5k", min: 0, max: 5000 },
  { label: "₦5k - ₦20k", min: 5000, max: 20000 },
  { label: "₦20k - ₦50k", min: 20000, max: 50000 },
  { label: "₦50k - ₦100k", min: 50000, max: 100000 },
  { label: "₦100k +", min: 100000, max: null },
];

const NIGERIAN_STATES = [
  "Lagos",
  "Kano",
  "Rivers",
  "Ogun",
  "Oyo",
  "Osun",
  "Edo",
  "Akwa Ibom",
  "Ekiti",
  "Anambra",
  "Enugu",
  "Delta",
  "Kaduna",
  "Imo",
  "Plateau",
];

const CONDITION_OPTIONS = ["Brand new", "Fairly used", "Refurbished"];

const SORT_OPTIONS = [
  { key: "newest", label: "Newest first" },
  { key: "popular", label: "Most popular" },
  { key: "rating", label: "Best rated" },
  { key: "low", label: "Price: low to high" },
  { key: "high", label: "Price: high to low" },
  { key: "sold", label: "Most sold" },
];

const EMPTY_FILTERS = {
  priceRange: null,
  condition: [],
  location: [],
  delivery: [],
  minRating: 0,
  verifiedOnly: false,
};

function normalizeCategory(category) {
  if (!category) return null;

  if (typeof category === "string") {
    return category;
  }

  return category.name || category.slug || category.id || null;
}

const ShoppingPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // ---- existing states — all unchanged ----
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [banners, setBanners] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [search, setSearch] = useState(searchParams.get("q") || "");

  const [activeCategory, setActiveCategory] = useState(
    searchParams.get("category") || "All",
  );

  const [sort, setSort] = useState(searchParams.get("sort") || "newest");

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS);

  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const [activeBanner, setActiveBanner] = useState(0);

  const observerRef = useRef(null);
  const searchTimerRef = useRef(null);

  //Prevent old requests from replacing newer results.
  const requestIdRef = useRef(0);

  //Header scroll effect
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  //Load categories, stores and banners, these are independent resources, so failure of one should not prevent the products from loading.
  useEffect(() => {
    const controller = new AbortController();

    const loadShoppingResources = async () => {
      const results = await Promise.allSettled([
        getProductCategories(controller.signal),
        getFeaturedStores(controller.signal),
        getShoppingBanners(controller.signal),
      ]);

      if (controller.signal.aborted) return;

      const [categoriesResult, storesResult, bannersResult] = results;

      if (categoriesResult.status === "fulfilled") {
        setCategories(categoriesResult.value);
      }

      if (storesResult.status === "fulfilled") {
        setStores(storesResult.value);
      }

      if (bannersResult.status === "fulfilled") {
        setBanners(bannersResult.value);
      }
    };

    loadShoppingResources();

    return () => {
      controller.abort();
    };
  }, []);

  // fetch products
  const fetchProducts = useCallback(
    async (pageNumber = 1, reset = false) => {
      const requestId = ++requestIdRef.current;

      const controller = new AbortController();

      try {
        if (pageNumber === 1) {
          setLoading(true);
          setError("");
        } else {
          setLoadingMore(true);
        }

        const result = await getProducts(
          {
            page: pageNumber,
            limit: PAGE_SIZE,

            search,

            category: activeCategory,

            sort,

            priceMin: filters.priceRange?.min,

            priceMax: filters.priceRange?.max,

            condition: filters.condition,

            location: filters.location,

            delivery: filters.delivery,

            minRating: filters.minRating,

            verifiedOnly: filters.verifiedOnly,
          },
          controller.signal,
        );

        /**
         * Ignore stale responses.
         */
        if (requestId !== requestIdRef.current) {
          return;
        }

        const incomingProducts = Array.isArray(result.products)
          ? result.products
          : [];

        setProducts((prev) => {
          if (reset || pageNumber === 1) {
            return incomingProducts;
          }

          /*
           * Prevent duplicate products if the backend returns
           * overlapping pages.
           */
          const existingIds = new Set(prev.map((product) => product.id));

          const newProducts = incomingProducts.filter(
            (product) => !existingIds.has(product.id),
          );

          return [...prev, ...newProducts];
        });

        setPage(result.meta.page);
        setTotalProducts(result.meta.total);
        setHasMore(result.meta.hasNextPage);
      } catch (err) {
        if (err?.name === "CanceledError") {
          return;
        }

        if (err?.code === "ERR_CANCELED") {
          return;
        }

        console.error("Shopping products fetch failed:", err);

        if (pageNumber === 1) {
          setProducts([]);
          setError("We couldn't load products right now. Please try again.");
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }

      return () => {
        controller.abort();
      };
    },
    [activeCategory, filters, search, sort],
  );

  // refresh from first page whenever search  query parameters change.
  useEffect(() => {
    clearTimeout(searchTimerRef.current);

    searchTimerRef.current = setTimeout(() => {
      fetchProducts(1, true);
    }, 350);

    return () => {
      clearTimeout(searchTimerRef.current);
    };
  }, [activeCategory, filters, search, sort, fetchProducts]);

  // this Keep important shopping state in the URL, without letting user loose their search state
  useEffect(() => {
    const nextParams = new URLSearchParams();

    if (search.trim()) {
      nextParams.set("q", search.trim());
    }

    if (activeCategory !== "All") {
      nextParams.set("category", activeCategory);
    }

    if (sort !== "newest") {
      nextParams.set("sort", sort);
    }

    setSearchParams(nextParams, {
      replace: true,
    });
  }, [search, activeCategory, sort, setSearchParams]);

  // fetch on filter/category/sort change
  useEffect(() => {
    fetchProducts(1, true);
  }, [activeCategory, search, sort, filters, fetchProducts]);

  // infinite scroll observer
  useEffect(() => {
    const element = observerRef.current;

    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];

        if (firstEntry.isIntersecting && hasMore && !loading && !loadingMore) {
          fetchProducts(page + 1, false);
        }
      },
      {
        rootMargin: "400px",
        threshold: 0,
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [fetchProducts, hasMore, loading, loadingMore, page]);

  // ---- banner auto rotate ----
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [banners.length]);

  // Category display list.
  const categoryOptions = useMemo(() => {
    const normalized = categories.map(normalizeCategory).filter(Boolean);
    return ["All", ...Array.from(new Set(normalized))];
  }, [categories]);

  // ---- active filter count — useMemo ----
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.priceRange) count++;
    count += filters.condition.length;
    count += filters.location.length;
    count += filters.delivery.length;
    if (filters.minRating) count++;
    if (filters.verifiedOnly) count++;
    return count;
  }, [filters]);

  // Open filter sheet using current applied filters.
  const openFilters = () => {
    setDraftFilters({
      ...filters,
      condition: [...filters.condition],
      location: [...filters.location],
      delivery: [...filters.delivery],
    });
    setFilterOpen(true);
  };

  //Apply filter selections.
  const applyFilters = () => {
    setFilters({
      ...draftFilters,
      condition: [...draftFilters.condition],
      location: [...draftFilters.location],
      delivery: [...draftFilters.delivery],
    });

    setFilterOpen(false);
  };

  //Clear applied filter
  const clearFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setDraftFilters(EMPTY_FILTERS);
  }, []);

  // Remove one individual filter chip.
  const removeFilter = (type, value = null) => {
    setFilters((prev) => {
      if (type === "priceRange") {
        return {
          ...prev,
          priceRange: null,
        };
      }

      if (type === "minRating") {
        return {
          ...prev,
          minRating: 0,
        };
      }

      if (type === "verifiedOnly") {
        return {
          ...prev,
          verifiedOnly: false,
        };
      }

      return {
        ...prev,
        [type]: prev[type].filter((item) => item !== value),
      };
    });
  };

  // Retry failed product request.
  const retryProducts = () => {
    fetchProducts(1, true);
  };

  return (
    <div style={{ position: "relative" }}>
      <MainHeader
        showAuth={!true}
        showWishlist={true}
        searchValue={search}
        setSearch={setSearch}
      />

      {/* Category chips */}
      <div
        className="category_chip py-2"
        style={{
          position: "sticky",
          top: 62,
          zIndex: 2,
          background: scrolled ? "#001a10bb" : "",
          backdropFilter: scrolled ? "blur(5px)" : "",
          WebkitBackdropFilter: scrolled ? "blur(5px)" : "",
          boxShadow: scrolled ? " 0 5px 90px #000000" : "",
        }}
      >
        <Container>
          {/* Category chips */}
          <div className="filter-tab gap-4 gap-lg-5 hide-scrollbar py-2 py-sm-3 ">
            {categoryOptions.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: "4px 15px",
                    fontWeight: isActive ? 600 : 400,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s",
                    border: "none",
                    borderTop: `1px solid ${isActive ? "#dfe689a4" : "#86db9a9d"}`,
                    borderBottom: `1px solid ${isActive ? "#dfe689a4" : "#86db9a9d"}`,
                    background: isActive ? "#a7af343d" : "#86db9a2a",
                    borderRadius: 12,
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                  }}
                >
                  <p
                    style={{
                      color: isActive ? "#eeff00" : "#fff",
                      letterSpacing: 1,
                    }}
                  >
                    {cat}
                  </p>
                </button>
              );
            })}
          </div>
        </Container>
      </div>

      <Container>
        <div style={{ marginTop: "120px" }}>
          {/* ---- PROMO BANNERS — unchanged ---- */}
          {activeCategory === "All" && banners.length > 0 && (
            <div className="my-5 py-2" style={{ position: "relative" }}>
              <AnimatePresence mode="wait">
                <motion.div
                  className="d-flex flex-column px-3 py-4 text-start text-sm-center"
                  key={activeBanner}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.6 }}
                  onClick={() =>
                    banners[activeBanner]?.route &&
                    navigate(banners[activeBanner].route)
                  }
                  style={{
                    background:
                      banners[activeBanner]?.bg ||
                      "linear-gradient(135deg, #1a4a1a, #2d7a0a)",
                    borderRadius: 14,
                    cursor: "pointer",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    {banners[activeBanner]?.tag && (
                      <p
                        style={{
                          textTransform: "uppercase",
                        }}
                      >
                        {banners[activeBanner].tag}
                      </p>
                    )}
                    <h6 className="fs-5 text-white fw-bold my-3 my-lg-4">
                      {banners[activeBanner]?.headline || "Discover r.o.a."}
                    </h6>
                    <p>{banners[activeBanner]?.sub}</p>
                  </div>
                  {banners[activeBanner]?.cta && (
                    <div className="mt-3 mt-lg-4">
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#edfd03",
                        }}
                      >
                        {banners[activeBanner].cta} →
                      </span>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {banners.length > 1 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 5,
                    marginTop: 8,
                  }}
                >
                  {banners.map((_, i) => (
                    <div
                      key={i}
                      onClick={() => setActiveBanner(i)}
                      style={{
                        width: activeBanner === i ? 18 : 6,
                        height: 6,
                        borderRadius: 3,
                        background:
                          activeBanner === i
                            ? "#ccc124ef"
                            : "rgba(255,255,255,0.2)",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ---- FEATURED STORES — unchanged ---- */}
          {activeCategory === "All" && stores.length > 0 && (
            <div className="my-5 ">
              <div
                className="mb-3 mb-lg-4"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <h5 className="text-white">Top stores</h5>
                <p
                  onClick={() => navigate("/stores")}
                  style={{ fontSize: 12, color: "#e7eb0e", cursor: "pointer" }}
                >
                  See all →
                </p>
              </div>
              <div className="filter-tab gap-2 gap-lg-5 py-2">
                {stores.map((store) => (
                  <div
                    key={store.id}
                    onClick={() => navigate(`/store/${store.slug || store.id}`)}
                    style={{
                      flexShrink: 0,
                      width: "100px",
                      textAlign: "center",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      className="mx-auto d-flex flex-column"
                      style={{
                        width: "clamp(65px, 8vw, 100px)",
                        aspectRatio: 1 / 1,
                        borderRadius: 16,
                        background: "#111a11",
                        border: "0.5px solid #175217",
                        overflow: "hidden",
                      }}
                    >
                      {store.logo ? (
                        <img
                          src={store.logo}
                          alt={store.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <FaStore style={{ fontSize: 24 }} />
                      )}
                    </div>
                    <p
                      className="text-white my-2"
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {store.name}
                    </p>
                    <p style={{ color: "#c7c420" }}>
                      ⭐ {Number(store.ratingStars).toFixed(1)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---- FILTER + SORT BAR — unchanged ---- */}
          <div className="my-5 my-5 d-flex align-items-center justify-content-between gap-3">
            <div className="d-flex gap-2 gap-sm-3">
              <button
                type="button"
                onClick={openFilters}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "7px 14px",
                  background: activeFilterCount > 0 ? "#c7c94c1a" : "#002200",
                  border: `0.5px solid ${activeFilterCount > 0 ? "#bdc00db0" : "#62bd62a2"}`,
                  borderRadius: 8,
                  color: activeFilterCount > 0 ? "#d3d008" : "",
                  cursor: "pointer",
                }}
              >
                <p>
                  <Filter size={18} />
                </p>
                <p>Filter</p>
                {activeFilterCount > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      background: "#d3d008",
                      color: "#222100",
                      borderRadius: 10,
                      padding: "0 5px",
                    }}
                  >
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setSortOpen(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "7px 14px",
                  background: "#002200",
                  border: "0.5px solid #62bd62a2",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                <p>
                  {" "}
                  <SortAlphaDownAlt size={20} />
                </p>
                <p className="d-none d-sm-flex">
                  {SORT_OPTIONS.find((option) => option.key === sort)?.label}
                </p>
                <p className="d-sm-none">Sort</p>
              </button>
            </div>
            <div>
              <p>
                {loading
                  ? "Loading..."
                  : `${totalProducts} ${totalProducts === 1 ? "item" : "items"}`}
              </p>
            </div>
          </div>

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <Row className="g-3 mb-4">
              <Col className="col-9">
                {" "}
                <div className="hide-scrollbar gap-3 filter-tab ">
                  {filters.priceRange && (
                    <span className="activeFilterChip">
                      {filters.priceRange.label}{" "}
                      <span
                        onClick={() => removeFilter("priceRange")}
                        style={{ cursor: "pointer", color: "#a0a0a0" }}
                      >
                        ✕
                      </span>
                    </span>
                  )}
                  {filters.condition.map((c) => (
                    <span key={c} className="activeFilterChip">
                      {c}{" "}
                      <span
                        onClick={() => removeFilter("condition", c)}
                        style={{ cursor: "pointer", color: "#a0a0a0" }}
                      >
                        ✕
                      </span>
                    </span>
                  ))}
                  {filters.location.map((l) => (
                    <span key={l} className="activeFilterChip">
                      {l}{" "}
                      <span
                        onClick={() => removeFilter("location", l)}
                        style={{ cursor: "pointer", color: "#a0a0a0" }}
                      >
                        ✕
                      </span>
                    </span>
                  ))}
                  {filters.minRating > 0 && (
                    <span className="activeFilterChip">
                      {filters.minRating}★+{" "}
                      <span
                        onClick={() => removeFilter("minRating")}
                        style={{ cursor: "pointer", color: "#a0a0a0" }}
                      >
                        ✕
                      </span>
                    </span>
                  )}
                  {filters.verifiedOnly && (
                    <span className="activeFilterChip">
                      Verified only{" "}
                      <span
                        onClick={() => removeFilter("verifiedOnly")}
                        style={{ cursor: "pointer", color: "#a0a0a0" }}
                      >
                        ✕
                      </span>
                    </span>
                  )}
                </div>
              </Col>
              <Col className="col-3">
                {" "}
                <span
                  className="ms-2"
                  onClick={clearFilters}
                  style={{
                    color: "#c0392b",
                    borderColor: "rgba(192,57,43,0.3)",
                    background: "rgba(192,57,43,0.06)",
                  }}
                >
                  Clear all
                </span>
              </Col>
            </Row>
          )}

          {/* ================= ERROR ================= */}
          {!loading && error && (
            <div
              className="my-5 p-4 text-center"
              style={{
                background: "#111a11",
                border: "0.5px solid #542020",
                borderRadius: 14,
              }}
            >
              <p className="text-white mb-2">Something went wrong</p>

              <p className="mb-3">{error}</p>

              <button
                type="button"
                onClick={retryProducts}
                style={{
                  border: "none",
                  borderRadius: 9,
                  padding: "9px 16px",
                  background: "#c7c94c",
                  color: "#171700",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <ArrowClockwise className="me-2" />
                Try again
              </button>
            </div>
          )}

          {/* Product grid */}
          {!error && (
            <ProductPage
              product={products}
              Store={false}
              storeFront={false}
              loading={loading}
              selectedCategory={activeCategory}
              setSelectedCategory={setActiveCategory}
              setSort={setSort}
              sort={sort}
              CATEGORIES={categoryOptions}
              loadingMore={loadingMore}
              observerRef={observerRef}
              activeFilterCount={activeFilterCount}
              clearFilters={clearFilters}
              hasMore={hasMore}
              totalProducts={totalProducts}
              filter={false}
              count={false}
            />
          )}

          {/* ---- FILTER SHEET — unchanged ---- */}
          <AnimatePresence>
            {filterOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setFilterOpen(false)}
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(0,0,0,0.6)",
                  zIndex: 100,
                  display: "flex",
                  alignItems: "flex-end",
                }}
              >
                <motion.div
                  className="filter_bottom-sheet"
                  initial={{ y: 400 }}
                  animate={{ y: 0 }}
                  exit={{ y: 400 }}
                  transition={{ type: "spring", damping: 25 }}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    background: "#172417",
                    borderRadius: "20px 20px 0 0",
                    width: "100%",
                    margin: "0 auto",
                    padding: "0 0 32px",
                    maxHeight: "70vh",
                    overflowY: "auto",
                  }}
                >
                  <Container>
                    {" "}
                    <div
                      className="py-4"
                      style={{
                        position: "sticky",
                        top: 0,
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                        borderBottom: "0.5px solid #034903",
                        zIndex: 1,
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 4,
                          background: "#1a2a1a",
                          borderRadius: 2,
                          margin: "0 auto 12px",
                        }}
                      />
                      <div className="d-flex align-items-center justify-content-between">
                        {" "}
                        <p
                          className="text-white fs-5"
                          style={{ fontWeight: 600 }}
                        >
                          Filter products
                        </p>
                        <p
                          onClick={() => {
                            setDraftFilters(EMPTY_FILTERS);
                          }}
                          style={{
                            color: "#c0392b",
                            cursor: "pointer",
                          }}
                        >
                          Clear all
                        </p>
                      </div>
                    </div>
                    <div className="p-3 py-4 px-md-4">
                      <p className="filterSectionLabel">Price range</p>
                      <div className="mb-5 d-flex flex-wrap gap-3">
                        {PRICE_RANGES.map((range) => {
                          const active =
                            draftFilters.priceRange?.label === range.label;
                          return (
                            <button
                              key={range.label}
                              type="button"
                              onClick={() =>
                                setDraftFilters((previous) => ({
                                  ...previous,
                                  priceRange: active ? null : range,
                                }))
                              }
                              style={{
                                padding: "7px 14px",
                                borderRadius: 20,
                                cursor: "pointer",
                                border: `0.5px solid ${active ? "#8ba30570" : "rgba(255,255,255,0.1)"}`,
                                background: active
                                  ? "#5d6d012c"
                                  : "transparent",
                                transition: "all 0.15s",
                              }}
                            >
                              <p
                                style={{
                                  color: active ? "#c2dd29" : "",
                                }}
                              >
                                {range.label}
                              </p>
                            </button>
                          );
                        })}
                      </div>

                      <p className="filterSectionLabel">Condition</p>
                      <div className="d-flex flex-wrap gap-3 mb-5">
                        {CONDITION_OPTIONS.map((cond) => {
                          const active = draftFilters.condition.includes(cond);
                          return (
                            <button
                              key={cond}
                              type="button"
                              onClick={() =>
                                setDraftFilters((prev) => ({
                                  ...prev,
                                  condition: active
                                    ? prev.condition.filter(
                                        (item) => item !== cond,
                                      )
                                    : [...prev.condition, cond],
                                }))
                              }
                              style={{
                                padding: "7px 14px",
                                borderRadius: 20,
                                fontSize: 12,
                                cursor: "pointer",
                                border: `0.5px solid ${active ? "#8ba30570" : "rgba(255,255,255,0.1)"}`,
                                background: active
                                  ? "#5d6d012c"
                                  : "transparent",
                                transition: "all 0.15s",
                              }}
                            >
                              <p style={{ color: active ? "#c2dd29" : "" }}>
                                {cond}
                              </p>
                            </button>
                          );
                        })}
                      </div>

                      <p className="filterSectionLabel">Location</p>
                      <Row className="g-3 mb-5">
                        {NIGERIAN_STATES.map((state) => {
                          const active = draftFilters.location.includes(state);
                          return (
                            <Col
                              className=" col-6 col-md-3 col-lg-2"
                              key={state}
                            >
                              <div
                                className="p-1 px-2"
                                style={{
                                  background: "#054e058c",
                                  border: "0.5px solid #26b8266b",
                                  borderRadius: 8,
                                }}
                              >
                                <Form.Check
                                  id={`location-${state}`}
                                  onChange={() =>
                                    setDraftFilters((prev) => ({
                                      ...prev,
                                      location: active
                                        ? prev.location.filter(
                                            (item) => item !== state,
                                          )
                                        : [...prev.location, state],
                                    }))
                                  }
                                  type="checkbox"
                                  label={<p>{state}</p>}
                                  checked={active}
                                  value={state}
                                />
                              </div>
                            </Col>
                          );
                        })}
                      </Row>

                      <p className="filterSectionLabel">Minimum rating</p>
                      <div className="d-flex gap-3 flex-wrap mb-5">
                        {[0, 3, 4].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() =>
                              setDraftFilters((previous) => ({
                                ...previous,
                                minRating: rating,
                              }))
                            }
                            style={{
                              flex: 1,
                              padding: "9px 0",
                              borderRadius: 10,
                              fontSize: 12,
                              cursor: "pointer",
                              border: `0.5px solid ${
                                draftFilters.minRating === rating
                                  ? "#8ba30570"
                                  : "#1a2a1a"
                              }`,
                              background:
                                draftFilters.minRating === rating
                                  ? "#5d6d012c"
                                  : "#0a1a0a",
                              fontWeight:
                                draftFilters.minRating === rating ? 600 : 400,
                              transition: "all 0.15s",
                            }}
                          >
                            <h6
                              style={{
                                color:
                                  draftFilters.minRating === rating
                                    ? "#c2dd29"
                                    : "",
                              }}
                            >
                              {" "}
                              {rating === 0 ? "All" : `${rating}★ +`}
                            </h6>
                          </button>
                        ))}
                      </div>

                      <div
                        className="d-flex align-items-center justify-content-between py-3"
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            verifiedOnly: !prev.verifiedOnly,
                          }))
                        }
                        style={{
                          cursor: "pointer",
                          borderTop: "0.5px solid #025f02",
                        }}
                      >
                        <div>
                          <p className="text-white mb-2">
                            Verified sellers only
                          </p>
                          <p>Show only products from verified stores</p>
                        </div>
                        <div
                          style={{
                            width: 44,
                            height: 24,
                            borderRadius: 12,
                            background: filters.verifiedOnly
                              ? "#8ba305c2"
                              : "#1a2a1a",
                            position: "relative",
                            transition: "background 0.2s",
                            flexShrink: 0,
                          }}
                        >
                          <div
                            style={{
                              position: "absolute",
                              top: 4,
                              borderRadius: "50%",
                              width: 16,
                              height: 16,
                              background: "#fff",
                              left: filters.verifiedOnly ? 24 : 4,
                              transition: "left 0.2s",
                            }}
                          />
                        </div>
                      </div>

                      {/* Verified */}
                      <div
                        className="d-flex align-items-center justify-content-between py-3"
                        onClick={() =>
                          setDraftFilters((previous) => ({
                            ...previous,
                            verifiedOnly: !previous.verifiedOnly,
                          }))
                        }
                        style={{
                          cursor: "pointer",
                          borderTop: "0.5px solid #025f02",
                        }}
                      >
                        <div>
                          <p className="text-white mb-2">
                            Verified sellers only
                          </p>

                          <p className="mb-0">
                            Show products from verified stores
                          </p>
                        </div>

                        <div
                          style={{
                            width: 44,
                            height: 24,
                            borderRadius: 12,
                            background: draftFilters.verifiedOnly
                              ? "#8ba305c2"
                              : "#1a2a1a",
                            position: "relative",
                          }}
                        >
                          <div
                            style={{
                              position: "absolute",
                              top: 4,
                              left: draftFilters.verifiedOnly ? 24 : 4,
                              width: 16,
                              height: 16,
                              borderRadius: "50%",
                              background: "#fff",
                              transition: "left 0.2s",
                            }}
                          />
                        </div>
                      </div>
                      {/* Action */}

                      <button
                        type="button"
                        onClick={applyFilters}
                        style={{
                          width: "100%",
                          padding: 13,
                          marginTop: 16,
                          background: "#8ba305",
                          border: "none",
                          borderRadius: 12,
                          cursor: "pointer",
                        }}
                      >
                        <h6
                          className="fw-bold"
                          style={{
                            color: "#1a1000",
                          }}
                        >
                          Apply filters
                          {Object.values(draftFilters).some((value) =>
                            Array.isArray(value)
                              ? value.length > 0
                              : Boolean(value),
                          )
                            ? " ✓"
                            : ""}
                        </h6>
                      </button>
                    </div>
                  </Container>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ---- SORT SHEET — unchanged ---- */}
          <AnimatePresence>
            {sortOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSortOpen(false)}
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(0,0,0,0.6)",
                  zIndex: 100,
                  display: "flex",
                  alignItems: "flex-end",
                }}
              >
                <motion.div
                  initial={{ y: 300 }}
                  animate={{ y: 0 }}
                  exit={{ y: 300 }}
                  transition={{ type: "spring", damping: 25 }}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    background: "#111a11",
                    borderRadius: "20px 20px 0 0",
                    width: "100%",
                    margin: "0 auto",
                    paddingBottom: 24,
                  }}
                >
                  <Container>
                    {" "}
                    <div
                      style={{
                        width: 36,
                        height: 4,
                        background: "#1a2a1a",
                        borderRadius: 2,
                        margin: "12px auto 4px",
                      }}
                    />
                    <div className="px-4 px-sm-0">
                      {" "}
                      <div
                        className="py-4"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          borderBottom: "0.5px solid #1a2a1a",
                        }}
                      >
                        <p className="text-white fs-5">Sort by</p>
                        <button
                          type="button"
                          onClick={() => setSortOpen(false)}
                          style={{
                            width: 35,
                            height: 35,
                            borderRadius: "50%",
                            background: "#1a2a1a",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <X className="text-white" size={30} />
                        </button>
                      </div>
                      {SORT_OPTIONS.map((opt) => (
                        <Form.Check
                          className="d-flex gap-3 py-2 py-sm-3"
                          key={opt.key}
                          id={`sort-${opt.key}`}
                          type="radio"
                          value={opt.key}
                          name="shopping-sort"
                          checked={sort === opt.key}
                          label={<h6 className="text-white">{opt.label}</h6>}
                          onChange={(e) => {
                            setSort(e.target.value);
                            setSortOpen(false);
                          }}
                        />
                      ))}
                    </div>
                  </Container>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Container>
    </div>
  );
};

export default ShoppingPage;
