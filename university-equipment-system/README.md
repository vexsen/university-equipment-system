# University Equipment Borrowing System

A full-stack web application for managing university equipment borrowing.

## Tech Stack
- **Frontend**: React 18 + Vite + React Router v6
- **Backend**: Node.js + Express
- **Database**: SQLite (via better-sqlite3)
- **Auth**: JWT (JSON Web Tokens)

## Project Structure
```
university-equipment-system/
├── backend/
│   ├── data/                    # SQLite database file (auto-created)
│   ├── src/
│   │   ├── database/db.js       # DB init, schema, seed data
│   │   ├── middleware/auth.js   # JWT authentication middleware
│   │   └── routes/
│   │       ├── auth.js          # Login / Register
│   │       ├── equipment.js     # Equipment CRUD
│   │       ├── borrows.js       # Borrow request lifecycle
│   │       ├── users.js         # User management
│   │       ├── fines.js         # Fine management
│   │       └── dashboard.js     # Dashboard statistics
│   └── package.json
└── frontend/
    └── src/
        ├── pages/
        │   ├── auth/            # Login, Register
        │   ├── user/            # Search, BorrowRequest, MyBorrows, CurrentStatus, FineBalance
        │   └── admin/           # Dashboard, Equipment, Approvals, Users, Fines
        ├── components/          # Layout, Navbar, ProtectedRoute
        ├── context/             # AuthContext
        └── services/api.js      # Axios instance
```

## Quick Start

### Option 1: Double-click `start.bat`

### Option 2: Manual

**Terminal 1 (Backend):**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm install
npm run dev
```

Then open: http://localhost:5173

## Default Credentials

| Role    | Email                      | Password   |
|---------|----------------------------|------------|
| Admin   | admin@university.edu       | admin123   |
| Student | student@university.edu     | student123 |

## Borrow Types

### Short-term Borrow
- Requires a return due date
- Status flow: Pending -> Borrowing -> Returned / Overdue / Lost
- Fine: calculated per day overdue (rate set per equipment)
- Lost fine: equals full equipment replacement value

### Long-term Allocation
- No due date assigned
- No fine calculation whatsoever
- Status: Long-term Allocation (permanent until recalled)
- Intended for 5-10 year equipment assignments (staff laptops, furniture, etc.)

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/login | Login |
| POST | /api/auth/register | Register |
| GET | /api/equipment | List equipment (search/filter) |
| POST | /api/equipment | Create equipment (admin) |
| PUT | /api/equipment/:id | Update equipment (admin) |
| DELETE | /api/equipment/:id | Delete equipment (admin) |
| GET | /api/borrows | User's own borrows |
| POST | /api/borrows | Create borrow request |
| GET | /api/borrows/all | All borrows (admin) |
| PUT | /api/borrows/:id/approve | Approve request (admin) |
| PUT | /api/borrows/:id/reject | Reject request (admin) |
| PUT | /api/borrows/:id/return | Mark returned (admin) |
| PUT | /api/borrows/:id/mark-lost | Mark lost (admin) |
| GET | /api/fines | User's own fines |
| GET | /api/fines/all | All fines (admin) |
| PUT | /api/fines/:id/pay | Mark fine paid (admin) |
| PUT | /api/fines/:id/waive | Waive fine (admin) |
| GET | /api/users | All users (admin) |
| PUT | /api/users/:id | Edit user (admin) |
| GET | /api/dashboard/admin | Admin dashboard stats |
| GET | /api/dashboard/user | User dashboard stats |
