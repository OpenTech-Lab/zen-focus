# ZenFocus App

A minimal, modern **focus & wellness web app** built with  
**AWS Amplify + Next.js + Tailwind CSS + shadcn/ui**.

ZenFocus helps you stay present and productive with customizable timers for studying, deep work, yoga, and meditation — all wrapped in a clean, distraction-free UI.

---

## ✨ Features

- ⏳ **Countdown Timer**
  - Start, pause, reset with smooth animations
  - Visual progress ring / bar

- 🎛 **Focus Modes**
  - 🎓 Study (Pomodoro 25/5)
  - 💻 Deep Work (50/10)
  - 🧘 Yoga (custom breathing/pose intervals)
  - 🌌 Zen (open timer with ambient background)

- 📊 **History Tracking** _(optional)_
  - Save sessions and streaks with Amplify Data
  - Minimal dashboard showing total focus time

- 🎶 **Ambience & Themes**
  - Light / Dark mode toggle
  - Ambient sounds (rain, forest, ocean)
  - Calming color palette: sage, beige, muted blue

---

## 🛠️ Tech Stack

- [Next.js (App Router)](https://nextjs.org/) – React framework for UI + routing
- [Tailwind CSS](https://tailwindcss.com/) – utility-first styling
- [shadcn/ui](https://ui.shadcn.com/) – accessible, modern UI components
- [AWS Amplify](https://aws.amazon.com/amplify/) – auth, data, hosting
- [TypeScript](https://www.typescriptlang.org/) – type safety

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/zenfocus.git
cd zenfocus
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
```

### 3. Configure Amplify

```bash
npx amplify init
```

Follow the prompts to set up your Amplify environment.

### 4. Run the dev server

```bash
npm run dev
```

App runs on [http://localhost:3000](http://localhost:3000).

---

## 🌱 Roadmap

- [ ] MVP: Countdown timer with modes + clean UI
- [ ] Add dark/light theme toggle
- [ ] Add ambient sounds
- [ ] Add session history with Amplify Data
- [ ] Shareable focus rooms
- [ ] SaaS features (export logs, premium themes, team focus)

---

## 🤝 Contributing

Pull requests are welcome!
If you’d like to add a new focus mode, improve UI/UX, or enhance functionality, open an issue first to discuss your ideas.

---

## 📜 License

MIT License © 2025
