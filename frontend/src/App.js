import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider, CartProvider } from './context';
import { Navbar, Footer } from './components/layout';
import { ProtectedRoute } from './components/common';

// Customer Pages
import {
  Home,
  Login,
  Register,
  RestaurantDetails,
  Cart,
  Checkout,
  MyOrders,
  Profile
} from './pages/customer';

// Admin Pages
import {
  Dashboard,
  ManageRestaurants,
  ManageFoods,
  ManageOrders,
  ManageUsers,
  AdminLayout
} from './pages/admin';

// Delivery Pages
import {
  DeliveryLogin,
  DeliveryDashboard,
  AssignedOrders,
  OrderDetails,
  DeliveryPartnerProfile
} from './pages/delivery';

import './styles/index.css';

const MainLayout = () => {
  return (
    <div className="main-layout">
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

const NotFound = () => (
  <div className="error-page">
    <div className="error-content">
      <h1>404</h1>
      <p>Page not found</p>
      <a href="/" className="btn btn-primary">
        Go Home
      </a>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Routes>

            {/* Customer Routes */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/restaurants/:id" element={<RestaurantDetails />} />

              <Route
                path="/cart"
                element={
                  <ProtectedRoute requiredRole="customer">
                    <Cart />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/checkout"
                element={
                  <ProtectedRoute requiredRole="customer">
                    <Checkout />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/orders"
                element={
                  <ProtectedRoute requiredRole="customer">
                    <MyOrders />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/orders/:id"
                element={
                  <ProtectedRoute requiredRole="customer">
                    <MyOrders />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute requiredRole="customer">
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Delivery Routes */}
              <Route path="/delivery/login" element={<DeliveryLogin />} />

              <Route
                path="/delivery"
                element={
                  <ProtectedRoute requiredRole="delivery_partner">
                    <Outlet />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DeliveryDashboard />} />
                <Route path="orders" element={<AssignedOrders />} />
                <Route path="orders/:id" element={<OrderDetails />} />
                <Route path="profile" element={<DeliveryPartnerProfile />} />
              </Route>
            </Route>

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="restaurants" element={<ManageRestaurants />} />
              <Route path="foods" element={<ManageFoods />} />
              <Route path="orders" element={<ManageOrders />} />
              <Route path="users" element={<ManageUsers />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />

          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;