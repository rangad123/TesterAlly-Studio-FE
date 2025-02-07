import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateTestSuite.css";
import "./Requirement.css";

const Requirement = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "",
    startDate: "",
    completionDate: "",
    labels: "", 
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [requirementTypes, setRequirementTypes] = useState([]);

  const navigate = useNavigate();

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
        fetchRequirementTypes(project.id);
      } catch (err) {
        console.error("Error parsing saved project:", err);
        localStorage.removeItem(savedProjectKey);
      }
    }

    const handleProjectChange = (event) => {
      const project = event.detail;
      setSelectedProject(project);
      if (project?.id) {
        fetchRequirementTypes(project.id);
      }
      localStorage.setItem(savedProjectKey, JSON.stringify(project));
    };

    window.addEventListener("projectChanged", handleProjectChange);

    return () => {
      window.removeEventListener("projectChanged", handleProjectChange);
    };
  }, []);

  const fetchRequirementTypes = async (projectId) => {
    if (!projectId) return;
    
    try {
      const response = await fetch(
        `https://api.testerally.ai/api/requirement-types/?project_id=${projectId}`
      );
      if (!response.ok) throw new Error("Failed to fetch requirement types");
      const data = await response.json();
      setRequirementTypes(data);

    } catch (error) {
      console.error("Error fetching requirement types:", error);
      setRequirementTypes([]);
    }
  };

  const validateForm = () => {
    const { title, type, startDate, completionDate, labels } = formData;
    const newErrors = {};

    if (!title.trim()) newErrors.title = "Title of the requirement is required.";
    if (!type.trim()) newErrors.type = "Type selection is required.";
    if (!startDate) newErrors.startDate = "Start date is required.";
    if (!completionDate) newErrors.completionDate = "Completion date is required.";
    if (!selectedProject?.id) newErrors.project = "A project must be selected to create a requirement.";
    
    if (labels.trim()) {
      const labelValue = parseInt(labels.trim(), 10);
      if (isNaN(labelValue) || labelValue < 0) {
        newErrors.labels = "Please enter a valid positive number for planned automation count.";
      }
    }

    return newErrors;
  };

  const handleCreate = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
  
    setErrors({});
    setIsLoading(true);
  
    try {
      const labelValue = parseInt(formData.labels) || 0;
  
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        start_date: formData.startDate,
        completion_date: formData.completionDate,
        labels: labelValue,
        project_id: selectedProject.id,
      };
  
      console.log("Payload:", payload);
  
      const response = await fetch(
        "https://api.testerally.ai/api/requirements/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server Error Response:", errorData);
        if (errorData.labels) {
          setErrors({ labels: errorData.labels });
        } else {
          alert(`Failed to create requirement: ${errorData.message || "Check your input."}`);
        }
        return;
      }
  
      const responseData = await response.json(); 
      console.log("Response:", responseData);
  
      alert("Requirement Created Successfully");
      setFormData({
        title: "",
        description: "",
        type: "",
        startDate: "",
        completionDate: "",
        labels: "",
      });
      navigate("/requirement-details");
    } catch (error) {
      console.error("Request failed:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  

  const handleCancel = () => {
    navigate("/requirement-details");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 lg:ml-[300px] transition-all duration-300 lg:max-w-[calc(100%-300px)] sm:ml-[60px] sm:max-w-full">
        <div className="lg:p-6 sm:p-0">
          <div className="create-test-suite-container">
            <div className="create-test-suite-content">
              <div className="create-test-cases-header">
                <div className="flex flex-col">
                  <h2 className="create-test-cases-title">Create Requirement</h2>
                  {selectedProject ? (
                    <span className="project-name text-sm text-gray-600 mt-1">
                      Project: {selectedProject.name}
                    </span>
                  ) : (
                    <span className="project-name text-sm text-red-500 mt-1">
                      No project selected
                    </span>
                  )}
                </div>

                <div className="create-test-cases-button-group-right">
                  <button onClick={handleCancel} className="cancel-btn">
                   Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    className="create-btn"
                    disabled={isLoading || !selectedProject}
                  >
                    {isLoading ? "Creating..." : "Create"}
                  </button>
                </div>
              </div>

              {!selectedProject && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
                  <p className="text-yellow-700">
                    Please select a project from the sidebar before creating a requirement.
                  </p>
                </div>
              )}

              <form className="create-test-suite-form">
                <div className="create-test-suite-input-group">
                  <label className="create-test-suite-label">Name:*</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter requirement name"
                    className={`create-test-suite-input ${
                      errors.title ? "error-border" : ""
                    }`}
                    disabled={!selectedProject}
                  />
                  {errors.title && <p className="error-message">{errors.title}</p>}
                </div>

                <div className="create-test-suite-input-group">
                  <label className="create-test-suite-label">Description (Optional):</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter description"
                    className="create-test-suite-textarea"
                    disabled={!selectedProject}
                  />
                </div>

                <div className="create-test-suite-input-group">
                  <label className="create-test-suite-label">Select Type:*</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className={`create-test-suite-select ${
                      errors.type ? "error-border" : ""
                    }`}
                    disabled={!selectedProject}
                  >
                    <option value="">Select</option>
                    {requirementTypes.map((type) => (
                      <option key={type.id} value={type.type_name}>
                        {type.type_name}
                      </option>
                    ))}
                  </select>
                  {errors.type && <p className="error-message">{errors.type}</p>}
                </div>

                <div className="create-test-suite-date-row">
                  <div className="create-test-suite-date-group">
                    <label className="create-test-suite-label">Start Date:*</label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className={`create-test-suite-input ${
                        errors.startDate ? "error-border" : ""
                      }`}
                      disabled={!selectedProject}
                    />
                    {errors.startDate && <p className="error-message">{errors.startDate}</p>}
                  </div>
                  <div className="create-test-suite-date-group">
                    <label className="create-test-suite-label">Completion Date:*</label>
                    <input
                      type="date"
                      name="completionDate"
                      value={formData.completionDate}
                      onChange={handleInputChange}
                      className={`create-test-suite-input ${
                        errors.completionDate ? "error-border" : ""
                      }`}
                      disabled={!selectedProject}
                    />
                    {errors.completionDate && <p className="error-message">{errors.completionDate}</p>}
                  </div>
                </div>

                <div className="create-test-suite-input-group">
                  <label className="create-test-suite-label">Planned Automation Count</label>
                  <input
                    type="number"
                    name="labels"
                    value={formData.labels}
                    onChange={handleInputChange}
                    placeholder="Enter Planned Automation"
                    className={`create-test-suite-input ${
                      errors.labels ? "error-border" : ""
                    }`}
                    min="0"
                    disabled={!selectedProject}
                  />
                  {errors.labels && <p className="error-message">{errors.labels}</p>}
                </div>
                {errors.project && <p className="error-message">{errors.project}</p>}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Requirement;