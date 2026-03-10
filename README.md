# 📚 Syllabus Planner

A smart React web application for managing your coursework and projects with intelligent work distribution.

## Features

### 🎯 Projects System
- Create multiple named projects with auto-assigned colors
- Toggle project visibility in calendar and graphs
- Rename and delete projects with confirmation
- Visual task statistics per project

### ✍️ Dual Task Input Methods

**Manual Entry:**
- Add tasks with title, project, deadline, hours, and priority
- Simple form-based interface

**Syllabus Parsing:**
- Paste raw syllabus text
- Automatically extracts task names, dates, and hour estimates
- Preview and select which tasks to import
- Supports multiple date formats (e.g., "March 20", "04/15/2025", "Apr 3")

### 🧠 Smart Work Distribution
- Automatically schedules sessions across available days
- Splits tasks into 2-hour max sessions
- Avoids Sundays by default
- Prevents overloading (max 4 hours/day)
- Distributes work evenly toward deadlines
- Warns about overloaded days

### 📅 Three-Panel Layout
- **Left Sidebar:** Project list with visibility toggles
- **Middle Panel:** Sortable task list with completion tracking
- **Right Panel:** Weekly calendar with session cards

### 📊 Workload Graph
- 4-week horizontal bar chart
- Stacked bars colored by project
- Visual overload warnings (red bars above 4h limit)
- Interactive tooltips with session details
- Updates live as projects are toggled

### 🎨 Beautiful Dark Theme
- Custom color palette with 7 project colors
- Google Fonts: Instrument Serif, DM Sans, DM Mono
- Smooth animations and transitions
- Responsive design

### 💾 Data Persistence
- All data saved to localStorage
- Auto-saves on changes
- Survives page refreshes

## Getting Started

### Prerequisites
- Node.js 16+ and npm

### Installation

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

3. Open your browser to `http://localhost:3000`

### Build for Production

\`\`\`bash
npm run build
\`\`\`

The built files will be in the `dist/` folder.

## Usage Guide

### Creating a Project
1. Click "+ New Project" in the sidebar
2. Enter a name (e.g., "CS101", "Work")
3. Project gets auto-assigned a color

### Adding Tasks Manually
1. Click "+ Add Task" in the task list header
2. Fill in title, deadline, hours, priority
3. Select which project to assign it to
4. Task is auto-scheduled with distributed sessions

### Parsing a Syllabus
1. Click "📋 Parse Syllabus"
2. Paste your syllabus text (e.g., "Assignment 1 due March 20 (~6 hours)")
3. Click "Parse" to extract tasks
4. Select which project to assign imported tasks
5. Check/uncheck tasks to import
6. Click "Add Selected"

### Managing Projects
- Click project name to filter view
- Click eye icon to hide/show in calendar
- Click active project to see rename/delete options
- Deleting reassigns tasks to "General" project

### Viewing Workload
- Calendar shows sessions as colored cards
- Graph below shows 28-day distribution
- Hover bars to see detailed breakdown
- Red bars indicate overloaded days (>4h)

## Component Structure

\`\`\`
src/
├── components/          # Reusable UI components
│   ├── Button.jsx
│   ├── Input.jsx
│   ├── Badge.jsx
│   └── Modal.jsx
├── panels/             # Main panels
│   ├── ProjectSidebar.jsx
│   ├── TaskList.jsx
│   ├── WeeklyCalendar.jsx
│   └── WorkloadGraph.jsx
├── models.js           # Data models and constants
├── scheduler.js        # Smart scheduling algorithm
├── parser.js           # Syllabus text parser
├── storage.js          # localStorage utilities
├── App.jsx             # Main application
└── main.jsx           # Entry point
\`\`\`

## Technologies

- **React 18** - UI framework
- **Vite** - Build tool
- **date-fns** - Date manipulation
- **CSS Variables** - Theming
- **localStorage** - Data persistence

## Browser Support

Modern browsers with ES6+ support:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT

---

Built with ❤️ for students and professionals managing complex schedules.
