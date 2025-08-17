# Todo List App

A modern, responsive todo list application built with React, TypeScript, and Firebase, deployed on GitHub Pages.

## 🚀 Features

### **Core Features**
- **Authentication**: Email/password and Google sign-in with friendly error messages
- **Task Management**: Create, edit, delete, and organize tasks with real-time sync
- **Group Organization**: Custom groups with icons and colors for task categorization
- **Advanced Filtering**: Filter by status, priority, groups, and search functionality
- **Calendar View**: Interactive calendar with drag-and-drop task scheduling
- **Priority Levels**: Set task priorities (Low, Medium, High, Urgent) with visual indicators

### **User Experience**
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Dark Mode**: Toggle between light and dark themes with system preference detection
- **Accessibility**: WCAG compliant with ARIA labels, keyboard navigation, and screen reader support
- **Mobile-Friendly**: Touch interactions, long-press menus, and mobile-optimized interfaces
- **Toast Notifications**: Real-time feedback for all user actions
- **Optimistic UI**: Instant visual feedback with automatic rollback on errors

### **Performance & Security**
- **Lazy Loading**: Code-splitting for faster initial load times
- **Skeleton Loading**: Smooth loading states instead of spinners
- **Server-side Timestamps**: Tamper-proof data integrity
- **Firestore Security Rules**: Comprehensive data protection and validation
- **App Check Ready**: Optional bot protection with reCAPTCHA v3 integration

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Headless UI
- **Backend**: Firebase (Authentication + Firestore + App Check)
- **State Management**: Zustand
- **Routing**: React Router (HashRouter for GitHub Pages)
- **Icons**: Heroicons
- **UI Components**: Custom accessible components (Modal, Toast, Skeleton)
- **Deployment**: GitHub Pages with GitHub Actions
- **Security**: Firestore Security Rules + Server-side Timestamps

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

**IMPORTANT**: Deploy the comprehensive security rules from `firestore.rules` file:

```bash
# Using Firebase CLI (recommended)
firebase deploy --only firestore:rules

# Or copy the content of firestore.rules to Firebase Console
```

The security rules include:
- **User isolation**: Each user can only access their own data
- **Field validation**: Strict validation for all data fields
- **Schema enforcement**: Prevents invalid data structure
- **Server timestamp requirements**: Ensures data integrity
- **Group reference validation**: Validates group relationships

### 6. Optional: App Check (Bot Protection)

App Check is **optional** and provides additional security against bots and abuse:

```env
# Add to .env only if you want App Check protection
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
```

