import { parse, parseISO, isValid } from 'date-fns';

/**
 * Parse syllabus text and extract tasks
 */
export const parseSyllabusText = (text) => {
  const lines = text.split('\n').filter(line => line.trim());
  const tasks = [];
  
  // Keywords that indicate a task
  const taskKeywords = /\b(assignment|exam|quiz|project|essay|due|submit|homework|test|midterm|final|presentation|report|paper)\b/i;
  
  // Date patterns
  const datePatterns = [
    // "March 20", "Apr 3"
    /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})\b/i,
    // "20 March"
    /\b(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i,
    // "04/15/2025", "4/15/25"
    /\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/,
    // "2025-04-15"
    /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/,
  ];
  
  // Hour estimate patterns
  const hourPattern = /~?\s*(\d+)\s*(hours?|hrs?)\b/i;
  
  lines.forEach(line => {
    // Check if line contains task keywords
    if (!taskKeywords.test(line)) {
      return;
    }
    
    let task = {
      title: '',
      date: null,
      hours: 2, // default
    };
    
    // Extract date
    let foundDate = false;
    for (const pattern of datePatterns) {
      const match = line.match(pattern);
      if (match) {
        const parsedDate = parseDateFromMatch(match);
        if (parsedDate) {
          task.date = parsedDate;
          foundDate = true;
          break;
        }
      }
    }
    
    if (!foundDate) {
      return; // Skip tasks without dates
    }
    
    // Extract hours
    const hourMatch = line.match(hourPattern);
    if (hourMatch) {
      task.hours = parseInt(hourMatch[1], 10);
    }
    
    // Extract title (clean up the line)
    task.title = line
      .replace(hourPattern, '')
      .replace(/~?\s*\d+\s*%/, '') // Remove percentage
      .replace(/\b(due|on|worth)\b/gi, '')
      .trim();
    
    // Clean up extra whitespace
    task.title = task.title.replace(/\s+/g, ' ').trim();
    
    if (task.title && task.date) {
      tasks.push(task);
    }
  });
  
  return tasks;
};

/**
 * Helper to parse date from regex match
 */
const parseDateFromMatch = (match) => {
  const currentYear = new Date().getFullYear();
  let dateString = '';
  
  // "March 20" or "Apr 3" or "March 20, 2026"
  if (match[0].match(/^[a-z]+\s+\d+/i)) {
    const month = match[1];
    const day = match[2];
    // Check if year is already in the string
    const yearMatch = match.input.match(/\b(20\d{2})\b/);
    const year = yearMatch ? yearMatch[1] : currentYear;
    dateString = `${month} ${day}, ${year}`;
  }
  // "20 March"
  else if (match[0].match(/^\d+\s+[a-z]+/i)) {
    const day = match[1];
    const month = match[2];
    const yearMatch = match.input.match(/\b(20\d{2})\b/);
    const year = yearMatch ? yearMatch[1] : currentYear;
    dateString = `${month} ${day}, ${year}`;
  }
  // "04/15/2025" or "4/15/2026"
  else if (match[0].match(/\d+\/\d+\/\d+/)) {
    const month = match[1];
    const day = match[2];
    let year = match[3];
    if (year.length === 2) {
      year = `20${year}`;
    }
    dateString = `${month}/${day}/${year}`;
  }
  // "2025-04-15"
  else if (match[0].match(/\d{4}-\d+-\d+/)) {
    dateString = match[0];
  }
  
  try {
    const parsed = new Date(dateString);
    if (isValid(parsed)) {
      return parsed;
    }
  } catch (e) {
    return null;
  }
  
  return null;
};

/**
 * Export tasks data
 */
export const exportTasks = (tasks, projects) => {
  const projectMap = {};
  projects.forEach(p => {
    projectMap[p.id] = p.name;
  });
  
  let output = 'Task List\n\n';
  
  tasks
    .filter(t => !t.completed)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .forEach(task => {
      const project = projectMap[task.projectId] || 'Unknown';
      const deadline = new Date(task.deadline).toLocaleDateString();
      output += `• ${task.title}\n`;
      output += `  Project: ${project} | Deadline: ${deadline} | Hours: ${task.estimatedHours}\n\n`;
    });
  
  return output;
};
