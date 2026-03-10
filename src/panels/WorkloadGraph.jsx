import React, { useState } from 'react';
import { 
  startOfDay, 
  addDays, 
  format,
  isToday 
} from 'date-fns';
import { calculateDailyWorkload } from '../scheduler';
import { MAX_HOURS_PER_DAY } from '../models';
import './WorkloadGraph.css';

const WorkloadGraph = ({ tasks, projects }) => {
  const [hoveredBar, setHoveredBar] = useState(null);
  
  // Calculate data for next 4 weeks (28 days)
  const startDate = startOfDay(new Date());
  const endDate = addDays(startDate, 27);
  const dailyWorkload = calculateDailyWorkload(tasks, projects, startDate, endDate);
  
  // Generate all days in range
  const days = [];
  for (let i = 0; i < 28; i++) {
    const date = addDays(startDate, i);
    const dateKey = format(date, 'yyyy-MM-dd');
    days.push({
      date: dateKey,
      dateObj: date,
      data: dailyWorkload[dateKey] || { total: 0, byProject: {} },
    });
  }
  
  // Find max value for scaling
  const maxHours = Math.max(6, ...days.map(d => d.data.total));
  
  return (
    <div className="workload-graph">
      <div className="graph-header">
        <h2>Workload Distribution</h2>
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
          <div className="y-label">6h</div>
          <div className="y-label">4h</div>
          <div className="y-label">2h</div>
          <div className="y-label">0h</div>
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
                  
                  {index % 4 === 0 && (
                    <div className="bar-date mono">
                      {format(day.dateObj, 'MMM d')}
                    </div>
                  )}
                  
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
