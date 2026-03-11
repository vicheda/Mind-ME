import { 
  addDays, 
  differenceInDays, 
  startOfDay, 
  isSunday, 
  format,
  isAfter,
  isBefore,
  isSameDay
} from 'date-fns';
import { MAX_HOURS_PER_DAY, MAX_SESSION_HOURS } from './models';

/**
 * Smart work distribution algorithm
 * Distributes task hours into sessions across available days
 */
export const scheduleTask = (task, existingSessions = []) => {
  const deadline = new Date(task.deadline);
  const today = startOfDay(new Date());
  const deadlineStart = startOfDay(deadline);
  
  // Edge case: deadline already passed
  if (isBefore(deadlineStart, today)) {
    return {
      sessions: [],
      warning: 'Deadline has already passed',
    };
  }
  
  // Edge case: deadline is today
  const isUrgent = isSameDay(today, deadlineStart);
  
  // Get available days (excluding Sundays by default)
  const availableDays = [];
  let currentDay = today;
  
  while (!isAfter(currentDay, deadlineStart)) {
    if (!isSunday(currentDay)) {
      availableDays.push(new Date(currentDay));
    }
    currentDay = addDays(currentDay, 1);
  }
  
  if (availableDays.length === 0) {
    return {
      sessions: [],
      warning: 'No available days before deadline',
    };
  }
  
  // Split total hours into sessions of max 2 hours each
  const rawHours = Number(task.estimatedHours);
  const totalHours = Number.isFinite(rawHours) && rawHours > 0 ? rawHours : 2;
  const numSessions = Math.max(1, Math.ceil(totalHours / MAX_SESSION_HOURS));
  const hoursPerSession = totalHours / numSessions;
  
  // Distribute sessions evenly across available days
  // Start later for tasks with distant deadlines to spread work more evenly
  const sessions = [];
  
  if (availableDays.length === 1 || numSessions >= availableDays.length) {
    // If deadline is urgent or many sessions needed, pack them together
    for (let i = 0; i < numSessions; i++) {
      const dayIndex = Math.min(i, availableDays.length - 1);
      const sessionDate = availableDays[dayIndex];
      
      if (!sessionDate) {
        console.error('Invalid dayIndex:', dayIndex, 'availableDays.length:', availableDays.length);
        continue;
      }
      
      sessions.push({
        id: `${task.id}-session-${i}`,
        taskId: task.id,
        sessionNumber: i + 1,
        totalSessions: numSessions,
        hours: hoursPerSession,
        date: sessionDate.toISOString(),
        completed: false,
      });
    }
  } else if (numSessions === 1) {
    // Single-session tasks should be placed on a concrete day (latest available day).
    const dayIndex = availableDays.length - 1;
    const sessionDate = availableDays[dayIndex];

    if (!sessionDate) {
      console.error('Invalid dayIndex:', dayIndex, 'availableDays.length:', availableDays.length);
    } else {
      sessions.push({
        id: `${task.id}-session-0`,
        taskId: task.id,
        sessionNumber: 1,
        totalSessions: 1,
        hours: hoursPerSession,
        date: sessionDate.toISOString(),
        completed: false,
      });
    }
  } else {
    // Spread sessions evenly across available time
    const spacing = (availableDays.length - 1) / (numSessions - 1);
    
    for (let i = 0; i < numSessions; i++) {
      const dayIndex = Math.min(
        Math.max(0, Math.round(i * spacing)),
        availableDays.length - 1
      );
      const sessionDate = availableDays[dayIndex];
      
      if (!sessionDate) {
        console.error('Invalid dayIndex:', dayIndex, 'availableDays.length:', availableDays.length);
        continue;
      }
      
      sessions.push({
        id: `${task.id}-session-${i}`,
        taskId: task.id,
        sessionNumber: i + 1,
        totalSessions: numSessions,
        hours: hoursPerSession,
        date: sessionDate.toISOString(),
        completed: false,
      });
    }
  }
  
  // Check for overloaded days
  const warnings = [];
  const dailyHours = {};
  
  // Count hours from existing sessions
  existingSessions.forEach(session => {
    const dateKey = format(new Date(session.date), 'yyyy-MM-dd');
    dailyHours[dateKey] = (dailyHours[dateKey] || 0) + session.hours;
  });
  
  // Add new sessions
  sessions.forEach(session => {
    const dateKey = format(new Date(session.date), 'yyyy-MM-dd');
    dailyHours[dateKey] = (dailyHours[dateKey] || 0) + session.hours;
  });
  
  // Check for overload
  Object.entries(dailyHours).forEach(([date, hours]) => {
    if (hours > MAX_HOURS_PER_DAY) {
      warnings.push(`${date} is overloaded with ${hours.toFixed(1)} hours`);
    }
  });
  
  return {
    sessions,
    warnings,
    isUrgent,
  };
};

/**
 * Get all sessions for visible projects grouped by date
 */
export const getSessionsByDate = (tasks, projects) => {
  const visibleProjects = new Set(
    projects.filter(p => p.visible).map(p => p.id)
  );
  
  const sessionsByDate = {};
  
  tasks.forEach(task => {
    if (!visibleProjects.has(task.projectId) || task.completed) {
      return;
    }
    
    task.sessions?.forEach(session => {
      if (session.completed) {
        return;
      }
      const dateKey = format(new Date(session.date), 'yyyy-MM-dd');
      if (!sessionsByDate[dateKey]) {
        sessionsByDate[dateKey] = [];
      }
      sessionsByDate[dateKey].push({
        ...session,
        task,
        project: projects.find(p => p.id === task.projectId),
      });
    });
  });
  
  return sessionsByDate;
};

/**
 * Calculate daily workload for the graph
 */
export const calculateDailyWorkload = (tasks, projects, startDate, endDate) => {
  const visibleProjects = new Set(
    projects.filter(p => p.visible).map(p => p.id)
  );
  
  const projectMap = {};
  projects.forEach(p => {
    projectMap[p.id] = p;
  });
  
  const dailyData = {};
  
  tasks.forEach(task => {
    if (!visibleProjects.has(task.projectId)) {
      return;
    }
    
    task.sessions?.forEach(session => {
      const sessionDate = new Date(session.date);
      if (isBefore(sessionDate, startDate) || isAfter(sessionDate, endDate)) {
        return;
      }
      
      const dateKey = format(sessionDate, 'yyyy-MM-dd');
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          date: dateKey,
          total: 0,
          byProject: {},
        };
      }
      
      const projectId = task.projectId;
      if (!dailyData[dateKey].byProject[projectId]) {
        dailyData[dateKey].byProject[projectId] = {
          hours: 0,
          sessions: 0,
          color: projectMap[projectId]?.color || '#888',
          name: projectMap[projectId]?.name || 'Unknown',
        };
      }
      
      dailyData[dateKey].total += session.hours;
      dailyData[dateKey].byProject[projectId].hours += session.hours;
      dailyData[dateKey].byProject[projectId].sessions += 1;
    });
  });
  
  return dailyData;
};
