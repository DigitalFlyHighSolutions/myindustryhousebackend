# Database Relations Overview

This document describes how the service databases and tables are structured in the **microservices stack** (Docker Compose + Postgres + Knex), and how they are logically related.

> **Important:** cross-service relationships are **by shared ID values only** (e.g. `userId`); there are **no cross-database foreign keys**.

---

## 1. What runs under Docker Compose
`docker-compose.yml` provisions one PostgreSQL database per service:
- `auth-service`
- `user-service`
- `seller-service`
- `product-service`
- `lead-service`
- `gst-service`
- `chat-service`
- `admin-service`

> Note: a `monolith/` directory exists, but it is not started by the current `docker-compose.yml`. If you need its schema, see `monolith/prisma/schema.prisma`.

---

## 2. Microservice databases (Knex)
Each microservice owns its schema. Migrations live under `<service>/db/migrations`.

### 2.1 user-service
**Migration:** `user-service/db/migrations/20251127100200_initial_schema.js`

**Tables:**
- `users` (UUID PK): canonical user identity for the microservices stack.
- `user_addresses` (UUID PK) with FK `userId` → `users.id`.

### 2.2 seller-service
**Migration:** `seller-service/db/migrations/20251127100100_initial_schema.js`

**Tables:**
- `seller_profiles` (UUID PK, `userId` unique)
- `plans` (UUID PK)
- `subscriptions` (UUID PK, `planId` FK → `plans.id`)
- `payments` (UUID PK, `subscriptionId` FK → `subscriptions.id`)

**Cross-service meaning:** `userId` values are expected to be `user-service.users.id`.

### 2.3 auth-service
**Migration:** `auth-service/db/migrations/20251127054727_initial_schema.js`

This migration creates the same tables as `seller-service` (`seller_profiles`, `plans`, `subscriptions`, `payments`). In the current gateway routing, seller/plan/payment endpoints point at `seller-service`, so treat these tables in `auth-service` as legacy/overlapping schema.

### 2.4 admin-service
**Migrations:**
- `admin-service/db/migrations/20251127120000_create_admin_settings_table.js`
- `admin-service/db/migrations/20251212120000_add_main_categories_table.js`
- `admin-service/db/migrations/20251213131000_seed_main_categories.js`

**Tables (intended):**
- `main_categories` (UUID PK, `name` unique, `isActive` boolean)
- `admin_settings` (incrementing int PK)

**Notes on current state:**
- Despite the filename, `20251127120000_create_admin_settings_table.js` also creates `main_categories`.
- `20251212120000_add_main_categories_table.js` also creates `main_categories`.

On a fresh database, running both “create main_categories” migrations may fail unless you reconcile/merge them.

### 2.5 product-service
**Migrations (current repo state):**
- `product-service/db/migrations/20251127060116_initial_schema.js` (normalizes columns on an existing `products` table; does not create tables)
- `product-service/db/migrations/20251211103000_add_business_category_to_products.js` (no-op placeholder)
- `product-service/db/migrations/20251211104000_add_business_category_to_products.js` (no-op placeholder)
- `product-service/db/migrations/20251213110000_add_main_and_subcategory_to_products.js` (adds `mainCategoryId` and `subCategory`, makes `productCategoryId` nullable)

**Tables (required by the running service):**
- `products` (expected by code in `product-service/repositories/productRepository.js`)

**Columns used by code (camelCase):**
- `id` (UUID)
- `sellerId` (string/UUID-as-string; expected to match `user-service.users.id`)
- `stockQuantity` (int)
- `businessCategory` (string; mapped to the main category name)
- `mainCategoryId` (UUID; expected to match `admin-service.main_categories.id`)
- `subCategory` (string; free text)
- plus fields like `name`, `description`, `brand`, `status`, `gstRate`, `gstInclusive`, `isFeatured`, `isLeadPlaceholder`

**Notes on current state:**
- The normalization migration also adds snake_case variants like `seller_id`, `stock_quantity`, `is_public` for compatibility/indexing.
- The repo migrations are not a complete “create schema from scratch” history for product-service; they assume `products` already exists.

### 2.6 chat-service
**Migration:** `chat-service/db/migrations/20251127100200_initial_schema.js`

**Tables:**
- `conversations` (int PK) with `productId` (UUID)
- `participants` (int PK) with `conversationId` → `conversations.id` and `userId` (UUID)
- `messages` (int PK) with `conversationId` → `conversations.id` and UUID `senderId` / `recipientId`

**Cross-service meaning:** `userId` / `senderId` / `recipientId` values are expected to be `user-service.users.id`. `productId` is expected to be a `product-service.products.id`.

### 2.7 lead-service
**Migration:** `lead-service/db/migrations/20251127120000_create_lead_service_tables.js`

Lead-service maintains its own tables (`users`, `products`, `requirements`, `conversations`, etc.) with string IDs. Treat it as its own bounded context rather than a strict mirror of `user-service`/`product-service` schemas.

### 2.8 gst-service
**Migrations:**
- `gst-service/db/migrations/20251127100000_initial_schema.js`
- `gst-service/db/migrations/20251127120000_create_gst_table.js`

Both migrations attempt to create `gst_details` but with different column sets.

**Table (intended / latest):** `gst_details`
- `gst_number` (unique)
- `company_name`
- `address`

On a fresh database, running both “create gst_details” migrations may fail unless you reconcile/merge them.

---

## 3. Cross-service ID conventions (practical)
- **Users:** canonical ID is `user-service.users.id` (UUID). Reused as:
  - `seller-service.seller_profiles.userId`
  - `seller-service.subscriptions.userId`
  - `seller-service.payments.userId`
  - `product-service.products.sellerId`
  - `chat-service.participants.userId` / `messages.senderId` / `messages.recipientId`
- **Main categories:** canonical ID is `admin-service.main_categories.id` (UUID). Reused as `product-service.products.mainCategoryId`.
- **Products:** canonical ID is `product-service.products.id` (UUID). Reused as `chat-service.conversations.productId`.
- **GST numbers:** shared by value (no FK) via `gst_details.gst_number`.

---

## 4. Source-of-truth note
This document is based on the **Knex migration files and current service code** in this repo. Some services contain overlapping/legacy migrations or no-op placeholder migrations to match existing DB state; if you are bootstrapping a fresh DB from scratch, you may need to reconcile those migrations first.
