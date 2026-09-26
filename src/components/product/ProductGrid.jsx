import ProductCard from "./ProductCard";
import { Row, Col } from "react-bootstrap";
import { Building, CarFront, Search } from "react-bootstrap-icons";
import { FaShoppingBag } from "react-icons/fa";

const ProductGrid = ({
  selectProduct,
  sorted = [],
  wished,
  type,
  handleWishlist,
  handleAddToCart,
  showWishlist,
  Shop,
  Store,
  loading,
  totalProducts,
  activeFilterCount,
  clearFilters,
  loadingMore,
  observerRef,
  hasMore,
}) => {
  //  EMPTY STATE
  if (!loading && totalProducts === 0) {
    return (
      <div
        style={{
          padding: "0 12px",
        }}
      >
        <div
          className="text-center"
          style={{
            padding: "50px 0",
          }}
        >
          <Search
            style={{
              fontSize: 48,
              color: "rgba(255,255,255,0.07)",
              marginBottom: 14,
            }}
          />

          {/*    {activeFilterCount === 0 && activeFilterCount > 0 && (
            <Search
              style={{
                fontSize: 48,
                color: "rgba(255,255,255,0.07)",
                marginBottom: 14,
              }}
            />
          )}
          {type === "CAR" ? (
            <CarFront
              style={{
                fontSize: 48,
                color: "rgba(255,255,255,0.07)",
                marginBottom: 14,
              }}
            />
          ) : type === "REGULAR" ? (
            <FaShoppingBag
              style={{
                fontSize: 48,
                color: "rgba(255,255,255,0.07)",
                marginBottom: 14,
              }}
            />
          ) : (
            <Building
              style={{
                fontSize: 48,
                color: "rgba(255,255,255,0.07)",
                marginBottom: 14,
              }}
            />
          )}  */}

          <p
            style={{
              marginBottom: 6,
              color: "#fff",
              fontWeight: 600,
            }}
          >
            No listing found
          </p>

          {activeFilterCount == 0 &&
            activeFilterCount > 0 &&
            typeof clearFilters === "function" && (
              <>
                {" "}
                <p
                  style={{
                    lineHeight: 1.6,
                    marginBottom: 20,
                  }}
                >
                  Try a different search or clear some of your filters.
                </p>
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
              </>
            )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 12px" }}>
      <Row className="gx-3">
        {sorted.map((p) => {
          const isRegular = !p.type || p.type === "REGULAR";

          return (
            <Col
              key={p.id}
              xs={6}
              sm={isRegular ? 4 : 6}
              md={isRegular ? 3 : 4}
              lg={isRegular ? 2 : 3}
            >
              <ProductCard
                product={p}
                onSelect={Shop ? selectProduct : undefined}
                wished={typeof wished === "function" ? wished(p.id) : false}
                handleWishlist={handleWishlist}
                handleAddToCart={handleAddToCart}
                showWishlist={showWishlist}
                Store={Store}
                Shop={Shop}
              />
            </Col>
          );
        })}
      </Row>

      {/* Load more trigger */}
      <div ref={observerRef} style={{ height: 20, marginTop: 10 }} />

      {/* Loading more indicator */}
      {loadingMore && (
        <div
          className="py-3"
          style={{
            display: "flex",
            justifyContent: "center",
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
          You've seeen all
          {typeof totalProducts === "number" &&
            ` of ${totalProducts.toLocaleString("en-NG")} products`}
        </p>
      )}
    </div>
  );
};

export default ProductGrid;
