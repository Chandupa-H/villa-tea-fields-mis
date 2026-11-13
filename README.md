# Villa Tea Fields — Proposed MIS Frontend Prototype

This repository contains the frontend prototype for the **Villa Tea Fields Management Information System (MIS)**, built with Next.js, React, and Tailwind CSS.

---

## Prerequisites

* **Node.js:** Version `20.9` or newer (tested on `v22.19.0`)
* **pnpm:** Package manager (install globally via `npm install -g pnpm` or enable via `corepack enable pnpm`)
* **Git:** Installed locally to clone and push changes

---

## Getting Started (Running Locally)

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd "Villa Tea Fields"
   ```

2. **Install `pnpm` (if not already installed on your machine):**
   ```bash
   npm install -g pnpm
   ```

3. **Install project dependencies:**
   ```bash
   pnpm install
   ```
   *(Alternative: You can also use `npm install` if preferred.)*

4. **Start the development server:**
   ```bash
   pnpm dev
   ```
   *(Alternative: `npm run dev`)*

5. **View in browser:**
   Open [http://localhost:3000](http://localhost:3000) in your browser. Press `Ctrl + C` in the terminal to stop the server.

---

## Module & Page Assignments

Each team member is responsible for editing and refining the UI fields, mock data, and interactions for their assigned pages:

| Module / Page | Assigned Member |
| :--- | :--- |
| **Dashboard** | Danushka |
| **Reports and Analysis** | Danushka |
| **Reservations** | Chandupa |
| **Rooms** | Sehan |
| **Guests** | Chathuni |
| **Daily Operations** | Kavindulal |
| **Auth** | Kavindulal |
| **Payments and Finance** | Lisitha |
| **Pricing and Promotions** | Lisitha |
| **Marketing and CRM** | Sachin |
| **AI Business Assistant** | Dewmi |
| **Audit Logs** | Dewmini |
| **Settings** | Hansana |

---

## Team Git Workflow (Avoiding Merge Conflicts)

To prevent overwriting each other's work, please follow these steps when making updates:

1. **Always pull the latest `main` branch before starting work:**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Create a separate branch for your module:**
   ```bash
   git checkout -b feature/<your-module-name>
   ```
   *(Example: `git checkout -b feature/reservations`)*

3. **Edit only the files related to your assigned pages**, then commit and push your branch:
   ```bash
   git add .
   git commit -m "Update <module-name> fields and layout"
   git push -u origin feature/<your-module-name>
   ```

4. **Open a Pull Request (PR)** on GitHub to merge your branch into `main`.