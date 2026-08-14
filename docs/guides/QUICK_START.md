# CuriousBees V2 — Onboarding Quick Start Guide

Welcome to the CuriousBees development team! This guide will help you set up and run the monorepo locally in less than 5 minutes.

---

## 🚀 4-Step Setup Workflow

### 1. Clone the Repository

```bash
git clone <repository-url>
cd CuriousBees_V2
```

### 2. Configure Environment Variables

Copy the consolidated environment configuration template into your active `.env` file:

```bash
cp .env.example .env
```

_(Open the newly created `.env` file and review connection credentials if using cloud instances; otherwise, the defaults are configured to support local setups)._

### 3. Run Automated Setup

This script validates your environment variables, generates the Prisma database client, and compiles shared packages:

```bash
npm run setup
```

### 4. Boot Development Servers

Start both the NestJS API backend (`http://localhost:4000`) and Next.js web frontend (`http://localhost:3000`) in parallel:

```bash
npm run dev
```

---

## 🔑 Development Authentication Bypass

By default, the setup is configured with `AUTH_MODE=bypass` enabled.

1. Open your browser and navigate to `http://localhost:3000/login`.
2. Click the **Developer Sandbox Bypass** controls.
3. Select your testing role (**Research Scholar**, **Faculty Supervisor**, or **Institution Admin**).
4. The system will automatically construct mock credentials and redirect you to the appropriate dashboard portal without requiring Google SSO or Firebase configurations.
5. In addition, you can use the **Dev Override Switcher** widget at the bottom-right corner of the page to toggle roles dynamically on the fly.
