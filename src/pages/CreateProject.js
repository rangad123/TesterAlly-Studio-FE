import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Globe, 
  Smartphone, 
  ServerCog,
  BarChart3
} from "lucide-react";
import "./CreateProject.css";

const CreateProject = ({ onProjectCreated }) => {
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [projectType, setProjectType] = useState("");
  const [showDescription, setShowDescription] = useState(false);
  const [errors, setErrors] = useState({ projectName: "", projectType: "" });
  const [userProjects, setUserProjects] = useState([]);
  const [isFetchingProjects, setIsFetchingProjects] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const projectTypes = [
    { value: "Web Application", icon: <Globe className="w-5 h-5" /> },
    { value: "Mobile Application", icon: <Smartphone className="w-5 h-5" /> },
    { value: "API Development", icon: <ServerCog className="w-5 h-5" /> },
    { value: "Data Analysis", icon: <BarChart3 className="w-5 h-5" /> }
  ];

  useEffect(() => {
    const fetchUserProjects = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        console.warn("No userId found in localStorage");
        setIsFetchingProjects(false);
        return;
      }

      try {
        const response = await fetch(
          `https://api.testerally.ai/api/projects/?user_id=${userId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch user projects");
        }
        const projects = await response.json();
        setUserProjects(projects);
      } catch (error) {
        console.error("Error fetching user projects:", error);
      } finally {
        setIsFetchingProjects(false);
      }
    };

    fetchUserProjects();
  }, []);

  const validateFields = () => {
    let isValid = true;
    const newErrors = { projectName: "", projectType: "" };

    if (!projectName.trim()) {
      newErrors.projectName = "Project Name is required!";
      isValid = false;
    } else if (userProjects.some((project) => project.name === projectName.trim())) {
      newErrors.projectName = "Project name already exists. Please choose a different name.";
      isValid = false;
    }

    if (!projectType || projectType === "Select Type") {
      newErrors.projectType = "Please select a valid Project Type!";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const fetchProjects = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.warn("No userId found in localStorage");
      return;
    }
  
    try {
      const response = await fetch(
        `https://api.testerally.ai/api/projects/?user_id=${userId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch user projects");
      }
      const projects = await response.json();
      setUserProjects(projects);
    } catch (error) {
      console.error("Error fetching user projects:", error);
    } finally {
      setIsFetchingProjects(false);
    }
  };


  useEffect(() => {
    fetchProjects();
  }, []); 

  const handleCreateProject = async () => {
    if (!validateFields()) return;
  
    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.warn("No userId found in localStorage");
      return;
    }
  
    const projectData = {
      user_id: parseInt(userId),
      name: projectName,
      description: description || "No description provided",
      project_type: projectType,
    };
  
    setIsLoading(true);
  
    try {
      const response = await fetch(
        "https://api.testerally.ai/api/projects/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(projectData),
        }
      );
  
      if (!response.ok) {
        const errorResponse = await response.json();
        console.error("Backend Error Response:", errorResponse);
        throw new Error(errorResponse.message || "Failed to create project");
      }
  
      const createdProject = await response.json();
      setUserProjects((prevProjects) => [...prevProjects, createdProject]);
  
      alert("Project Created Successfully");
      
      fetchProjects();
  
      navigate("/projects-list");
  
      if (onProjectCreated) {
        onProjectCreated(createdProject.name);
      }
  
      setProjectName("");
      setDescription("");
      setProjectType("");
      setShowDescription(false);
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Error creating project. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };  

  const handleCancel = () => {
    navigate("/dashboard-user");
  };

  const toggleDescription = () => {
    setShowDescription(!showDescription);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 transition-all duration-300 sm:ml-[60px] sm:max-w-full">
        <div className="p-6">
          <div className="create-project-container">
            <div className="create-project-box">
              <div className="create-test-cases-header sm:block">
                <h2 className="create-test-cases-title" style={{ fontSize: "28px", fontWeight: "bold" }}>
                  Create Project
                </h2>
                <div className="create-test-cases-button-group-right">
                  <button onClick={handleCancel} className="cancel-btn">
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateProject}
                    className="create-btn"
                    disabled={isLoading || isFetchingProjects}
                  >
                    {isLoading ? "Creating..." : "Create"}
                  </button>
                </div>
              </div>

              <div className="create-project-input-group">
                <label htmlFor="projectName" className="create-project-label">
                  Project Name<span className="create-project-required">*</span>
                </label>
                <input
                  id="projectName"
                  type="text"
                  autoComplete="off"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter your project name"
                  className={`create-project-input ${
                    errors.projectName ? "create-project-error-border" : ""
                  }`}
                />
                {errors.projectName && (
                  <span className="create-project-error">{errors.projectName}</span>
                )}
              </div>

              <div className="create-project-input-group">
                <label htmlFor="description" className="create-project-label">
                  Description<span className="create-project-optional">(optional)</span>
                </label>
                <button onClick={toggleDescription} className="create-project-toggle-btn">
                  {showDescription ? "Hide Description" : "Add Description"}
                </button>
                {showDescription && (
                  <textarea
                    id="description"
                    autoComplete="off"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter a brief description"
                    className="create-project-textarea"
                  />
                )}
              </div>

              <div className="create-project-input-group">
                <label htmlFor="projectType" className="create-project-label">
                  Project Type<span className="create-project-required">*</span>
                </label>
                <div className="relative">
                  <select
                    id="projectType"
                    value={projectType}
                    onChange={(e) => {
                      setProjectType(e.target.value);
                      setErrors((prevErrors) => ({ ...prevErrors, projectType: "" }));
                    }}
                    className={`create-project-select ${
                      errors.projectType ? "create-project-error-border" : ""
                    }`}
                  >
                    <option value="" disabled hidden>
                      Select Type
                    </option>
                    {projectTypes.map((type) => (
                      <option key={type.value} value={type.value} className="flex items-center gap-2">
                        {type.value}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    {projectType && projectTypes.find(type => type.value === projectType)?.icon}
                  </div>
                </div>
                {errors.projectType && (
                  <span className="create-project-error">{errors.projectType}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProject;
