import { Stack } from "react-bootstrap";
import { BsWallet2, BsArrowDownCircle, BsArrowUpCircle } from "react-icons/bs";

const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(Number(value) || 0);
};

export function WalletCard({ mode = "topup", balance = 0 }) {
  const isWithdraw = mode === "withdraw";

  return (
    <div className="wallet p-5">
      <Stack
        direction="horizontal"
        className="justify-content-between align-items-start"
      >
        <Stack gap={3}>
          <p>Wallet balance</p>
          <h2
            className="fw-bold mt-2 mb-0 text-white"
            style={{ fontFamily: "Syne" }}
          >
            {" "}
            {formatCurrency(balance)}{" "}
          </h2>{" "}
        </Stack>

        <div
          className="rounded-circle d-flex align-items-center justify-content-center"
          style={{ width: "50px", height: "50px", background: "#c7aa3541" }}
        >
          {" "}
          <BsWallet2 size={24} style={{ color: "#facc15cc" }} />{" "}
        </div>
      </Stack>

      <div className="mt-4">
        {" "}
        <Stack direction="horizontal" gap={2} className="text-secondary">
          {" "}
          {isWithdraw ? (
            <BsArrowDownCircle size={20} />
          ) : (
            <BsArrowUpCircle size={20} />
          )}
          <p> {isWithdraw ? "Available balance" : "Wallet balance"}</p>
        </Stack>
      </div>
    </div>
  );
}
