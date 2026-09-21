# FoodExpress — Full Project Prompt (Zomato-style Food Delivery Platform)

Build a full-stack food delivery platform connecting **three portals** — **Customer**, **Restaurant Admin**, and **Delivery Partner** — that work together in a single order lifecycle, exactly like Zomato/Swiggy.

Each portal has its own login, dashboard, and workflows. All three share the same backend and database, so every action in one portal is instantly visible to the other portals.

---

## 1. Roles & Access

Single registration endpoint where the user picks a role: `customer`, `restaurant_admin`, or `delivery_partner`.

| Role | Registration details |
|------|----------------------|
| Customer | Name, email, phone, password, delivery address |
| Restaurant Admin | Name, email, phone, password, restaurant name, address, cuisine, description, logo/image |
| Delivery Partner | Name, email, phone, password, vehicle type, address |

- JWT-based authentication (both backend and frontend store and send the token).
- Role-based access control: every protected API verifies the role before allowing the action.
- Each portal redirects to its own dashboard after login based on role.

---

## 2. Customer Portal (`/customer`)

### 2.1 Browse & Discover
- Browse list of restaurants with image, name, rating, cuisine, and estimated delivery time.
- Search restaurants by name/cuisine.
- Open a restaurant → view its menu items (name, description, price, category, image, availability).
- Mark restaurants/items as favourites.

### 2.2 Cart & Checkout
- Add/remove menu items to cart, change quantities.
- Cart shows itemised bill: subtotal, delivery fee, taxes, total.
- Choose a delivery address (saved or new).
- **Payment mode selection at checkout:**
  - Cash on Delivery (COD)
  - Online payment via card / UPI (mock payment gateway is acceptable)
- Place order → order is created with status `pending`.

### 2.3 Order Tracking (live)
- My Orders page shows order history with current status.
- **Live status tracker** for an active order (polling or WebSocket):
  1. `pending` → 2. `accepted` → 3. `preparing` → 4. `ready_for_pickup` → 5. `picked_up` → 6. `out_for_delivery` → 7. `delivered`
  - Or `rejected` / `cancelled`.
- Show which delivery partner is assigned, their name, phone, and **live location/ETA**.
- **Order tracking** screen like Zomato: restaurant icon → pickup point → delivery point with live updates.

### 2.4 Other Customer Features
- Profile management (edit name, phone, address).
- Order history with past bills and repeat-order option (one-click reorder).
- Cancel order (only while status is `pending` or `accepted`).
- Rate & review a restaurant after the order is delivered.
- Notifications/alerts for order status changes (in-app).

---

## 3. Restaurant Admin Portal (`/restaurant`)

### 3.1 Restaurant Profile Management
- Edit restaurant name, description, address, phone, cuisine, image.

### 3.2 Menu Management
- Add / edit / delete menu items (name, description, price, category, image).
- Set item availability (in-stock / out-of-stock toggles).

### 3.3 Incoming Orders — Accept / Reject
- Incoming orders appear in a notification queue as soon as a customer places them.
- Each order shows: order ID, customer name & phone, items with quantities, bill breakdown, payment mode (COD or online), delivery address.
- **Accept order** → status becomes `accepted` → then start preparing.
- **Reject order** → status becomes `rejected` with a reason → customer is notified instantly and refunded/cancelled.

### 3.4 Order Preparation Workflow
- Mark `accepted` → `preparing` → `ready_for_pickup`.
- When the order is `ready_for_pickup`, the system **auto-generates a pickup/delivery OTP** (6-digit) and shows it in the admin panel. The same OTP is shared with the assigned delivery partner.

### 3.5 Assign to Delivery Partner
- After the order is accepted/preparing, the admin **assigns an available delivery partner** from a list (shows distance, vehicles, current workload).
- Only available (online, not currently delivering) partners are shown.
- On assignment, a notification and live order card appears in the delivery partner's portal.
- Admin can see delivery status and partner's live tracking on the order.

### 3.6 Sales & Analytics
- Today's orders, total revenue, average order value.
- Order list filtered by status (new / preparing / ready / completed / rejected / cancelled).
- Item-wise sales report (which items sell most).
- Daily weekly sales chart.

---

## 4. Delivery Partner Portal (`/delivery`)

