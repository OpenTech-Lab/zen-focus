# zenFocus

> _Stay present, stay productive — with focus timers designed for deep work, study, yoga, and meditation._

zenFocus is a **modern focus app** that provides customizable timers wrapped in a clean, distraction-free UI. Whether you’re studying, practicing yoga, meditating, or doing deep work, zenFocus helps you stay mindful and productive.

Built with **AWS Amplify Gen 2 + Next.js (App Router) + Tailwind CSS + shadcn/ui**, the project is designed for scalability, modularity, and developer efficiency.

---

## 🚀 Project Overview

- **Purpose**: To provide a lightweight, modern web app that promotes focus and mindfulness through customizable timers.
- **Problem**: Most timer apps are cluttered, overly complex, or lack the flexibility for different focus styles (study, deep work, yoga, meditation).
- **Target Audience**:
  - Students and professionals practicing **deep work**.
  - People who want **guided focus sessions** for productivity.
  - Yoga and meditation practitioners seeking **minimalist timers**.

---

## 🏛 Architecture & Design Principles

### Tech Stack

- **Frontend**: Next.js (App Router, React 18, Server & Client Components).
- **Styling/UI**: Tailwind CSS + shadcn/ui components for consistency and accessibility.
- **Backend/Hosting**: AWS Amplify Gen 2 (infrastructure-as-code, CI/CD, managed hosting).

### Design Choices

- **Scalability**: Modular architecture — Amplify provides cloud scalability, while Next.js ensures flexible rendering (SSR/SSG).
- **Modularity**: Feature-driven folder structure for clear separation of concerns.
- **Clean UI/UX**: Minimalist design with shadcn/ui for reusable, accessible components.
- **Maintainability**: Clear conventions for folder structure, naming, and code style.

---

## ⚙️ Installation & Setup

### Prerequisites

- Node.js (>=18)
- pnpm / npm / yarn
- AWS CLI configured with access to an Amplify environment

### Setup Steps

```bash
# 1. Clone the repository
git clone https://github.com/<your-org>/zenfocus.git
cd zenfocus

# 2. Install dependencies
pnpm install
# or: npm install / yarn install

# 3. Configure Amplify
amplify pull --appId <your-app-id> --envName dev

# 4. Run local dev server
pnpm dev
```

App runs locally at **[http://localhost:3000](http://localhost:3000)**

### Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_APP_NAME=zenFocus
AMPLIFY_ENV=dev
AMPLIFY_API_URL=<your-api-url>
```

---

## ▶️ Usage Guidelines

### Running Locally

```bash
pnpm dev
```

### Building for Production

```bash
pnpm build
pnpm start
```

### Testing

```bash
pnpm test
```

### Deployment

CI/CD is handled by **Amplify Hosting**. Each push to `main` triggers a build & deployment.
Feature branches can be connected to Amplify **preview environments**.

---

## 📂 Code & Folder Structure

```
zenfocus/
├── app/               # Next.js App Router entry points
│   └── layout.tsx     # Root layout
├── components/        # Reusable UI components (shadcn/ui + custom)
├── lib/               # Utility functions, API clients
├── styles/            # Global Tailwind styles
├── amplify/           # Amplify backend configs (Gen 2)
├── tests/             # Unit & integration tests
└── public/            # Static assets
```

**Conventions**:

- **TypeScript first** — all code is written in `.ts` / `.tsx`.
- **Component-driven** — reusable UI follows `shadcn/ui` conventions.
- **Naming**: kebab-case for files, PascalCase for components.

---

## 🤝 Contribution & Collaboration

### Branching Model

- `main` → production branch (protected).
- `dev` → active development branch.
- feature branches → `feature/<short-description>`

### PR Standards

- PRs must reference an issue.
- Require at least 1 review before merge.
- Squash commits for cleaner history.

### Code Review Process

- Linting and tests must pass before merging.
- Reviews focus on readability, maintainability, and performance.

### Reporting Issues / Requesting Features

- Use [GitHub Issues](../../issues) with proper labels (`bug`, `enhancement`, `question`).
- For urgent support, contact maintainers (below).

---

## 📜 Licensing & Contact Information

- **License**: MIT License (see [LICENSE](./LICENSE))

---

✨ _zenFocus is more than a timer — it’s a mindful productivity tool designed for simplicity, focus, and calm._
