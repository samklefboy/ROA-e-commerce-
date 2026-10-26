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
  Table,
} from "react-bootstrap";
import {
  FiEdit2,
  FiPlus,
  FiSearch,
  FiRefreshCw,
  FiPackage,
  FiMoreVertical,
  FiPause,
  FiPlay,
  FiTrash2,
} from "react-icons/fi";
import { Link } from "react-router-dom";

import {
  getMyProducts,
  updateProduct,
  archiveProduct,
} from "../../../../services/product.service";

const PAGE_SIZE = 12;
const LOW_STOCK_THRESHOLD = 5;

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

const STATUS_STYLES = {
  ACTIVE: { bg: "rgba(25, 135, 84, .16)", color: "#65df9b" },
  DRAFT: { bg: "rgba(255, 193, 7, .13)", color: "#ffd166" },
  HIDDEN: { bg: "rgba(108, 117, 125, .2)", color: "#c6cbd1" },
  ARCHIVED: { bg: "rgba(108, 117, 125, .2)", color: "#c6cbd1" },
  OUT_OF_STOCK: { bg: "rgba(220, 53, 69, .15)", color: "#ff858f" },
};

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Unable to load your products. Please try again."
  );
}

function formatPrice(value) {
  const amount = Number(value);

  if (
    value === null ||
    value === undefined ||
    value === "" ||
    !Number.isFinite(amount)
  ) {
    return "—";
  }

  return `₦${amount.toLocaleString("en-NG", {
    maximumFractionDigits: 2,
  })}`;
}

function getProductType(product) {
  const type = String(product?.type || "REGULAR").toUpperCase();

  if (type === "CAR") return "Car";
  if (type === "REAL_ESTATE" || type === "REALESTATE") {
    return "Real estate";
  }

  return "Regular product";
}

function getStatusStyle(status) {
  return STATUS_STYLES[status] || STATUS_STYLES.DRAFT;
}

function ProductStatus({ status }) {
  const normalizedStatus = String(status || "DRAFT").toUpperCase();
  const style = getStatusStyle(normalizedStatus);

  return (
    <Badge
      pill
      className="fw-semibold px-3 py-2"
      style={{
        color: style.color,
        background: style.bg,
        border: `1px solid ${style.color}30`,
      }}
    >
      {normalizedStatus.replaceAll("_", " ")}
    </Badge>
  );
}

