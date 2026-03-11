import React, { useState } from 'react';
import { 
  startOfWeek,
  addDays, 
  addWeeks,
  subWeeks,
  format,
  isToday 
} from 'date-fns';
import { calculateDailyWorkload } from '../scheduler';
import { MAX_HOURS_PER_DAY } from '../models';
import './WorkloadGraph.css';

const WorkloadGraph = ({ tasks, projects }) => {
  const [hoveredBar, setHoveredBar] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  
  // Calculate data for the selected week (7 days)
  const startDate = currentWeek;
  const endDate = addDays(startDate, 6);
  const dailyWorkload = calculateDailyWorkload(tasks, projects, startDate, endDate);

  const handlePrevWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  const handleThisWeek = () => {
    setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };
  
  // Generate all days in range
  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(startDate, i);
    const dateKey = format(date, 'yyyy-MM-dd');
    days.push({
      date: dateKey,
      dateObj: date,
      data: dailyWorkload[dateKey] || { total: 0, byProject: {} },
    });
  }
  
  // Find max value for scaling
  const maxHours = Math.max(MAX_HOURS_PER_DAY, ...days.map(d => d.data.total));
  const yAxisTicks = [1, 0.75, 0.5, 0.25, 0].map(ratio =>
    Math.round(maxHours * ratio)
  );
  
  return (
    <div className="workload-graph">
      <div className="graph-header">
        <div className="graph-title-group">
          <h2>Weekly Workload</h2>
          <span className="graph-week-label mono">
            {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
          </span>
        </div>
        <div className="graph-nav">
          <button className="graph-nav-btn" onClick={handlePrevWeek}>←</button>
          <button className="graph-nav-btn" onClick={handleThisWeek}>This Week</button>
          <button className="graph-nav-btn" onClick={handleNextWeek}>→</button>
        </div>
        <div className="graph-legend">
          {projects
            .filter(p => p.visible)
            .map(project => (
              <div key={project.id} className="legend-item">
                <div 
                  className="legend-color" 
                  style={{ background: project.color }}
                ></div>
                <span>{project.name}</span>
              </div>
            ))}
        </div>
      </div>
      
      <div className="graph-container">
        <div className="graph-y-axis">
          {yAxisTicks.map((tick, index) => (
            <div key={`${tick}-${index}`} className="y-label">{tick}h</div>
          ))}
        </div>
        
        <div className="graph-content">
          <div className="graph-threshold-line" style={{ bottom: `${(MAX_HOURS_PER_DAY / maxHours) * 100}%` }}>
            <span className="threshold-label mono">{MAX_HOURS_PER_DAY}h limit</span>
          </div>
          
          <div className="graph-bars">
            {days.map((day, index) => {
              const heightPercent = (day.data.total / maxHours) * 100;
              const isOverloaded = day.data.total > MAX_HOURS_PER_DAY;
              const isTodayDate = isToday(day.dateObj);
              
              return (
                <div
                  key={index}
                  className={`bar-container ${isTodayDate ? 'today' : ''}`}
                  onMouseEnter={() => setHoveredBar(index)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  {day.data.total > 0 && (
                    <div className="bar-value mono">{day.data.total.toFixed(1)}h</div>
                  )}

                  {day.data.total > 0 ? (
                    <div 
                      className={`bar ${isOverloaded ? 'overloaded' : ''}`}
                      style={{ height: `${Math.max(2, heightPercent)}%` }}
                    >
                      {Object.entries(day.data.byProject).map(([projectId, data], idx) => {
                        const segmentHeight = (data.hours / day.data.total) * 100;
                        return (
                          <div
                            key={projectId}
                            className="bar-segment"
                            style={{
                              height: `${segmentHeight}%`,
                              background: data.color,
                            }}
                          ></div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bar-empty"></div>
                  )}
                  
                  <div className="bar-date mono">
                    {format(day.dateObj, 'EEE d')}
                  </div>
                  
                  {hoveredBar === index && day.data.total > 0 && (
                    <div className="bar-tooltip">
                      <div className="tooltip-date">
                        {format(day.dateObj, 'MMM d, yyyy')}
                      </div>
                      <div className="tooltip-total mono">
                        Total: {day.data.total.toFixed(1)}h
                      </div>
                      <div className="tooltip-divider"></div>
                      {Object.entries(day.data.byProject).map(([projectId, data]) => (
                        <div key={projectId} className="tooltip-project">
                          <div 
                            className="tooltip-color" 
                            style={{ background: data.color }}
                          ></div>
                          <span className="tooltip-name">{data.name}</span>
                          <span className="tooltip-hours mono">
                            {data.hours.toFixed(1)}h · {data.sessions} session{data.sessions !== 1 ? 's' : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkloadGraph;
