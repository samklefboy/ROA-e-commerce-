import api from "./api";

export async function getSellerCommissionRate() {
  const response = await api.get("/commission-policy/rate");
  return response.data.data;
}
