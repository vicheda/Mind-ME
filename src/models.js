// Data models and constants

export const PROJECT_COLORS = [
  '#e8c547', // yellow
  '#e07b3a', // orange
  '#6eb89e', // green
  '#7b8ce8', // blue
  '#e06b9a', // pink
  '#8be87b', // light green
  '#e8a87b', // peach
];

export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};

export const MAX_HOURS_PER_DAY = 8;
export const MAX_SESSION_HOURS = 2;
export const STORAGE_KEY = 'syllabus-planner-v2';

export const createProject = (name, id = Date.now(), colorIndex = 0) => ({
  id,
  name,
  color: PROJECT_COLORS[colorIndex % PROJECT_COLORS.length],
  visible: true,
  createdAt: Date.now(),
});

export const createTask = (data) => ({
  id: Date.now() + Math.random(),
  projectId: data.projectId,
  title: data.title,
  deadline: data.deadline, // Date object or ISO string
  estimatedHours: data.estimatedHours || 2,
  priority: data.priority || PRIORITY_LEVELS.MEDIUM,
  completed: false,
  createdAt: Date.now(),
  sessions: [], // Will be populated by scheduling algorithm
});

export const createSession = (taskId, sessionNumber, totalSessions, hours, date) => ({
  id: Date.now() + Math.random(),
  taskId,
  sessionNumber,
  totalSessions,
  hours,
  date, // Date object or ISO string
});
