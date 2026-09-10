export function AmountPicker({
  QUICK_TOPUP,
  setAmount,
  amount,
  QUICK_WITHDRAW,
  walletBalance,
}) {
  return (
    <div>
      <h5>Quick select</h5>
      <div className="d-flex flex-wrap gap-4 my-4">
        {(QUICK_TOPUP || QUICK_WITHDRAW).map((a) => {
          return (
            <button
              className="px-3 py-2 px-sm-4 py-sm-3"
              key={a}
              onClick={() =>
                setAmount(a === "All" ? String(walletBalance) : String(a))
              }
              style={{
                fontSize: "14px",
                borderRadius: "18px",
                fontWeight: 600,
                border: `1px solid ${amount == a ? "#c9a84c" : ""}`,
                color: amount == a ? "#ffee00" : "#000",
                background: amount == a ? "#ffffff23 " : "",
              }}
            >
              {a === "All" ? a : <>₦ {a.toLocaleString()}</>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
