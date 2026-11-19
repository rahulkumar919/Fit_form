# 🛍️ Fit & Form (MelaMart) — Full-Stack E-Commerce Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-Upstash-DC382D?style=for-the-badge&logo=redis)](https://redis.io/)

> **A high-performance, modern D2C Men's Fashion & Outfit Bundling E-Commerce web application.** Built with **Next.js 16 App Router**, **Turbopack**, **TypeScript**, and **Tailwind CSS v4**, featuring an end-to-end custom **Admin CMS**, **Social Proof conversion mechanics**, **dynamic Floriwish-style Reviews & FAQs**, and **automated catalog synchronization**.

---

## 🌟 Key Highlights & Engineering Features

### 🛒 Modern Storefront & Customer Experience
- **Dynamic Outfit Bundles ("Combos"):** Curated men's fashion sets (Jeans + Shirts + Hoodies) with automatic bundle discounts and seamless one-click add-to-cart.
- **Floriwish-Style Social Proof & Reviews:**
  - Interactive testimonial horizontal scroll cards with customer avatar, location badges, and verified purchase pills.
  - Granular 5-star rating breakdown progress bars.
  - Customer review modal with instant image attachments.
- **Dynamic FAQ Section:**
  - Responsive 2-column accordion system with smooth height/opacity CSS grid transitions.
  - Centered hero branding and intuitive `+` to `×` rotation indicators.
  - Deep-linked anchor navigation (`#faq`) from the footer.
- **Conversion-Optimized Product Details:**
  - High-res image gallery slider with mobile pinch/swipe zoom.
  - Dynamic size selector & responsive interactive size guide chart.
  - Real-time stock counters and automated sales proof badges (e.g., *"🔥 14 sold in last 24h"*).
  - Floating WhatsApp & Instagram social contact triggers.

### 🛡️ Enterprise-Grade Admin Control Center (`/admin`)
- **Visual Section Builder:** Drag-and-drop / re-orderable homepage sections (Hero banners, trending combos, reels showcase, testimonial strips).
- **Social Proof Overrides:** Fine-tune manual ratings, review counts, and base purchase volume per product to boost customer trust.
- **Dynamic FAQ Manager:** Full CRUD interface to add, edit, reorder via arrow shortcuts, and toggle public visibility of store FAQs.
- **Review Moderation Hub:** Approve/reject customer reviews, author store-verified testimonials, and pin featured customer photos.
- **Catalog & Inventory Lifecycle:** Complete product management with multi-variant SKUs, pricing rules, categories, and Meesho sourcing integration.
- **Security & RBAC:** Protected admin routes with session tokens, audit action logs, and rate-limiting.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack, Server Actions) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (Strict typing, 0 TS errors) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) + Lucide Icons + Radix UI primitives |
| **Database** | [MongoDB Atlas](https://www.mongodb.com/) via [Mongoose ODM](https://mongoosejs.com/) |
| **Cache Layer** | [Redis / Upstash](https://upstash.com/) for high-throughput homepage & catalog reads |
| **Payments** | Cashfree Payments & Cash on Delivery (COD) workflows |
| **Validation** | [Zod](https://zod.dev/) for robust end-to-end API schema validation |
| **Quality & Tests** | Vitest, ESLint, TypeScript Strict Compiler |

---

## 📁 Project Structure

```text
├── src/
│   ├── app/
│   │   ├── (store)/                 # Customer-facing storefront routes
│   │   │   ├── combo/ & combos/     # Outfit bundles showcase
│   │   │   ├── product/[slug]/      # Conversion-focused PDP
│   │   │   ├── faq/                 # Dedicated & footer FAQ routes
│   │   │   ├── checkout/            # Multi-step checkout pipeline
│   │   │   └── layout.tsx           # Store global layout with announcement & footer
│   │   ├── admin/                   # Admin panel dashboard & managers
│   │   │   ├── (panel)/products/    # Product catalog manager
│   │   │   ├── (panel)/faq/         # Dynamic FAQ manager
│   │   │   ├── (panel)/reviews/     # Review moderation & testimonials
│   │   │   └── (panel)/homepage/    # CMS banner & section editor
│   │   └── api/                     # RESTful API endpoints (Admin & Public)
│   ├── components/
│   │   ├── admin/                   # Reusable glassmorphic Admin UI components
│   │   ├── faq/                     # Floriwish-style FAQ 2-col accordion
│   │   ├── products/                # PDP galleries, review bars, sales badges
│   │   └── layout/                  # Header, navigation, announcement & footer
│   ├── models/                      # Mongoose schemas (Product, Review, Faq, Order, etc.)
│   ├── services/                    # Server-side business logic & caching
│   └── lib/                         # Utilities, API response helpers, auth guards
├── scripts/                         # Database seeding utilities (reviews, FAQs, admin)
└── public/                          # Optimized WebP assets, icons, logos
```

---

## ⚡ Quick Start & Installation

### Prerequisites
- **Node.js**: `20.9.0` or higher
- **MongoDB**: Connection string (local or MongoDB Atlas)

### 1. Clone the repository
```bash
git clone https://github.com/rahulkumar919/Fit_form.git
cd Fit_form
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory (refer to `.env.example`):
```env
# Database
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=melamart
USE_REAL_DB=true

# Authentication
AUTH_SECRET=your_generated_auth_secret_key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Seed Database (Optional)
```bash
# Seed initial categories, products and outfit combos
npm run seed

# Seed verified customer reviews and testimonials
npm run seed:reviews

# Seed 14 initial store FAQs
npm run seed:faqs

# Create initial admin account
npm run create-admin -- admin@melamart.in 'YourStrongPassword123!' "Admin User"
```

### 5. Start Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the storefront, or [http://localhost:3000/admin](http://localhost:3000/admin) to access the Admin Panel.

---

## 🧪 Verification & Build

```bash
# Verify TypeScript strict typing
npm run typecheck

# Execute unit tests
npm test

# Production build test
npm run build
```

---

## 👨‍💻 Author

**Rahul Kumar**
- GitHub: [@rahulkumar919](https://github.com/rahulkumar919)
- Role: Full-Stack Developer / Frontend Specialist

---

## 📄 License
This project is licensed under the MIT License — feel free to explore and adapt!
