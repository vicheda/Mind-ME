import React, { useState } from 'react';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { Input } from '../components/Input';
import './ProjectSidebar.css';

const ProjectSidebar = ({ 
  projects, 
  activeFilter,
  onFilterChange,
  onToggleVisibility,
  onAddProject,
  onRenameProject,
  onDeleteProject,
  tasks 
}) => {
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [editingProject, setEditingProject] = useState(null);
  const [editName, setEditName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  const handleAddProject = () => {
    if (newProjectName.trim()) {
      onAddProject(newProjectName.trim());
      setNewProjectName('');
      setShowNewProjectModal(false);
    }
  };
  
  const handleRename = () => {
    if (editName.trim() && editingProject) {
      onRenameProject(editingProject.id, editName.trim());
      setEditingProject(null);
      setEditName('');
    }
  };
  
  const handleDelete = (projectId) => {
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    if (projectTasks.length > 0) {
      if (window.confirm(`This project has ${projectTasks.length} task(s). Delete anyway?`)) {
        onDeleteProject(projectId);
      }
    } else {
      onDeleteProject(projectId);
    }
    setDeleteConfirm(null);
  };
  
  const getProjectStats = (projectId) => {
    const projectTasks = tasks.filter(t => t.projectId === projectId && !t.completed);
    const totalHours = projectTasks.reduce((sum, t) => sum + t.estimatedHours, 0);
    return {
      count: projectTasks.length,
      hours: totalHours,
    };
  };
  
  return (
    <div className="project-sidebar">
      <div className="sidebar-header">
        <h2>Projects</h2>
      </div>
      
      <div className="project-list">
        <button
          className={`project-item ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => onFilterChange('all')}
        >
          <span className="project-color" style={{ background: 'var(--accent-yellow)' }}>
            ⚡
          </span>
          <div className="project-info">
            <span className="project-name">All Projects</span>
            <span className="project-stats mono">
              {tasks.filter(t => !t.completed).length} tasks
            </span>
          </div>
        </button>
        
        <div className="divider"></div>
        
        {projects.map(project => {
          const stats = getProjectStats(project.id);
          return (
            <div key={project.id} className="project-item-wrapper">
              <button
                className={`project-item ${activeFilter === project.id ? 'active' : ''} ${!project.visible ? 'hidden' : ''}`}
                onClick={() => onFilterChange(project.id)}
              >
                <span 
                  className="project-color" 
                  style={{ background: project.color }}
                ></span>
                <div className="project-info">
                  <span className="project-name">{project.name}</span>
                  <span className="project-stats mono">
                    {stats.count} · {stats.hours}h
                  </span>
                </div>
                <div className="project-actions">
                  <span
                    className="icon-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleVisibility(project.id);
                    }}
                    title={project.visible ? 'Hide from calendar' : 'Show in calendar'}
                  >
                    {project.visible ? '👁️' : '👁️‍🗨️'}
                  </span>
                </div>
              </button>
              
              {activeFilter === project.id && (
                <div className="project-menu">
                  <button
                    className="menu-btn"
                    onClick={() => {
                      setEditingProject(project);
                      setEditName(project.name);
                    }}
                  >
                    ✏️ Rename
                  </button>
                  {project.id !== 'general' && (
                    <button
                      className="menu-btn danger"
                      onClick={() => handleDelete(project.id)}
                    >
                      🗑️ Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="sidebar-footer">
        <Button 
          variant="ghost" 
          onClick={() => setShowNewProjectModal(true)}
          className="add-project-btn"
        >
          + New Project
        </Button>
      </div>
      
      {/* New Project Modal */}
      <Modal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        title="Create New Project"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowNewProjectModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddProject}>
              Create
            </Button>
          </>
        }
      >
        <Input
          label="Project Name"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          placeholder="e.g., CS101, Work Projects"
          required
          onKeyPress={(e) => e.key === 'Enter' && handleAddProject()}
        />
      </Modal>
      
      {/* Rename Project Modal */}
      <Modal
        isOpen={!!editingProject}
        onClose={() => setEditingProject(null)}
        title="Rename Project"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingProject(null)}>
              Cancel
            </Button>
            <Button onClick={handleRename}>
              Save
            </Button>
          </>
        }
      >
        <Input
          label="Project Name"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          placeholder="Enter new name"
          required
          onKeyPress={(e) => e.key === 'Enter' && handleRename()}
        />
      </Modal>
    </div>
  );
};

export default ProjectSidebar;
