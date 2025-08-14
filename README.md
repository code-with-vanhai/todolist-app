# Todo List App

A modern, responsive todo list application built with React, TypeScript, and Firebase, deployed on GitHub Pages.

## 🚀 Features

- **Authentication**: Email/password and Google sign-in
- **Task Management**: Create, edit, delete, and organize tasks
- **Real-time Sync**: Tasks sync across devices in real-time
- **Filtering & Search**: Advanced filtering by status, priority, and search
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Mode**: Toggle between light and dark themes
- **Calendar View**: Visualize tasks in calendar format (coming soon)
- **Categories**: Organize tasks with custom categories
- **Priority Levels**: Set task priorities (Low, Medium, High, Urgent)

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Headless UI
- **Backend**: Firebase (Authentication + Firestore)
- **State Management**: Zustand
- **Routing**: React Router (HashRouter for GitHub Pages)
- **Icons**: Heroicons
- **Deployment**: GitHub Pages with GitHub Actions

## 🏗️ Setup Instructions

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project

### 1. Clone the repository

\`\`\`bash
git clone https://github.com/yourusername/todolistapp.git
cd todolistapp
\`\`\`

### 2. Install dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password and Google)
3. Create a Firestore database
4. Get your Firebase config from Project Settings

### 4. Environment Variables

Create a \`.env\` file in the root directory:

\`\`\`env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your_app_id
\`\`\`

### 5. Firestore Security Rules

Add these security rules to your Firestore database:

\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
\`\`\`

### 6. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

## 🚀 Deployment

### GitHub Pages Deployment

1. Update \`vite.config.ts\` with your repository name:
   \`\`\`typescript
   export default defineConfig({
     base: '/your-repo-name/',
     // ...
   });
   \`\`\`

2. Update \`package.json\` homepage:
   \`\`\`json
   {
     "homepage": "https://yourusername.github.io/your-repo-name"
   }
   \`\`\`

3. Add Firebase environment variables to GitHub Secrets:
   - Go to Repository Settings → Secrets and variables → Actions
   - Add all VITE_FIREBASE_* variables

4. Push to main branch - GitHub Actions will automatically deploy

### Manual Deployment

\`\`\`bash
npm run build
npm run deploy
\`\`\`

## 📱 Usage

1. **Sign Up/Login**: Create an account or sign in with Google
2. **Create Tasks**: Click "New Task" to add tasks with title, description, due date, and priority
3. **Manage Tasks**: Mark as complete, edit, or delete tasks
4. **Filter & Search**: Use the sidebar to filter by status, priority, or search
5. **Dashboard**: View task statistics and recent tasks

## 🔧 Development

### Project Structure

\`\`\`
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── tasks/          # Task management components
│   ├── calendar/       # Calendar components
│   └── ui/             # UI components
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── services/           # API services (Firebase)
├── stores/             # Zustand stores
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
\`\`\`

### Available Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run preview\` - Preview production build
- \`npm run deploy\` - Deploy to GitHub Pages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React](https://reactjs.org/)
- [Firebase](https://firebase.google.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Heroicons](https://heroicons.com/)
- [Vite](https://vitejs.dev/)
