import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Loader } from "lucide-react";

const AdminOrganization = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [loading, setLoading] = useState(true);

  const getCurrentOrg = useCallback(() => {
    try {
      const org = localStorage.getItem('selectedOrganization');
      return org ? JSON.parse(org) : null;
    } catch (error) {
      console.error('Error parsing organization from localStorage:', error);
      return null;
    }
  }, []);

  const fetchProjects = useCallback(async (orgId) => {
    if (!orgId) return;
    setLoading(true);
    try {
      const response = await axios.get(`https://api.testerally.ai/api/organization/${orgId}/projects/`);
      setProjects(response.data.projects || []);
    } catch (err) {
      console.error("Failed to fetch projects", err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleOrgChange = () => {
      const newOrg = getCurrentOrg();
      setSelectedOrg(newOrg);
      if (newOrg?.id) {
        fetchProjects(newOrg.id);
      } else {
        setProjects([]);
      }
    };

    handleOrgChange();

    window.addEventListener('storage', handleOrgChange);
    
    const handleOrgCustomEvent = () => {
      handleOrgChange();
    };
    
    window.addEventListener('organizationChanged', handleOrgCustomEvent);

    return () => {
      window.removeEventListener('storage', handleOrgChange);
      window.removeEventListener('organizationChanged', handleOrgCustomEvent);
    };
  }, [getCurrentOrg, fetchProjects]);

  const handleProjectSelect = (project) => {
    const userId = localStorage.getItem('userId');
    localStorage.setItem(`selectedProject_${userId}`, JSON.stringify(project));
    localStorage.setItem('selectedProject', JSON.stringify(project));
    
    window.dispatchEvent(new CustomEvent('projectChanged', {
      detail: project
    }));

    navigate('/admin-project-details');
  };


  const renderLoadingState = () => (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="flex items-center space-x-2 text-purple-600">
        <Loader className="w-6 h-6 animate-spin" />
        <span className="text-lg">Loading projects...</span>
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className="text-center py-8">
      <h3 className="text-lg font-medium text-gray-900">No Projects Found</h3>
      <p className="mt-1 text-sm text-gray-500">
        {selectedOrg ? 
          'This organization currently has no projects.' : 
          'Please select an organization to view projects.'}
      </p>
    </div>
  );

  const renderProjectsTable = () => (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {projects.map((project) => (
            <tr 
              key={project.id}
              className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
              onClick={() => handleProjectSelect(project)}
            >
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-gray-900">{project.name}</div>
                <div className="text-sm text-gray-500 line-clamp-1">{project.description}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{project.project_type || 'N/A'}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {project.created_at ? 
                    new Date(project.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }) : 'N/A'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  Active
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
         {/* {selectedOrg?.name ? `${selectedOrg.name} Projects` : 'Organization Projects'}  */} Projects
        </h1>
        <div className="text-sm text-gray-500">
          {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
        </div>
      </div>

      {loading ? renderLoadingState() : (
        <div className="space-y-4">
          {projects.length === 0 ? renderEmptyState() : renderProjectsTable()}
        </div>
      )}
    </div>
  );
};

export default AdminOrganization;