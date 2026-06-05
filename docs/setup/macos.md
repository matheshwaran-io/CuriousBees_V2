# macOS Local Setup Guide

Follow this guide to configure and run the CuriousBees V2 project on macOS.

---

## 💻 Prerequisites

Ensure you have the following installed:
1. **Xcode Command Line Tools**: Run `xcode-select --install` in the terminal.
2. **Homebrew** (Optional but recommended): [Download here](https://brew.sh/).
3. **Node.js**: `v22.14.0` (Install via `nvm` or Homebrew).
4. **Docker Desktop for Mac**: [Download here](https://www.docker.com/products/docker-desktop/). Choose the correct version for your Mac processor (Intel or Apple Silicon).

---

## 🛠️ Installation & Configuration

### 1. Clone & Install
Open your terminal and run:
```bash
git clone <repository-url>
cd CuriousBees_V2
nvm install
npm install
```
*Note: `nvm install` will automatically read the project's `.nvmrc` and install/switch to Node v22.*

### 2. Start Local Databases (Docker)
Start the Docker Desktop application, then run:
```bash
npm run docker:up
```

### 3. Configure Environments
Copy the environment files:
* **Root**: Copy `.env.example` $\rightarrow$ `.env`
* **Frontend (`apps/web`)**: Copy `apps/web/.env.example` $\rightarrow$ `apps/web/.env.local`
* **Backend (`apps/api`)**: Copy `apps/api/.env.example` $\rightarrow$ `apps/api/.env`

*Ensure that `DEVELOPMENT_MODE=true` and `NEXT_PUBLIC_DEVELOPMENT_MODE=true` are active to bypass external Firebase auth.*

### 4. Database Setup & Seed
Initialize the database tables and seed mock data:
```bash
npm run setup
```

### 5. Launch Development Servers
Start both the frontend and backend servers concurrently:
```bash
npm run dev
```
* **Frontend**: Open [http://localhost:3000](http://localhost:3000)
* **Backend API**: Running at [http://localhost:4000](http://localhost:4000)

---

## 🔧 macOS Troubleshooting

### Port `3000` is already in use
On macOS, port `3000` or `5000` can sometimes be occupied by built-in macOS features (such as AirPlay Receiver).
To fix this:
1. Go to **System Settings > General > AirPlay & Handoff**.
2. Turn off **AirPlay Receiver**.
3. If it is still blocked, find the PID and kill it:
   ```bash
   lsof -i :3000
   kill -9 <PID_NUMBER>
   ```
