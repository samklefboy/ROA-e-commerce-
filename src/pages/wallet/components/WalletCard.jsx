import { Stack } from "react-bootstrap";
import { BsWallet } from "react-icons/bs";

export function WalletCard({ topup = true, withdraw = true }) {
  return (
    <div className="wallet p-5" style={{}}>
      <Stack>
        <Stack direction="horizontal" gap={3}>
          <BsWallet size={18} />
          {topup && <h4>Wallet Balance</h4>}
          {withdraw && <h4>Available to withdraw</h4>}
        </Stack>

        <h1
          className="fs-1 fw-bolder text-white my-4"
          style={{ letterSpacing: 4 }}
        >
          ₦ 122,420 <span style={{ fontSize: "17px" }}>.31</span>
        </h1>
        {topup && <p>Last topped up 3 days ago</p>}
        {withdraw && <p>Withdrawals process within 24 hours</p>}
      </Stack>
    </div>
  );
}
