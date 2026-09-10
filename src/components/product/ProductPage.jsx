import { useState, useMemo, useCallback } from "react";
import ProductFilter from "./ProductFilter";
import ProductDetails from "./ProductDetails";
import axios from "axios";
import ProductGroupAccordion from "./ProductGroupAccordion";
import { useNavigate } from "react-router-dom";
import {
  FaCouch,
  FaFootballBall,
  FaHandSparkles,
  FaMobile,
  FaShirtsinbulk,
  FaShoePrints,
  FaTools,
  FaUtensils,
} from "react-icons/fa";
import { Book, Building, CarFront, Grid, Leaf } from "react-bootstrap-icons";

// ---- CONFIGS ----
export const CATEGORY_CONFIG = {
  All: { Icon: Grid, color: "#c9a84c" },
  Fashion: { Icon: FaShirtsinbulk, color: "#c9a84c" },
  Electronics: { Icon: FaMobile, color: "#378ADD" },
  Agriculture: { Icon: Leaf, color: "#1D9E75" },
  "Auto parts": { Icon: FaTools, color: "#888" },
  Beauty: { Icon: FaHandSparkles, color: "#D4537E" },
  "Food & kitchen": { Icon: FaUtensils, color: "#c9a84c" },
  Shoes: { Icon: FaShoePrints, color: "#378ADD" },
  "Home & living": { Icon: FaCouch, color: "#1D9E75" },
  Sports: { Icon: FaFootballBall, color: "#888" },
  Health: { Icon: Leaf, color: "#D4537E" },
  Books: { Icon: Book, color: "#c9a84c" },
  Cars: { Icon: CarFront, color: "#378ADD" },
  "Real estate": { Icon: Building, color: "#1D9E75" },
};

// config per product TYPE
export const PRODUCT_TYPE_CONFIG = {
  REGULAR: {
    cta: "Add to cart",
    ctaColor: "#ecf01f",
    ctaBg: "#202001c2",
    ctaText: "#fbff00",
    showSpecs: false,
    showAmenities: false,
    showVariants: true,
    showMap: false,
  },

  VEHICLE: {
    cta: "Contact seller",
    ctaColor: "none",
    ctaBg: "linear-gradient(135deg, #1a4a1a, #2d7a0a)",
    ctaText: "#fff",
    showSpecs: true,
    showAmenities: false,
    showVariants: false,
    showMap: true,
  },
  REAL_ESTATE: {
    cta: "Schedule visit ",
    ctaColor: "0.5px solid rgba(55,138,221,0.3)",
    ctaBg: "rgba(55,138,221,0.12",
    ctaText: "#378ADD",
    showSpecs: true,
    showAmenities: true,
    showVariants: false,
    showMap: true,
  },
};

// config per CATEGORY — controls Icon and color
const SORT_CONFIG = {
  "Newest first": (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  "Most popular": (a, b) => (b.soldCount || 0) - (a.soldCount || 0),
  "Price: low to high": (a, b) => a.price - b.price,
  "Price: high to low": (a, b) => b.price - a.price,
  "Most sold": (a, b) => (b.soldCount || 0) - (a.soldCount || 0),
};

export default function ProductPage({
  filter = true,
  product,
  count = true,
  Store = true,
  Shop = true,
  storeFront = true,
  showWishlist = true,
  loading,
  activeFilterCount,
  clearFilters,
  loadingMore,
  observerRef,
  hasMore,
  sort,
  setSort,
  CATEGORIES,
  selectedCategory,
  setSelectedCategory,
}) {
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isWish, setIsWish] = useState({});

  // handle product click
  const selectProduct = useCallback((product) => {
    setSelectedProduct(product);
    setShowDetails(true);
  }, []);

  const handleDetailClose = useCallback(() => {
    setShowDetails(false);

    setTimeout(() => setSelectedProduct(null), 350);
  }, []);

  // filtering by category and search
  const filtered = useMemo(() => {
    return product.filter((p) => {
      const matchCategory =
        selectedCategory === "All" || p.category === selectedCategory;

      return matchCategory;
    });
  }, [product, selectedCategory]);

  // sorting filtered results
  const sorted = useMemo(() => {
    return [...filtered].sort(SORT_CONFIG[sort]);
  }, [filtered, sort]);

  // wishlist toggle — useCallback
  const handleWishlist = useCallback(async (productId) => {
    setIsWish((prev) => ({ ...prev, [productId]: !prev[productId] }));
    try {
      await axios.post("/api/wishlist/toggle", { productId });
    } catch {
      setIsWish((prev) => ({ ...prev, [productId]: !prev[productId] }));
    }
  }, []);

  return (
    <>
      <div className="product-page">
        {/* FILTERS */}
        {filter && (
          <ProductFilter
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            setSort={setSort}
            sort={sort}
            Store={Store}
            Shop={Shop}
            CATEGORIES={CATEGORIES}
            storeFront={storeFront}
          />
        )}

        {/* GRID */}
        <ProductGroupAccordion
          selectProduct={selectProduct}
          sorted={sorted}
          wished={isWish}
          handleWishlist={handleWishlist}
          showWishlist={showWishlist}
          Store={Store}
          Shop={Shop}
          count={count}
          loading={loading}
          activeFilterCount={activeFilterCount}
          clearFilters={clearFilters}
          loadingMore={loadingMore}
          observerRef={observerRef}
          hasMore={hasMore}
          selectedCategory={selectedCategory}
          storeFront={storeFront}
        />

        {/* DETAILS (desktop animated switching) */}

        {showDetails && (
          <ProductDetails
            show={showDetails}
            product={selectedProduct}
            onClose={handleDetailClose}
            onWishlist={handleWishlist}
            wished={!!isWish[selectedProduct?.id]}
            navigate={navigate}
          />
        )}
      </div>
    </>
  );
}
