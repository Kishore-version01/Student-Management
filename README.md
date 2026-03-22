# Academic Management System

A full-stack, role-based academic portal designed to streamline university operations. This system provides dedicated interfaces for Administrators, Faculty, and Students to manage academic data, track performance, and maintain secure user profiles.

## Live demo

https://student-management-two-woad.vercel.app/

##  Key Features

###  Role-Based Access Control
* Secure, unified login portal routing users to their specific dashboards based on their role (`admin`, `faculty`, `student`).
* "Space-proof" backend validation to prevent login errors from accidental whitespace.

###  Admin Portal
* **Dashboard Analytics:** Live overview of total enrolled students and registered faculty.
* **User Management:** Add, edit, and delete student and faculty records dynamically.
* **Smart Forms:** Auto-toggling input fields (e.g., transport options hide if a student is a hostler).

###  Faculty Portal
* **Automated Dashboard:** Instantly calculates class average marks, overall attendance percentages, and identifies top/poor performers.
* **Marks Management:** Enter subject marks (CAT 1, CAT 2, Model, Internal, Practical, End Sem). The system automatically calculates total scores, assigns letter grades, and computes Grade Points (GP).
* **Attendance Tracking:** Bulk-save attendance records with automated percentage calculation.
* **Profile Management:** Faculty can update their contact information and passwords via secure popups.

###  Student Portal
* **Performance Dashboard:** View-only access to published grades and attendance status (Safe, Warning, Shortage).
* **Self-Service Profile:** Students can securely update their emergency contact numbers and account passwords without admin intervention.

##  Technology Stack

**Frontend:**
* HTML5 & CSS3 (Custom responsive design system)
* Vanilla JavaScript (ES6+)
* [SweetAlert2](https://sweetalert2.github.io/) (For sleek, interactive popup notifications and forms)

**Backend:**
* [Python 3](https://www.python.org/)
* [FastAPI](https://fastapi.tiangolo.com/) (High-performance API routing and data validation)
* [Uvicorn](https://www.uvicorn.org/) (ASGI web server)
* Pydantic (Strict data modeling and payload validation)

**Database:**
* [Supabase](https://supabase.com/) (PostgreSQL)

**Deployment**
* [Vercel] (https://vercel.com)

## 📁 Project Structure

```text
├── Backend/
│   └── main.py              # FastAPI server, endpoints, and database logic
├── Frontend/
│   ├── index.html           # Unified Login Page
│   ├── login.js             # Authentication routing logic
│   ├── adminhome.html       # Admin Portal UI
│   ├── admin.js             # Admin logic (CRUD operations)
│   ├── facultyhome.html     # Faculty Portal UI
│   ├── faculty.js           # Faculty logic (Marks/Attendance calculation)
│   ├── studenthome.html     # Student Portal UI
│   ├── student.js           # Student logic (Read-only data fetching)
│   └── style.css            # Global stylesheet and design system
└── README.md
