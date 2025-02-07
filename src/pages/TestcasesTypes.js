import React, { useState, useEffect } from "react";
import { FaEdit, FaTrashAlt, FaPlus, FaCheck, FaTimes } from "react-icons/fa";

const TestcasesTypes = () => {
  const [types, setTypes] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingField, setAddingField] = useState(false);
  const [editingId, setEditingId] = useState(null);
  

  const [newType, setNewType] = useState({ name: "", description: "" });

  const [editValues, setEditValues] = useState({ name: "", description: "" });

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setError("User ID not found. Please log in again.");
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
    const fetchTestCaseTypes = async () => {
      if (!selectedProject?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `https://api.testerally.ai/api/testcase-types/?project_id=${selectedProject.id}`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch test case types");
        }

        const data = await response.json();
        setTypes(data);
      } catch (error) {
        setError(error.message || "Failed to fetch test case types");
      } finally {
        setLoading(false);
      }
    };

    fetchTestCaseTypes();
  }, [selectedProject]);

  const handleAddClick = () => {
    setAddingField(true);
    setNewType({ name: "", description: "" });
  };

  const handleAddType = async () => {
    if (!newType.name.trim()) {
      alert("Type name cannot be empty.");
      return;
    }

    if (!selectedProject?.id) {
      alert("Please select a project first.");
      return;
    }

    try {
      const response = await fetch(
        `https://api.testerally.ai/api/testcase-types/?project_id=${selectedProject.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newType),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create test case type");
      }

      const createdType = await response.json();
      setTypes([...types, createdType]);
      setAddingField(false);
      setNewType({ name: "", description: "" });
    } catch (error) {
      alert(error.message);
    }
  };

  const handleEdit = (type) => {
    setEditingId(type.id);
    setEditValues({ name: type.name, description: type.description });
  };

  const handleSaveEdit = async (typeId) => {
    if (!editValues.name.trim()) {
      alert("Type name cannot be empty.");
      return;
    }

    try {
      const response = await fetch(
        `https://api.testerally.ai/api/testcase-types/${typeId}/?project_id=${selectedProject.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editValues),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update test case type");
      }

      const updatedType = await response.json();
      setTypes(types.map(type => type.id === typeId ? updatedType : type));
      setEditingId(null);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDelete = async (typeId) => {
    if (!window.confirm("Are you sure you want to delete this type?")) return;

    try {
      const response = await fetch(
        `https://api.testerally.ai/api/testcase-types/${typeId}/?project_id=${selectedProject.id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete test case type");
      }

      setTypes(types.filter(type => type.id !== typeId));
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 lg:ml-[300px] transition-all duration-300 lg:max-w-[calc(100%-300px)] sm:ml-[60px] sm:max-w-full">
        <div className="p-6">
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-semibold text-gray-800">
                {selectedProject ? `Test Case Types  ${/* Commented out selectedProject.name */ ''}` : 'Select a Project'}
              </h2>
              {selectedProject && (
                <button
                  onClick={handleAddClick}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  <FaPlus className="mr-2" /> Add Type
                </button>
              )}
            </div>

            {loading ? (
              <div className="p-4 text-center">Loading test case types...</div>
            ) : error ? (
              <div className="p-4 text-center text-red-500">{error}</div>
            ) : !selectedProject ? (
              <div className="p-4 text-center text-gray-500">
                Please select a project from the sidebar to view test case types
              </div>
            ) : (
              <div className="p-4">
                <div className="space-y-4">
                  {types.map((type) => (
                    <div key={type.id} className="border rounded-lg p-4 bg-gray-50">
                      {editingId === type.id ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={editValues.name}
                            onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                            className="w-full p-2 border rounded-md"
                            placeholder="Type name"
                          />
                          <textarea
                            value={editValues.description}
                            onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                            className="w-full p-2 border rounded-md"
                            placeholder="Type description"
                            rows="2"
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleSaveEdit(type.id)}
                              className="flex items-center px-3 py-1.5 bg-green-50 text-green-600 rounded-md hover:bg-green-100"
                            >
                              <FaCheck className="mr-1" /> Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="flex items-center px-3 py-1.5 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100"
                            >
                              <FaTimes className="mr-1" /> Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">{type.name}</h3>
                              <p className="text-gray-600 mt-1">{type.description}</p>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(type)}
                                className="flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
                              >
                                <FaEdit className="mr-1" /> Edit
                              </button>
                              <button
                                onClick={() => handleDelete(type.id)}
                                className="flex items-center px-3 py-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100"
                              >
                                <FaTrashAlt className="mr-1" /> Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {addingField && (
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={newType.name}
                          onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                          className="w-full p-2 border rounded-md"
                          placeholder="Enter type name"
                        />
                        <textarea
                          value={newType.description}
                          onChange={(e) => setNewType({ ...newType, description: e.target.value })}
                          className="w-full p-2 border rounded-md"
                          placeholder="Enter type description"
                          rows="2"
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={handleAddType}
                            className="flex items-center px-3 py-1.5 bg-green-50 text-green-600 rounded-md hover:bg-green-100"
                          >
                            <FaCheck className="mr-1" /> Save
                          </button>
                          <button
                            onClick={() => setAddingField(false)}
                            className="flex items-center px-3 py-1.5 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100"
                          >
                            <FaTimes className="mr-1" /> Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestcasesTypes;