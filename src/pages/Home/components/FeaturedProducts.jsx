import { Container, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import ProductPage from "../../../components/product/ProductPage";
import { PRODUCTS } from "../../../dummyData";

export function FeaturedProducts() {
  return (
    <Container>
      <div className="py-5">
        <div className="text-center py-5">
          <h2 className="text-center" style={{ color: "#fff025" }}>
            Featured Products
          </h2>
        </div>
        <div>
          <h5 className="text-start my-4">Trending products</h5>

          <ProductPage
            Store={false}
            filter={!true}
            product={PRODUCTS}
            count={false}
          />
        </div>

        <Link to="/shopping">
          {" "}
          <Button
            className="mt-4 border-0 p-3"
            style={{
              background: "#00e677",
            }}
          >
            <p className="text-dark fs-5"> Show All Products</p>
          </Button>
        </Link>
      </div>
    </Container>
  );
}
