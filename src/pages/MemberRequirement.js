
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import { AiOutlinePlus } from "react-icons/ai";
import { Save, X, Edit2, Trash2, ChevronDown } from 'lucide-react';
import MemberSidebar from "./MemberSidebar";

const MemberRequirement = () => {
  const navigate = useNavigate();
  const [requirements, setRequirements] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editedType, setEditedType] = useState("");
  const [editedLabels, setEditedLabels] = useState(""); 
  const [editedStartDate, setEditedStartDate] = useState(""); 
  const [editedEndDate, setEditedEndDate] = useState("");
  const [requirementTypes, setRequirementTypes] = useState([]);


  useEffect(() => {
    const fetchRequirementTypes = async () => {
      try {
        const response = await fetch(
          "https://api.testerally.ai/api/requirement-types/",
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch requirement types");
        }

        const types = await response.json();
        setRequirementTypes(types);
        console.log(types)
      } catch (error) {
        console.error("Error fetching requirement types:", error);
      }
    };

    fetchRequirementTypes();
  }, []);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setLoading(false);
      return;
    }

    const savedProjectKey = `selectedProject_${userId}`;
    const savedProject = localStorage.getItem(savedProjectKey);

    if (savedProject) {
      try {
        const project = JSON.parse(savedProject);
        setSelectedProject(project);
      } catch (err) {
        console.error("Error parsing saved project:", err);
        localStorage.removeItem(savedProjectKey);
      }
    }

    const handleProjectChange = (event) => {
      const newProject = event.detail;
      setSelectedProject(newProject);
    };

    window.addEventListener("projectChanged", handleProjectChange);
    return () => window.removeEventListener("projectChanged", handleProjectChange);
  }, []);

  useEffect(() => {
    const fetchRequirements = async () => {
      setLoading(true);
      if (!selectedProject?.id) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `https://api.testerally.ai/api/requirements/?project_id=${selectedProject.id}`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch requirements");
        }

        const data = await response.json();
        setRequirements(data);

        console.log("Requirment",data)
        
      } catch (error) {
        console.error("Error fetching requirements:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequirements();
  }, [selectedProject]);

  const handleEdit = (id, title, description, type, labels, start_date, completion_date) => {
    setEditingId(id);
    setEditedTitle(title);
    setEditedDescription(description);
    setEditedType(type);
    setEditedLabels(labels); 
    setEditedStartDate(start_date); 
    setEditedEndDate(completion_date);
  };

  const handleSave = async (id) => {
    if (!editedTitle || !editedDescription) return;
  
    const updatedRequirement = {
      title: editedTitle,
      description: editedDescription,
      type: editedType,
      labels: editedLabels, 
      start_date: editedStartDate, 
      completion_date: editedEndDate,
    };
  
    console.log("Updated Requirement:", updatedRequirement);
  
    try {
      const response = await fetch(
        `https://api.testerally.ai/api/requirements/${id}/?project_id=${selectedProject.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedRequirement),
        }
      );
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response from server:", errorData);
        throw new Error("Failed to update requirement");
      }
  
      const updatedData = await response.json();
      console.log("Updated Requirement Response:", updatedData);
  
      setRequirements((prevRequirements) =>
        prevRequirements.map((req) =>
          req.id === updatedData.id ? updatedData : req
        )
      );
  
      setEditingId(null);
      setEditedTitle("");
      setEditedDescription("");
      setEditedType("");
      setEditedLabels("");
      setEditedStartDate("");
      setEditedEndDate("");
    } catch (error) {
      console.error("Error saving requirement:", error);
    }
  };
  

  const handleCancel = () => {
    setEditingId(null);
    setEditedTitle("");
    setEditedDescription("");
    setEditedType("");
    setEditedLabels("");
    setEditedStartDate("");
    setEditedEndDate("");
  };

  const handleDelete = async (id) => {
    console.log("id:",id)
    console.log("project_id:",selectedProject.id)

    if (window.confirm("Are you sure you want to delete this requirement?")) {
      try {
        const response = await fetch(
          `https://api.testerally.ai/api/requirements/${id}/?project_id=${selectedProject.id}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete requirement");
        }

        setRequirements((prevRequirements) =>
          prevRequirements.filter((req) => req.id !== id)
        );
      } catch (error) {
        console.error("Error deleting requirement:", error);
      }
    }
  };

  const filteredRequirements = requirements.filter((requirement) =>
    requirement.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderEditForm = () => {
    if (!editingId) return null;
  
    const editingRequirement = requirements.find(req => req.id === editingId);
    if (!editingRequirement) return null;
  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-white shadow-xl rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto relative">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Edit Requirement</h3>
              <button 
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="w-full p-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className="w-full p-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all duration-200"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <div className="relative">
                  <select
                    value={editedType}
                    onChange={(e) => setEditedType(e.target.value)}
                    className="w-full p-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-200 focus:border-blue-400 appearance-none transition-all duration-200 pr-8"
                  >
                    <option value="">Select Type</option>
                    {requirementTypes.map((type) => (
                      <option key={type.id} value={type.type_name}>
                        {type.type_name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Labels</label>
                <input
                  type="text"
                  value={editedLabels}
                  onChange={(e) => setEditedLabels(e.target.value)}
                  className="w-full p-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={editedStartDate}
                  onChange={(e) => setEditedStartDate(e.target.value)}
                  className="w-full p-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Completion Date</label>
                <input
                  type="date"
                  value={editedEndDate}
                  onChange={(e) => setEditedEndDate(e.target.value)}
                  className="w-full p-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all duration-200"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleSave(editingId)}
                  className="inline-flex items-center px-3 py-1.5 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors duration-200"
                >
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </button>
                <button
                  onClick={handleCancel}
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
    <div>
      <MemberSidebar />
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 lg:ml-[300px] transition-all duration-300 lg:max-w-[calc(100%-300px)] sm:ml-[60px] sm:max-w-full">
        <div className="p-6">
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="flex flex-col lg:flex-row justify-between items-center p-4 border-b">
              <div className="flex space-x-4 mb-4 sm:mb-0">
                <button className="px-4 py-2 text-purple-600 font-medium border-b-2 border-purple-600">
                  Requirements
                </button>
              </div>
              <button
                onClick={() => navigate("/member-test-suite")}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 lg:mt-0 sm:mt-3"
              >
                <AiOutlinePlus className="mr-2" />
                Create
              </button>
            </div>

            <div className="p-4 flex flex-col lg:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <h2 className="text-lg font-medium text-gray-700">
                {selectedProject
                  ? `Requirements  ${/* Commented out selectedProject.name */ ''}`
                  : "Select a Project"}
              </h2>
              {selectedProject && (
                <div className="relative w-full sm:w-64">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search requirements..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="p-4 text-center">Loading requirements...</div>
            ) : !selectedProject ? (
              <div className="p-4 text-center text-gray-500">
                Please select a project from the sidebar to view requirements.
              </div>
            ) : filteredRequirements.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No requirements found for this project.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Labels (Count)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Start Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Completion Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRequirements.map((requirement) => (
                      <tr key={requirement.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {requirement.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {requirement.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {requirement.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {`Count: ${requirement.labels}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {requirement.start_date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {requirement.completion_date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() =>
                              handleEdit(
                                requirement.id, 
                                requirement.title, 
                                requirement.description, 
                                requirement.type,
                                requirement.labels,
                                requirement.start_date,
                                requirement.completion_date
                              )
                            }
                            className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors duration-200"
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(requirement.id)}
                            className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors duration-200 ml-2"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>                
                </table>
              </div>
            )}
          </div>
          {renderEditForm()}
        </div>
      </div>
    </div></div>
  );
};

export default MemberRequirement;
