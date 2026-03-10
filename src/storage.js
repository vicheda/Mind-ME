import { STORAGE_KEY, createProject } from './models';

/**
 * Load data from localStorage
 */
export const loadData = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load data:', e);
  }
  
  // Return default data
  return {
    projects: [createProject('General', 'general', 0)],
    tasks: [],
  };
};

/**
 * Save data to localStorage
 */
export const saveData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save data:', e);
  }
};

/**
 * Clear all data
 */
export const clearData = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear data:', e);
  }
};
