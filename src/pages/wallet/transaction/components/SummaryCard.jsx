import { useNavigate } from "react-router";
import { FaArrowDown, FaArrowUp } from "react-icons/fa";

export function SummaryCard({ summary, summaryLoading }) {
  const navigate = useNavigate();

  return (
    <div
      className=" px-3 px-sm-4 my-5"
      style={{
        background: "linear-gradient(135deg, #566e0062, #007a1a59)",
        border: "0.5px solid #196d00c0",
        borderRadius: 16,
      }}
    >
      <div
        className="d-flex align-items-center gap-5 justify-content-between py-4"
        style={{
          borderBottom: "0.5px solid rgba(0, 41, 5, 0.62)",
        }}
      >
        <div>
          <h6
            style={{
              textWrap: "nowrap",
              textOverflow: "ellipsis",
            }}
            className="mb-1"
          >
            Wallet balance
          </h6>
          <span
            className="fw-bold "
            style={{
              fontFamily: "Syne",
              fontSize: 26,
              color: "#facc15",
            }}
          >
            {" "}
            {summaryLoading ? "—" : `₦${summary?.balance.toLocaleString()}`}
          </span>
        </div>

        <div className="d-flex gap-3 flex-wrap ms-auto ">
          <button
            type="button"
            className=" ms-auto p-1 p-sm-2 px-sm-3 "
            onClick={() => navigate("/wallet/topup")}
            style={{
              background: "#d1d418",
              border: "none",
              borderRadius: 10,
              color: "#161601",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Top up
          </button>
          <button
            type="button"
            className="p-1 p-sm-2 px-sm-3 ms-auto"
            onClick={() => navigate("/wallet/withdraw")}
            style={{
              background: "#1acf90ec",
              border: "none",
              borderRadius: 10,
              color: "#011d13",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Withdraw
          </button>
        </div>
      </div>

      <div className="d-flex flex-wrap align-items-center justify-content-between py-4">
        {[
          {
            label: "Money in",
            amount: summary?.moneyIn,
            count: summary?.inCount || 0,
            color: "#1D9E75",
            Icon: FaArrowDown,
          },
          {
            label: "Money out",
            amount: summary?.moneyOut,
            count: summary?.outCount,
            color: "#c0392b",
            Icon: FaArrowUp,
          },
        ].map((s) => {
          return (
            <div key={s.label}>
              <div
                className="p-3"
                style={{
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #001605ba #001405c7)",
                }}
              >
                <div
                  className="d-flex align-items-center gap-2"
                  style={{
                    textTransform: "uppercase",
                  }}
                >
                  <s.Icon style={{ color: s.color }} />
                  <p className="text-white ">{s.label}</p>
                </div>

                <span
                  className=" my-3"
                  style={{
                    fontFamily: "Syne",
                    fontSize: 26,
                    color: s.color,
                  }}
                >
                  {summaryLoading ? "—" : `₦${s.amount.toLocaleString()}`}.00
                </span>

                <p>
                  {s.count} transaction{s.count === 1 ? "" : "s"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
