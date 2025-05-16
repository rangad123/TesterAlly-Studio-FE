
import React, { useState, useEffect, useCallback } from "react";
import { AiOutlinePlus, AiOutlineClose } from "react-icons/ai";
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
  const [isInviting, setIsInviting] = useState(false);
  const [showMemberDetails, setShowMemberDetails] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberDetailsLoading, setMemberDetailsLoading] = useState(false);
  const [memberDetails, setMemberDetails] = useState(null);

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
      const response = await axios.get(`http://127.0.0.1:8000/api/projects/${selectedProject.id}/members/`, {
        params: { 
          project_id: selectedProject.id,
          user_id: userId
        },
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

    setIsInviting(true); // Start loading

    const payload = {
      project_id: selectedProject.id,
      user_id: userId,
      recipient_email: inviteEmail,
      role: selectedRole 
    };

    try {
      const response = await axios.post(
        `http://127.0.0.1:8000/api/send-invite/`,
        payload
      );

      setInviteEmail("");
      setSelectedRole("member"); 
      setShowModal(false);
      setError(null);
      alert("Invitation sent successfully!");

      const responseData = response.data;
      if (responseData.error === "User already registered with this email.") {
        alert("This email is already registered in the system.");
      }

      fetchInvitedMembers(); // Always refresh
    } catch (error) {
      console.error("Error sending invite:", error);
      const errorMessage =
        error.response?.data?.error || 
        error.response?.data?.message || 
        "An error occurred while sending the invite";

      if (errorMessage.includes("already registered")) {
        setError("This user is already registered in the system.");
      } else if (errorMessage.includes("invalid email")) {
        setError("The email address is invalid.");
      } else {
        setError(errorMessage || "Failed to send invitation");
      }
    } finally {
      setIsInviting(false); // Stop loading
    }
  };

  const resetModal = () => {
    setShowModal(false);
    setInviteEmail("");
    setSelectedRole("member");
    setError(null);
  };

  const handleMemberClick = async (member) => {
    setSelectedMember(member);
    setShowMemberDetails(true);
    
    if (member.invitation_status === "Accepted") {
      setMemberDetailsLoading(true);
      
      try {
        const response = await axios.post(
          `http://127.0.0.1:8000/api/project-member-details/`,
          { email_id: member.email }
        );

        const userData = response.data;
        console.log("Members data:", userData);

        setMemberDetails({
          id: userData.id,
          user: userData.user,
          projects: userData.projects,
          exe_downloads: userData.exe_downloads || [],
          completedTasks: userData.projects?.reduce((total, project) => 
            total + (project.test_cases?.length || 0), 0) || 0,
          pendingTasks: 0 
        });
      } catch (error) {
        console.error("Error fetching member details:", error);
        setError("Failed to fetch member details");
      } finally {
        setMemberDetailsLoading(false);
      }
    }
  };

  const closeMemberDetails = () => {
    setShowMemberDetails(false);
    setSelectedMember(null);
    setMemberDetails(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
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
              {selectedProject && (
                <span className="text-sm text-gray-600 mt-1 block">
                  Project: {selectedProject.name}
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
                    className="p-3 bg-gray-50 border rounded-md flex items-center justify-between cursor-pointer hover:bg-gray-100 transition duration-200"
                    onClick={() => handleMemberClick(member)}
                  >
                    <div>
                      <span className="text-gray-800 font-medium">
                        {member.email}
                      </span>
                      <span className="text-sm text-gray-500 ml-2">
                        Role: {member.role || 'Member'}
                      </span>
                    </div>
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      member.invitation_status === 'Accepted' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {member.invitation_status || 'Pending'}
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

      {/* Invite Member Modal */}
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
                disabled={isInviting}
              >
                {isInviting ? "Inviting..." : "Invite"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Member Details Modal */}
      {showMemberDetails && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Member Details
              </h3>
              <button 
                onClick={closeMemberDetails}
                className="text-gray-500 hover:text-gray-700"
              >
                <AiOutlineClose size={20} />
              </button>
            </div>

            {selectedMember.invitation_status === "Pending" ? (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <p className="text-yellow-800 font-medium">Invitation Pending</p>
                  <p className="text-sm text-gray-600 mt-2">
                    This user has not yet accepted their invitation to join the project.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{selectedMember.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Role:</span>
                    <span className="font-medium">{selectedMember.role || "Member"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Invitation Date:</span>
                    <span className="font-medium">
                      {selectedMember.invited_at ? formatDate(selectedMember.invited_at) : "Not available"}
                    </span>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button 
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
                  >
                    Resend Invitation
                  </button>
                </div>
              </div>
            ) : memberDetailsLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-700"></div>
              </div>
            ) : memberDetails ? (
              <div className="space-y-6">
                {/* User Profile Summary */}
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-xl font-semibold text-purple-700">
                      {memberDetails.user?.name?.charAt(0).toUpperCase() || selectedMember.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-lg">{memberDetails.user?.name || selectedMember.email}</h4>
                    <p className="text-gray-600">{memberDetails.user?.email || selectedMember.email}</p>
                  </div>
                </div>

                {/* User Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-gray-500 text-sm">Role</p>
                    <p className="font-medium">{selectedMember.role || "Member"}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-gray-500 text-sm">Country</p>
                    <p className="font-medium">{memberDetails.user?.country || "Not specified"}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-gray-500 text-sm">Phone</p>
                    <p className="font-medium">{memberDetails.user?.phone || "Not available"}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-gray-500 text-sm">Joined</p>
                    <p className="font-medium">{formatDate(memberDetails.user?.created_at)}</p>
                  </div>
                </div>

                {/* Agent Status */}
                <div className="border-t pt-4">
                  <h5 className="font-medium mb-3">Agent Status</h5>
                  <div className={`p-3 rounded-md ${memberDetails.exe_downloads && memberDetails.exe_downloads.length > 0 ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                    <p className="font-medium">
                      {memberDetails.exe_downloads && memberDetails.exe_downloads.length > 0 
                        ? "Agent Created" 
                        : "Agent Not Created"}
                    </p>
                    <p className="text-sm mt-1">
                      {memberDetails.exe_downloads && memberDetails.exe_downloads.length > 0 
                        ? "This member has created a test agent." 
                        : "This member has not yet created a test agent."}
                    </p>
                  </div>
                </div>

                {/* Activity Summary */}
                <div className="border-t pt-4">
                  <h5 className="font-medium mb-3">Activity Summary</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 p-3 rounded-md">
                      <p className="text-green-800 font-bold text-xl">{memberDetails.completedTasks}</p>
                      <p className="text-sm text-gray-600">Test Cases</p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-md">
                      <p className="text-yellow-800 font-bold text-xl">{memberDetails.projects?.length || 0}</p>
                      <p className="text-sm text-gray-600">Projects</p>
                    </div>
                  </div>
                </div>

                {/* Projects Information */}
                {memberDetails.projects && memberDetails.projects.length > 0 && (
                  <div className="border-t pt-4">
                    <h5 className="font-medium mb-3">Project Information</h5>
                    <div className="space-y-3">
                      {memberDetails.projects.map((project) => (
                        <div key={project.id} className="bg-gray-50 p-3 rounded-md">
                          <p className="font-medium">{project.name}</p>
                          <div className="flex justify-between text-sm mt-2">
                            <span className="text-gray-600">Type: {project.project_type}</span>
                            <span className="text-gray-600">ID: {project.project_id}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Test Cases Section */}
                {memberDetails.projects && memberDetails.projects.some(project => project.test_cases && project.test_cases.length > 0) && (
                  <div className="border-t pt-4">
                    <h5 className="font-medium mb-3">Test Cases</h5>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {memberDetails.projects.flatMap(project => 
                        (project.test_cases || []).map(testCase => (
                          <div key={testCase.id} className="bg-gray-50 p-3 rounded-md">
                            <div className="flex justify-between items-center">
                              <span className="font-medium truncate">{testCase.name}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                {testCase.testcase_type}
                              </span>
                              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                                {testCase.testcase_priority}
                              </span>
                              <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                                Project: {project.name}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No details available for this member.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectMembers;