import React, { useState, useEffect, useCallback } from "react";
import { AiOutlinePlus } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const ProjectMembers = () => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [invitedMembers, setInvitedMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("member"); // Default role
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const userId = localStorage.getItem("userId");

  const roles = [
    { id: "manager", label: "Project Manager" },
    { id: "member", label: "Project Member" }
  ];

  const fetchInvitedMembers = useCallback(async () => {
    if (!selectedProject?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(`https://api.testerally.ai/api/projects/${selectedProject.id}/members/`, {
        params: { 
          project_id: selectedProject.id,
          user_id: userId
        },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setInvitedMembers(response.data || []);
    } catch (error) {
      console.error("Error fetching invited members:", error);
      setError(error.response?.data?.message || "Failed to fetch members");
    } finally {
      setIsLoading(false);
    }
  }, [selectedProject?.id, userId]);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      return;
    }

    const savedProjectKey = `selectedProject_${userId}`;
    const savedProject = localStorage.getItem(savedProjectKey);
    
    if (savedProject) {
      try {
        const project = JSON.parse(savedProject);
        setSelectedProject(project);
      } catch (error) {
        console.error("Error parsing saved project:", error);
        navigate("/dashboard-user");
      }
    }

    const handleProjectChange = (event) => {
      const newProject = event.detail;
      if (newProject) {
        setSelectedProject(newProject);
        localStorage.setItem("selectedProject", JSON.stringify(newProject));
      }
    };

    window.addEventListener("projectChanged", handleProjectChange);
    return () => window.removeEventListener("projectChanged", handleProjectChange);
  }, [navigate]);

  useEffect(() => {
    if (selectedProject?.id) {
      fetchInvitedMembers();
    }
  }, [selectedProject, fetchInvitedMembers]);

  const handleInviteMember = async () => {
    if (!inviteEmail) {
      setError("Please enter a valid email address.");
      return;
    }

    const payload = {
      project_id: selectedProject.id,
      user_id: userId,
      recipient_email: inviteEmail,
      role: selectedRole 
    };

    try {
      const response = await axios.post(
        `https://api.testerally.ai/api/send-invite/`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      
      setInviteEmail("");
      setSelectedRole("member"); 
      setShowModal(false);
      setError(null);
      alert("Invitation sent successfully!");

      const responseData = response.data;
      if (responseData.success) {
        fetchInvitedMembers();
      } else if (responseData.error === "User already registered with this email.") {
        alert("This email is already registered in the system.");
      }
    } catch (error) {
      console.error("Error sending invite:", error);

      const errorMessage =
        error.response?.data?.error || 
        error.response?.data?.message || 
        "An error occurred while sending the invite";

      if (errorMessage.includes("already registered")) {
        setInviteEmail("");
        setShowModal(false);
        setError(null);
        setError("This user is already registered in the system.");
      } else if (errorMessage.includes("invalid email")) {
        setError("The email address is invalid.");
      } else {
        setError(errorMessage || "Failed to send invitation");
      }
    }
  };

  const resetModal = () => {
    setShowModal(false);
    setInviteEmail("");
    setSelectedRole("member");
    setError(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <div className="flex-1 lg:ml-[300px] transition-all duration-300 lg:max-w-[calc(100%-300px)] sm:ml-[60px] sm:max-w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Project Members
              </h2>
              {selectedProject ? (
                <span className="text-sm text-gray-600 mt-1 block">
                  {/* Project: {selectedProject.name} */}
                </span>
              ) : (
                <span className="text-sm text-red-500 mt-1 block">
                  No project selected
                </span>
              )}
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition duration-200"
            >
              <AiOutlinePlus className="mr-2" />
              Invite Member
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              {error}
            </div>
          )}

          <div className="bg-white p-4 rounded-md shadow-md">
            <h3 className="text-lg font-medium text-gray-700 mb-4">
              Invited Members
            </h3>
            {isLoading ? (
              <p className="text-gray-500">Loading members...</p>
            ) : invitedMembers.length > 0 ? (
              <ul className="space-y-2">
                {invitedMembers.map((member) => (
                  <li
                    key={member.id}
                    className="p-3 bg-gray-50 border rounded-md flex items-center justify-between"
                  >
                    <div>
                      <span className="text-gray-800 font-medium">
                        {member.email}
                      </span>
                      {/* <span className="text-sm text-gray-500 ml-2">
                        Role: {member.role || 'Member'}
                      </span> */}
                    </div>
                    <span className="text-sm text-gray-500">
                      Status: {member.invitation_status || 'Pending'}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">
                No members have been invited yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Project Member
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter member's email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md"
                />
              </div>
              
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  id="role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md bg-white"
                >
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={resetModal}
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleInviteMember}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
              >
                Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectMembers;