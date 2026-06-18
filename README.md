# Civix Backend API

The backend REST API for **Civix** — a digital civic engagement platform designed to empower citizens, facilitate communication with officials, enable democratic polls, coordinate volunteer support, and analyze community sentiment.

---
frontend repo : https://github.com/vrlegacy/civix-frontend

live application : https://civix-zeta.vercel.app/

---

## 📸 App Interface & Demos

### 🏠 Home Page
![Civix Home Screen](https://res.cloudinary.com/dwbj1dnak/image/upload/v1781766842/civix_assets/qnjtkd32dhj47dur67o6.png)

### 📊 Dashboard
![Civix Dashboard Screen](https://res.cloudinary.com/dwbj1dnak/image/upload/v1781766843/civix_assets/fwedsbl2tjkvtnqb6klv.png)

### 🎥 Demo Video Walkthrough
You can download and watch the full video walkthrough:
* [Download Demo Video (civix-video.mp4)]([https://github.com/vrlegacy/civix-backend/blob/main/civix-video.mp](https://drive.google.com/file/d/1uhYGms1CHXoL4E4Js9MHp-OCbBMd6e3g/view?usp=sharing)

---

## 🚀 Key Features

* **User Authentication & Authorization:**
  * Secure signup queue using a `PendingUser` model with automatic 3-minute email verification timeouts.
  * Role-based authorization (`citizen`, `admin`, `official`, `volunteer`).
  * JWT-based request authentication (valid for 24 hours).
  * Password reset workflow utilizing secure cryptographic tokens sent via Gmail SMTP.
  * JWT token blacklisting on logout.

* **Complaints Management:**
  * Citizens can report issues with categories, location names, and coordinates (Latitude/Longitude).
  * Direct photo upload support, integrated with **Cloudinary** for image processing and hosting.
  * Admin assignment of complaints to volunteers for on-the-ground review and resolution.
  * Real-time automated email notifications for submissions and volunteer assignments.

* **Petitions & Campaigning:**
  * Create detailed civic petitions with signature targets.
  * Single-signature enforcement per user (prevents double-voting).
  * Officials can respond to local petitions, make comments, or assign them to volunteers.
  * Volunteers can post progress updates on assigned petitions.

* **Polls & Civic Voting:**
  * Create and schedule community polls targeted at specific geographic locations and authorities.
  * Double-vote protection on options.
  * Real-time calculations of vote tallies and choice percentages.

* **Sentiment Analysis & Engagement Analytics:**
  * NLP engine powered by the `natural` library (`PorterStemmer`, `AFINN` lexicon).
  * Analyzes positive/negative/neutral sentiment scores of complaints, petitions, polls, and comments.
  * Aggregated monthly activity metrics for the past 12 months.
  * Automated data exporting of petitions and polls into CSV format.

---

## 🛠️ Architecture & Tech Stack

* **Runtime:** Node.js (v18+)
* **Framework:** Express.js
* **Database:** MongoDB (via Mongoose ODM)
* **Image Hosting:** Cloudinary
* **Mail Delivery:** Nodemailer (Gmail SMTP)
* **NLP & Text Mining:** Natural

```
civix-backend/
├── config/             # DB Connection configuration
├── controllers/        # Business & Route logic (Auth, Complaints, Petitions, Polls, Reports, Users)
├── middleware/         # JWT Authentication & Role-based Access Control (RBAC)
├── models/             # Mongoose schemas (User, Complaint, Petition, Poll, Blacklist, etc.)
├── routes/             # Express route mappings
├── utils/              # Email, Cloudinary and Notifications helpers
├── seedDemo.js         # Direct database seeder utility
├── index.js            # Main Express application entry point
└── server.js           # Lightweight server wrapper
```

---

## 📦 Installation & Local Setup

### Prerequisites
Make sure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) (v18.0.0 or higher)
* [MongoDB](https://www.mongodb.com/try/download/community) (Local instance or MongoDB Atlas account URL)

---

### Step 1: Clone and Install Dependencies
Navigate to the backend directory and install the required NPM packages:
```bash
npm install
```

---

### Step 2: Configure Environment Variables
Create a `.env` file in the root of the project (copying from `.env.example` if present):
```env
# Server configuration
PORT=5000
FRONTEND_URL=http://localhost:5173

# Database Connection
MONGODB_URI=your_mongodb_connection_string

# JWT authentication
JWT_SECRET=your_jwt_secret_key_here

# Email Notification (Gmail SMTP)
GMAIL_USER=your_gmail_address@gmail.com
GMAIL_PASS=your_gmail_app_password

# Cloudinary Storage
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

> [!NOTE]
> For email notifications, you must use a **Gmail App Password**, not your primary account password. You can generate one under Google Account > Security > 2-Step Verification > App Passwords.

---

### Step 3: Seed the Database with Demo Data
To test the application with realistic data immediately, run the direct seeding script. This will wipe any existing complaints, polls, and petitions, create a default citizen user, upload a sample complaint image to Cloudinary, and insert 5 complaints, 5 polls, and 5 petitions:
```bash
node seedDemo.js
```
* **Default Seeded Credentials:**
  * **Email:** `vishwasrudrramurthy.2004@gmail.com`
  * **Password:** `12345678`

---

### Step 4: Run the Server

#### Development Mode (with hot-reloading):
```bash
npm run dev
```

#### Production Mode:
```bash
npm start
```

Once running, the backend server will listen on the port defined in your `.env` (default is `http://localhost:5000`).

---

## 📡 API Endpoints

### Authentication (`/api/auth`)
* `POST /signup` - Register a new user (sends verification email)
* `POST /verify-email` - Confirm registration with verification token
* `POST /signin` or `/login` - Authenticate user & return JWT token
* `GET /me` - Retrieve current logged-in user profile (requires Token)
* `POST /logout` - Invalidate user session (requires Token)
* `POST /forgot-password` - Request a password reset email
* `POST /reset-password` - Update password with a reset token

### Complaints (`/api/complaints`)
* `POST /` - Submit a new complaint (with optional photo upload)
* `GET /` - Fetch all complaints (Admin/Official/Volunteer/Citizen)
* `GET /mine` - Get complaints submitted by the logged-in user
* `PUT /:id/assign` - Assign a complaint to a volunteer (Admin only)
* `PUT /:id/status` - Update complaint status (Volunteer/Admin)

### Petitions (`/api/petitions`)
* `POST /` - Create a new petition
* `GET /` - List all petitions
* `GET /local` - View petitions local to the user's registered area
* `POST /:id/sign` - Sign a petition
* `POST /:id/comment` - Add a comment/opinion to a petition
* `PUT /:id/assign` - Assign petition to a volunteer (Official/Admin)
* `PUT /:id/resolve` - Resolve a petition (Admin only)

### Polls (`/api/polls`)
* `POST /` - Create a new poll
* `GET /` - List all polls
* `POST /:id/vote` - Cast a vote on a poll option
* `GET /:id/results` - Retrieve real-time aggregates and percentages

### Reports & Sentiment (`/api/reports`)
* `GET /sentiment` - Get aggregated sentiment analysis across all content
* `GET /sentiment/:type/:id` - Get sentiment analysis for a specific complaint/petition/poll
* `GET /engagement` - Fetch monthly engagement statistics
* `GET /export` - Export petition and poll listings as CSV
