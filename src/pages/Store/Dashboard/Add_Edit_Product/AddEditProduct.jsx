import { useEffect, useState } from "react";
import { Alert, Container, Spinner } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import FormCreation from "../../../../components/forms/FormCreation";
import api from "../../../../services/api";

const createInitialFormData = () => ({
  type: "REGULAR",

  // Basic information
  name: "",
  description: "",
  condition: "BRAND_NEW",
  keywords: [],

  // Category-specific information
  category: "",
  categoryId: "",
  gender: "",
  brand: "",
  origin: "",
  isOrganic: false,
  warrantyIncluded: false,
  warrantyDuration: "",
  deliveryOptions: [],
  deliveryTime: "",

  // Vehicle/property metadata
  listingMeta: {
    location: "",
    make: "",
    model: "",
    year: "",
    mileage: "",
    transmission: "",
    fuel: "",
    color: "",
    bodyType: "",
    features: [],
    negotiable: false,
    contactMethod: [],

    listingType: "",
    propertyType: "",
    bedrooms: "",
    bathrooms: 1,
    toilets: 1,
    furnished: "",
    floor: "",
    sizeInSqm: "",
    amenities: [],
    address: "",
    hideExactAddress: false,
    agencyFee: "",
    cautionFee: "",
  },

  // Variants
  variants: {},
  productVariants: [],
  hasVariants: false,

  // Pricing and stock
  price: "",
  costPrice: "",
  stock: "",
  lowStockAlert: 5,
  sku: "",
  priceDisplay: "exact",

  // Images
  images: [],

  // Publication
  status: "DRAFT",
});

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function normalizeProductForForm(product) {
  const initial = createInitialFormData();
  const listingMeta = asObject(product.listingMeta);

  return {
    ...initial,
    ...product,

    // The form uses REAL_ESTATE; the backend enum uses REALESTATE.
    type:
      product.type === "REALESTATE" ? "REAL_ESTATE" : product.type || "REGULAR",

    condition: product.condition || "BRAND_NEW",

    category: product.category?.name || product.category || "",
    categoryId: product.categoryId || "",

    images: asArray(product.images),
    keywords: asArray(product.keywords),

    variants: asObject(product.variants),
    productVariants: asArray(product.productVariants),
    hasVariants: Boolean(product.hasVariants),

    price: product.price == null ? "" : String(product.price),
    costPrice: product.costPrice == null ? "" : String(product.costPrice),
    stock: product.stock == null ? "" : String(product.stock),

    listingMeta: {
      ...initial.listingMeta,
      ...listingMeta,
      features: asArray(listingMeta.features),
      contactMethod: asArray(listingMeta.contactMethod),
      amenities: asArray(listingMeta.amenities),
    },
  };
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Unable to load this product. Please try again."
  );
}

export default function AddEditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState(createInitialFormData);
  const [loadingProduct, setLoadingProduct] = useState(isEditMode);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!id) {
      setFormData(createInitialFormData());
      setLoadingProduct(false);
      setLoadError("");
      return;
    }

    let cancelled = false;

    async function loadProduct() {
      setLoadingProduct(true);
      setLoadError("");

      try {
        const response = await api.get(`/products/${encodeURIComponent(id)}`);

        const product = response?.data?.data;

        if (!product || typeof product !== "object") {
          throw new Error("The server returned an invalid product response.");
        }

        if (!cancelled) {
          setFormData(normalizeProductForForm(product));
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(getErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setLoadingProduct(false);
        }
      }
    }

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loadingProduct) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status" />
        <p className="mt-3 mb-0">Loading product details...</p>
      </Container>
    );
  }

  if (loadError) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          <Alert.Heading>Unable to open product</Alert.Heading>
          <p className="mb-3">{loadError}</p>
          <div className="d-flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-outline-danger"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
            <button
              type="button"
              className="btn btn-dark"
              onClick={() => navigate(-1)}
            >
              Go back
            </button>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <section>
      <FormCreation
        formData={formData}
        setFormData={setFormData}
        getStore={false}
        addProduct
        isEditMode={isEditMode}
        title={isEditMode ? "Edit Product" : "Add Product"}
      />
    </section>
  );
}
