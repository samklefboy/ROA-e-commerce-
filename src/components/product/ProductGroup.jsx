// single accordion group
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProductGrid from "./ProductGrid";
import GroupHeader from "./GroupHeader";
import { fadedown } from "../../utils/animation";

export default function ProductGroup({
  // type,
  // defaultOpen = false,
  selectProduct,
  sorted = [],
  wished,
  handleWishlist,
  handleAddToCart,
  showWishlist,
  Shop,
  totalProducts,
  Store,
  loading,
  activeFilterCount,
  clearFilters,
  loadingMore,
  observerRef,
  hasMore,
  // storeFront,
  //selectedCategory,
}) {
  // const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-5">
      {/*}  {selectedCategory === "All" ? (
        <>
          {/* Header */}
      {/*</div>   <GroupHeader
            type={type}
            count={totalProducts}
            isOpen={isOpen}
            Store={Store}
            storeFront={storeFront}
            Shop={Shop}
            onToggle={() => setIsOpen((prev) => !prev)}
          />*/}

      {/* Collapsible content */}
      {/*isOpen && (
            <AnimatePresence initial={false}>
              <motion.div
                key="content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                style={{ overflow: "hidden" }}
              >
                <div
                  style={{
                    // border: `0.5px solid ${GROUP_CONFIG[type].border}`,
                    borderTop: "none",
                    borderRadius: "0 0 12px 12px",
                    padding: 10,
                    paddingTop: 0,
                  }}
                >
                  <ProductGrid
                    selectProduct={selectProduct}
                    sorted={sorted}
                    wished={wished}
                    handleWishlist={handleWishlist}
                    handleAddToCart={handleAddToCart}
                    showWishlist={showWishlist}
                    totalProducts={totalProducts}
                    Store={Store}
                    Shop={Shop}
                    loading={loading}
                    activeFilterCount={activeFilterCount}
                    clearFilters={clearFilters}
                    loadingMore={loadingMore}
                    observerRef={observerRef}
                    hasMore={hasMore}
                    type={type}
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </>
      ) : (*/}
      <motion.div
        variable={fadedown}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <ProductGrid
          selectProduct={selectProduct}
          sorted={sorted}
          wished={wished}
          handleWishlist={handleWishlist}
          handleAddToCart={handleAddToCart}
          showWishlist={showWishlist}
          totalProducts={totalProducts}
          Store={Store}
          Shop={Shop}
          loading={loading}
          activeFilterCount={activeFilterCount}
          clearFilters={clearFilters}
          loadingMore={loadingMore}
          observerRef={observerRef}
          hasMore={hasMore}
        />
      </motion.div>
      {/*)}*/}
    </div>
  );
}
