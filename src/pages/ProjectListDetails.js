import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, X, Edit2, Trash2, ChevronDown } from 'lucide-react';

const ProjectListDetails = () => {
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const userId = localStorage.getItem("userId");
  const userName = localStorage.getItem("userName") || "User";
  const projectTypes = ["Web Development", "Mobile Application", "API Development", "Data Analysis"];

  useEffect(() => {
    const savedProjectKey = `selectedProject_${userId}`;
    const savedProject = localStorage.getItem(savedProjectKey);
    
    if (savedProject) {
      try {
        const project = JSON.parse(savedProject);
        setSelectedProject(project);
      } catch (error) {
        console.error("Error parsing saved project:", error);
        navigate("/projects-list");
      }
    } else {
      navigate("/projects-list");
    }

    setLoading(false);
  }, [navigate, userId]);

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
  
    try {
      const deleteResponse = await fetch(
        `https://api.testerally.ai/api/projects/${projectId}/?user_id=${userId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );
  
      if (deleteResponse.ok) {
        const currentUser = localStorage.getItem("userId");
        localStorage.removeItem(`selectedProject_${currentUser}`);
        localStorage.removeItem("selectedProject"); 
  
        alert("Project deleted successfully.");
        navigate("/projects-list");
      } else {
        const errorData = await deleteResponse.json();
        console.error("Delete failed:", errorData);
        alert(errorData.message || "Failed to delete project.");
      }
    } catch (error) {
      console.error("Error during deletion:", error);
      alert("An error occurred while deleting the project. Please try again.");
    }
  };
  
  const handleEditClick = () => {
    setSelectedProject(prev => ({ ...prev, isEditing: true }));
    setIsEditModalOpen(true);
  };

  const handleCancelEdit = () => {
    setIsEditModalOpen(false);
    setSelectedProject(prev => ({ ...prev, isEditing: false }));
  };

  const handleChange = (field, value) => {
    setSelectedProject(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSave = async () => {
    try {
      const response = await fetch(
        `https://api.testerally.ai/api/projects/${selectedProject.id}/?user_id=${userId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: selectedProject.name,
            description: selectedProject.description,
            project_type: selectedProject.project_type,
          }),
        }
      );

      if (response.ok) {
        const updatedProject = await response.json();

        setSelectedProject(updatedProject);

        const savedProjectKey = `selectedProject_${userId}`;
        localStorage.setItem(savedProjectKey, JSON.stringify(updatedProject));
        localStorage.setItem("selectedProject", JSON.stringify(updatedProject));

        setIsEditModalOpen(false);
        alert("Project updated successfully.");
      }
    } catch (err) {
      console.error("Error updating project:", err);
      alert("An error occurred while updating the project.");
    }
  };

  const renderEditModal = () => {
    if (!isEditModalOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-white shadow-xl rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto relative">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Edit Project</h3>
              <button 
                onClick={handleCancelEdit}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
                <input
                  type="text"
                  value={selectedProject.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full p-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={selectedProject.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full p-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all duration-200"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Type</label>
                <div className="relative">
                  <select
                    value={selectedProject.project_type || ''}
                    onChange={(e) => handleChange('project_type', e.target.value)}
                    className="w-full p-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-200 focus:border-blue-400 appearance-none transition-all duration-200 pr-8"
                  >
                    {projectTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  className="inline-flex items-center px-3 py-1.5 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors duration-200"
                >
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="inline-flex items-center px-3 py-1.5 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 transition-colors duration-200"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 lg:ml-[300px] transition-all duration-300 lg:max-w-[calc(100%-300px)] sm:ml-[60px] sm:max-w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">Project Details</h2>
            <div className="flex space-x-2">
              <button
                onClick={handleEditClick}
                className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors duration-200"
              >
                <Edit2 className="w-4 h-4 mr-1" />
                Edit
              </button>
              <button
                onClick={() => handleDeleteProject(selectedProject.id)}
                className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors duration-200"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center p-8 bg-white rounded-lg shadow-md">
              <p className="text-gray-600 text-lg mb-4">Loading project...</p>
            </div>
          ) : selectedProject ? (
            <div className="bg-white shadow-md rounded-lg p-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Project Name</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedProject.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Project Type</label>
                  <p className="text-lg text-gray-900">{selectedProject.project_type || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="text-gray-900">{selectedProject.description || 'No description provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created By</label>
                  <p className="text-gray-900">{userName}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 bg-white rounded-lg shadow-md">
              <p className="text-gray-600 text-lg mb-4">No project selected</p>
              <button 
                onClick={() => navigate("/projects-list")}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Back to Projects
              </button>
            </div>
          )}

          {renderEditModal()}
        </div>
      </div>
    </div>
  );
};

export default ProjectListDetails;