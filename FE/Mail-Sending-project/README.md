# Mail-Sending Web Application (Frontend)

The official web frontend for the **Personalized Email Marketing Platform**. Built with **Vue 3**, **TypeScript**, **Vite**, **Pinia**, and **Vue Router**.

---

## Table of Contents

- [Features](#features)
- [Architecture & Folder Structure](#architecture--folder-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the App](#running-the-app)
- [Available Scripts](#available-scripts)
- [Code Quality & Linting](#code-quality--linting)
- [Connecting to Backend](#connecting-to-backend)

---

## Features

- **Dashboard**: Live campaign delivery stats, click & open rates, recent campaign logs, and quick actions.
- **Drag-and-Drop Template Designer**:
  - Interactive block canvas: Headers, Text, Images, Buttons, Social icons, Columns, Dividers.
  - Live inspector for modifying styles, typography, spacing, and links.
  - Desktop & mobile responsive live preview modal.
  - Compiles directly into standard cross-client email HTML.
- **Campaign Management**:
  - Multi-step campaign builder (selecting templates, senders, and recipient segments).
  - Campaign queue management: Start, Pause, Resume, Cancel, and track deliverability metrics.
- **Contact Management & Segmentation**:
  - Create and manage contacts with tags and custom dynamic fields.
  - Bulk CSV and Excel (`.xlsx`) import and export.
  - Dedicated Contact Picker modal with instant email search and selection.
- **Individual & Direct Email Compose**:
  - Send single customized emails to specific recipients.
  - Template loading with HTML preview modal before dispatch.
  - Automatic draft state persistence in local browser storage.
- **SMTP Accounts Management**:
  - Add and manage multiple SMTP sender accounts.
  - Set default senders, define daily limits, and test SMTP connections live.
- **AI Media Generation**:
  - Generate promotional images and media directly from text prompts using AI.
- **Admin Control Panel**:
  - User and role management, audit logs, global system settings, and usage limits.

---

## Architecture & Folder Structure

```text
src/
├── api/                     # Type-safe API client services
│   ├── authApi.ts           # Authentication & OTP verification
│   ├── campaignsApi.ts      # Campaigns & recipient scheduling
│   ├── contactsApi.ts       # Contacts, tags, and custom fields
│   ├── dashboardApi.ts      # Metrics & delivery logs
│   ├── emailAccountsApi.ts  # SMTP accounts & verification
│   ├── http.ts              # Fetch wrapper with JWT injection & error handling
│   ├── individualEmailsApi.ts # Single email dispatch & drafts
│   ├── templateDesignerApi.ts # Visual designer templates & compilation
│   └── templatesApi.ts      # Template listing & HTML previews
├── assets/                  # CSS tokens, animations, and global stylesheets
│   ├── base.css
│   ├── global.css
│   └── main.css
├── components/              # Modular, reusable UI components
│   ├── auth/                # Auth branding & login/register forms
│   ├── campaigns/           # Campaign creation modal & recipient manager
│   ├── common/              # Base modals, stat cards, skeletons, pagination
│   ├── contacts/            # Contact table & form modal
│   ├── designer/            # Block library, canvas, inspector, preview modal
│   └── emails/              # Contact picker & email preview modal
├── composables/             # Reusable Vue composables (useNotice, usePagination)
├── layouts/                 # AppLayout shell with topbar and sidebar navigation
├── stores/                  # Pinia stores (auth, campaigns, contacts)
├── types/                   # TypeScript interfaces & API contracts
├── utils/                   # Helpers (draft storage, debounce, ownership checks)
├── views/                   # Top-level routed views (Dashboard, Campaigns, etc.)
├── App.vue                  # Root Vue component with global notifications
└── main.ts                  # Application entry point with Pinia & Router
```

---

## Tech Stack

- **Core**: Vue 3 (Composition API, `<script setup>`)
- **Language**: TypeScript (~5.9)
- **State Management**: Pinia 4
- **Routing**: Vue Router 4
- **Build Tool**: Vite 7
- **Code Quality**: ESLint 10 (Flat Config), Prettier 3, Husky 9, `lint-staged`
- **Type Checking**: `vue-tsc`

---

## Getting Started

### Prerequisites

- **Node.js**: v18.19+, v20.19+, or v22.12+ (LTS recommended)
- **npm**: v9+
- Running backend service: `MailSendingBE` on `http://localhost:5000`

### Installation

```bash
# Navigate to the frontend directory
cd FE/Mail-Sending-project

# Install all dependencies (also configures Husky Git hooks)
npm install
```

### Environment Variables

Copy `.env.example` to `.env.development`:

```bash
# Windows PowerShell
Copy-Item .env.example .env.development

# Linux/macOS
cp .env.example .env.development
```

Edit `.env.development` to configure the backend API endpoint:

```ini
# Backend base URL for frontend API calls
VITE_API_BASE_URL=http://localhost:5000/api/v1

# Optional: Vite dev proxy target (proxies /api/v1 calls to this host)
VITE_API_PROXY_TARGET=http://localhost:5000
```

### Running the App

```bash
# Start local development server with Hot Module Replacement (HMR)
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## Available Scripts

| Script         | Command                | Purpose                                                   |
| -------------- | ---------------------- | --------------------------------------------------------- |
| `dev`          | `npm run dev`          | Starts the Vite dev server with instant HMR               |
| `build`        | `npm run build`        | Validates types and compiles production assets in `dist/` |
| `build-only`   | `npm run build-only`   | Builds Vite assets without running `vue-tsc`              |
| `preview`      | `npm run preview`      | Locally serves the production `dist/` build               |
| `type-check`   | `npm run type-check`   | Runs `vue-tsc` strict type checking                       |
| `lint`         | `npm run lint`         | Runs ESLint 10 Flat Config                                |
| `lint:fix`     | `npm run lint:fix`     | Fixes auto-fixable ESLint rules                           |
| `format`       | `npm run format`       | Formats all files with Prettier                           |
| `format:check` | `npm run format:check` | Verifies code formatting without modifying files          |

---

## Code Quality & Linting

This project uses modern Flat Config ESLint (`eslint.config.js`) together with Prettier:

```bash
# Run linter
npm run lint

# Check formatting
npm run format:check

# Format files
npm run format
```

All staged files are automatically formatted and verified before each commit via **Husky** and **`lint-staged`**.

---

## Connecting to Backend

When logging in for the first time:

1. Ensure the `MailSendingBE` server is running and connected to PostgreSQL/Supabase.
2. If you need an admin account, run `npm run seed:admin` or create a user via the registration page.
3. Configure your SMTP settings in **Email Accounts** (`/email-accounts`) before sending your first campaign.
