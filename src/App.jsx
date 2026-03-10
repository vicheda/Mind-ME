import React, { useState, useEffect } from 'react';
import { startOfDay } from 'date-fns';
import ProjectSidebar from './panels/ProjectSidebar';
import TaskList from './panels/TaskList';
import WeeklyCalendar from './panels/WeeklyCalendar';
import WorkloadGraph from './panels/WorkloadGraph';
import { createProject, createTask, PROJECT_COLORS } from './models';
import { scheduleTask, getSessionsByDate } from './scheduler';
import { loadData, saveData } from './storage';
import './App.css';

function App() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [highlightedTaskId, setHighlightedTaskId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  
  // Load data on mount
  useEffect(() => {
    const data = loadData();
    setProjects(data.projects);
    setTasks(data.tasks);
  }, []);
  
  // Save data whenever it changes
  useEffect(() => {
    if (projects.length > 0) {
      saveData({ projects, tasks });
    }
  }, [projects, tasks]);
  
  // Project management
  const handleAddProject = (name) => {
    const colorIndex = projects.length % PROJECT_COLORS.length;
    const newProject = createProject(name, Date.now(), colorIndex);
    setProjects([...projects, newProject]);
  };
  
  const handleRenameProject = (projectId, newName) => {
    setProjects(projects.map(p => 
      p.id === projectId ? { ...p, name: newName } : p
    ));
  };
  
  const handleDeleteProject = (projectId) => {
    // Remove project
    setProjects(projects.filter(p => p.id !== projectId));
    
    // Remove or reassign tasks
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    if (projectTasks.length > 0) {
      const generalProject = projects.find(p => p.id === 'general');
      if (generalProject) {
        // Reassign to General
        setTasks(tasks.map(t => 
          t.projectId === projectId 
            ? { ...t, projectId: 'general' } 
            : t
        ));
      } else {
        // Delete tasks
        setTasks(tasks.filter(t => t.projectId !== projectId));
      }
    }
    
    // Reset filter if deleted project was active
    if (activeFilter === projectId) {
      setActiveFilter('all');
    }
  };
  
  const handleToggleVisibility = (projectId) => {
    setProjects(projects.map(p => 
      p.id === projectId ? { ...p, visible: !p.visible } : p
    ));
  };
  
  // Task management
  const handleAddTask = (taskData) => {
    const newTask = createTask(taskData);
    
    // Use functional update to avoid race conditions
    setTasks(currentTasks => {
      // Get existing sessions from visible projects only
      const visibleProjects = new Set(projects.filter(p => p.visible).map(p => p.id));
      const existingSessions = currentTasks
        .filter(t => visibleProjects.has(t.projectId) && !t.completed)
        .flatMap(t => t.sessions || []);
      
      // Schedule the task
      const { sessions, warnings, isUrgent } = scheduleTask(newTask, existingSessions);
      
      newTask.sessions = sessions;
      return [...currentTasks, newTask];
    });
  };
  
  // Batch add multiple tasks (for syllabus parser)
  const handleAddMultipleTasks = (tasksData) => {
    setTasks(currentTasks => {
      const visibleProjects = new Set(projects.filter(p => p.visible).map(p => p.id));
      const newTasks = [];
      let allExistingSessions = currentTasks
        .filter(t => visibleProjects.has(t.projectId) && !t.completed)
        .flatMap(t => t.sessions || []);
      
      tasksData.forEach(taskData => {
        const newTask = createTask(taskData);
        const { sessions, warnings } = scheduleTask(newTask, allExistingSessions);
        newTask.sessions = sessions;
        newTasks.push(newTask);
        
        // Add new sessions to the pool for next task scheduling
        allExistingSessions = [...allExistingSessions, ...sessions];
      });
      
      return [...currentTasks, ...newTasks];
    });
  };
  
  const handleToggleComplete = (taskId) => {
    setTasks(tasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    ));
  };
  
  const handleDeleteTask = (taskId) => {
    if (window.confirm('Delete this task?')) {
      setTasks(tasks.filter(t => t.id !== taskId));
    }
  };
  
  const handleHighlightTask = (taskId) => {
    setHighlightedTaskId(taskId);
    setTimeout(() => setHighlightedTaskId(null), 2000);
  };
  
  const handleSelectDate = (date) => {
    setSelectedDate(startOfDay(date));
  };
  
  // Recalculate sessions when projects visibility changes
  useEffect(() => {
    if (tasks.length === 0) return;
    
    const visibleProjects = new Set(projects.filter(p => p.visible).map(p => p.id));
    
    // Recalculate all task sessions
    const updatedTasks = tasks.map(task => {
      if (task.completed) {
        return task;
      }
      
      // Get existing sessions from other visible tasks
      const otherSessions = tasks
        .filter(t => t.id !== task.id && visibleProjects.has(t.projectId) && !t.completed)
        .flatMap(t => t.sessions || []);
      
      const { sessions } = scheduleTask(task, otherSessions);
      return { ...task, sessions };
    });
    
    setTasks(updatedTasks);
  }, [projects.map(p => p.visible).join(',')]); // Only recalculate when visibility changes
  
  const visibleProjects = projects.filter(p => p.visible);
  const hasVisibleProjects = visibleProjects.length > 0;
  
  return (
    <div className="app">
      {/* <header className="app-header">
        <h1>📚 Syllabus Planner</h1>
        <p className="app-subtitle">Smart work distribution for your projects</p>
      </header> */}
      
      <div className="app-container">
        <div className="app-layout">
          <div className="layout-sidebar">
            <ProjectSidebar
              projects={projects}
              tasks={tasks}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              onToggleVisibility={handleToggleVisibility}
              onAddProject={handleAddProject}
              onRenameProject={handleRenameProject}
              onDeleteProject={handleDeleteProject}
            />
          </div>
          
          <div className="layout-main">
            <TaskList
              tasks={tasks}
              projects={projects}
              activeFilter={activeFilter}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              onAddTask={handleAddTask}
              onAddMultipleTasks={handleAddMultipleTasks}
              onToggleComplete={handleToggleComplete}
              onDeleteTask={handleDeleteTask}
              onHighlightTask={handleHighlightTask}
            />
          </div>
          
          <div className="layout-calendar">
            {hasVisibleProjects ? (
              <WeeklyCalendar
                tasks={tasks}
                projects={projects}
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
                onHighlightTask={handleHighlightTask}
              />
            ) : (
              <div className="empty-calendar">
                <p>No projects visible</p>
                <p className="empty-subtitle">
                  Enable at least one project to see the calendar
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="app-graph">
          {hasVisibleProjects ? (
            <WorkloadGraph
              tasks={tasks}
              projects={projects}
            />
          ) : (
            <div className="empty-graph">
              <p>Enable projects to see workload distribution</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
