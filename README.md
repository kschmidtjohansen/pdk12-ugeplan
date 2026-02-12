
# PDK12 Ugeplan

![GitHub repo size](https://img.shields.io/github/repo-size/kschmidtjohansen/pdk12-ugeplan?style=flat-square)
![Last commit](https://img.shields.io/github/last-commit/kschmidtjohansen/pdk12-ugeplan?style=flat-square)
![GitHub issues](https://img.shields.io/github/issues/kschmidtjohansen/pdk12-ugeplan?style=flat-square)
![GitHub license](https://img.shields.io/github/license/kschmidtjohansen/pdk12-ugeplan?style=flat-square)

> 🇩🇰 Scroll ned for dansk version  
> 🇬🇧 English version below

---

## 🇩🇰 Dansk version

### 📌 Om projektet

**PDK12 Ugeplan** er en digital planlægningsløsning til Polygon Skadeservice. Systemet giver et komplet overblik over ugens opgaver, firmabiler, bemanding, lager og ferieadministration — alt sammen i et brugervenligt interface med real-time opdateringer.

---

### ✨ Funktioner

- 📅 **Ugeplanlægning** med farvekodede statusser og real-time opdateringer
- 👥 **Brugeradministration** med rollebaseret adgang (Administrator, Skadeleder, Servicemedarbejder, Vikar)
- 🚗 **Bilhåndtering** med brændstofkort og trailer-tracking
- 📦 **Lagerstyring** med sagsnummer-tracking og rengøringsstatus
- 🏖️ **Ferieadministration** med godkendelsesworkflow og notifikationer
- 🔔 **Real-time notifikationer** for opgaver og ferieansøgninger
- 🎭 **Demo-mode** med automatisk data cleanup (15 minutter) og rolleskift
- 🔒 **Avanceret sikkerhed** med RLS policies, audit logging og password reset
- 🌐 **Flersproget interface** (Dansk/Engelsk) med komplet oversættelse
- 📱 **Responsivt design** til mobil, tablet og desktop
- 📊 **Dashboard** med interaktive metrics og opgaveoversigt
- 📸 **Profilbilleder** med avatar upload og cropping
- 🔄 **Automatisk cleanup** af demo data og udløbne brugere
- 🔑 **Automatisk afdelingstildeling** ved login (ingen manuel vælger)
- 📍 **Lokationsstyring** med inline-redigering i Admin-panelet
- ⚡ **Optimistic UI** med automatisk rollback ved fejl
- 🛡️ **Robust fejlhåndtering** med Error Boundaries på alle sider
- 💾 **Intelligent caching** med TanStack Query og 5-minutters staleTime

---

### 🔐 Roller og adgang

| Rolle              | Funktioner                                                                     |
|--------------------|--------------------------------------------------------------------------------|
| Super Admin        | Global adgang til alle afdelinger og funktioner                                |
| Administrator      | Fuld adgang til alle funktioner inkl. brugerhåndtering                         |
| Skadeleder         | Kan oprette og redigere opgaver, godkende ferie                                |
| Servicemedarbejder | Kan se alle medarbejdere i afdelingen, se egne opgaver, anmode om ferie        |
| Vikar              | Midlertidig adgang med automatisk udløb                                        |

---

### 🛠️ Teknologi Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (Database, Auth, Real-time, Edge Functions)
- **Styling**: TailwindCSS + Shadcn/ui komponenter
- **State Management**: React Query for data caching
- **Routing**: React Router v6
- **Internationalization**: Custom i18n system med da/en support
- **Form Handling**: React Hook Form + Zod validation
- **Charts**: Recharts for data visualisering
- **Date Handling**: date-fns for datomanipulation

---

### 🚀 Installation

```bash
# Klon repository
git clone https://github.com/kschmidtjohansen/pdk12-ugeplan.git
cd pdk12-ugeplan

# Installer dependencies
npm install

# Kør development server
npm run dev

# Build til production
npm run build
```

---

### 📁 Mappestruktur

```text
/src
  /components       → Reusable UI komponenter organiseret efter feature
    /Admin          → Brugeradministration, system health, sikkerhed
    /Auth           → Login, password reset, sikkerhedsheaders
    /Cars           → Bilhåndtering med dialogs og tabeller
    /Dashboard      → Dashboard widgets, metrics og oversigter
    /Employees      → Medarbejderhåndtering
    /Layout         → Navigation, topbar, sidebars
    /Planner        → Ugeplanlægning med drag-drop (kommende)
    /Vacation       → Ferieadministration med godkendelse
    /Warehouse      → Lagerstyring
    /ui             → Shadcn UI komponenter (buttons, dialogs, etc.)
  /context          → React contexts (Auth, Translation, Notifications, Security)
  /hooks            → Custom React hooks organiseret efter feature
    /assignment     → Hooks til opgavehåndtering
    /car            → Hooks til bilhåndtering
    /employee       → Hooks til medarbejderhåndtering
    /vacation       → Hooks til feriehåndtering
    /warehouse      → Hooks til lagerhåndtering
    /notifications  → Hooks til notifikationssystem
  /services         → Business logic og data services
  /translations     → i18n oversættelser (da/en)
  /types            → TypeScript type definitions
  /utils            → Helper functions (dateUtils, validation, security)
  /pages            → Route pages (Dashboard, Planner, Cars, etc.)
/supabase
  /functions        → Edge functions (admin operations, cleanup)
  /migrations       → Database migrations med version control
```

---

### 🚀 Deployment

Denne app er deployed på **Lovable Cloud** med **Supabase** backend.

**Demo Adgang:**
- Email: test@polygongroup.com
- Adgangskode: [Kontakt administrator]

**Nøglefunktioner:**
- **Real-time samarbejde**: Flere brugere kan arbejde samtidigt
- **Automatisk cleanup**: Demo data ryddes automatisk hvert 15. minut
- **Sikkerhed**: Row-level security policies sikrer data isolation
- **Performance**: Optimeret med caching, circuit breakers og effektive queries
- **Skalerbarhed**: Bygget til at håndtere voksende teams og datamængder

---

### 📋 Ændringslog

Se [CHANGELOG.md](./CHANGELOG.md) for detaljeret version history.

---

### 📄 Licens

Projektet er under privat licens. Kontakt udvikleren for brug og samarbejde.

---

## 🇬🇧 English version

### 📌 About the Project

**PDK12 Ugeplan** is a comprehensive digital planning solution for Polygon Skadeservice. The system provides complete overview of weekly tasks, company vehicles, staffing, warehouse inventory, and vacation management — all in a user-friendly interface with real-time updates.

---

### ✨ Features

- 📅 **Weekly Planning** with color-coded statuses and real-time updates
- 👥 **User Management** with role-based access control (Administrator, Supervisor, Employee, Temp)
- 🚗 **Vehicle Management** with fuel cards and trailer tracking
- 📦 **Warehouse Inventory** with case number tracking and cleaning status
- 🏖️ **Vacation Management** with approval workflow and notifications
- 🔔 **Real-time Notifications** for tasks and vacation requests
- 🎭 **Demo Mode** with automatic data cleanup (15 minutes) and role switching
- 🔒 **Advanced Security** with RLS policies, audit logging, and password reset
- 🌐 **Multi-language Interface** (Danish/English) with complete translations
- 📱 **Responsive Design** for mobile, tablet, and desktop
- 📊 **Dashboard** with interactive metrics and task overview
- 📸 **Profile Pictures** with avatar upload and cropping
- 🔄 **Automatic Cleanup** of demo data and expired users
- 🔑 **Automatic Department Assignment** on login (no manual selector)
- 📍 **Location Management** with inline editing in Admin panel
- ⚡ **Optimistic UI** with automatic rollback on failure
- 🛡️ **Robust Error Handling** with Error Boundaries on all pages
- 💾 **Intelligent Caching** with TanStack Query and 5-minute staleTime

---

### 🔐 Roles & Access

| Role             | Permissions                                                                    |
|------------------|--------------------------------------------------------------------------------|
| Super Admin      | Global access to all departments and features                                 |
| Administrator    | Full access to all features including user management                          |
| Supervisor       | Can create and edit tasks, approve vacation requests                           |
| Employee         | Can view all employees in department, view own tasks, request vacation          |
| Temp             | Temporary access with automatic expiration                                     |

---

### 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (Database, Auth, Real-time, Edge Functions)
- **Styling**: TailwindCSS + Shadcn/ui components
- **State Management**: React Query for data caching
- **Routing**: React Router v6
- **Internationalization**: Custom i18n system with da/en support
- **Form Handling**: React Hook Form + Zod validation
- **Charts**: Recharts for data visualization
- **Date Handling**: date-fns for date manipulation

---

### 🚀 Getting Started

```bash
# Clone repository
git clone https://github.com/kschmidtjohansen/pdk12-ugeplan.git
cd pdk12-ugeplan

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

---

### 📁 Folder Structure

```text
/src
  /components       → Reusable UI components organized by feature
    /Admin          → User management, system health, security
    /Auth           → Login, password reset, security headers
    /Cars           → Vehicle management with dialogs and tables
    /Dashboard      → Dashboard widgets, metrics and overviews
    /Employees      → Employee management
    /Layout         → Navigation, topbar, sidebars
    /Planner        → Weekly planning with drag-drop (upcoming)
    /Vacation       → Vacation management with approval
    /Warehouse      → Inventory management
    /ui             → Shadcn UI components (buttons, dialogs, etc.)
  /context          → React contexts (Auth, Translation, Notifications, Security)
  /hooks            → Custom React hooks organized by feature
    /assignment     → Hooks for assignment handling
    /car            → Hooks for vehicle handling
    /employee       → Hooks for employee handling
    /vacation       → Hooks for vacation handling
    /warehouse      → Hooks for warehouse handling
    /notifications  → Hooks for notification system
  /services         → Business logic and data services
  /translations     → i18n translations (da/en)
  /types            → TypeScript type definitions
  /utils            → Helper functions (dateUtils, validation, security)
  /pages            → Route pages (Dashboard, Planner, Cars, etc.)
/supabase
  /functions        → Edge functions (admin operations, cleanup)
  /migrations       → Database migrations with version control
```

---

### 🚀 Deployment

This app is deployed on **Lovable Cloud** with **Supabase** backend.

**Demo Access:**
- Email: test@polygongroup.com
- Password: [Contact administrator]

**Key Features:**
- **Real-time Collaboration**: Multiple users can work simultaneously
- **Automatic Cleanup**: Demo data is automatically cleaned up every 15 minutes
- **Security**: Row-level security policies ensure data isolation
- **Performance**: Optimized with caching, circuit breakers, and efficient queries
- **Scalability**: Built to handle growing teams and data volumes

---

### 📋 Changelog

See [CHANGELOG.md](./CHANGELOG.md) for detailed version history.

---

### 📄 License

This project is under a custom/private license. Contact the developer for use or contributions.
