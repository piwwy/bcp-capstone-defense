# BCP Alumni Management System

A comprehensive Alumni Management System for Bestlink College of the Philippines built with React, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Landing Page** - Modern, responsive landing page with sections for:
  - Hero with animated particles
  - About BCP Alumni Portal
  - Courses/Programs carousel
  - Alumni Success Stories
  - Events & Activities
  - Job Opportunities
  - Contact Form

- **Multi-Role Dashboard System**
  - Super Admin Dashboard
  - Admin Dashboard
  - Registrar Dashboard
  - Alumni Portal

- **Authentication**
  - Login with email/password
  - Two-Factor Authentication (2FA)
  - Role-based access control

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18.0.0 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** - [Download here](https://git-scm.com/)
- **VS Code** (recommended) - [Download here](https://code.visualstudio.com/)

## 🛠️ Installation & Setup

### Step 1: Clone or Copy the Project

If you have the project files, copy them to your desired location.

Or clone from GitHub:
```bash
git clone https://github.com/your-username/bcp-alumni-system.git
cd bcp-alumni-system
```

### Step 2: Open in VS Code

```bash
code .
```

Or open VS Code and use `File > Open Folder` to select the project folder.

### Step 3: Install Dependencies

Open the integrated terminal in VS Code (`Ctrl + `` ` or `View > Terminal`) and run:

```bash
npm install
```

This will install all required packages including:
- React & React DOM
- React Router DOM
- Tailwind CSS
- Lucide React (icons)
- TypeScript
- Vite (build tool)

### Step 4: Start Development Server

```bash
npm run dev
```

The application will start and be available at:
```
http://localhost:5173
```

### Step 5: Build for Production

When ready to deploy:
```bash
npm run build
```

This creates an optimized build in the `dist` folder.

## 📁 Project Structure

```
bcp-alumni-system/
├── public/                  # Static assets
│   ├── bcplogo.png         # BCP logo
│   ├── logosms.png         # AMS logo
│   └── images/             # Image assets
├── src/
│   ├── components/
│   │   ├── landing/        # Landing page components
│   │   │   ├── Navbar.tsx
│   │   │   ├── HeroSection.tsx
│   │   │   ├── AboutSection.tsx
│   │   │   ├── CoursesSection.tsx
│   │   │   ├── AlumniSection.tsx
│   │   │   ├── EventsSection.tsx
│   │   │   ├── JobsSection.tsx
│   │   │   ├── ContactSection.tsx
│   │   │   └── Footer.tsx
│   │   ├── sidebar/        # Dashboard sidebars
│   │   │   ├── AdminSidebar.tsx
│   │   │   ├── AlumniSidebar.tsx
│   │   │   ├── RegistrarSidebar.tsx
│   │   │   └── SuperAdminSidebar.tsx
│   │   └── dashboard/      # Dashboard components
│   │       └── DashboardAdmin.tsx
│   ├── context/
│   │   └── AuthContext.tsx # Authentication context
│   ├── layouts/
│   │   └── DashboardLayout.tsx
│   ├── pages/
│   │   ├── LandingPage.tsx
│   │   ├── Login.tsx
│   │   └── Alumni2FA.tsx
│   ├── App.tsx             # Main app with routing
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## 🎨 Adding Images

Place your images in the `public/images/` directory:

```
public/
├── bcplogo.png          # Main BCP logo
├── logosms.png          # AMS sidebar logo
└── images/
    ├── hero1.jpg        # Hero carousel images
    ├── hero2.jpg
    ├── hero3.jpg
    ├── hero4.jpg
    ├── campus.jpg       # About section image
    └── ...
```

## 🔐 Demo Login Credentials

For testing purposes (connect to your backend API):

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@bcp.edu | admin123 |
| Super Admin | superadmin@bcp.edu | super123 |
| Registrar | registrar@bcp.edu | registrar123 |
| Alumni | alumni@bcp.edu | alumni123 |

## 🔧 Configuration

### API Endpoint

Update the API endpoint in your login/auth components:
```typescript
const res = await fetch("http://localhost:5000/api/auth/login", {
  // ...
});
```

### Tailwind CSS

Custom colors and configurations are in `tailwind.config.js`.

## 📱 Responsive Design

The application is fully responsive and optimized for:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically

### Manual Deployment
```bash
npm run build
# Upload the 'dist' folder to your hosting provider
```

## 📝 Next Steps

1. **Connect Backend API** - Update fetch calls to your actual API endpoints
2. **Add More Dashboard Pages** - Replace placeholder components with actual functionality
3. **Implement Real Authentication** - Connect to your authentication service
4. **Add Database** - Connect to MongoDB, PostgreSQL, or your preferred database

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is for Bestlink College of the Philippines.

## 👥 Team

- Developed for BCP Final Defense Project

---

**Bestlink College of the Philippines** - *Unity through Education in Shaping the New Philippines*
