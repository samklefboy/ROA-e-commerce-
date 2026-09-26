// AmountPicker.jsx
export function AmountPicker({
  setAmount,
  amount,
  amounts = [],
  walletBalance = 0,
}) {
  const handleAmountSelect = (value) => {
    if (value === "All") {
      setAmount(String(walletBalance));
      return;
    }

    setAmount(String(value));
  };

  const isSelected = (value) => {
    if (value === "All") {
      return String(amount) === String(walletBalance);
    }

    return String(amount) === String(value);
  };

  return (
    <div className="my-5 py-4">
      <h6>Quick select</h6>

      <div className="d-flex flex-wrap gap-4 my-4">
        {amounts.map((value) => {
          const selected = isSelected(value);

          return (
            <button
              type="button"
              key={value}
              className="px-3 py-2 "
              onClick={() => handleAmountSelect(value)}
              style={{
                fontSize: "14px",
                borderRadius: "18px",
                fontWeight: 600,
                border: `1px solid ${selected ? "#c9c14cd8" : "#ffffff20"}`,
                color: selected ? "#ffee00" : "#fff",
                background: selected ? "#3d39038a" : "transparent",
              }}
            >
              {value === "All"
                ? "All"
                : `₦ ${Number(value).toLocaleString("en-NG")}`}
            </button>
          );
        })}
      </div>
    </div>
  );
}
