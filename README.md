# BigMinds Education Platform

[![Vercel](https://img.shields.io/badge/Backend%20API-Live%20on%20Vercel-000000?logo=vercel)](https://bigminds-api-gilt.vercel.app/api/health)
[![APK](https://img.shields.io/badge/Download-APK%20from%20GitHub-181717?logo=github)](https://github.com/usmantalpur12/BigMinds-FullStack/releases/latest)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A full-stack education platform built with React Native (Expo), Node.js/Express, and MongoDB.

- **Backend API**: `https://bigminds-api-gilt.vercel.app/api`
- **Health Check**: `https://bigminds-api-gilt.vercel.app/api/health`
- **Mobile App APK**: [Download latest from GitHub Releases](https://github.com/usmantalpur12/BigMinds-FullStack/releases/latest)

## Table of Contents

- [Project Structure](#project-structure)
- [Features](#features)
- [Quick Start](#quick-start)
- [Deployment](#deployment)
  - [Backend API (Vercel)](#backend-api-vercel)
  - [Mobile App APK (GitHub Actions)](#mobile-app-apk-github-actions)
- [APK Download](#apk-download)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Documentation](#documentation)
- [Technologies](#technologies)

## Project Structure

```
BigMinds-FullStack/
├── BigMindsEducation/      # React Native (Expo) mobile app
│   ├── app/                # Expo Router app screens
│   ├── android/            # Android native project
│   ├── assets/             # Static assets (icons, fonts, images)
│   ├── package.json
│   ├── app.json            # Expo configuration
│   ├── eas.json            # EAS Build configuration
│   └── .gitignore
├── bigminds-backend/       # Node.js/Express backend API
│   ├── controllers/        # Route controllers
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   ├── middleware/         # Express middleware
│   ├── utils/              # Utility functions
│   ├── server.js           # Express server entry point
│   ├── vercel.json         # Vercel deployment config
│   ├── .env.example        # Environment variables template
│   └── package.json
├── .github/
│   └── workflows/
│       └── build-apk.yml   # GitHub Actions workflow for APK builds
├── docs/                   # Project documentation
├── babel.config.js         # Babel configuration
└── tailwind.config.js      # Tailwind CSS configuration
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
- Email notifications with Nodemailer (SMTP)
## Quick Start

### API Health Check

```bash
curl https://bigminds-api-gilt.vercel.app/api/health
```

Expected response:
```json
{"success":true,"message":" BigMinds API is running smoothly!","timestamp":"...","environment":"production","version":"v1"}
```

### Download APK

Download the latest APK from the [GitHub Releases page](https://github.com/usmantalpur12/BigMinds-FullStack/releases/latest).

## Deployment

### Backend API (Vercel)

The backend API is deployed on Vercel with automatic HTTPS and global CDN.

**Production URL**: `https://bigminds-api-gilt.vercel.app/api`

To redeploy from the `bigminds-backend` directory:

```bash
cd bigminds-backend
vercel login        # Authenticate with Vercel (browser)
vercel link          # Link to existing project
vercel --prod        # Deploy to production
```

**Environment Variables** are managed via the Vercel dashboard or CLI:

```bash
# List all environment variables
vercel env ls

# Add a new secret
vercel env add VARIABLE_NAME

# Pull all env vars locally
vercel env pull .env
```

**Note**: The `MONGODB_URI` environment variable must point to a valid MongoDB Atlas cluster with the correct IP whitelist (allow access from Vercel servers, or use `0.0.0.0/0`).

### Mobile App APK (GitHub Actions)

APK builds are automated through GitHub Actions using EAS Build. The workflow:

1. Triggers on push to `main`, GitHub Release publication, or manual dispatch
2. Uses `EXPO_TOKEN` GitHub secret for EAS authentication
3. Runs `eas build --platform android --profile production`
4. Uploads the APK as a build artifact
5. Creates a GitHub Release with the APK (on release events)

**Required GitHub Secret**: `EXPO_TOKEN` — see [EAS Token Setup](#eas-token-setup) below.

To trigger a manual APK build:

```bash
# Push a commit to main (auto-trigger)
git push origin main

# Or trigger manually via GitHub Actions UI
# Visit: https://github.com/usmantalpur12/BigMinds-FullStack/actions
```


## APK Download

Download the latest APK from the [GitHub Releases page](https://github.com/usmantalpur12/BigMinds-FullStack/releases/latest).

**Release URL pattern**: `https://github.com/usmantalpur12/BigMinds-FullStack/releases/download/v<version>/bigminds-education.apk`

## EAS Token Setup

To enable automated APK builds via GitHub Actions, you need to create an Expo access token and add it as a GitHub secret:

1. **Create a token** on the Expo dashboard:
   - Visit [Expo Access Tokens](https://expo.dev/accounts/usmantalpur12/settings/access-tokens)
   - Click "Create Access Token"
   - Enter a name (e.g., `github-actions`)
   - Copy the generated token

2. **Add as GitHub Secret**:
   ```bash
   gh secret set EXPO_TOKEN --body "<token>"
   ```
   Or manually via GitHub → Settings → Secrets and variables → Actions → New repository secret.

3. **Verify**: The GitHub Actions workflow (`.github/workflows/build-apk.yml`) will use this token to authenticate with EAS Build.

## Environment Variables

### Backend (`bigminds-backend/`)

See `bigminds-backend/.env.example` for all required variables. Key variables:

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | JWT signing secret |
| `JWT_EXPIRE` | JWT expiration (e.g., `30d`) |
| `JWT_REFRESH_SECRET` | Refresh token secret |
| `FRONTEND_URL` | Frontend URL (for CORS) |
| `SMTP_HOST` | SMTP server host |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `RAZORPAY_KEY_ID` | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay key secret |
| `GROQ_API_KEY` | GROQ API key for AI |
| `OPENAI_API_KEY` | OpenAI API key for AI |

### Frontend (`BigMindsEducation/`)

Create a `.env` file in `BigMindsEducation/` with:

```env
EXPO_API_BASE_URL=https://bigminds-api-gilt.vercel.app/api
EXPO_PUBLIC_API_URL=https://bigminds-api-gilt.vercel.app/api
```

## Development

### Backend

```bash
cd bigminds-backend
npm install
npm start        # Start server on port 5000
```

### Frontend

```bash
cd BigMindsEducation
npm install
npm start        # Start Expo dev server
```

### Build APK Locally

```bash
cd BigMindsEducation
npm install -g eas-cli
eas login
eas build --platform android --profile production
```

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
- **CI/CD**: GitHub Actions, EAS Build, Vercel
