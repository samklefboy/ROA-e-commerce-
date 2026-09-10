import { Container } from "react-bootstrap";
import MainHeader from "../../components/MainHeader";
import { Footer } from "../Home/components/Footer";
import ProductPage from "../../components/product/ProductPage";
import { getWishlistByUser } from "../../dummyData";

export const WishlistPage = () => {
  return (
    <>
      <title> My Wishlist</title>

      <MainHeader
        title="Wishlists"
        showAuth={!true}
        showSearchbtn={!true}
        showNotification={false}
        search={false}
      />

      <Container>
        <div className="wishlist">
          <div>
            <h6>4 saved items</h6>
            <div className="d-flex justify-content-between mt-2">
              <h1 className="text-light">My wishlist</h1>
            </div>
          </div>

          <div
            className="d-flex align-items-center my-4 px-4 py-3 justify-content-between"
            style={{
              background: "#ffffff11",
              backdropFilter: "blur(80px)",
              borderRadius: "20px",
              maxWidth: "600px",
            }}
          >
            <div>
              <h6>Total value</h6>
              <h4 className="text-light">₦ 33,500</h4>
            </div>

            <button
              className="px-3 py-2"
              style={{
                background: "#e2df32",
                fontSize: "17px",
                border: "none",
                borderRadius: "11px",
              }}
            >
              Add all to cart
            </button>
          </div>

          <ProductPage
            filter={!true}
            product={getWishlistByUser("user-001")}
            count={false}
            showWishlist={!false}
          />
        </div>
      </Container>

      <Footer />
    </>
  );
};

export default WishlistPage;
