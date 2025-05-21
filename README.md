# TaskApp - Modern Task Management Application (Check V.1.1)

[![React Native](https://img.shields.io/badge/React%20Native-0.76.8-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-52.0.42-blue.svg)](https://expo.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-11.6.0-orange.svg)](https://firebase.google.com/)

A modern task management application built with React Native and Firebase. TaskApp helps users organize their tasks efficiently with a clean and intuitive user interface.

## Features

### Authentication

- 🔐 Email and Phone Number Authentication
- 🔑 Password Reset Functionality
- 💾 Persistent Login using AsyncStorage
- 🔒 Secure Session Management

### Task Management

- 📝 Create, Edit, and Delete Tasks
- 📋 Task Categories (Personal, Work, Shopping, Health, Education, Other)
- ⭐ Priority Levels (Low, Medium, High) with Color Coding
- 📅 Due Date Assignment
- ✅ Task Completion Tracking
- 🔍 Search Tasks by Name or Details
- 🏷️ Filter Tasks by Categories
- 📊 Sort Tasks by Priority (Low to High / High to Low)
- 📱 Real-time Data Synchronization with Firebase

### User Management

- 👤 User Profile Creation and Management
- 📧 Email Verification
- 📱 Phone Number Verification

### Platform Support

- 📱 Cross-platform (iOS & Android)

## 🛠️ Tech Stack

- **Frontend:**

  - React Native
  - Expo
  - TypeScript
  - React Navigation

- **Backend:**
  - Firebase Authentication
  - Firebase Firestore
  - Firebase Realtime Database
  - Firebase Storage

## 📸 Screenshots

### Authentication Screens

[![Login Screen](PLACEHOLDER_LOGIN_SCREEN.png)](PLACEHOLDER_LOGIN_SCREEN.png)
_Login Screen_

[![Signup Screen](PLACEHOLDER_SIGNUP_SCREEN.png)](PLACEHOLDER_SIGNUP_SCREEN.png)
_Signup Screen_

### Main Features

[![Task List](PLACEHOLDER_TASK_LIST.png)](PLACEHOLDER_TASK_LIST.png)
_Task List View_

[![Profile Screen](PLACEHOLDER_PROFILE_SCREEN.png)](PLACEHOLDER_PROFILE_SCREEN.png)
_User Profile_

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- Firebase account

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/TaskApp.git
cd TaskApp
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Configure Firebase:

   - Create a new Firebase project
   - Add your Firebase configuration in `firebaseConfig.js`
   - Enable Authentication, Firestore, and Storage services

4. Start the development server:

```bash
npm start
# or
yarn start
```

## 📱 Running the App

- **iOS:**

  ```bash
  npm run ios
  # or
  yarn ios
  ```

- **Android:**
  ```bash
  npm run android
  # or
  yarn android
  ```

## 🔧 Configuration

### Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication, Firestore, and Storage services
3. Update the `firebaseConfig.js` file with your Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
}
```

## 📦 Project Structure

```
TaskApp/
├── app/
│   ├── screens/
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   └── ProfileScreen.tsx
│   ├── index.tsx
│   └── _layout.tsx
├── assets/
├── firebaseConfig.js
└── package.json
```
