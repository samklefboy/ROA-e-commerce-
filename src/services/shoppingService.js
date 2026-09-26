import api from "./api";

function normalizeProductsResponse(response) {
  const payload = response?.data ?? response ?? {};

  // Preferred shape
  if (Array.isArray(payload.data)) {
    return {
      products: payload.data,
      meta: {
        page: payload.meta?.page ?? 1,
        limit: payload.meta?.limit ?? payload.data.length,
        total: payload.meta?.total ?? payload.data.length,
        totalPages: payload.meta?.totalPages ?? 1,
        hasNextPage:
          payload.meta?.hasNextPage ?? payload.meta?.hasMore ?? false,
      },
    };
  }

  // Temporary compatibility with your current backend-ready shape
  if (Array.isArray(payload.products)) {
    return {
      products: payload.products,
      meta: {
        page: payload.page ?? 1,
        limit: payload.limit ?? payload.products.length,
        total: payload.total ?? payload.products.length,
        totalPages: payload.totalPages ?? 1,
        hasNextPage: payload.hasMore ?? false,
      },
    };
  }

  return {
    products: [],
    meta: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
    },
  };
}

// GET /api/products

export async function getProducts(params = {}, signal) {
  const response = await api.get("/api/products", {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,

      search: params.search?.trim() || undefined,

      category:
        params.category && params.category !== "All"
          ? params.category
          : undefined,

      sort: params.sort || "newest",

      priceMin:
        params.priceMin !== undefined && params.priceMin !== null
          ? params.priceMin
          : undefined,

      priceMax:
        params.priceMax !== undefined && params.priceMax !== null
          ? params.priceMax
          : undefined,

      condition: params.condition?.length
        ? params.condition.join(",")
        : undefined,

      location: params.location?.length ? params.location.join(",") : undefined,

      delivery: params.delivery?.length ? params.delivery.join(",") : undefined,

      minRating: params.minRating > 0 ? params.minRating : undefined,

      verifiedOnly: params.verifiedOnly ? true : undefined,
    },

    signal,
  });

  return normalizeProductsResponse(response);
}

// GET /api/categories
export async function getProductCategories(signal) {
  const response = await api.get("/api/categories", {
    signal,
  });

  const payload = response?.data ?? response ?? {};

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (Array.isArray(payload.categories)) {
    return payload.categories;
  }

  return [];
}

// GET /api/stores/featured
export async function getFeaturedStores(signal) {
  const response = await api.get("/api/stores/featured", {
    signal,
  });

  const payload = response?.data ?? response ?? {};

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (Array.isArray(payload.stores)) {
    return payload.stores;
  }

  return [];
}

//GET /api/banners
export async function getShoppingBanners(signal) {
  const response = await api.get("/api/banners", {
    signal,
  });

  const payload = response?.data ?? response ?? {};

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (Array.isArray(payload.banners)) {
    return payload.banners;
  }

  return [];
}

export const toggleWishlist = async (productId) => {
  if (!productId) {
    throw new Error("Product ID is required");
  }
  const response = await api.post("/api/wishlist/toggle", { productId });
  return response.data;
};

export const addToCart = async ({
  productId,
  quantity = 1,
  variant = null,
}) => {
  if (!productId) {
    throw new Error("Selelct a product");
  }
  if (quantity < 1) {
    throw new Error("Quantity must be at least 1");
  }
  const response = await api.post("/api/cart/items", {
    productId,
    quantity,
    variant,
  });
  return response.data;
};
