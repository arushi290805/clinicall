# 🩺 CLINI-CALL — Team Bazinga

> **Voice-Enabled Healthcare Intake & AI Appointment Booking System**

CLINI-CALL is an intelligent, voice-powered healthcare management application designed to streamline patient intake and appointment scheduling for clinic front desks. Features include real-time Web Speech recognition for form intake, an AI Voice Agent powered by **Google Gemini** for conversational scheduling, and automated GitHub Actions CI/CD deployment to GitHub Pages.

---

## 🌟 Key Features

- **🎙️ Voice-Powered Intake Form**: Real-time speech-to-text input with automatic field formatting for quick patient registration.
- **🤖 AI Voice Booking Agent**: Conversational AI assistant powered by **Google Gemini 3.6 Flash** with function-calling capabilities to check doctor availability and schedule appointments.
- **📅 Specialist & Appointment Selection**: Intuitive doctor selection by specialty and instant slot availability verification.
- **⚡ Local SQLite / Prisma Database**: Fully functional offline/local development with zero cloud database dependency required.
- **🚀 Automated CI/CD Pipeline**: GitHub Actions workflow that automatically tests, builds, and deploys the application to **GitHub Pages**.

---

## 📦 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, React Router (`HashRouter`), TailwindCSS |
| **Backend** | Node.js, Express, TypeScript, Prisma ORM |
| **Database** | SQLite (`dev.db`) / PostgreSQL compatible |
| **AI / Voice** | Google Gemini API (`gemini-3.6-flash`), Web Speech API |
| **CI/CD** | GitHub Actions (`.github/workflows/deploy.yml`) & GitHub Pages |
| **Testing** | Vitest, Testing Library, Supertest |

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- Node.js 18+ and `npm` installed.

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/arushi290805/teambazinga.git
cd clini-call

# Install frontend dependencies
npm install

# Install backend dependencies
cd healthcare-backend
npm install
cd ..
```

### 2. Environment Configuration

In `healthcare-backend/.env`, set your Gemini API key:

```env
PORT=5000
DATABASE_URL="file:./dev.db"

# Gemini API Key (Required for AI Voice Booking Agent)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.6-flash
```

### 3. Database Setup & Seeding

Initialize the SQLite database and seed initial doctor records:

```bash
cd healthcare-backend
npx prisma db push
npx ts-node prisma/seed.ts
cd ..
```

### 4. Run Development Servers

- **Backend Express Server**:
  ```bash
  cd healthcare-backend
  npm run dev
  ```
  *(Server runs on `http://localhost:5000`)*

- **Frontend Vite App**:
  ```bash
  npm start
  ```
  *(App runs on `http://localhost:5173`)*

---

## 🧪 Testing & Build Verification

Run all unit tests across frontend and backend components:

```bash
# Run unit test suite (Vitest)
npm test

# Check TypeScript types
npx tsc --noEmit

# Build production bundle
npm run build
```

---

## ⚙️ GitHub Actions CI/CD Pipeline

The repository includes a pre-configured GitHub Actions workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

### Pipeline Workflow:
1. **Trigger**: Executes on every `push` to the `main` or `master` branch (or via `workflow_dispatch`).
2. **Build & Test**:
   - Installs dependencies using `npm ci`.
   - Runs all Vitest test suites (`npm test`).
   - Compiles TypeScript and builds production artifacts (`npm run build`).
3. **Deployment**: Deploys the static `dist/` directory directly to **GitHub Pages**.

### How to Enable GitHub Pages:
1. Push your changes to GitHub (`git push origin main`).
2. On GitHub, navigate to **Settings** -> **Pages**.
3. Under **Build and deployment** -> **Source**, select **GitHub Actions**.

