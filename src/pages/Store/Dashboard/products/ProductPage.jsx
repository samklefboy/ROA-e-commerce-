import { FiPlus, FiSearch } from "react-icons/fi";
import ProductPage from "../../../../components/product/ProductPage";
import { getProductsByStore } from "../../../../dummyData";
import { Form } from "react-bootstrap";
import { Link } from "react-router-dom";

export default function StoreProductPage() {
  return (
    <div>
      <Link
        className="py-3 px-4 position-fixed ms-2 ms-sm-3 ms-md-4"
        to="/add_product"
        style={{
          background: "rgb(0, 255, 0)",
          bottom: 100,
          zIndex: 1,
          borderRadius: 22,
        }}
      >
        <div
          className="d-flex align-items-center justify-content-center p-1 bg-dark"
          style={{ borderRadius: 12 }}
        >
          <FiPlus className="fs-1" style={{ color: "#e7eb03" }} />{" "}
        </div>
      </Link>

      <div className="my-5">
        <div
          className="d-flex align-items-center gap-3 px-4 py-3"
          style={{ background: "#000" }}
        >
          <FiSearch />
          <Form.Control
            className="py-1"
            type="text"
            placeholder="search products..."
          />
        </div>
      </div>

      <div>
        <ProductPage
          Shop={false}
          product={getProductsByStore("store-001")}
          showWishlist={false}
        />
      </div>
    </div>
  );
}
