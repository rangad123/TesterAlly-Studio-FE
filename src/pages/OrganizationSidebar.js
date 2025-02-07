import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUsers,
  FaBuilding,
  FaPlusCircle
} from "react-icons/fa";

const OrganizationSidebar = ({ isVisible, isMobileView, onOptionSelect }) => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [activeMenuItem, ] = useState("");
  const [isOrganizationProjectsExpanded, setIsOrganizationProjectsExpanded] = useState(false);
  const [projectMembers, setProjectMembers] = useState([]);
  const [isProjectMembersDropdownOpen, setIsProjectMembersDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await fetch(
          "https://api.testerally.ai/api/organizations/"
        );
        const data = await response.json();
        setOrganizations(data);

        if (data.length > 0) {
          const firstOrg = data[0];
          const projectsResponse = await fetch(
            `https://api.testerally.ai/api/organizations/${firstOrg.id}/projects/`
          );
          const projects = await projectsResponse.json();
          firstOrg.projects = projects;

          setSelectedOrganization(firstOrg);
        }
      } catch (error) {
        console.error("Error fetching organizations:", error);
      }
    };

    fetchOrganizations();
  }, []);

  const handleOrganizationSelect = async (organization) => {
    try {
      if (!organization.projects) {
        const response = await fetch(
          `https://api.testerally.ai/api/organizations/${organization.id}/projects/`
        );
        const projects = await response.json();
        organization.projects = projects;
      }

      setSelectedOrganization(organization);
      setIsDropdownOpen(false);
      setSearchTerm("");

      if (isMobileView) {
        onOptionSelect();
      }
    } catch (error) {
      console.error("Error fetching organization projects:", error);
    }
  };

  const handleCreateOrganization = () => {
    navigate("/create-organization");
  };

  const handleProjectClick = async (project) => {
    try {
      const response = await fetch(
        `https://api.testerally.ai/api/projects/${project.id}/members/`
      );
      const members = await response.json();
      setProjectMembers(members);
      setIsProjectMembersDropdownOpen(true);
    } catch (error) {
      console.error("Error fetching project members:", error);
    }
  };

/*  const organizationMenuItems = [
  { icon: FaUsers, label: "Organization Members", path: "" },
  ];

   const handleMenuClick = (path) => {
    if (!selectedOrganization) {
      alert("Please select an organization first to access this feature.");
      return;
    }

    navigate(path);

    if (isMobileView) {
      onOptionSelect();
    }
  };
*/
  const filteredOrganizations = organizations.filter((org) =>
    org.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isVisible) return null;

  return (
    <div
      className={`fixed left-16 h-[calc(100%-4rem)] w-60 bg-white border-l border-gray-200 transition-all duration-300 ease-in-out mt-3 ${
        isMobileView ? 'md:hidden' : 'md:block'
      }`}
    >
      {/* Organization Dropdown or No Organizations Message */}
      <div className="px-4 mt-[18px]">
        {organizations.length === 0 ? (
          <div className="text-center">
            <div className="mb-2 text-gray-600">You have no organizations</div>
            <button
              onClick={handleCreateOrganization}
              className="flex items-center justify-center gap-2 w-full p-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              <FaPlusCircle />
              <span>Create Organization</span>
            </button>
          </div>
        ) : (
          <div
            className="relative w-full p-2 bg-white border border-purple-600 rounded-md flex justify-between items-center cursor-pointer"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span className="text-black truncate">
              {selectedOrganization?.name || "Select Organization"}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`w-4 h-4 transform transition-transform ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </div>

      {/* Dropdown Menu */}
      {isDropdownOpen && organizations.length > 0 && (
        <div className="absolute left-0 w-full bg-white border border-gray-300 rounded-md mt-1 z-10">
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search organizations..."
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="max-h-[200px] overflow-y-auto text-black">
            {filteredOrganizations.map((org) => (
              <div
                key={org.id}
                onClick={() => handleOrganizationSelect(org)}
                className="p-2 cursor-pointer hover:bg-blue-100"
              >
                {org.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Menu Items - Always visible */}
      <div className="overflow-y-none mt-4">
        <div className="flex justify-center text-lg text-gray-500 p-2">
          Organization Management
        </div>
{/*
        {organizationMenuItems.map((item, index) => (
          <div
            key={index}
            className={`sub-sidebar-item flex items-center gap-2 p-2 cursor-pointer ${
              !selectedOrganization ? "text-gray-400" : activeMenuItem === item.label ? "bg-[#9ac5e2] text-white" : "text-gray-700"
            } hover:bg-blue-100`}
            onClick={() => {
              if (selectedOrganization) {
                setActiveMenuItem(item.label);
                handleMenuClick(item.path);
              } else {
                handleMenuClick(item.path);
              }
            }}
          >
            <item.icon className="icon" />
            <span>{item.label}</span>
          </div>
        ))}
*/}
        {/* Organization Projects Section */}
        <div
          className={`sub-sidebar-item flex items-center gap-2 p-2 cursor-pointer ${
            !selectedOrganization ? "text-gray-400" : activeMenuItem === "Organization Projects" ? "bg-[#9ac5e2] text-white" : "text-gray-700"
          } hover:bg-blue-100`}
          onClick={() => setIsOrganizationProjectsExpanded(!isOrganizationProjectsExpanded)}
        >
          <FaBuilding className="icon" />
          <span>Organization Projects</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`w-4 h-4 ml-auto transform transition-transform ${
              isOrganizationProjectsExpanded ? "rotate-180" : ""
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>

        {isOrganizationProjectsExpanded && (
          <div className="pl-4">
            {selectedOrganization?.projects?.length > 0 ? (
              selectedOrganization.projects.map((project) => (
                <div
                  key={project.id}
                  className="p-2 text-gray-700 hover:bg-blue-50 cursor-pointer"
                  onClick={() => handleProjectClick(project)}
                >
                  {project.name}
                </div>
              ))
            ) : (
              <div className="p-2 text-gray-500">No projects found</div>
            )}
          </div>
        )}

        {/* Project Members Dropdown */}
        {isProjectMembersDropdownOpen && (
          <div className="pl-4">
            <div className="flex justify-center text-lg text-gray-500 p-2"><FaUsers className="mt-1 mr-3" />Project Members</div>
            <div className="max-h-[200px] overflow-y-auto text-black">
              {projectMembers.length > 0 ? (
                projectMembers.map((member) => (
                  <div
                    key={member.id}
                    className="p-2 text-gray-700 hover:bg-blue-50"
                  >
                    {member.name}
                  </div>
                ))
              ) : (
                <div className="p-2 text-gray-500">No members found</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizationSidebar;
