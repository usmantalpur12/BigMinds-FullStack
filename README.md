# BigMinds Education Platform

A full-stack education platform built with React Native (Expo), Node.js/Express, and MongoDB.

## Project Structure

```
BigMinds-FullStack/
├── BigMindsEducation/      # React Native (Expo) mobile app
│   ├── app/                # Expo Router app screens
│   ├── android/            # Android native project
│   ├── assets/             # Static assets (icons, fonts, images)
│   ├── package.json
│   └── app.json            # Expo configuration
├── bigminds-backend/       # Node.js/Express backend API
│   ├── controllers/        # Route controllers
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   ├── middleware/         # Express middleware
│   ├── utils/              # Utility functions
│   ├── server.js           # Express server entry point
│   └── package.json
├── docs/                   # Project documentation
├── composer.json           # PHP dependencies (Guzzle HTTP)
├── vendor/                 # PHP vendor dependencies
├── babel.config.js         # Babel configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── test-gamification.js    # Gamification system test script
```

## Features

### Frontend (BigMindsEducation)
- React Native with Expo
- Expo Router for navigation
- Tailwind CSS with NativeWind
- Redux Toolkit for state management
- Firebase integration
- Socket.IO for real-time communication

### Backend (bigminds-backend)
- Express.js REST API
- MongoDB with Mongoose ODM
- JWT authentication
- Role-based access control (student/teacher/admin)
- File uploads with Cloudinary
- Payment processing with Razorpay
- Real-time features with Socket.IO
- Email notifications with Nodemailer

## Getting Started

### Backend

```bash
cd bigminds-backend
npm install
npm start
```

### Frontend

```bash
cd BigMindsEducation
npm install
npm start
```

## Environment Variables

Both the frontend and backend require `.env` files. See `.env.example` files in each directory.

## Documentation

- `docs/teacher-screens.md` - Teacher flow navigation
- `docs/teacher-components.md` - Teacher-only components inventory

## Technologies

- **Frontend**: React Native, Expo, TypeScript, Tailwind CSS, Redux Toolkit
- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Authentication**: JWT, bcryptjs
- **Storage**: Cloudinary, Multer
- **Payments**: Razorpay
- **Real-time**: Socket.IO
- **Notifications**: Expo Notifications, Nodemailer
