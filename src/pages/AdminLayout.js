
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFileAlt, FaCog } from 'react-icons/fa';
import axios from 'axios';

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [projects, setProjects] = useState([]);
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [isProjectsDropdownOpen, setIsProjectsDropdownOpen] = useState(false);
  const [orgSearchTerm, setOrgSearchTerm] = useState("");
  const [projectSearchTerm, setProjectSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (selectedOrg) {
      fetchProjects(selectedOrg.id);
    }
  }, [selectedOrg]);

  const fetchOrganizations = async () => {
    try {
      const response = await axios.get("https://testerally-be-ylpr.onrender.com/api/organizations/");
      setOrganizations(response.data);
      
      if (response.data.length > 0) {
        const savedOrgKey = 'selectedOrganization';
        const savedOrg = localStorage.getItem(savedOrgKey);

        if (savedOrg) {
          const parsedOrg = JSON.parse(savedOrg);
          const orgExists = response.data.some((o) => o.id === parsedOrg.id);
          if (orgExists) {
            setSelectedOrg(parsedOrg);
          } else {
            setSelectedOrg(response.data[0]);
            localStorage.setItem(savedOrgKey, JSON.stringify(response.data[0]));
          }
        } else {
          setSelectedOrg(response.data[0]);
          localStorage.setItem(savedOrgKey, JSON.stringify(response.data[0]));
        }
      }
    } catch (err) {
      console.error("Failed to fetch organizations");
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async (orgId) => {
    try {
      const response = await axios.get(`https://testerally-be-ylpr.onrender.com/api/organization/${orgId}/projects/`);
      setProjects(response.data.projects);
    } catch (err) {
      console.error("Failed to fetch projects");
    }
  };

  const handleOrgSelect = (org) => {
    setSelectedOrg(org);
    localStorage.setItem('selectedOrganization', JSON.stringify(org));
    
    window.dispatchEvent(new CustomEvent('organizationChanged', {
      detail: org
    }));
    
    setIsOrgDropdownOpen(false);
    setOrgSearchTerm("");
    setIsProjectsDropdownOpen(false);
  };


  const handleProjectSelect = (project) => {
    const userId = localStorage.getItem('userId');
    const savedProjectKey = `selectedProject_${userId}`;
    localStorage.setItem(savedProjectKey, JSON.stringify(project));
    localStorage.setItem('selectedProject', JSON.stringify(project));
    
    window.dispatchEvent(new CustomEvent('projectChanged', {
      detail: project
    }));

    navigate('/admin-project-details');
  };

  const filteredOrganizations = organizations.filter((org) =>
    org.name?.toLowerCase().includes(orgSearchTerm.toLowerCase())
  );

  const filteredProjects = projects.filter((project) =>
    project.name?.toLowerCase().includes(projectSearchTerm.toLowerCase())
  );

  const menuItems = [
    { 
      icon: FaFileAlt, 
      label: "Projects", 
      onClick: () => {
        if (selectedOrg) {
          setIsProjectsDropdownOpen(!isProjectsDropdownOpen);
        }
      }
    },
    { icon: FaCog, label: "Settings", path: "/admin-org-settings" },
  ];

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="fixed left-0 h-[calc(100%-4rem)] w-60 bg-white border-r border-gray-200 overflow-hidden transition-all duration-300 z-20">
        <div className="flex flex-col h-full mt-5">
          {/* Organization Dropdown */}
          <div className="px-4 py-4">
            <div
              className="relative w-full p-2 bg-white border border-purple-600 rounded-md flex justify-between items-center cursor-pointer"
              onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
            >
              <span className="text-black truncate">
                {selectedOrg?.name || "Select Organization"}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`w-4 h-4 transform transition-transform ${
                  isOrgDropdownOpen ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Organization Dropdown Menu */}
            {isOrgDropdownOpen && (
              <div className="absolute left-0 w-60 bg-white border border-gray-300 rounded-md mt-1 z-30">
                <div className="p-2 border-b border-gray-200">
                  <input
                    type="text"
                    value={orgSearchTerm}
                    onChange={(e) => setOrgSearchTerm(e.target.value)}
                    placeholder="Search organizations..."
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="max-h-[200px] overflow-y-auto">
                  {filteredOrganizations.map((org) => (
                    <div
                      key={org.id}
                      onClick={() => handleOrgSelect(org)}
                      className="p-2 cursor-pointer hover:bg-blue-100"
                    >
                      {org.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto">
            {menuItems.map((item, index) => (
              <div key={index} className="relative">
                <div
                  className={`flex items-center gap-2 p-4 cursor-pointer ${
                    !selectedOrg ? "text-purple-400" : "text-purple-700"
                  } hover:bg-blue-50`}
                  onClick={item.onClick || (() => navigate(item.path))}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {item.label === "Projects" && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`w-4 h-4 ml-auto transform transition-transform ${
                        isProjectsDropdownOpen ? "rotate-180" : ""
                      }`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  )}
                </div>

                {/* Projects Dropdown */}
                {item.label === "Projects" && isProjectsDropdownOpen && selectedOrg && (
                  <div className="bg-white border-t border-gray-200">
                    <div className="p-2">
                      <input
                        type="text"
                        value={projectSearchTerm}
                        onChange={(e) => setProjectSearchTerm(e.target.value)}
                        placeholder="Search projects..."
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {filteredProjects.map((project) => (
                        <div
                          key={project.id}
                          onClick={() => handleProjectSelect(project)}
                          className="p-2 pl-8 cursor-pointer hover:bg-blue-50"
                        >
                          {project.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-60 p-8">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-lg text-gray-600">Loading...</div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default AdminLayout;