**To get reCAPTCHA Site Key:**
1. Visit [Google reCAPTCHA Console](https://www.google.com/recaptcha/admin)
2. Create new site with reCAPTCHA v3
3. Add your domains (yourusername.github.io, localhost)
4. Copy the Site Key

**Note**: The app works perfectly without App Check. Only add it if you need bot protection.

### 7. Run Development Server

```bash
npm run dev
```

## 🚀 Deployment

### GitHub Pages Deployment

1. **Update repository configuration:**
   ```typescript
   // vite.config.ts - Update with your repository name
   export default defineConfig({
     base: '/your-repo-name/',
     // ...
   });
   ```

   ```json
   // package.json - Update homepage
   {
     "homepage": "https://yourusername.github.io/your-repo-name"
   }
   ```

2. **Add Firebase environment variables to GitHub Secrets:**
   - Go to Repository Settings → Secrets and variables → Actions
   - Add all required variables:
     ```
     VITE_FIREBASE_API_KEY
     VITE_FIREBASE_AUTH_DOMAIN
     VITE_FIREBASE_PROJECT_ID
     VITE_FIREBASE_STORAGE_BUCKET
     VITE_FIREBASE_MESSAGING_SENDER_ID
     VITE_FIREBASE_APP_ID
     VITE_RECAPTCHA_SITE_KEY (optional)
     ```

3. **Deploy Firestore Security Rules:**
   ```bash
   firebase deploy --only firestore:rules
   ```

4. **Push to main branch** - GitHub Actions will automatically deploy

### Manual Deployment

```bash
npm run build
npm run deploy
```

## 📱 Usage

### **Getting Started**
1. **Sign Up/Login**: Create an account with email/password or sign in with Google
2. **Create Groups**: Organize tasks by creating custom groups with icons and colors
3. **Add Tasks**: Click "New Task" to create tasks with title, description, dates, priority, and group
4. **Calendar View**: Drag and drop tasks on the calendar to reschedule due dates

### **Task Management**
- **Quick Actions**: Click the checkbox to mark tasks complete (with instant feedback)
- **Edit Tasks**: Double-click tasks or use the edit button
- **Delete Tasks**: Use the delete button with confirmation dialog
- **Mobile Support**: Long-press tasks on mobile for context menu

### **Organization & Filtering**
- **Groups**: Create custom groups to categorize tasks (Work, Personal, etc.)
- **Filters**: Filter by status, priority, groups, or use search
- **Calendar**: Visual overview with drag-and-drop scheduling
- **Dashboard**: Statistics and overview of all tasks

### **Accessibility Features**
- **Keyboard Navigation**: Full keyboard support with Tab navigation
- **Screen Reader**: ARIA labels and semantic HTML for screen readers
- **Dark Mode**: Automatic system preference detection with manual toggle
- **Mobile Optimized**: Touch-friendly interface with responsive design

## 🔧 Development

### Project Structure

```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── tasks/          # Task management components
│   ├── calendar/       # Calendar components
│   ├── groups/         # Group management components
│   └── ui/             # Reusable UI components (Modal, Toast, Skeleton)
├── pages/              # Page components (lazy-loaded)
├── services/           # API services (Firebase, App Check)
├── stores/             # Zustand stores (state management)
├── types/              # TypeScript type definitions
├── utils/              # Utility functions (error handling, debug)
└── index.css           # Global styles and animations
```

### Key Files
- `firestore.rules` - Database security rules
- `src/services/appCheck.ts` - Optional bot protection
- `src/utils/errorHandler.ts` - User-friendly error messages
- `src/components/ui/` - Accessible UI components

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run deploy` - Deploy to GitHub Pages
- `npm run lint` - Run ESLint for code quality

### Development Features

- **Hot Reload**: Instant updates during development
- **TypeScript**: Full type safety and IntelliSense
- **ESLint**: Code quality and consistency checks
- **Lazy Loading**: Automatic code splitting for better performance
- **Debug Panel**: Development-only debugging tools

## 🔒 Security Features

### **Data Protection**
- **Firestore Security Rules**: Comprehensive validation and user isolation
- **Server-side Timestamps**: Tamper-proof data integrity
- **Input Validation**: Client and server-side validation for all fields
- **Error Sanitization**: User-friendly messages without technical exposure

### **Authentication Security**
- **Firebase Auth**: Industry-standard authentication
- **Protected Routes**: Automatic redirection for unauthenticated users
- **Session Management**: Secure token handling and refresh

### **Optional Bot Protection**
- **App Check**: reCAPTCHA v3 integration for production environments
- **Rate Limiting**: Firebase built-in protection against abuse
- **Domain Validation**: Restricted to authorized domains only

## 🚀 Performance Optimizations

- **Lazy Loading**: Code splitting for faster initial load
- **Optimistic UI**: Instant feedback with automatic rollback
- **Skeleton Loading**: Smooth loading states
- **Real-time Updates**: Efficient Firestore listeners
- **Caching**: Browser caching for static assets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - UI Framework
- [Firebase](https://firebase.google.com/) - Backend Services
- [Tailwind CSS](https://tailwindcss.com/) - Styling Framework
- [Heroicons](https://heroicons.com/) - Icon Library
- [Vite](https://vitejs.dev/) - Build Tool
- [Zustand](https://github.com/pmndrs/zustand) - State Management
- [Headless UI](https://headlessui.com/) - Accessible Components

---

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/todolist-app/issues) page
2. Create a new issue with detailed description
3. Include browser console errors if applicable

**Happy task managing! 🎉**