### 4.1 Availability & Assignments
- Go online/offline toggle (only online partners appear in admin's assign list).
- Assigned orders appear instantly as cards: pickup restaurant, customer address, items, earnings estimate, payment mode.
- **Accept / reject** the assigned delivery.

### 4.2 Pickup with OTP Verification
- On reaching the restaurant, the partner sees the **OTP** (generated when order became `ready_for_pickup`).
- Partner confirms pickup by entering/confirming the OTP → status becomes `picked_up`.

### 4.3 Live Tracking (the connecting link)
- Partner's location is tracked (browser geolocation polling, or `navigator.geolocation` sent every few seconds).
- Location is stored to the `deliveries`/`orders` record so the **customer portal can show the partner moving toward them on a map**.
- Status flow: `picked_up` → `out_for_delivery`.

### 4.4 Delivery & Payment Mode Confirmation
- On arrival: confirm delivery.
- **Payment mode handling at drop-off:**
  - If **COD** → partner confirms amount collected → mark `delivered`.
  - If **online** → partner confirms the payment was already received → mark `delivered`.
- The payment mode chosen by the customer at checkout is shown to the partner on the order card so they know whether to collect cash.
- Completing delivery records `actual_time` and adds earnings.

### 4.5 Earnings & History
- Delivery history with date, order, earnings per delivery, total earnings.
- Daily/weekly earnings summary.
- Profile management (name, phone, vehicle).

---

## 5. The Complete Connected Flow (single order lifecycle)

```
1. Customer logs in → browses restaurant → adds items to cart
2. Customer chooses address + payment mode → places order (status: pending)
3. Restaurant admin gets a new-order alert → ACCEPT (→ accepted) or REJECT (→ rejected, customer notified)
4. Admin marks order → preparing → ready_for_pickup
      ⟶ System auto-generates a 6-digit OTP when order is ready
5. Admin opens "Assign Delivery Partner" → sees only online/available partners → assigns one
6. Delivery partner receives the assignment → ACCEPTS or REJECTS it
      (If accepted, partner appears on customer's live tracking screen)
7. Partner reaches restaurant → verifies pickup using the OTP → picked_up
8. Partner starts delivery → live location streams to customer's tracker → out_for_delivery
9. Partner reaches customer → confirms payment mode (COD: collect cash | online: confirmed) → delivered
10. Customer sees "Delivered" + pays (COD/online at delivery) → can rate/review the restaurant
      ⟶ Earnings added to partner, analytics updated for restaurant, order saved in customer history
```

This order lifecycle is the backbone — **all three portals are views of the same order record, so every update by one role is immediately reflected in the others**.

---

## 6. Database Schema (PostgreSQL)

Additional fields/schema needed on top of the current tables:

- **users** — add `vehicle_type` (for delivery partners), `is_online` (partner availability), `latitude`, `longitude` (live location).
- **restaurants** — add `cuisine`, `rating`, `delivery_time`, `is_active`.
- **orders** — add `payment_mode` (`cod`, `online`), `payment_status` (`pending`, `paid`), `delivery_otp` (6-digit), `rejection_reason`, `estimated_delivery_time`.
- **order_items** — as-is (order_id, menu_item_id, quantity, unit_price).
- **deliveries** — add `otp`, `start_location`, `current_latitude`, `current_longitude`, `earnings`.
- **delivery_locations** — new table logging partner lat/lng with timestamps for live tracking.
- **favourites** — new table (customer_id, restaurant_id) for favourites.
- **reviews** — new table (order_id, customer_id, restaurant_id, rating, comment).

Sample tables:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(50),
                  ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE,
                  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8),
                  ADD COLUMN IF NOT EXISTS longitude DECIMAL(10,8);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_mode VARCHAR(20) DEFAULT 'cod',
                   ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending',
                   ADD COLUMN IF NOT EXISTS delivery_otp CHAR(6),
                   ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
                   ADD COLUMN IF NOT EXISTS estimated_delivery_time TIMESTAMP;

ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS otp CHAR(6),
                       ADD COLUMN IF NOT EXISTS earnings DECIMAL(10,2) DEFAULT 0;

