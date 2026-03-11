import React, { useState } from 'react';
import { 
  startOfWeek, 
  addDays, 
  format, 
  isToday,
  isSameDay,
  addWeeks,
  subWeeks 
} from 'date-fns';
import Button from '../components/Button';
import { getSessionsByDate } from '../scheduler';
import { MAX_HOURS_PER_DAY } from '../models';
import './WeeklyCalendar.css';

const WeeklyCalendar = ({ tasks, projects, selectedDate, onSelectDate, onHighlightTask }) => {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));
  const sessionsByDate = getSessionsByDate(tasks, projects);
  
  const getDaySessions = (date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return sessionsByDate[dateKey] || [];
  };
  
  const getDayHours = (date) => {
    const sessions = getDaySessions(date);
    return sessions.reduce((sum, s) => sum + s.hours, 0);
  };
  
  const isOverloaded = (date) => {
    return getDayHours(date) > MAX_HOURS_PER_DAY;
  };
  
  const handlePrevWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };
  
  const handleNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };
  
  const handleToday = () => {
    setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };
  
  return (
    <div className="weekly-calendar">
      <div className="calendar-header">
        <h2>Weekly Calendar</h2>
        <div className="calendar-nav">
          <Button size="small" variant="ghost" onClick={handlePrevWeek}>
            ←
          </Button>
          <Button size="small" variant="ghost" onClick={handleToday}>
            Today
          </Button>
          <Button size="small" variant="ghost" onClick={handleNextWeek}>
            →
          </Button>
        </div>
      </div>
      
      <div className="calendar-grid-scroll">
        <div className="calendar-grid">
          {weekDays.map((day, index) => {
          const dayName = format(day, 'EEE');
          const dayNumber = format(day, 'd');
          const sessions = getDaySessions(day);
          const totalHours = getDayHours(day);
          const overloaded = isOverloaded(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const today = isToday(day);
          const isSunday = index === 6;
          
          return (
            <div 
              key={index} 
              className={`calendar-day ${today ? 'today' : ''} ${isSelected ? 'selected' : ''} ${overloaded ? 'overloaded' : ''} ${isSunday ? 'sunday' : ''}`}
            >
              <div 
                className="day-header clickable"
                onClick={() => onSelectDate && onSelectDate(day)}
              >
                <div className="day-name">{dayName}</div>
                <div className="day-number">{dayNumber}</div>
              </div>
              
              <div className="day-sessions">
                {sessions.length === 0 && !isSunday && (
                  <div className="no-sessions">—</div>
                )}
                
                {isSunday && sessions.length === 0 && (
                  <div className="no-sessions sunday-label">Rest</div>
                )}
                
                {sessions.map((session, idx) => (
                  <div
                    key={idx}
                    className="session-card"
                    style={{ 
                      background: session.project?.color || '#888',
                      borderLeft: `3px solid ${session.project?.color || '#888'}`
                    }}
                    onClick={() => onHighlightTask && onHighlightTask(session.taskId)}
                  >
                    <div className="session-title">
                      {session.task?.title}
                    </div>
                    <div className="session-meta mono">
                      Session {session.sessionNumber}/{session.totalSessions} · {session.hours.toFixed(1)}h
                    </div>
                  </div>
                ))}
              </div>
              
              {totalHours > 0 && (
                <div className={`day-footer ${overloaded ? 'overloaded' : ''}`}>
                  <span className="mono">{totalHours.toFixed(1)}h</span>
                  {overloaded && <span className="warning-icon">⚠️</span>}
                </div>
              )}
            </div>
          );
        })}
        </div>
      </div>
      
      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-dot" style={{ background: 'var(--accent-yellow)' }}></div>
          <span>Today</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot overload"></div>
          <span>Overloaded ({MAX_HOURS_PER_DAY}h+)</span>
        </div>
        <div className="legend-item">
          <span className="mono" style={{ color: 'var(--text-muted)' }}>
            Sunday = No scheduling
          </span>
        </div>
      </div>
    </div>
  );
};

export default WeeklyCalendar;