function ProductThumbnail({ product, size = 54 }) {
  const image = Array.isArray(product?.images)
    ? product.images.find((item) => typeof item === "string" && item.trim())
    : typeof product?.images === "string"
      ? product.images
      : null;

  return (
    <div
      className="flex-shrink-0 rounded-3 overflow-hidden d-flex align-items-center justify-content-center"
      style={{
        width: size,
        height: size,
        background: "#171a19",
        border: "1px solid rgba(255,255,255,.08)",
      }}
    >
      {image ? (
        <img
          src={image}
          alt={product?.name || "Product"}
          loading="lazy"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : (
        <FiPackage size={22} className="text-secondary" />
      )}
    </div>
  );
}

function getStockInfo(product) {
  const type = String(product?.type || "REGULAR").toUpperCase();

  if (type === "CAR" || type === "REAL_ESTATE" || type === "REALESTATE") {
    return { label: "Not applicable", low: false };
  }

  const stock = Number(product?.stock);

  if (
    product?.stock === null ||
    product?.stock === undefined ||
    product?.stock === "" ||
    !Number.isFinite(stock)
  ) {
    return { label: "—", low: false };
  }

  if (stock <= 0) {
    return { label: "Out of stock", low: true };
  }

  if (stock <= LOW_STOCK_THRESHOLD) {
    return { label: `${stock} left`, low: true };
  }

  return { label: `${stock} units`, low: false };
}

function ProductActions({
  product,
  busy,
  disabled,
  onToggleStatus,
  onArchive,
}) {
  const isActive = product.status === "ACTIVE";
  const isHidden = product.status === "HIDDEN";
  const isArchived = product.status === "ARCHIVED";

  return (
    <div className="d-flex flex-wrap align-items-center justify-content-end gap-2">
      <Button
        as={Link}
        to={`/seller/products/${product.id}/edit`}
        variant="outline-light"
        size="sm"
        className="d-inline-flex align-items-center gap-2"
        aria-label={`Edit ${product.name || "product"}`}
        disabled={disabled}
      >
        <FiEdit2 size={14} />
        Edit
      </Button>

      {!isArchived && (
        <>
          {(isActive || isHidden) && (
            <Button
              type="button"
              variant={isActive ? "outline-warning" : "outline-success"}
              size="sm"
              className="d-inline-flex align-items-center gap-2"
              onClick={() => onToggleStatus(product)}
              disabled={disabled}
              aria-label={
                isActive
                  ? `Pause ${product.name || "product"}`
                  : `Resume ${product.name || "product"}`
              }
            >
              {busy ? (
                <Spinner size="sm" animation="border" />
              ) : isActive ? (
                <FiPause size={14} />
              ) : (
                <FiPlay size={14} />
              )}
              {isActive ? "Pause" : "Resume"}
            </Button>
          )}

          <Button
            type="button"
            variant="outline-danger"
            size="sm"
            className="d-inline-flex align-items-center gap-2"
            onClick={() => onArchive(product)}
            disabled={disabled}
            aria-label={`Delete ${product.name || "product"}`}
          >
            {busy ? (
              <Spinner size="sm" animation="border" />
            ) : (
              <FiTrash2 size={14} />
            )}
            Delete
          </Button>
        </>
      )}

      {isArchived && <span className="small text-secondary">Archived</span>}
    </div>
  );
}

function ProductRow({
  product,
  busy,
  actionsDisabled,
  onToggleStatus,
  onArchive,
}) {
  const stock = getStockInfo(product);

  return (
    <tr>
      <td className="ps-3 py-3 align-middle">
        <div className="d-flex align-items-center gap-3">
          <ProductThumbnail product={product} />

          <div className="min-w-0">
            <div
              className="fw-semibold text-light text-truncate"
              style={{ maxWidth: 290 }}
              title={product.name || "Untitled product"}
            >
              {product.name || "Untitled product"}
            </div>
            <div className="small text-secondary mt-1">
              {getProductType(product)}
            </div>
          </div>
        </div>
      </td>

      <td className="align-middle text-light fw-semibold text-nowrap">
        {formatPrice(product.price)}
      </td>

      <td className="align-middle">
        <span
          className="small fw-medium"
          style={{ color: stock.low ? "#ff858f" : "#c4cbc7" }}
        >
          {stock.label}
        </span>
      </td>

      <td className="align-middle">
        <ProductStatus status={product.status} />
      </td>

      <td className="align-middle text-end pe-3">
        <ProductActions
          product={product}
          busy={busy}
          disabled={actionsDisabled}
          onToggleStatus={onToggleStatus}
          onArchive={onArchive}
        />
      </td>
    </tr>
  );
}

function ProductMobileCard({
  product,
  busy,
  actionsDisabled,
  onToggleStatus,
  onArchive,
}) {
  const stock = getStockInfo(product);

  return (
    <div
      className="rounded-3 p-3 h-100"
      style={{
        background: "#111513",
        border: "1px solid rgba(255,255,255,.1)",
      }}
    >
      <div className="d-flex align-items-start gap-3">
        <ProductThumbnail product={product} size={68} />

        <div className="flex-grow-1 min-w-0">
          <div className="fw-semibold text-light mb-1">
            {product.name || "Untitled product"}
          </div>
          <div className="small text-secondary mb-2">
            {getProductType(product)}
          </div>
          <ProductStatus status={product.status} />
        </div>

        <div className="text-secondary">
          <FiMoreVertical />
        </div>
      </div>

      <div
        className="d-flex justify-content-between align-items-center gap-3 mt-3 pt-3"
        style={{ borderTop: "1px solid rgba(255,255,255,.08)" }}
      >
        <div>
          <div className="small text-secondary mb-1">Price</div>
          <div className="fw-bold text-light">{formatPrice(product.price)}</div>
        </div>

        <div className="text-end">
          <div className="small text-secondary mb-1">Inventory</div>
          <div
            className="small fw-semibold"
            style={{ color: stock.low ? "#ff858f" : "#c4cbc7" }}
          >
            {stock.label}
          </div>
        </div>
      </div>

      <div
        className="mt-3 pt-3"
        style={{ borderTop: "1px solid rgba(255,255,255,.08)" }}
      >
        <ProductActions
          product={product}
          busy={busy}
          disabled={actionsDisabled}
          onToggleStatus={onToggleStatus}
          onArchive={onArchive}
        />
      </div>
    </div>
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
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [busyProductId, setBusyProductId] = useState(null);

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

  const handleClearFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatus("ALL");
    setSort("newest");
    setPage(1);
  };

  const handleToggleStatus = async (product) => {
    const nextStatus = product.status === "ACTIVE" ? "HIDDEN" : "ACTIVE";
    const action = nextStatus === "HIDDEN" ? "pause" : "resume";

    const confirmed = window.confirm(
      nextStatus === "HIDDEN"
        ? `Pause "${product.name}"? It will be hidden from the public catalogue.`
        : `Resume "${product.name}"? It will become eligible to appear in the public catalogue again.`,
    );

    if (!confirmed) return;

    setBusyProductId(product.id);
    setActionError("");
    setSuccessMessage("");

    try {
      await updateProduct(product.id, { status: nextStatus });

      setSuccessMessage(
        nextStatus === "HIDDEN"
          ? `"${product.name}" has been paused successfully.`
          : `"${product.name}" has been resumed successfully.`,
      );

      await loadProducts({ refresh: true });
    } catch (requestError) {
      setActionError(
        requestError?.response?.data?.message ||
          `Unable to ${action} this product. Please try again.`,
      );
    } finally {
      setBusyProductId(null);
    }
  };

  const handleArchiveProduct = async (product) => {
    const confirmed = window.confirm(
      `Delete "${product.name}" from your active inventory? This action archives the listing rather than permanently deleting the record.`,
    );

    if (!confirmed) return;

    setBusyProductId(product.id);
    setActionError("");
    setSuccessMessage("");

    try {
      await archiveProduct(product.id);

      setSuccessMessage(`"${product.name}" has been archived successfully.`);

      // If this was the last item on the current page, go back one page.
      if (products.length === 1 && page > 1) {
        setPage((currentPage) => currentPage - 1);
      } else {
        await loadProducts({ refresh: true });
      }
    } catch (requestError) {
      setActionError(
        requestError?.response?.data?.message ||
          "Unable to archive this product. Please try again.",
      );
    } finally {
      setBusyProductId(null);
    }
  };

  const hasFilters = search !== "" || status !== "ALL" || sort !== "newest";

  const currentPage = pagination.page || page;
  const totalPages = pagination.totalPages || 0;

  return (
    <div className=" py-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Product management</h2>
          <p className="text-secondary mb-0">
            Manage your listings, prices, and inventory.
          </p>
        </div>

        <div className="d-flex gap-3 my-3">
          <Button
            variant="outline-light"
            onClick={() => void loadProducts({ refresh: true })}
            disabled={loading || refreshing || busyProductId !== null}
          >
            {refreshing ? (
              <Spinner size="sm" animation="border" />
            ) : (
              <FiRefreshCw />
            )}
            <span className="ms-2">Refresh</span>
          </Button>

          <Button
            as={Link}
            to="/add_product"
            variant="success"
            className="fw-semibold d-flex align-items-center gap-2 text-light"
          >
            <FiPlus />
            Add product
          </Button>
        </div>
      </div>

      {actionError && (
        <Alert variant="danger" dismissible onClose={() => setActionError("")}>
          {actionError}
        </Alert>
      )}

      {successMessage && (
        <Alert
          variant="success"
          dismissible
          onClose={() => setSuccessMessage("")}
        >
          {successMessage}
        </Alert>
      )}

      <Row className="g-3 mb-4">
        <Col xs={12} sm={12} md={6} xl={3}>
          <div
            className=" p-3 h-100"
            style={{
              background: "linear-gradient(145deg, #034421, #0a1600)",
              border: "1px solid #253329",
              borderRadius: 20,
            }}
          >
            <div className="d-flex justify-content-between align-items-center">
              <span className="text-secondary">Matching products</span>
              <FiPackage className="text-warning fs-4" />
            </div>
            <div className="fs-3 fw-bold mt-4">
              {pagination.total.toLocaleString("en-NG")}
            </div>
          </div>
        </Col>

        <Col xs={12} xl={9}>
          <div
            className="rounded-3 p-3 h-100"
            style={{
              background: "linear-gradient(145deg, #003117, #070f00)",
              border: "1px solid #253329",
              borderRadius: 20,
            }}
          >
            <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
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

            <Row className="g-3">
              <Col xs={12} md={6}>
                <Form.Label className="small text-secondary">
                  Search products
                </Form.Label>
                <div className="position-relative">
                  <FiSearch
                    className="position-absolute text-secondary"
                    style={{
                      left: 13,
                      top: "50%",
                      transform: "translateY(-50%)",
                      zIndex: 2,
                    }}
                  />
                  <Form.Control
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search by product name..."
                    aria-label="Search your products"
                    className=" ms-1 bg-black text-light"
                  />
                </div>
              </Col>

              <Col xs={6} md={3}>
                <Form.Label className="small text-secondary">Status</Form.Label>
                <Form.Select
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value);
                    setPage(1);
                  }}
                  className="bg-black text-light "
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
                  onChange={(event) => {
                    setSort(event.target.value);
                    setPage(1);
                  }}
                  className="bg-black text-light "
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
        <Alert
          variant="danger"
          dismissible
          onClose={() => setError("")}
          className="mb-4"
        >
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
      ) : !error && products.length === 0 ? (
        <div
          className="rounded-3 border border-secondary text-center p-4 p-md-5"
          style={{ background: "#111513" }}
        >
          <FiPackage className="fs-1 text-secondary mb-3" />
          <h5>
            {hasFilters ? "No matching products" : "Your catalogue is empty"}
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
        <>
          {/* Desktop and tablet inventory table */}
          <div
            className="d-none d-md-block rounded-3 overflow-hidden"
            style={{
              border: "1px solid rgba(255,255,255,.1)",
            }}
          >
            <Table
              responsive
              hover
              variant="black"
              className="mb-0 align-middle"
            >
              <thead>
                <tr className="small text-secondary">
                  <th className="ps-3 py-3">Product</th>
                  <th className="py-3">Price</th>
                  <th className="py-3">Inventory</th>
                  <th className="py-3">Status</th>
                  <th className="text-end pe-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    busy={busyProductId === product.id}
                    actionsDisabled={busyProductId !== null}
                    onToggleStatus={handleToggleStatus}
                    onArchive={handleArchiveProduct}
                  />
                ))}
              </tbody>
            </Table>
          </div>

          {/* Mobile inventory cards */}
          <div className="d-md-none">
            <Row className="g-3">
              {products.map((product) => (
                <Col xs={12} key={product.id}>
                  <ProductMobileCard
                    product={product}
                    busy={busyProductId === product.id}
                    actionsDisabled={busyProductId !== null}
                    onToggleStatus={handleToggleStatus}
                    onArchive={handleArchiveProduct}
                  />
                </Col>
              ))}
            </Row>
          </div>

          {totalPages > 1 && (
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mt-4">
              <span className="small text-secondary">
                Page {currentPage} of {totalPages}
                {" · "}
                {pagination.total.toLocaleString("en-NG")} products
              </span>

              <Pagination className="mb-0">
                <Pagination.Prev
                  disabled={currentPage <= 1 || loading}
                  onClick={() => setPage(Math.max(1, currentPage - 1))}
                />

                {Array.from({ length: totalPages }, (_, index) => index + 1)
                  .filter(
                    (pageNumber) =>
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      Math.abs(pageNumber - currentPage) <= 1,
                  )
                  .map((pageNumber, index, visiblePages) => (
                    <span key={pageNumber} className="d-contents">
                      {index > 0 &&
                        pageNumber - visiblePages[index - 1] > 1 && (
                          <Pagination.Ellipsis disabled />
                        )}
                      <Pagination.Item
                        active={pageNumber === currentPage}
                        disabled={loading}
                        onClick={() => setPage(pageNumber)}
                      >
                        {pageNumber}
                      </Pagination.Item>
                    </span>
                  ))}

                <Pagination.Next
                  disabled={currentPage >= totalPages || loading}
                  onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                />
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  );
}
