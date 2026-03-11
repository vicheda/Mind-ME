import React, { useEffect, useState } from 'react';
import { format, isPast, isToday, isSameDay } from 'date-fns';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { Input, Select, TextArea } from '../components/Input';
import { PRIORITY_LEVELS } from '../models';
import { parseSyllabusText } from '../parser';
import './TaskList.css';

const parseLocalDateFromInput = (dateString) => {
  if (!dateString) return null;

  const [year, month, day] = dateString.split('-').map(Number);
  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
};

const TaskList = ({ 
  tasks, 
  projects,
  activeFilter,
  selectedDate,
  onSelectDate,
  onAddTask,
  onAddMultipleTasks,
  onToggleTaskComplete,
  onToggleSessionComplete,
  onDeleteTask,
  onHighlightTask 
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showParseModal, setShowParseModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    projectId: projects[0]?.id || '',
    deadline: '',
    estimatedHours: 2,
    priority: PRIORITY_LEVELS.MEDIUM,
  });
  const [syllabusText, setSyllabusText] = useState('');
  const [parsedTasks, setParsedTasks] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [selectedProjectForParsed, setSelectedProjectForParsed] = useState(projects[0]?.id || '');
  const [viewMode, setViewMode] = useState('day'); // 'day' or 'all'

  // Keep the middle task panel synced with calendar day selection.
  useEffect(() => {
    if (selectedDate) {
      setViewMode('day');
    }
  }, [selectedDate]);
  
  // Filter tasks by active project filter
  const projectFilteredTasks = tasks.filter(task => {
    if (activeFilter === 'all') return true;
    return task.projectId === activeFilter;
  });
  
  const upcomingTasks = viewMode === 'all'
    ? projectFilteredTasks
        .filter(t => !t.completed)
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    : projectFilteredTasks
        .filter(task =>
          (task.sessions || []).some(
            session => !session.completed && isSameDay(new Date(session.date), selectedDate)
          )
        )
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  const completedTasks = viewMode === 'all'
    ? projectFilteredTasks
        .filter(t => t.completed)
        .sort((a, b) => new Date(b.deadline) - new Date(a.deadline))
    : projectFilteredTasks
        .filter(task => {
          const hasIncompleteForDay = (task.sessions || []).some(
            session => !session.completed && isSameDay(new Date(session.date), selectedDate)
          );
          const hasCompletedForDay = (task.sessions || []).some(
            session => session.completed && isSameDay(new Date(session.date), selectedDate)
          );
          return !hasIncompleteForDay && hasCompletedForDay;
        })
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  
  const handleAddTask = () => {
    if (formData.title && formData.deadline) {
      const localDeadline = parseLocalDateFromInput(formData.deadline);
      if (!localDeadline) return;

      onAddTask({
        ...formData,
        deadline: localDeadline,
      });
      setFormData({
        title: '',
        projectId: projects[0]?.id || '',
        deadline: '',
        estimatedHours: 2,
        priority: PRIORITY_LEVELS.MEDIUM,
      });
      setShowAddModal(false);
    }
  };
  
  const handleParseSyllabus = () => {
    const parsed = parseSyllabusText(syllabusText);
    setParsedTasks(parsed);
    setSelectedTasks(new Set(parsed.map((_, i) => i)));
  };
  
  const handleConfirmParsed = () => {
    const tasksToAdd = parsedTasks
      .filter((task, index) => selectedTasks.has(index))
      .map(task => ({
        title: task.title,
        projectId: selectedProjectForParsed,
        deadline: task.date,
        estimatedHours: task.hours,
        priority: PRIORITY_LEVELS.MEDIUM,
      }));
    
    if (onAddMultipleTasks) {
      onAddMultipleTasks(tasksToAdd);
    } else {
      // Fallback to individual adds
      tasksToAdd.forEach(task => onAddTask(task));
    }
    
    setSyllabusText('');
    setParsedTasks([]);
    setSelectedTasks(new Set());
    setShowParseModal(false);
  };
  
  const toggleTaskSelection = (index) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedTasks(newSelected);
  };
  
  const getProjectColor = (projectId) => {
    return projects.find(p => p.id === projectId)?.color || '#888';
  };
  
  return (
    <div className="panel task-list-panel">
      <div className="panel-header">
        <div className="header-left">
          <h2>Tasks</h2>
          {viewMode === 'day' && (
            <span className="date-indicator">
              {isToday(selectedDate) ? 'Today' : format(selectedDate, 'MMM d, yyyy')}
            </span>
          )}
        </div>
        <div className="header-actions">
          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === 'day' ? 'active' : ''}`}
              onClick={() => setViewMode('day')}
            >
              Day
            </button>
            <button
              className={`toggle-btn ${viewMode === 'all' ? 'active' : ''}`}
              onClick={() => setViewMode('all')}
            >
              All
            </button>
          </div>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            + Add Task
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setShowParseModal(true)}>
            📋 Parse
          </Button>
        </div>
      </div>
      
      <div className="task-list-content">
        {upcomingTasks.length === 0 && completedTasks.length === 0 && (
          <div className="empty-state">
            {viewMode === 'day' ? (
              <>
                <p>No tasks scheduled for {isToday(selectedDate) ? 'today' : 'this day'}</p>
                <p className="empty-subtitle">
                  Add a task or select a different day
                </p>
              </>
            ) : (
              <>
                <p>No tasks yet</p>
                <p className="empty-subtitle">Add a task or parse your syllabus to get started</p>
              </>
            )}
          </div>
        )}
        
        {upcomingTasks.length > 0 && (
          <div className="task-section">
            <h3 className="section-title">
              {viewMode === 'day' ? 'Scheduled' : 'Upcoming'}
            </h3>
            <div className="task-items">
              {upcomingTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  projectColor={getProjectColor(task.projectId)}
                  selectedDate={selectedDate}
                  viewMode={viewMode}
                  daySessionStatus="incomplete"
                  onToggleTaskComplete={onToggleTaskComplete}
                  onToggleSessionComplete={onToggleSessionComplete}
                  onDelete={onDeleteTask}
                  onHighlight={onHighlightTask}
                />
              ))}
            </div>
          </div>
        )}
        
        {completedTasks.length > 0 && (
          <div className="task-section">
            <h3 className="section-title">Completed</h3>
            <div className="task-items">
              {completedTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  projectColor={getProjectColor(task.projectId)}
                  selectedDate={selectedDate}
                  viewMode={viewMode}
                  daySessionStatus={viewMode === 'day' ? 'completed' : 'incomplete'}
                  onToggleTaskComplete={onToggleTaskComplete}
                  onToggleSessionComplete={onToggleSessionComplete}
                  onDelete={onDeleteTask}
                  onHighlight={onHighlightTask}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Add Task Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Task"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTask}>
              Add Task
            </Button>
          </>
        }
      >
        <div className="form-grid">
          <Input
            label="Task Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Assignment 1"
            required
          />
          
          <Select
            label="Project"
            value={formData.projectId}
            onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
            options={projects.map(p => ({ value: p.id, label: p.name }))}
            required
          />
          
          <Input
            label="Deadline"
            type="date"
            value={formData.deadline}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            required
          />
          
          <Input
            label="Estimated Hours"
            type="number"
            min="0.5"
            step="0.5"
            value={formData.estimatedHours}
            onChange={(e) => setFormData({ ...formData, estimatedHours: parseFloat(e.target.value) })}
            required
          />
          
          <Select
            label="Priority"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            options={[
              { value: PRIORITY_LEVELS.LOW, label: 'Low' },
              { value: PRIORITY_LEVELS.MEDIUM, label: 'Medium' },
              { value: PRIORITY_LEVELS.HIGH, label: 'High' },
            ]}
          />
        </div>
      </Modal>
      
      {/* Parse Syllabus Modal */}
      <Modal
        isOpen={showParseModal}
        onClose={() => {
          setShowParseModal(false);
          setParsedTasks([]);
          setSyllabusText('');
        }}
        title="Parse Syllabus"
        footer={
          parsedTasks.length > 0 ? (
            <>
              <Button variant="secondary" onClick={() => setParsedTasks([])}>
                Back
              </Button>
              <Button onClick={handleConfirmParsed}>
                Add Selected ({selectedTasks.size})
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setShowParseModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleParseSyllabus}>
                Parse
              </Button>
            </>
          )
        }
      >
        {parsedTasks.length === 0 ? (
          <>
            <TextArea
              label="Syllabus Text"
              value={syllabusText}
              onChange={(e) => setSyllabusText(e.target.value)}
              placeholder="Paste your syllabus here...&#10;&#10;Example:&#10;Assignment 1 due March 20, worth 20% (~6 hours)&#10;Midterm exam on April 3&#10;Final project due April 28 (~12 hours)"
              rows={10}
            />
            <p className="help-text">
              The parser will look for task names, dates, and hour estimates.
            </p>
          </>
        ) : (
          <>
            <div className="form-grid">
              <Select
                label="Assign to Project"
                value={selectedProjectForParsed}
                onChange={(e) => setSelectedProjectForParsed(e.target.value)}
                options={projects.map(p => ({ value: p.id, label: p.name }))}
              />
            </div>
            <div className="parsed-tasks-list">
              {parsedTasks.map((task, index) => (
                <label key={index} className="parsed-task-item">
                  <input
                    type="checkbox"
                    checked={selectedTasks.has(index)}
                    onChange={() => toggleTaskSelection(index)}
                  />
                  <div className="parsed-task-info">
                    <strong>{task.title}</strong>
                    <span className="parsed-task-meta">
                      {format(task.date, 'MMM d, yyyy')} • {task.hours}h
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

const TaskItem = ({ task, projectColor, selectedDate, viewMode, daySessionStatus = 'incomplete', onToggleTaskComplete, onToggleSessionComplete, onDelete, onHighlight }) => {
  const isTaskComplete =
    task.completed ||
    ((task.sessions || []).length > 0 && (task.sessions || []).every(session => session.completed));
  const isCompletedRow = viewMode === 'day' ? daySessionStatus === 'completed' : isTaskComplete;
  const deadline = new Date(task.deadline);
  const isOverdue = isPast(deadline) && !isToday(deadline) && !isTaskComplete;
  const isUrgent = isToday(deadline) && !isTaskComplete;
  
  // Find sessions for selected date if in day mode
  const daySessions = viewMode === 'day' && selectedDate
    ? task.sessions?.filter(s => {
        const sameDay = isSameDay(new Date(s.date), selectedDate);
        if (!sameDay) return false;
        return daySessionStatus === 'completed' ? !!s.completed : !s.completed;
      }) || []
    : [];
  
  return (
    <div className={`task-item ${isCompletedRow ? 'completed' : ''}`}>
      {viewMode === 'all' ? (
        <input
          type="checkbox"
          checked={isTaskComplete}
          onChange={() => onToggleTaskComplete(task.id)}
          className="task-checkbox"
        />
      ) : (
        <input
          type="checkbox"
          checked={daySessionStatus === 'completed' && daySessions.length > 0}
          onChange={() => {
            if (daySessions.length > 0) {
              onToggleSessionComplete(task.id, daySessions[0].id);
            }
          }}
          className="task-checkbox"
          title={daySessions.length > 0 ? 'Toggle one session complete' : 'No session on this day'}
          disabled={daySessions.length === 0}
        />
      )}
      
      <div 
        className="task-color" 
        style={{ background: projectColor }}
      ></div>
      
      <div className="task-info">
        <div className="task-title">{task.title}</div>
        <div className="task-meta">
          <span className={`task-deadline mono ${isOverdue ? 'overdue' : ''}`}>
            {format(deadline, 'MMM d, yyyy')}
          </span>
          <span className="task-hours mono">{task.estimatedHours}h</span>
          {viewMode === 'day' && daySessions.length > 0 && (
            <span className="task-sessions mono">
              {daySessions
                .map(s => `Session ${s.sessionNumber}/${s.totalSessions} · ${s.hours.toFixed(1)}h`)
                .join(', ')}
            </span>
          )}
          {viewMode === 'all' && task.sessions && task.sessions.length > 0 && (
            <span className="task-sessions mono">
              {task.sessions.length} sessions
            </span>
          )}
        </div>
      </div>
      
      <div className="task-badges">
        {isUrgent && <Badge variant="urgent">Today</Badge>}
        <Badge variant={task.priority}>{task.priority}</Badge>
      </div>
      
      <button
        className="task-delete"
        onClick={() => onDelete(task.id)}
        title="Delete task"
      >
        🗑️
      </button>
    </div>
  );
};

export default TaskList;
