/**
 * App Component
 *
 * Main application with routing
 */

import React from 'react';
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

// Delivery Partner Pages
import {
  DeliveryLogin,
  DeliveryDashboard,
  AssignedOrders,
  OrderDetails,
  DeliveryPartnerProfile
} from './pages/delivery';

// Styles
import './styles/index.css';

const App = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="app">
            <Routes>
              {/* Admin Routes - No Navbar/Footer */}
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

              {/* Public Routes with Navbar/Footer */}
              <Route
                path="*"
                element={
                  <div className="main-layout">
                    <Navbar />
                    <main className="main-content">
                      <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/restaurants/:id" element={<RestaurantDetails />} />

                        {/* Protected Customer Routes */}
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

                        {/* Delivery Partner Routes */}
                        <Route
                          path="/delivery"
                          element={
                            <div className="main-layout">
                              <Navbar />
                              <main className="main-content">
                                <Routes>
                                  <Route path="login" element={<DeliveryLogin />} />
                                  <Route
                                    element={
                                      <ProtectedRoute requiredRole="delivery_partner">
                                        <DeliveryPartnerLayout />
                                      </ProtectedRoute>
                                    }
                                  >
                                    <Route index element={<DeliveryDashboard />} />
                                    <Route path="orders" element={<AssignedOrders />} />
                                    <Route path="orders/:id" element={<OrderDetails />} />
                                    <Route path="profile" element={<DeliveryPartnerProfile />} />
                                  </Route>
                                  {/* 404 Page for Delivery Partner */}
                                  <Route path="*" element={<NotFound />} />
                                </Routes>
                              </main>
                              <Footer />
                            </div>
                          }
                        />

                        {/* 404 Page */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                    <Footer />
                  </div>
                }
              />
            </Routes>
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
};

// 404 Not Found Component
const NotFound = () => (
  <div className="error-page">
    <div className="error-content">
      <h1>404</h1>
      <p>Page not found</p>
      <a href="/" className="btn btn-primary">Go Home</a>
    </div>
  </div>
);

// Delivery Partner Layout (simple layout for delivery partner protected routes)
const DeliveryPartnerLayout = () => {
  return <Outlet />;
};

export default App;
