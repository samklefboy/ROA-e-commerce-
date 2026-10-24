import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Col,
  Form,
  Pagination,
  Row,
  Spinner,
} from "react-bootstrap";
import { FiPlus, FiSearch, FiRefreshCw, FiPackage } from "react-icons/fi";
import { Link } from "react-router-dom";

import ProductPage from "../../../../components/product/ProductPage";
import { getMyProducts } from "../../../../services/product.service";

const PAGE_SIZE = 12;

const STATUS_OPTIONS = [
  { value: "ALL", label: "All products" },
  { value: "ACTIVE", label: "Active" },
  { value: "DRAFT", label: "Drafts" },
  { value: "HIDDEN", label: "Hidden" },
  { value: "ARCHIVED", label: "Archived" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name", label: "Name: A–Z" },
  { value: "priceLow", label: "Price: low to high" },
  { value: "priceHigh", label: "Price: high to low" },
  { value: "mostSold", label: "Most sold" },
];

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Unable to load your products. Please try again."
  );
}

export default function StoreProductPage() {
  const [products, setProducts] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const loadProducts = useCallback(
    async ({ refresh = false } = {}) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const result = await getMyProducts({
          page,
          limit: PAGE_SIZE,
          search,
          status,
          sort,
        });

        setProducts(Array.isArray(result?.items) ? result.items : []);

        setPagination(
          result?.pagination ?? {
            page,
            limit: PAGE_SIZE,
            total: 0,
            totalPages: 0,
          },
        );
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, search, status, sort],
  );

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const handleStatusChange = (value) => {
    setStatus(value);
    setPage(1);
  };

  const handleSortChange = (value) => {
    setSort(value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatus("ALL");
    setSort("newest");
    setPage(1);
  };

  const hasFilters = search !== "" || status !== "ALL" || sort !== "newest";

  return (
    <div className="px-3 px-md-4 py-4 text-light">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Product management</h2>
          <p className="text-secondary mb-0">
            Manage your listings, prices, and inventory.
          </p>
        </div>

        <div className="d-flex gap-2">
          <Button
            variant="outline-light"
            onClick={() => void loadProducts({ refresh: true })}
            disabled={loading || refreshing}
            aria-label="Refresh products"
          >
            {refreshing ? <Spinner size="sm" /> : <FiRefreshCw />}
            <span className="ms-2 d-none d-sm-inline">Refresh</span>
          </Button>

          <Button
            as={Link}
            to="/add_product"
            variant="success"
            className="fw-semibold py-3 px-4 position-fixed ms-2 ms-sm-3 ms-md-4"
            style={{
              background: "rgb(0, 255, 0)",
              bottom: 100,
              zIndex: 1,
              borderRadius: 22,
            }}
          >
            <FiPlus className="me-1" />
            Add product
          </Button>
        </div>
      </div>

      <Row className="g-3 mb-4">
        <Col xs={12} md={4}>
          <div className="rounded-3 border border-secondary bg-dark p-3 h-100">
            <div className="d-flex justify-content-between align-items-center">
              <span className="text-secondary">Matching products</span>
              <FiPackage className="text-warning fs-4" />
            </div>
            <div className="fs-3 fw-bold mt-2">{pagination.total}</div>
          </div>
        </Col>

        <Col xs={12} md={8}>
          <div className="rounded-3 border border-secondary bg-dark p-3 h-100">
            <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between mb-3">
              <strong>Find a product</strong>

              {hasFilters && (
                <Button
                  variant="link"
                  className="text-warning text-decoration-none p-0"
                  onClick={handleClearFilters}
                >
                  Clear filters
                </Button>
              )}
            </div>

            <Row className="g-2">
              <Col xs={12} md={6}>
                <Form.Label className="small text-secondary">Search</Form.Label>
                <div
                  className="position-relative d-flex align-items-center gap-3 px-4 py-3"
                  style={{ background: "#000" }}
                >
                  <FiSearch
                    className="position-absolute text-secondary"
                    style={{
                      left: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                  />
                  <Form.Control
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search your products..."
                    aria-label="Search your products"
                  />
                </div>
              </Col>

              <Col xs={6} md={3}>
                <Form.Label className="small text-secondary">Status</Form.Label>
                <Form.Select
                  value={status}
                  onChange={(event) => handleStatusChange(event.target.value)}
                  className="bg-black text-light border-secondary"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              <Col xs={6} md={3}>
                <Form.Label className="small text-secondary">
                  Sort by
                </Form.Label>
                <Form.Select
                  value={sort}
                  onChange={(event) => handleSortChange(event.target.value)}
                  className="bg-black text-light border-secondary"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
          <div className="mt-2">
            <Button
              size="sm"
              variant="outline-danger"
              onClick={() => void loadProducts()}
            >
              Try again
            </Button>
          </div>
        </Alert>
      )}

      {loading ? (
        <div className="d-flex justify-content-center align-items-center py-5">
          <Spinner animation="border" variant="success" />
          <span className="ms-3 text-secondary">Loading your products...</span>
        </div>
      ) : (
        <>
          {!error && products.length === 0 ? (
            <div className="rounded-3 border border-secondary bg-dark text-center p-5">
              <FiPackage className="fs-1 text-secondary mb-3" />
              <h5>
                {hasFilters
                  ? "No matching products"
                  : "Your catalogue is empty"}
              </h5>
              <p className="text-secondary">
                {hasFilters
                  ? "Try changing your search or filters."
                  : "Add your first product to start building your catalogue."}
              </p>

              {hasFilters ? (
                <Button variant="outline-warning" onClick={handleClearFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button as={Link} to="/add_product" variant="success">
                  <FiPlus className="me-1" />
                  Add your first product
                </Button>
              )}
            </div>
          ) : (
            <ProductPage
              filter={false}
              product={products}
              count={false}
              Store={false}
              Shop={false}
              storeFront={false}
              showWishlist={false}
              loading={false}
              totalProducts={pagination.total}
            />
          )}

          {pagination.totalPages > 1 && (
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mt-4">
              <span className="small text-secondary">
                Page {pagination.page} of {pagination.totalPages}
                {" · "}
                {pagination.total} products
              </span>

              <Pagination className="mb-0">
                <Pagination.Prev
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                />

                {Array.from(
                  { length: pagination.totalPages },
                  (_, index) => index + 1,
                )
                  .filter(
                    (pageNumber) =>
                      pageNumber === 1 ||
                      pageNumber === pagination.totalPages ||
                      Math.abs(pageNumber - page) <= 1,
                  )
                  .map((pageNumber, index, visiblePages) => (
                    <span className="d-contents" key={pageNumber}>
                      {index > 0 &&
                        pageNumber - visiblePages[index - 1] > 1 && (
                          <Pagination.Ellipsis disabled />
                        )}
                      <Pagination.Item
                        active={pageNumber === page}
                        onClick={() => setPage(pageNumber)}
                      >
                        {pageNumber}
                      </Pagination.Item>
                    </span>
                  ))}

                <Pagination.Next
                  disabled={page >= pagination.totalPages}
                  onClick={() =>
                    setPage((current) =>
                      Math.min(pagination.totalPages, current + 1),
                    )
                  }
                />
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  );
}
