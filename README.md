# Weekly Planner / Ugeplan

An internal web application for weekly work planning and department management of cars, vacations, and more.  
En intern webapplikation til ugentlig arbejdsplanlægning og afdelingstyring af biler, ferier og meget mere.

---

## 🚀 Features / Funktioner

- **Weekly Planning Dashboard**  
  – Plan and assign tasks, meetings and projects for the upcoming week.  
  - **Ugentligt planlægningsdashboard**  
    – Planlæg og tildel opgaver, møder og projekter for den kommende uge.

- **Resource Management**  
  – Track and allocate company cars, equipment, and meeting rooms.  
  - **Ressourcestyring**  
    – Overvåg og tildel firmabiler, udstyr og mødelokaler.

- **Leave & Vacation Calendar**  
  – View and approve team leave requests, vacations, and sick days.  
  - **Ferie- og fraværskalender**  
    – Vis og godkend teamets ferie-, fraværs- og sygeanmodninger.

- **Department Overview**  
  – High-level metrics: utilization rates, upcoming absences, car availability.  
  - **Afdelingsoversigt**  
    – Overblik over nøgletal: ressourceudnyttelse, kommende fravær, biltilgængelighed.

- **Role-Based Access Control**  
  – Admin, manager and staff roles with granular permissions.  
  - **Rollebaseret adgangsstyring**  
    – Admin-, leder- og medarbejderroller med præcise rettigheder.

---

## 🛠️ Installation / Installation

1. **Clone the repository**  
   ```bash
   git clone https://github.com/kschmidtjohansen/polygon-weekly-compass.git
   cd polygon-weekly-compass
````

2. **Install dependencies**

   ```bash
   npm install        # for backend and frontend
   ```
3. **Build & start**

   ```bash
   npm run build      # Builds frontend assets
   npm start          # Launches server on http://localhost:3000
   ```

---

## ⚙️ Configuration / Konfiguration

1. **Copy the example environment file**

   ```bash
   cp .env.example .env
   ```
2. **Edit `.env`** and set your values:

   ```dotenv
   PORT=3000  
   DB_URL=postgres://user:password@host:port/dbname  
   JWT_SECRET=your_jwt_secret  
   ADMIN_EMAIL=admin@example.com  
   ```
3. **Optional**: Enable email notifications for leave approvals:

   ```dotenv
   EMAIL_HOST=smtp.example.com  
   EMAIL_USER=user@example.com  
   EMAIL_PASS=supersecret  
   ```

---

## ▶️ Usage / Brug

* **Development mode**

  ```bash
  npm run dev
  ```

  — Live‐reload server and frontend.

* **Production mode**

  ```bash
  npm start
  ```

  — Serves optimized build.

* **Access**
  Open your browser at `http://localhost:3000` (or configured `PORT`).

---

## 🔄 Cron & Scheduling / Planlagte opgaver

Use a cronjob or scheduler to send weekly summary emails every Monday at 08:00 Copenhagen time:

```cron
0 8 * * 1 cd /path/to/repo && npm run summary-email >> email.log 2>&1
```

---

## 🤝 Contributing / Bidrag

1. Fork this repo / Fork dette repo
2. Create a feature branch / Opret en feature-gren

   ```bash
   git checkout -b feature/my-feature
   ```
3. Commit your changes / Commit dine ændringer

   ```bash
   git commit -m "Add my feature"
   ```
4. Push to your fork / Push til din fork

   ```bash
   git push origin feature/my-feature
   ```
5. Open a Pull Request / Opret en Pull Request

---

## 📝 Changelog / Ændringslog

See [CHANGELOG.md](./CHANGELOG.md) for details on version history and updates.
Se [CHANGELOG.md](./CHANGELOG.md) for detaljer om versionshistorik og opdateringer.

---

## 📄 License / Licens

This project is licensed under the MIT License.
© 2025 Polygon Group A/S

Dette projekt er licenseret under MIT-licensen.
© 2025 Polygon Group A/S