CREATE TABLE IF NOT EXISTS delivery_locations (
    id SERIAL PRIMARY KEY,
    delivery_id INTEGER REFERENCES deliveries(id) ON DELETE CASCADE,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(10,8) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS favourites (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 7. API Endpoints (Backend, Express)

| Method | Endpoint | Role | Purpose |
|--------|----------|------|---------|
| POST | `/api/register` | public | Register user (role in body) |
| POST | `/api/login` | public | Login → JWT |
| GET | `/api/profile` | all | Get profile |
| PUT | `/api/profile` | all | Update profile |
| GET | `/api/restaurants` | public | List restaurants |
| GET | `/api/restaurants/:id/menu` | public | Menu of restaurant |
| POST | `/api/restaurants` | restaurant_admin | Create/update restaurant profile |
| PUT | `/api/restaurants/:id` | restaurant_admin | Update restaurant |
| POST | `/api/restaurants/:id/menu` | restaurant_admin | Add menu item |
| PUT | `/api/menu/:itemId` | restaurant_admin | Update menu item |
| DELETE | `/api/menu/:itemId` | restaurant_admin | Delete menu item |
| POST | `/api/orders` | customer | Place order (address + payment_mode) |
| GET | `/api/orders` | customer | My orders + live track data |
| POST | `/api/orders/:id/cancel` | customer | Cancel order |
| GET | `/api/restaurant/orders` | restaurant_admin | All incoming orders |
| PUT | `/api/orders/:id/accept` | restaurant_admin | Accept order |
| PUT | `/api/orders/:id/reject` | restaurant_admin | Reject order + reason |
| PUT | `/api/orders/:id/status` | restaurant_admin | preparing / ready_for_pickup (generates OTP) |
| GET | `/api/orders/:id/otp` | restaurant_admin | View delivery OTP |
| POST | `/api/orders/:id/assign` | restaurant_admin | Assign delivery partner |
| GET | `/api/delivery/available-partners` | restaurant_admin | List online available partners |
| GET | `/api/deliveries` | delivery_partner | My assigned deliveries |
| PUT | `/api/deliveries/:id/accept` | delivery_partner | Accept assignment |
| PUT | `/api/deliveries/:id/reject` | delivery_partner | Reject assignment |
| PUT | `/api/deliveries/:id/verify-otp` | delivery_partner | Verify pickup OTP |
| PUT | `/api/deliveries/:id/status` | delivery_partner | picked_up → out_for_delivery → delivered (payment confirm) |
| POST | `/api/deliveries/:id/location` | delivery_partner | Send live lat/lng (tracking) |
| GET | `/api/deliveries/:id/track` | customer/restaurant | Get partner live location |
| PUT | `/api/deliveries/:id/toggle-online` | delivery_partner | Go online/offline |
| GET | `/api/delivery/earnings` | delivery_partner | Earnings summary |
| POST | `/api/favourites` / DELETE | customer | Favourite / unfavourite restaurant |
| POST | `/api/reviews` | customer | Rate & review after delivery |

---

## 8. Technology Stack

- **Backend:** Node.js + Express.js, PostgreSQL (`pg`), JWT, bcrypt, CORS.
- **Frontend:** Plain HTML / CSS / JavaScript (one folder per portal). Serve statically.
- **Live tracking:** browser Geolocation API sent as POST on an interval (updates stored in `delivery_locations`); customer/restaurant polls `track` endpoint every few seconds (or upgrade to Socket.IO / WebSockets for real-time).
- **Maps:** optional Google Maps / Leaflet + OpenStreetMap for showing partner location; acceptable to show coordinates/text ETA if maps are not available.

---

## 9. Deliverables / Acceptance Criteria

1. One working login system; correct portal opens based on role.
2. Customer can place an order with a payment mode and track it live till delivery.
3. Restaurant admin can accept/reject orders, and the customer sees the result instantly.
4. Restaurant admin can assign an available delivery partner; partner gets the order instantly.
5. Ready order auto-generates an OTP; delivery partner must verify it before pickup.
6. Partner live location is visible to the customer while delivering.
7. COD vs online payment is shown on the order; partner confirms the correct mode at drop-off.
8. Earnings appear on the partner dashboard; revenue appears on the restaurant dashboard; history appears on the customer dashboard.
9. All three portals share the same live order state (no manual sync).

---

## 10. Suggested Build Order

1. **Backend + DB:** migration, auth, role middleware, restaurant/menu APIs.
2. **Customer:** browse → cart → checkout → order placed.
3. **Restaurant:** incoming orders → accept/reject → prepare → OTP → assign partner.
4. **Delivery:** assignments → accept → OTP pickup → location tracking → delivery + payment confirm.
5. **Connect the loop:** live status propagation + tracking + earnings/reports.