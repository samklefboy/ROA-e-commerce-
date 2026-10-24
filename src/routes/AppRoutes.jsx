import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import VendorRoute from "./VendorRoute";

import { lazy, Suspense } from "react";
import { LoginPage } from "../pages/login/LoginPage";
import HomePage from "../pages/Home/HomePage";
import Help_Support from "../pages/Help&support/Help&Support";
import { TopUp, Withdraw } from "../pages/wallet/WalletPage";
import { Transactions } from "../pages/wallet/transaction/Transactions";
import CreatePasswordPage from "../pages/login/components/CreatePassword";

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
          {/* public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/shop" element={<ShoppingPage />} />{" "}
          <Route
            /*path="/store/:storeId"*/ path="/public-store"
            element={<PublicStore />}
          />
          <Route path="/help_support" element={<Help_Support />} />
          <Route path="/settings" element={<MenuSettings />} />
          <Route path="/create-password" element={<CreatePasswordPage />} />
          {/* Reqires login */}
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wishlist"
            element={
              <ProtectedRoute>
                <Wishlist />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notification"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet/withdraw"
            element={
              <ProtectedRoute>
                <Withdraw />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet/topup"
            element={
              <ProtectedRoute>
                <TopUp />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <Transactions />
              </ProtectedRoute>
            }
          />
          {/* requires login + store */}
          <Route
            path="/dashboard"
            element={
              //  <VendorRoute>
              <Dashboard />
              //  </VendorRoute>
            }
          />
          <Route
            path="/create-store"
            element={
              // <ProtectedRoute>
              <GetStore />
              //</ProtectedRoute>
            }
          />
          <Route
            path="/add_product"
            element={
              <VendorRoute>
                <AddEditProduct />
              </VendorRoute>
            }
          />
          <Route
            path="/seller/products/:id/edit"
            element={
              <VendorRoute>
                <AddEditProduct />
              </VendorRoute>
            }
          />
        </Routes>
      </Suspense>
    </>
  );
}

export default AppRoutes;
