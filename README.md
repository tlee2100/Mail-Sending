# Personalized Email Marketing Platform — Client Applications

A modern, high-performance client suite for the **Personalized Email Marketing Platform**, powered by the [MailSendingBE](../../MailSendingBE) Express & PostgreSQL backend. This repository contains the primary **Vue 3 Web Marketing Application** and the **React Native Companion Mobile App**.

---

## Table of Contents

- [Overview](#overview)
- [Architecture & Applications](#architecture--applications)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Local Installation & Setup](#local-installation--setup)
  - [1. Backend Setup](#1-backend-setup)
  - [2. Web Application Setup (`FE/Mail-Sending-project`)](#2-web-application-setup-femail-sending-project)
  - [3. Mobile Companion Setup (`ReactNativeApp`)](#3-mobile-companion-setup-reactnativeapp)
- [Environment Configuration](#environment-configuration)
- [Available Scripts](#available-scripts)
- [Code Quality & Git Hooks](#code-quality--git-hooks)
- [Contributing & License](#contributing--license)

---

## Overview

The **Personalized Email Marketing Platform** provides businesses and marketers with an end-to-end platform for delivering transactional and high-volume marketing email campaigns. It features multi-account SMTP failover, an intuitive drag-and-drop visual email designer, contact segmentation with custom fields, live tracking (opens, clicks, unsubscribes), AI-powered media creation, and role-based administrative control.

---

## Architecture & Applications

This repository hosts two client applications communicating with the same centralized REST API:

```
MailSending/
├── MailSendingBE/              # Backend service (Node.js, Express 5, PostgreSQL, Supabase)
└── Mail-Sending/               # Client Applications repository (This repository)
    ├── FE/Mail-Sending-project/ # Primary Web Dashboard & Campaign Suite (Vue 3)
    ├── ReactNativeApp/          # Mobile Companion App (React Native + Expo)
    └── .husky/                  # Monorepo Git pre-commit hooks
```

1. **[Web Application (`FE/Mail-Sending-project`)](FE/Mail-Sending-project)**
   - The primary management console and campaign command center.
   - Built with **Vue 3 (Composition API)**, **TypeScript**, **Pinia**, and **Vite**.
   - Includes full campaign management, contact management, visual template builder, analytics, admin console, and AI generation tools.

2. **[Mobile Companion App (`ReactNativeApp`)](ReactNativeApp)**
   - A fast, on-the-go companion app for monitoring live metrics and executing urgent actions.
   - Built with **React Native** and **Expo**.
   - Allows users to monitor live campaign delivery status, pause/resume campaigns, search contacts, and dispatch individual quick emails from their phone.

---

## Key Features

### Web Application (`FE/Mail-Sending-project`)
- **Visual Drag-and-Drop Template Designer**:
  - Interactive block canvas supporting text, headers, images, buttons, social links, dividers, and columns.
  - Live desktop and mobile responsive preview.
  - Automatically compiles block schemas into cross-client email HTML with fallback inline styles.
- **Campaign Orchestration**:
  - Bulk campaign creation, scheduled dispatching, and recipient list binding.
  - Live campaign monitoring (sent, delivered, opened, clicked, bounced).
  - Campaign state controls: Start, Pause, Resume, and Cancel.
- **Contact Management & Segmentation**:
  - Organize contacts with tags and custom dynamic fields.
  - Bulk CSV and Excel (`.xlsx`) import and export.
  - Fast contact picker with live searching and multi-select filters.
- **Individual & Transactional Emailing**:
  - Compose and send single personalized emails with custom variables.
  - Draft auto-persistence to browser storage to prevent loss of work.
  - Full delivery preview modal before sending.
- **SMTP Account Pool**:
  - Manage multiple SMTP senders per account.
  - Daily sending quotas, default fallback selection, and real-time SMTP connection testing.
- **Live Deliverability & Engagement**:
  - Tracking pixels for email open rates.
  - Signed tracking tokens for click-through redirection and unsubscribe management.
- **AI Media Generator**:
  - Create email marketing images and promotional assets powered by AI (Pollinations / OpenAI) directly inside the app.
- **Administrative Suite**:
  - Role-based authorization (`user` vs `admin`).
  - System metrics, user account management, quota limits, and audit logs.

### Mobile Companion App (`ReactNativeApp`)
- Real-time campaign stats and engagement metrics.
- Campaign status toggling (pause / resume active runs).
- Rapid contact lookup and instant single-recipient email dispatch.

---

## Tech Stack

### Web Application (`FE/Mail-Sending-project`)
| Layer | Technology |
|---|---|
| **Framework** | Vue 3 (Composition API, `<script setup>`) |
| **Language** | TypeScript |
| **State Management** | Pinia |
| **Router** | Vue Router 4 |
| **Build Tool** | Vite 7 |
| **Type Checking** | `vue-tsc` |
| **Linting & Formatting** | ESLint 10 (Flat Config), Prettier 3 |
| **Git Hooks** | Husky 9, `lint-staged` |

### Mobile Application (`ReactNativeApp`)
| Layer | Technology |
|---|---|
| **Framework** | React Native 0.85+ |
| **Tooling** | Expo 56+ |
| **Language** | TypeScript |
| **Storage** | `@react-native-async-storage/async-storage` |

---

## Project Structure

```text
Mail-Sending/
├── .husky/                          # Git hooks (pre-commit triggers lint-staged)
│   └── pre-commit
├── FE/
│   └── Mail-Sending-project/        # Vue 3 Web Application
│       ├── public/                  # Static assets
│       ├── src/
│       │   ├── api/                 # Strongly-typed HTTP API clients
│       │   ├── assets/              # Global CSS & theme tokens
│       │   ├── components/          # Reusable UI components
│       │   │   ├── auth/            # Auth heroes and credentials forms
│       │   │   ├── campaigns/       # Campaign modals & recipient managers
│       │   │   ├── common/          # Modals, stat cards, skeletons, pagination
│       │   │   ├── contacts/        # Contact tables & editing modals
│       │   │   ├── designer/        # Block library, canvas, inspector, preview
│       │   │   └── emails/          # Contact pickers & email previewers
│       │   ├── composables/         # Reusable Vue composables (pagination, notice)
│       │   ├── layouts/             # AppLayout shell & navigation
│       │   ├── stores/              # Pinia global stores (auth, campaigns, contacts)
│       │   ├── types/               # TypeScript interfaces & DTO schemas
│       │   ├── utils/               # Helpers (draft storage, ownership, debounce)
│       │   └── views/               # Top-level routed views (Dashboard, Designer, etc.)
│       ├── .env.example             # Example frontend environment variables
│       ├── .env.development         # Local development environment overrides
│       ├── .prettierrc              # Prettier configuration
│       ├── .prettierignore          # Prettier ignore list
│       ├── eslint.config.js         # ESLint Flat Config (Vue + TypeScript + Prettier)
│       ├── package.json
│       ├── tsconfig.json
│       └── vite.config.ts
├── ReactNativeApp/                  # Mobile Companion App
│       ├── app/                     # React Native app views & navigation
│       ├── app.json                 # Expo configuration
│       ├── package.json
│       └── tsconfig.json
├── .gitignore                       # Root Git ignore rules
└── README.md                        # Project documentation
```

---

## Prerequisites

Before setting up the clients, ensure you have the following installed on your machine:

- **Node.js**: v18.19+, v20.19+, or v22.12+ (LTS recommended)
- **npm**: v9+ (or pnpm / yarn)
- **Git**: v2.30+
- **Backend Running**: An active instance of `MailSendingBE` (typically running on `http://localhost:5000`)
- **(Optional for Mobile)**: [Expo Go](https://expo.dev/go) on your physical Android/iOS device, or an Android Studio / Xcode emulator.

---

## Local Installation & Setup

### 1. Backend Setup
Make sure the backend is running first. In the adjacent backend directory:
```bash
cd ../MailSendingBE
npm install
npm run dev
```
*(Refer to `MailSendingBE/README.md` for database migration and `.env` configuration details).*

---

### 2. Web Application Setup (`FE/Mail-Sending-project`)

#### Step 1: Navigate to the Frontend directory
```bash
cd FE/Mail-Sending-project
```

#### Step 2: Install dependencies
```bash
npm install
```
> **Note**: Running `npm install` automatically links the Git pre-commit hooks via Husky.

#### Step 3: Configure Environment Variables
Copy the `.env.example` file to create your local environment file:
```bash
# On Windows PowerShell:
Copy-Item .env.example .env.development

# On macOS/Linux:
cp .env.example .env.development
```

Ensure the API base URL matches your backend instance:
```ini
# Backend API base URL
VITE_API_BASE_URL=http://localhost:5000/api/v1

# Optional dev proxy target for Vite (proxies /api/v1 calls):
VITE_API_PROXY_TARGET=http://localhost:5000
```

#### Step 4: Run the Development Server
```bash
npm run dev
```

Open your browser at the URL shown in the terminal (typically `http://localhost:5173`).

---

### 3. Mobile Companion Setup (`ReactNativeApp`)

#### Step 1: Navigate to the Mobile directory
```bash
cd ReactNativeApp
```

#### Step 2: Install dependencies
```bash
npm install
```

#### Step 3: Start the Expo Development Server
```bash
npm start
```

- Press `a` to open in an Android Emulator.
- Press `i` to open in an iOS Simulator.
- Scan the printed QR code with the **Expo Go** app on your phone (ensure your phone and PC are connected to the same Wi-Fi network).

---

## Available Scripts

### Web Application (`FE/Mail-Sending-project`)

| Script | Command | Description |
|---|---|---|
| `dev` | `npm run dev` | Starts the Vite local development server with HMR |
| `build` | `npm run build` | Runs type checking and builds the optimized production bundle in `dist/` |
| `preview` | `npm run preview` | Locally previews the production build output |
| `type-check` | `npm run type-check` | Runs `vue-tsc` to perform strict TypeScript validation |
| `lint` | `npm run lint` | Runs ESLint 10 Flat Config across all `.js`, `.ts`, and `.vue` files |
| `lint:fix` | `npm run lint:fix` | Automatically fixes auto-fixable lint issues |
| `format` | `npm run format` | Formats all files using Prettier |
| `format:check` | `npm run format:check` | Verifies that all files conform to Prettier formatting |

### Mobile Application (`ReactNativeApp`)

| Script | Command | Description |
|---|---|---|
| `start` | `npm start` | Starts the Expo development server |
| `android` | `npm run android` | Boots the application in the Android Emulator |
| `ios` | `npm run ios` | Boots the application in the iOS Simulator |
| `typecheck` | `npm run typecheck` | Validates TypeScript types across the mobile app |

---

## Code Quality & Git Hooks

The repository enforces strict code quality and formatting standards before code is committed:

1. **ESLint**:
   Configured in `FE/Mail-Sending-project/eslint.config.js` with TypeScript and Vue 3 rules.
2. **Prettier**:
   Configured in `FE/Mail-Sending-project/.prettierrc` with consistent quotation, line width (100), and semicolon rules.
3. **Husky & lint-staged**:
   Whenever `git commit` is executed, Husky runs the pre-commit hook (`.husky/pre-commit`). `lint-staged` automatically runs `eslint --fix` and `prettier --write` only on the staged files, guaranteeing that no broken syntax or unformatted code enters Git.

---

## Contributing & License

1. Fork or branch from `main`.
2. Follow the existing architecture (Pinia stores for state, modular components, typed DTOs).
3. Ensure `npm run lint`, `npm run format:check`, and `npm run type-check` pass before submitting pull requests.

Licensed under the MIT License.
