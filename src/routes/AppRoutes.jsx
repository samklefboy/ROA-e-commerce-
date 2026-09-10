import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { LoginPage } from "../pages/login/LoginPage";
import HomePage from "../pages/Home/HomePage";
import Help_Support from "../pages/Help&support/Help&Support";
import { TopUp, Withdraw } from "../pages/wallet/WalletPage";
import { Transactions } from "../pages/wallet/transaction/Transactions";

const ProfilePage = lazy(() => import("../pages/Profile/ProfilePage"));

const CheckoutPage = lazy(() => import("../pages/Checkout/Checkout"));
const Dashboard = lazy(() => import("../pages/Store/Dashboard/Dashboard"));
const GetStore = lazy(() => import("../pages/createstore/GetStore"));
const OrderPage = lazy(() => import("../pages/order/OrderPage"));
const Wishlist = lazy(() => import("../pages/wishlist/Wishlist"));
const ShoppingPage = lazy(() => import("../pages/shop/ShoppingPage"));
const PublicStore = lazy(() => import("../pages/Store/PublicStorePage"));
const CartPage = lazy(() => import("../pages/Cart/CartPage"));
const Notifications = lazy(() => import("../pages/Notification/Notification"));
const MenuSettings = lazy(() => import("../pages/menu settings/MenuSettings"));
const AddEditProduct = lazy(
  () => import("../pages/Store/Dashboard/Add_Edit_Product/AddEditProduct"),
);

function AppRoutes() {
  return (
    <>
      <Suspense>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/orders" element={<OrderPage />} />
          <Route path="/shop" element={<ShoppingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route
            /*path="/store/:storeId"*/ path="/public-store"
            element={<PublicStore />}
          />
          <Route path="/get-store" element={<GetStore />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/notification" element={<Notifications />} />
          <Route path="/settings" element={<MenuSettings />} />
          <Route path="/help_support" element={<Help_Support />} />
          <Route path="/withdraw" element={<Withdraw />} />
          <Route path="/wallet/topup" element={<TopUp />} />

          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/add_product" element={<AddEditProduct />} />
          <Route
            path="/seller/products/:id/edit"
            element={<AddEditProduct />}
          />
        </Routes>
      </Suspense>
    </>
  );
}

export default AppRoutes;
