import MainHeader from "../../components/MainHeader";
import { Container, Row, Col, Form } from "react-bootstrap";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import ProductPage from "../../components/product/ProductPage";
import { motion, AnimatePresence } from "framer-motion";
import { FaStore } from "react-icons/fa";
import { Filter, SortAlphaDownAlt, X } from "react-bootstrap-icons";

const PRICE_RANGES = [
  { label: "Under ₦5k", min: 0, max: 5000 },
  { label: "₦5k - ₦20k", min: 5000, max: 20000 },
  { label: "₦20k - ₦50k", min: 20000, max: 50000 },
  { label: "₦50k - ₦100k", min: 50000, max: 100000 },
  { label: "₦100k +", min: 100000, max: Infinity },
];

const NIGERIAN_STATES = [
  "Lagos",
  "Abuja",
  "Kano",
  "Rivers",
  "Ogun",
  "Oyo",
  "Osun",
  "Rivers",
  "Edo",
  "Akwaibom",
  "Ekiti",
  "Anambra",
  "Enugu",
  "Delta",
  "Kaduna",
  "Imo",
  "Plateau",
];

const SORT_OPTIONS = [
  { key: "newest", label: "Newest first" },
  { key: "popular", label: "Most popular" },
  { key: "rating", label: "Best rated" },
  { key: "low", label: "Price: low to high" },
  { key: "high", label: "Price: high to low" },
  { key: "sold", label: "Most sold" },
];

const ShoppingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [scrolled, setScrolled] = useState(false);

  // ---- existing states — all unchanged ----
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [activeCategory, setActiveCategory] = useState(
    searchParams.get("category") || "All",
  );
  const [sort, setSort] = useState("newest");
  const [activeBanner, setActiveBanner] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const [filters, setFilters] = useState({
    priceRange: null,
    condition: [],
    location: [],
    delivery: [],
    minRating: 0,
    verifiedOnly: false,
  });

  const observerRef = useRef(null);

  // fetch products
  const fetchProducts = useCallback(
    async (pageNum = 1, reset = false) => {
      try {
        if (pageNum === 1) setLoading(true);
        else setLoadingMore(true);

        const params = new URLSearchParams({
          page: pageNum,
          limit: 20,
          category: activeCategory !== "All" ? activeCategory : "",
          search,
          sort,
          ...(filters.priceRange && {
            priceMin: filters.priceRange.min,
            priceMax:
              filters.priceRange.max === Infinity ? "" : filters.priceRange.max,
          }),
          ...(filters.minRating && { minRating: filters.minRating }),
          ...(filters.verifiedOnly && { verifiedOnly: true }),
          ...(filters.condition.length && {
            condition: filters.condition.join(","),
          }),
          ...(filters.location.length && {
            location: filters.location.join(","),
          }),
        });

        const { data } = await axios.get(`/api/products?${params}`);

        setProducts((prev) =>
          reset || pageNum === 1 ? data.products : [...prev, ...data.products],
        );
        setHasMore(data.hasMore);
        setPage(pageNum);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeCategory, search, sort, filters],
  );

  // fetch on filter/category/sort change
  useEffect(() => {
    fetchProducts(1, true);
  }, [activeCategory, search, sort, filters, fetchProducts]);

  // fetch featured stores
  useEffect(() => {
    axios
      .get("/api/stores/featured")
      .then(({ data }) => setStores(data))
      .catch(console.error);
    axios
      .get("/api/banners")
      .then(({ data }) => setBanners(data))
      .catch(console.error);
  }, []);

  // ---- filter + search + sort — useMemo ----
  {
    /*  const products = useMemo(() => {
    let result = [...products];

    // search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.store?.name.toLowerCase().includes(q) ||
          p.keywords?.some((k) => k.toLowerCase().includes(q)) ||
          p.category?.toLowerCase().includes(q),
      );
    }

    // price range filter
    if (filters.priceRange) {
      result = result.filter(
        (p) =>
          p.price >= filters.priceRange.min &&
          p.price <= filters.priceRange.max,
      );
    }

    // condition filter
    if (filters.condition.length) {
      result = result.filter((p) => filters.condition.includes(p.condition));
    }

    // location filter
    if (filters.location.length) {
      result = result.filter((p) => {
        const loc = p.listingMeta?.location || p.store?.location || "";
        return filters.location.some((l) =>
          loc.toLowerCase().includes(l.toLowerCase()),
        );
      });
    }

    // rating filter
    if (filters.minRating) {
      result = result.filter((p) => (p.ratingStars || 0) >= filters.minRating);
    }

    // verified filter
    if (filters.verifiedOnly) {
      result = result.filter((p) => p.store?.verified);
    }

    // sort
    result.sort(SORT_FNS[sort] || SORT_FNS.newest);

    return result;
  }, [products, search, sort, filters]); */
  }

  // infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchProducts(page + 1);
        }
      },
      { threshold: 0.5 },
    );
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, page, fetchProducts]);

  // ---- banner auto rotate ----
  useEffect(() => {
    if (banners.length === 0) return;
    const timer = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [banners.length]);

  // ---- active filter count — useMemo ----
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.priceRange) count++;
    if (filters.condition.length) count += filters.condition.length;
    if (filters.location.length) count += filters.location.length;
    if (filters.minRating) count++;
    if (filters.verifiedOnly) count++;
    return count;
  }, [filters]);

  const clearFilters = useCallback(
    () =>
      setFilters({
        priceRange: null,
        condition: [],
        location: [],
        delivery: [],
        minRating: 0,
        verifiedOnly: false,
      }),
    [],
  );

  const CATEGORIES = ["All", ...new Set(products.flatMap((p) => p.category))];
  return (
    <>
      <MainHeader
        showAuth={!true}
        showCart={true}
        showSearchbtn={true}
        showWishlist={true}
        searchValue={search}
        setSearch={setSearch}
        CATEGORIES={CATEGORIES}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        shop={true}
      />

      {/* Category cips */}
      <div
        className="category_chip "
        style={{
          position: "sticky",
          top: 62,
          zIndex: 30,
          background: "#011d0870",
          backdropFilter: " blur(8px)",
          WebkitBackdropFilter: " blur(10px)",
          borderRadius: 40,
          border: "0.5px solid #000",
        }}
      >
        <Container>
          {/* Category chips */}
          <div>
            <span className="filter-tab gap-3 gap-lg-5 hide-scrollbar py-2 py-sm-3">
              {" "}
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "6px 14px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: isActive ? 600 : 400,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      transition: "all 0.15s",
                      border: "none",
                      background: "none",
                    }}
                  >
                    <h6
                      style={{
                        color: isActive ? "#eeff00" : "#fff",
                        letterSpacing: 1,
                      }}
                    >
                      {cat}
                    </h6>
                  </button>
                );
              })}
            </span>
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
                      "linear-gradient(135deg,#1a4a1a,#2d7a0a)",
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
                    onClick={() => navigate(`/store/${store.id}`)}
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
                      ⭐ {store.ratingStars?.toFixed(1)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---- FILTER + SORT BAR — unchanged ---- */}
          <div
            className="my-5"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div className="d-flex gap-3">
              <button
                type="button"
                onClick={() => setFilterOpen(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "7px 14px",
                  background: activeFilterCount > 0 ? "#c7c94c1a" : "#043a048c",
                  border: `0.5px solid ${activeFilterCount > 0 ? "#bdc00db0" : "#049104a2"}`,
                  borderRadius: 8,
                  color: activeFilterCount > 0 ? "#d3d008" : "",
                  cursor: "pointer",
                }}
              >
                <p>
                  <Filter size={20} />
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
                  background: "#043a048c",
                  border: "0.5px solid #049104a2",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                <p>
                  {" "}
                  <SortAlphaDownAlt size={20} />
                </p>
                <p>
                  {SORT_OPTIONS.find((s) => s.key === sort)
                    ?.label.split(":")[0]
                    .split(" ")
                    .slice(0, 2)
                    .join(" ")}
                </p>
              </button>
            </div>
            <div>
              <p>{products.length} items</p>
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
                      {filters.priceRange.label} ✕
                    </span>
                  )}
                  {filters.condition.map((c) => (
                    <span key={c} className="activeFilterChip">
                      {c} ✕
                    </span>
                  ))}
                  {filters.location.map((l) => (
                    <span key={l} className="activeFilterChip">
                      {l} ✕
                    </span>
                  ))}
                  {filters.minRating > 0 && (
                    <span className="activeFilterChip">
                      {filters.minRating}★+ ✕
                    </span>
                  )}
                  {filters.verifiedOnly && (
                    <span className="activeFilterChip">Verified only ✕</span>
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

          {/* Product grid */}
          <ProductPage
            product={products}
            Store={false}
            loading={loading}
            selectedCategory={activeCategory}
            setSelectedCategory={setActiveCategory}
            setSort={setSort}
            sort={sort}
            CATEGORIES={CATEGORIES}
            loadingMore={loadingMore}
            observerRef={observerRef}
            activeFilterCount={activeFilterCount}
            clearFilters={clearFilters}
            hasMore={hasMore}
            filter={false}
            count={false}
          />

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
                    maxHeight: "85vh",
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
                          onClick={clearFilters}
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
                        {PRICE_RANGES.map((range) => (
                          <button
                            key={range.label}
                            type="button"
                            onClick={() =>
                              setFilters((prev) => ({
                                ...prev,
                                priceRange:
                                  prev.priceRange?.label === range.label
                                    ? null
                                    : range,
                              }))
                            }
                            style={{
                              padding: "7px 14px",
                              borderRadius: 20,
                              cursor: "pointer",
                              fontFamily: "'Plus Jakarta Sans',sans-serif",
                              border: `0.5px solid ${filters.priceRange?.label === range.label ? "#8ba30570" : "rgba(255,255,255,0.1)"}`,
                              background:
                                filters.priceRange?.label === range.label
                                  ? "#5d6d012c"
                                  : "transparent",
                              transition: "all 0.15s",
                            }}
                          >
                            <p
                              style={{
                                color:
                                  filters.priceRange?.label === range.label
                                    ? "#c2dd29"
                                    : "",
                              }}
                            >
                              {range.label}
                            </p>
                          </button>
                        ))}
                      </div>

                      <p className="filterSectionLabel">Condition</p>
                      <div className="d-flex flex-wrap gap-3 mb-5">
                        {["Brand new", "Fairly used", "Refurbished"].map(
                          (cond) => {
                            const active = filters.condition.includes(cond);
                            return (
                              <button
                                key={cond}
                                type="button"
                                onClick={() =>
                                  setFilters((prev) => ({
                                    ...prev,
                                    condition: active
                                      ? prev.condition.filter((c) => c !== cond)
                                      : [...prev.condition, cond],
                                  }))
                                }
                                style={{
                                  padding: "7px 14px",
                                  borderRadius: 20,
                                  fontSize: 12,
                                  cursor: "pointer",
                                  fontFamily: "'Plus Jakarta Sans',sans-serif",
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
                          },
                        )}
                      </div>

                      <p className="filterSectionLabel">Location</p>
                      <Row className="g-3 mb-5">
                        {NIGERIAN_STATES.map((state) => {
                          const active = filters.location.includes(state);
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
                                  onClick={(e) =>
                                    setFilters((prev) => ({
                                      ...prev,
                                      location: active
                                        ? prev.location.filter(
                                            (l) => l !== e.target.value,
                                          )
                                        : [...prev.location, e.target.value],
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
                              setFilters((prev) => ({
                                ...prev,
                                minRating: rating,
                              }))
                            }
                            style={{
                              flex: 1,
                              padding: "9px 0",
                              borderRadius: 10,
                              fontSize: 12,
                              cursor: "pointer",
                              fontFamily: "'Plus Jakarta Sans',sans-serif",
                              border: `0.5px solid ${filters.minRating === rating ? "#8ba30570" : "#1a2a1a"}`,
                              background:
                                filters.minRating === rating
                                  ? "#5d6d012c"
                                  : "#0a1a0a",
                              fontWeight:
                                filters.minRating === rating ? 600 : 400,
                              transition: "all 0.15s",
                            }}
                          >
                            <h6
                              style={{
                                color:
                                  filters.minRating === rating ? "#c2dd29" : "",
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

                      <button
                        type="button"
                        onClick={() => setFilterOpen(false)}
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
                        <h5
                          className="fw-bold"
                          style={{
                            color: "#1a1000",
                          }}
                        >
                          Apply filters
                          {activeFilterCount > 0 && ` (${activeFilterCount})`}
                        </h5>
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
                          type="radio"
                          value={opt.key}
                          checked={sort === opt.key}
                          label={<h5>{opt.label}</h5>}
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
    </>
  );
};

export default ShoppingPage;
