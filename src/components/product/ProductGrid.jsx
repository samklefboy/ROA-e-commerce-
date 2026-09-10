import ProductCard from "./ProductCard";
import { Row, Col, Container } from "react-bootstrap";
import SkeletonCard from "./SkeletonCard";
import { Search } from "react-bootstrap-icons";

const ProductGrid = ({
  selectProduct,
  sorted,
  wished,
  handleWishlist,
  showWishlist,
  Shop,
  Store,
  loading,
  activeFilterCount,
  clearFilters,
  loadingMore,
  observerRef,
  hasMore,
}) => {
  return (
    <div style={{ padding: "0 12px" }}>
      {loading ? (
        <Row className="g-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Col key={i} xxs={12} xs={6} sm={4} md={3} lg={2}>
              <SkeletonCard key={i} />
            </Col>
          ))}
        </Row>
      ) : sorted.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <Search
            style={{
              fontSize: 48,
              color: "rgba(255,255,255,0.07)",
              display: "block",
              marginBottom: 14,
            }}
          />
          <p
            style={{
              marginBottom: 6,
            }}
          >
            No products found
          </p>
          <p
            style={{
              lineHeight: 1.6,
              marginBottom: 20,
            }}
          >
            Try a different search or clear your filters
          </p>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              style={{
                padding: "10px 24px",
                background: "#ccc911d7",
                border: "none",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                color: "#131201ec",
                cursor: "pointer",
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <Row className="gx-3">
          {sorted.map((p) =>
            p.type === "REGULAR" ? (
              <Col
                key={p.id}
                xxs={12}
                xs={6}
                sm={4}
                md={3}
                lg={2}
                onClick={Shop && (() => selectProduct(p))}
                style={{ cursor: "pointer" }}
              >
                <ProductCard
                  product={p}
                  wished={!!wished[p.id]}
                  handleWishlist={handleWishlist}
                  showWishlist={showWishlist}
                  Store={Store}
                  Shop={Shop}
                />
              </Col>
            ) : (
              <Col
                key={p.id}
                xxs={12}
                xs={6}
                sm={6}
                md={4}
                lg={3}
                onClick={Shop && (() => selectProduct(p))}
                style={{ cursor: "pointer" }}
              >
                <ProductCard
                  product={p}
                  wished={!!wished[p.id]}
                  handleWishlist={handleWishlist}
                  showWishlist={showWishlist}
                  Store={Store}
                  Shop={Shop}
                />
              </Col>
            ),
          )}
        </Row>
      )}

      {/* Load more trigger */}
      <div ref={observerRef} style={{ height: 20, marginTop: 10 }} />

      {/* Loading more indicator */}
      {loadingMore && (
        <div
          className="py-2"
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "16px 0",
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              border: "2px solid #053505",
              borderTopColor: "#bfca1f",
              borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
            }}
          />
        </div>
      )}

      {/* End of results */}
      {!hasMore && sorted.length > 0 && (
        <p className="text-center my-3">
          You have seen all {sorted.length} products
        </p>
      )}
    </div>
  );
};

export default ProductGrid;
