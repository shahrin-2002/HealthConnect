# HealthConnect 🏥

A full-stack healthcare management system built with the MERN stack (MongoDB, Express.js, React.js, Node.js) featuring user authentication, role-based access control, and a modern UI.

## ✨ Features

### Authentication & User Management
- 🔐 Secure user registration and login with JWT
- 👥 Three user roles: Patient, Doctor, Hospital Admin
- 🔑 Password hashing with bcrypt (10 salt rounds)
- 📱 Profile management with gender and date of birth
- 🛡️ Protected routes with automatic session persistence

### Modern User Interface
- 🎨 Clean, responsive design matching mockups
- 🌈 Mint/teal color scheme with professional aesthetics
- 📱 Mobile-friendly layout
- ⚡ Fast, single-page application experience

### Backend API
- 🏥 Hospital directory with search and filtering
- 👨‍⚕️ Doctor directory with specialization lookup
- 🔍 Advanced search and pagination
- 🔒 Role-based access control for admin operations

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- MongoDB Atlas account (free tier) or local MongoDB
- npm or yarn

### 1. Install Dependencies

```bash
# Backend
npm install

# Frontend
cd client
npm install
cd ..
```

### 2. Setup MongoDB Database

**Option A: MongoDB Atlas (Cloud - Recommended)**

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create a free account
3. Create a new cluster (M0 Sandbox - Free tier)
4. Create a database user:
   - Click "Database Access" → "Add New Database User"
   - Choose password authentication
   - Set username and password (save these!)
5. Whitelist your IP:
   - Click "Network Access" → "Add IP Address"
   - Add your current IP or "Allow Access from Anywhere" (0.0.0.0/0) for development
6. Get your connection string:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your actual password
   - Add `/healthcare_system` before the `?` to specify database name

**Option B: Local MongoDB**

```bash
# Install MongoDB Community Edition
# Then start the service:
mongod
```

Your local connection string will be:
```
mongodb://localhost:27017/healthcare_system
```

### 3. Configure Environment

Backend `.env`:
```env
PORT=9358
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
MONGODB_URI=your_mongodb_connection_string_here
```

**MongoDB URI:**
```env
# MongoDB Atlas
MONGODB_URI=mongodb+srv://healthcare_user:HealthCare123@healthcareproject.ud0om4p.mongodb.net/?appName=healthcareproject
```

Frontend `client/.env`:
```env
REACT_APP_API_URL=http://localhost:9358/api
```

### 4. Run the Application

**Terminal 1 - Backend:**
```bash
npm start
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

**Access:** Open http://localhost:3000

## 📁 Project Structure

```
471_project/
├── models/                    # MVC - Database Models
│   └── User.js               # User data access layer
│
├── controllers/               # MVC - Business Logic
│   └── authController.js     # Authentication logic
│
├── routes/                    # MVC - API Routes
│   ├── auth.js               # Auth endpoints
│   ├── hospitals.js          # Hospital endpoints
│   └── doctors.js            # Doctor endpoints
│
├── middleware/                # Custom Middleware
│   └── auth.js               # JWT & RBAC middleware
│
├── client/                    # React Frontend
│   ├── src/
│   │   ├── pages/            # Login, Register, Dashboard
│   │   ├── services/         # API client (axios)
│   │   ├── context/          # Auth state management
│   │   └── styles/           # CSS files
│   └── public/
│
├── server.js                  # Express server
└── package.json               # Backend dependencies
```

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, React Router v6, Axios |
| **Backend** | Node.js, Express.js 4.18 |
| **Database** | MongoDB with Mongoose ODM |
| **Authentication** | JWT (24-hour expiry) |
| **Security** | bcrypt password hashing |
| **State** | React Context API |
| **Architecture** | MVC Pattern |

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/signup      Register new user
POST   /api/auth/login       Login and get JWT token
GET    /api/auth/profile     Get user profile (protected)
```

### Hospitals (Legacy API - not in frontend yet)
```
GET    /api/hospitals              List all hospitals
GET    /api/hospitals/:id          Get hospital details
POST   /api/hospitals              Create hospital (admin only)
PUT    /api/hospitals/:id          Update hospital (admin only)
```

### Doctors (Legacy API - not in frontend yet)
```
GET    /api/doctors                List all doctors
GET    /api/doctors/:id            Get doctor details
POST   /api/doctors                Register doctor (admin only)
PUT    /api/doctors/:id            Update doctor (admin only)
```

## 🎯 MVC Architecture

### Models (`models/`)
- Encapsulate database operations
- Provide clean data access interface
- Example: `User.findByEmail()`, `User.create()`

### Controllers (`controllers/`)
- Handle business logic
- Process and validate requests
- Return appropriate responses
- Example: `authController.signup()`, `authController.login()`

### Views (`client/`)
- React components for UI
- State management with Context API
- API calls through service layer

## 🔒 Security Features

- ✅ JWT authentication with 24-hour expiry
- ✅ bcrypt password hashing (10 salt rounds)
- ✅ NoSQL injection prevention with Mongoose validation
- ✅ Role-based access control (RBAC)
- ✅ Protected routes with automatic redirects
- ✅ CORS enabled for cross-origin requests
- ✅ Environment-based configuration
- ✅ Email format validation at schema level

## 💻 Usage

### Register an Account
1. Go to http://localhost:3000
2. Click "Sign Up"
3. Fill in the form:
   - Name
   - Email
   - Gender (optional)
   - Date of Birth (optional)
   - Role (patient, doctor, or admin)
   - Password & Confirm Password
   - Accept terms
4. Click "Create an Account"
5. You'll be automatically logged in

### Login
1. Enter your email and password
2. Click "Sign In"
3. Access your dashboard


## 📊 Database Schema

### users (MongoDB Collection)
| Field | Type | Constraints |
|-------|------|-------------|
| _id | ObjectId | Auto-generated (MongoDB) |
| name | String | Required, trimmed |
| email | String | Required, unique, lowercase, validated |
| password | String | Required (hashed with bcrypt) |
| role | String | Enum: patient, doctor, admin |
| phone | String | Optional, trimmed |
| address | String | Optional, trimmed |
| gender | String | Enum: male, female, other, null |
| date_of_birth | Date | Optional |
| createdAt | Date | Auto-generated (Mongoose timestamps) |
| updatedAt | Date | Auto-updated (Mongoose timestamps) |

**Note:** The MongoDB schema uses Mongoose ODM which provides:
- Automatic password hashing before saving
- Data validation at the schema level
- Email format validation
- Indexed email field for faster lookups
