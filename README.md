# 🏢 Skyland Attendance Portal

A modern, fullstack corporate workforce attendance and leave management portal designed for small-to-medium teams (20–30 employees). Built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, and **MongoDB (Mongoose)**, ready for instant one-click deployment to **Vercel**.

---

## ✨ Features

### 👤 Employee Self-Service
- **Live Digital Clock Widget**:
  - One-click **Clock In** with automatic late arrival detection (based on office shift and 15-minute grace period).
  - **Break Tracker**: Start and end breaks (Lunch, Coffee, Rest) with active time pause.
  - **Clock Out** with automatic net hours worked calculation.
- **Personal Monthly Attendance Log**: Color-coded status history (`Present`, `Late`, `Half Day`, `On Leave`, `Absent`).
- **Time Off & Leave Management**:
  - Track leave balances (Sick, Casual, Annual).
  - Submit leave requests with reason and automated day count.
  - Real-time approval status notifications.

### 👑 Admin & HR Management Suite
- **Live Attendance Roster ("Who's in Today")**:
  - Real-time presence indicators with pulsing green badges for actively working employees.
  - Department filters and employee search.
  - **Manual Adjustment & Regularization**: Adjust punch-in/out times or override status for employees who forgot to clock.
- **Staff Directory (20–30 Employees)**:
  - Add new employees with designated roles (`admin`, `hr`, `employee`).
  - Activate or deactivate team members.
- **Leave Authorization Queue**:
  - One-click Approve / Reject with optional review notes.
  - Automatically deducts approved days from employee leave balances.
- **Payroll Excel Export**:
  - Download formatted `.xlsx` attendance reports with employee IDs, exact punches, net hours, and late flags for any month/year.

---

## 🚀 Demo Accounts (Pre-configured)

When you first launch the app, clicking any of the **Fast Demo Accounts** on the login page will automatically initialize sample data with 10 team members and attendance history:

| Role | Email | Password | Name |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@skyland.com` | `password123` | Michael Scott |
| **HR Lead** | `hr@skyland.com` | `password123` | Pam Beesly |
| **Employee** | `jim@skyland.com` | `password123` | Jim Halpert |

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Lucide React
- **Database**: MongoDB (Atlas M0 Free Tier / Local)
- **ODM**: Mongoose with serverless connection pooling
- **Authentication**: JWT via `jose` with HttpOnly cookies & `bcryptjs`
- **Spreadsheet Engine**: `xlsx` (SheetJS)

---

## ⚙️ Local Development

### 1. Clone & Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env.local` file (or copy `.env.example`):
```env
# MongoDB Atlas connection string (or local MongoDB)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/skyland?retryWrites=true&w=majority

# JWT secret key
JWT_SECRET=your_super_secret_jwt_key_here
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Deploying to Vercel (3 Steps)

1. **Push your code to GitHub / GitLab**.
2. **Import into Vercel**:
   - Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
   - Select your Skyland repository.
3. **Configure Environment Variables in Vercel**:
   - `MONGODB_URI`: Your MongoDB Atlas connection URI (`mongodb+srv://...`).
   - `JWT_SECRET`: Any random 32+ character secret string.
4. Click **Deploy**! 🚀
