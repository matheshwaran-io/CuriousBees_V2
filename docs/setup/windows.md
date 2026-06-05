# Windows Local Setup Guide

Follow this guide to configure and run the CuriousBees V2 project on Windows.

---

## 💻 Prerequisites

Ensure you have the following installed:
1. **Node.js**: `v22.14.0` (Install via [fnm](https://github.com/Schniz/fnm) or the standard installer).
2. **Git**: [Git for Windows](https://gitforwindows.org/).
3. **Docker Desktop**: [Download here](https://www.docker.com/products/docker-desktop/). Make sure WSL 2 backend integration is enabled.
4. **VS Code** (Optional but recommended).

---

## 🛠️ Installation & Configuration

### 1. Clone & Install
Open **PowerShell** or **Command Prompt** (cmd) and run:
```powershell
git clone <repository-url>
cd CuriousBees_V2
npm install
```

### 2. Start Local Databases (Docker)
Start Docker Desktop on your machine. Then run:
```powershell
npm run docker:up
```
This runs the local PostgreSQL and Redis containers in the background.

### 3. Configure Environments
Copy the example configuration templates in each project directory:
* **Root**: Copy `.env.example` $\rightarrow$ `.env`
* **Frontend (`apps/web`)**: Copy `apps/web/.env.example` $\rightarrow$ `apps/web/.env.local`
* **Backend (`apps/api`)**: Copy `apps/api/.env.example` $\rightarrow$ `apps/api/.env`

*Ensure that `DEVELOPMENT_MODE=true` and `NEXT_PUBLIC_DEVELOPMENT_MODE=true` are set to enable the local authentication bypass.*

### 4. Database Setup & Seed
Compile types, push the schema, and seed test data to PostgreSQL:
```powershell
npm run setup
```

### 5. Launch Development Servers
Start both the frontend and backend servers concurrently:
```powershell
npm run dev
```
* **Frontend**: Open [http://localhost:3000](http://localhost:3000)
* **Backend API**: Running at [http://localhost:4000](http://localhost:4000)

---

## 🔧 Windows Troubleshooting

### Port `3000` or `4000` already in use (`EADDRINUSE`)
If a server fails to bind to its port:
1. Identify the process ID (PID) listening on the port:
   ```cmd
   netstat -ano | findstr :4000
   ```
2. Kill the process:
   ```cmd
   taskkill /F /PID <PID_NUMBER>
   ```

### Docker WSL 2 Engine Not Running
If `npm run docker:up` fails:
* Ensure Docker Desktop is open and has successfully started its engine.
* Go to Docker Desktop **Settings > General** and verify **Use the WSL 2 based engine** is checked.
