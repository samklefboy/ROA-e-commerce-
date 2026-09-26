import api from "./api";

const ORDER_ENDPOINTS = {
  LIST: "/api/orders",
  DETAIL: (orderId) => `/api/orders/${orderId}`,
  CANCEL: (orderId) => `/api/orders/${orderId}/cancel`,
  INVOICE: (orderId) => `/api/orders/${orderId}/invoice`,
  review: (orderId) => `/api/orders/${orderId}/review`,
  track: (orderId) => `/api/orders/${orderId}/tracking`,
};

export const getOrders = async (params = {}) => {
  const response = await api.get(ORDER_ENDPOINTS.LIST, {
    params,
  });

  return response.data;
};

export const getOrder = async (orderId) => {
  const response = await api.get(ORDER_ENDPOINTS.DETAIL(orderId));

  return response.data;
};

export const cancelOrder = async (orderId, reason) => {
  const response = await api.post(ORDER_ENDPOINTS.CANCEL(orderId), { reason });

  return response.data;
};

export const getOrderInvoice = async (orderId) => {
  const response = await api.get(ORDER_ENDPOINTS.INVOICE(orderId), {
    responseType: "blob",
  });

  return response;
};

export async function submitOrderReview(orderId, data) {
  const response = await api.post(ORDER_ENDPOINTS.review(orderId), data);

  return response.data;
}

/**
 * Get tracking information.
 */
export async function getOrderTracking(orderId) {
  const response = await api.get(ORDER_ENDPOINTS.track(orderId));

  return response.data;
}
