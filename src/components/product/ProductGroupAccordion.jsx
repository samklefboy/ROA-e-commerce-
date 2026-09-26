// components/ProductGroupAccordion.jsx
import { useMemo } from "react";
import ProductGroup from "./ProductGroup";
import { FiShoppingBag } from "react-icons/fi";
import { Building, CarFront } from "react-bootstrap-icons";

// ---- MAIN EXPORT ----
export default function ProductGroupAccordion({
  selectProduct,
  sorted,
  wished,
  handleWishlist,
  showWishlist,
  Shop,
  Store,
  handleAddToCart,
  storeFront,
  loading,
  activeFilterCount,
  clearFilters,
  loadingMore,
  observerRef,
  hasMore,
  totalProducts,
  count,
  selectedCategory,
}) {
  const hasAny = totalProducts > 0;

  // separate products into groups — useMemo
  const groups = useMemo(
    () => ({
      REGULAR: sorted.filter((p) => !p.type || p.type === "REGULAR"),
      CAR: sorted.filter((p) => p.type === "CAR"),
      REAL_ESTATE: sorted.filter((p) => p.type === "REAL_ESTATE"),
    }),
    [sorted],
  );

  return (
    <div>
      {/* Results count */}
      {count && (
        <div className="d-flex justify-content-between align-items-center my-5 mb-4">
          <p>
            {typeof totalProducts === "number"
              ? totalProducts.toLocaleString("en-NG")
              : sorted.length.toLocaleString("en-NG")}{" "}
            {totalProducts === 1 ? "product" : "products"}
          </p>

          {activeFilterCount > 0 && (
            <span
              style={{
                fontSize: 11,
                color: "#c9c74c",
              }}
            >
              {activeFilterCount} listing{activeFilterCount === 1 ? "" : "s"}
            </span>
          )}
        </div>
      )}

      {/* REGULAR — shop products */}
      <ProductGroup
        type={"REGULAR"}
        sorted={groups.REGULAR}
        defaultOpen={false}
        selectProduct={selectProduct}
        wished={wished}
        handleWishlist={handleWishlist}
        handleAddToCart={handleAddToCart}
        showWishlist={showWishlist}
        Store={Store}
        Shop={Shop}
        selectedCategory={selectedCategory}
        loading={loading}
        activeFilterCount={activeFilterCount}
        clearFilters={clearFilters}
        totalProducts={totalProducts}
        loadingMore={loadingMore}
        observerRef={observerRef}
        hasMore={hasMore}
        storeFront={storeFront}
      />

      {/* CAR — vehicle listings */}
      <ProductGroup
        type={"CAR"}
        sorted={groups.CAR}
        handleAddToCart={handleAddToCart}
        defaultOpen={false}
        selectProduct={selectProduct}
        wished={wished}
        totalProducts={totalProducts}
        selectedCategory={selectedCategory}
        handleWishlist={handleWishlist}
        showWishlist={showWishlist}
        Store={Store}
        storeFront={storeFront}
        Shop={Shop}
        loading={loading}
        activeFilterCount={activeFilterCount}
        clearFilters={clearFilters}
        loadingMore={loadingMore}
        observerRef={observerRef}
        hasMore={hasMore}
      />

      {/* REAL_ESTATE — property listings */}
      <ProductGroup
        type={"REAL_ESTATE"}
        sorted={groups.REAL_ESTATE}
        defaultOpen={false}
        selectProduct={selectProduct}
        wished={wished}
        handleWishlist={handleWishlist}
        showWishlist={showWishlist}
        selectedCategory={selectedCategory}
        Store={Store}
        Shop={Shop}
        totalProducts={totalProducts}
        loading={loading}
        storeFront={storeFront}
        activeFilterCount={activeFilterCount}
        clearFilters={clearFilters}
        loadingMore={loadingMore}
        observerRef={observerRef}
        hasMore={hasMore}
      />
    </div>
  );
}
