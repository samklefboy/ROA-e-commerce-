import api from "./api";

/* =========================================================
   WALLET SUMMARY
========================================================= */

export const getWalletSummary = async () => {
  const response = await api.get("/wallet/summary");

  return response.data;
};

/* =========================================================
   TOP UP
========================================================= */

export const initializeTopUp = async ({ amount, paymentMethod }) => {
  const response = await api.post("/wallet/topup/initialize", {
    amount,
    paymentMethod,
  });

  return response.data;
};

export const verifyTopUp = async (reference) => {
  const response = await api.post("/wallet/topup/verify", {
    reference,
  });

  return response.data;
};

/* =========================================================
   WITHDRAWAL
========================================================= */

export const withdrawFunds = async ({
  amount,
  bankCode,
  bankName,
  accountNumber,
}) => {
  const response = await api.post("/wallet/withdraw", {
    amount,
    bankCode,
    bankName,
    accountNumber,
  });

  return response.data;
};

/* =========================================================
   BANKS
========================================================= */
export const getBanks = async () => {
  const response = await api.get("/wallet/banks");

  return response.data;
};

/* =========================================================
   ACCOUNT RESOLUTION
========================================================= */

export const resolveBankAccount = async ({ accountNumber, bankCode }) => {
  const response = await api.post("/wallet/resolve-account", {
    accountNumber,
    bankCode,
  });

  return response.data;
};

/* =========================================================
   TRANSACTIONS
========================================================= */

export const getWalletTransactions = async (params = {}) => {
  const response = await api.get("/wallet/transactions", {
    params,
  });

  return response.data;
};

/* =========================================================
   TRANSACTION DETAIL
========================================================= */

export const getWalletTransaction = async (reference) => {
  const response = await api.get(`/wallet/transactions/${reference}`);

  return response.data;
};
