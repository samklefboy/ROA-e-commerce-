import api from "./api";

export async function getMyProducts({
  page = 1,
  limit = 12,
  search = "",
  status = "ALL",
  sort = "newest",
} = {}) {
  const response = await api.get("/products/mine", {
    params: {
      page,
      limit,
      search: search.trim(),
      status,
      sort,
    },
  });

  return response.data.data;
}

export async function createProduct(payload) {
  const response = await api.post("/products", payload);
  return response.data.data;
}

export async function updateProduct(productId, payload) {
  const response = await api.patch(
    `/products/${encodeURIComponent(productId)}`,
    payload,
  );

  return response.data.data;
}

export async function archiveProduct(productId) {
  const response = await api.delete(
    `/products/${encodeURIComponent(productId)}`,
  );

  return response.data;
}

export async function getProductDiscounts(params = {}) {
  const response = await api.get("/products/discounts", {
    params,
  });

  return response.data.data;
}

export async function createProductDiscount(productId, payload) {
  const response = await api.post(
    `/products/${encodeURIComponent(productId)}/discount`,
    payload,
  );

  return response.data.data;
}

export async function updateProductDiscount(productId, payload) {
  const response = await api.patch(
    `/products/${encodeURIComponent(productId)}/discount`,
    payload,
  );

  return response.data.data;
}

export async function endProductDiscount(productId) {
  const response = await api.delete(
    `/products/${encodeURIComponent(productId)}/discount`,
  );

  return response.data.data;
}
