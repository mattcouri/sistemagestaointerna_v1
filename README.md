# Team Kanban TV Dashboard

A modern, collaborative kanban board application with TV dashboard display mode for team visibility.

## 🚀 Features

- **Personal & Project Kanban Boards**: Organize tasks in personal lists and collaborative project boards
- **TV Dashboard Mode**: Full-screen, read-only display perfect for team monitors and meetings
- **Real-time Collaboration**: Share projects with team members and track progress together
- **Development Roadmap**: Collaborative idea sharing for future development
- **Multi-language Support**: English and Portuguese (Brazil) interface
- **Dark/Light Mode**: Customizable theme preferences
- **Drag & Drop**: Intuitive task and list management
- **Zoom & Pan Controls**: Customize TV dashboard view with persistent settings

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Context + Local Storage
- **Build Tool**: Vite

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd team-kanban-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

### Production Build

1. **Build for production**
   ```bash
   npm run build
   ```

2. **Preview production build**
   ```bash
   npm run preview
   ```

## 🚀 Deployment Options

### Option 1: Netlify (Recommended)
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Deploy automatically on git push

### Option 2: Vercel
1. Connect your GitHub repository to Vercel
2. Vercel will auto-detect Vite configuration
3. Deploy automatically on git push

### Option 3: GitHub Pages
1. Install gh-pages: `npm install --save-dev gh-pages`
2. Add to package.json scripts: `"deploy": "gh-pages -d dist"`
3. Run: `npm run build && npm run deploy`

### Option 4: Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 4173
CMD ["npm", "run", "start"]
```

## 🎯 Usage Guide

### Getting Started
1. **Login**: Use quick login buttons or enter your email/name
2. **Personal Dashboard**: Create personal task lists and manage private work
3. **Projects**: Create collaborative projects and invite team members
4. **TV Dashboard**: Click "TV Dashboard" in any project for full-screen display

### TV Dashboard Features
- **Full-screen Mode**: Perfect for team monitors and meetings
- **Zoom & Pan**: Adjust view to fit your screen and preferences
- **Auto-refresh**: Live updates every 30 seconds
- **Persistent Settings**: View preferences saved per project

### Keyboard Shortcuts
- **Double-click**: Edit task titles
- **Enter**: Save edits
- **Escape**: Cancel edits

## 🔧 Configuration

### Environment Variables
No environment variables required - the app uses local storage for data persistence.

### Customization
- **Colors**: Modify `tailwind.config.js` for custom color schemes
- **Languages**: Add translations in `src/contexts/LanguageContext.tsx`
- **Sample Data**: Modify `src/contexts/AppContext.tsx` for different demo data

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation above
- Review the code comments for implementation details

---

**Built with ❤️ for better team collaboration**

---

*Last updated: $(date) - GitHub integration test*