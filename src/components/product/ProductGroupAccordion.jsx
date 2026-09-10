// components/ProductGroupAccordion.jsx
import React, { useMemo } from "react";
import ProductGroup from "./ProductGroup";
import { FiShoppingBag } from "react-icons/fi";
import { Building, CarFront } from "react-bootstrap-icons";

// group config
export const GROUP_CONFIG = {
  REGULAR: {
    label: "product listing",
    Icon: FiShoppingBag,
    color: "#f5f107",
    bg: "rgba(32, 32, 0, 0.71)",
    border: "#c2c0426b",
    emptyMsg: "No shop products found",
  },
  VEHICLE: {
    label: "Vehicle listings",
    Icon: CarFront,
    color: "#378ADD",
    bg: "rgba(0, 11, 22, 0.71)",
    border: "rgba(55,138,221,0.2)",
    emptyMsg: "No vehicle listings found",
  },
  REAL_ESTATE: {
    label: "Property listings",
    Icon: Building,
    color: "#1D9E75",
    bg: "rgba(1, 31, 21, 0.71)",
    border: "rgba(29,158,117,0.2)",
    emptyMsg: "No property listings found",
  },
};

// ---- MAIN EXPORT ----
export default function ProductGroupAccordion({
  selectProduct,
  sorted,
  wished,
  handleWishlist,
  showWishlist,
  Shop,
  Store,
  storeFront,
  loading,
  activeFilterCount,
  clearFilters,
  loadingMore,
  observerRef,
  hasMore,
  count,
  selectedCategory,
}) {
  const hasAny = sorted.length > 0;

  // separate products into groups — useMemo
  const groups = useMemo(
    () => ({
      REGULAR: sorted.filter((p) => !p.type || p.type === "REGULAR"),
      VEHICLE: sorted.filter((p) => p.type === "VEHICLE"),
      REAL_ESTATE: sorted.filter((p) => p.type === "REAL_ESTATE"),
    }),
    [sorted],
  );

  if (!hasAny) return null;

  return (
    <div>
      {/* Expand/collapse all controls */}

      {/* Results count */}
      {count && (
        <h6 className="my-5 mb-4">
          {sorted.length} listing{sorted.length !== 1 ? "s" : ""}
        </h6>
      )}

      {/* REGULAR — shop products */}
      <ProductGroup
        type={"REGULAR"}
        sorted={groups.REGULAR}
        defaultOpen={true}
        selectProduct={selectProduct}
        wished={wished}
        handleWishlist={handleWishlist}
        showWishlist={showWishlist}
        Store={Store}
        Shop={Shop}
        selectedCategory={selectedCategory}
        loading={loading}
        activeFilterCount={activeFilterCount}
        clearFilters={clearFilters}
        loadingMore={loadingMore}
        observerRef={observerRef}
        hasMore={hasMore}
        storeFront={storeFront}
      />

      {/* VEHICLE — vehicle listings */}
      <ProductGroup
        type={"VEHICLE"}
        sorted={groups.VEHICLE}
        defaultOpen={true}
        selectProduct={selectProduct}
        wished={wished}
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
        defaultOpen={true}
        selectProduct={selectProduct}
        wished={wished}
        handleWishlist={handleWishlist}
        showWishlist={showWishlist}
        selectedCategory={selectedCategory}
        Store={Store}
        Shop={Shop}
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
