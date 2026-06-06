# Linux Local Setup Guide

Follow this guide to configure and run the CuriousBees V2 project on Linux (Ubuntu/Debian-based distributions).

---

## 💻 Prerequisites

Ensure you have the following installed:
1. **Node.js**: `v22.14.0` (Install via `nvm`).
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
   nvm install 22
   ```
2. **Git**
3. **Docker Engine & Docker Compose Plugin**:
   ```bash
   sudo apt-get update
   sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
   ```

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

### 2. Start Local Databases (Docker)
Ensure your user has permission to interact with the Docker daemon. If you get permission errors, either prefix the command with `sudo` or add your user to the `docker` group:
```bash
# Optional: Add user to docker group (requires logout/login to take effect)
# sudo usermod -aG docker $USER

npm run docker:up
```

### 3. Configure Environments
Copy the environment variables:
* **Root**: Copy `.env.example` $\rightarrow$ `.env`
* **Frontend (`apps/web`)**: Copy `apps/web/.env.example` $\rightarrow$ `apps/web/.env.local`
* **Backend (`apps/api`)**: Copy `apps/api/.env.example` $\rightarrow$ `apps/api/.env`

*Ensure that `DEVELOPMENT_MODE=true` and `NEXT_PUBLIC_DEVELOPMENT_MODE=true` are active to enable the local bypass.*

### 4. Database Setup & Seed
Initialize Prisma and seed the PostgreSQL database:
```bash
npm run setup
```

### 5. Launch Development Servers
Start Next.js and NestJS concurrently:
```bash
npm run dev
```
* **Frontend**: Open [http://localhost:3000](http://localhost:3000)
* **Backend API**: Running at [http://localhost:4000](http://localhost:4000)

---

## 🔧 Linux Troubleshooting

### Docker Permission Denied
If you see `Permission denied` when running Docker commands:
Run the command with `sudo` or grant your user account local Docker access:
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### Port `3000` or `4000` is already in use
Find the blocking process and stop it:
```bash
sudo lsof -i :4000
kill -9 <PID_NUMBER>
```
