
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../pages/CreateTestCases.css";
import MemberSidebar from "./MemberSidebar";

const MemberTestCases = () => {
  const [testcase_name, setTestcaseName] = useState("");
  const [testCaseType, setTestCaseType] = useState("");
  const [testCasePriority, setTestCasePriority] = useState("");
  const [errors, setErrors] = useState({ name: "", url: "", type: "", priority: "" });
//  const [isLoading, setIsLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [testCaseTypes, settestCaseTypes] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [, setError] = useState(null);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      navigate("/dashboard/login");
      return;
    }
    const savedProjectKey = `selectedProject_${userId}`;
    const savedProject = localStorage.getItem(savedProjectKey);

    if (savedProject) {
      setSelectedProject(JSON.parse(savedProject));
    } else {
      navigate("/dashboard-user");
    }

    const handleProjectChange = (event) => {
      const newProject = event.detail;
      setSelectedProject(newProject);
    };

    window.addEventListener("projectChanged", handleProjectChange);
    return () => window.removeEventListener("projectChanged", handleProjectChange);
  }, [navigate]);

  const validateFields = () => {
    const newErrors = {};
    let isValid = true;

    if (!testcase_name.trim()) {
      newErrors.name = "Test Case Name is required!";
      isValid = false;
    }

    if (!testCaseType.trim()) {
      newErrors.type = "Test Case Type is required!";
      isValid = false;
    }

    if (!testCasePriority.trim()) {
      newErrors.priority = "Test Case Priority is required!";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleNextClick = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    if (!validateFields()) return;
    setIsLoading(true);

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/integrate/testcase/?user_id=${userId}&project_name=${selectedProject.project_name}&testcase_name=${encodeURIComponent(testcase_name)}`,
        {
          headers: { "Content-Type": "application/json" }
        }
      );

      if (response.ok) {
        if (response.status === 200) {
          setShowModal(true);
          return;
        }
      } else {
        if (response.status === 404) {
          setShowModal(true);
          return;
        }
        throw new Error("Failed to check existing test cases");
      }

      const data = await response.json();
      const existingTestCase = data.testcase;

      if (
        existingTestCase &&
        existingTestCase.testcase_name.toLowerCase() === testcase_name.toLowerCase()
      ) {
        console.log("✅ Match found — setting error");
        setErrors((prev) => ({
          ...prev,
          testcase_name: "A test case with this name already exists. Please use a different name.",
        }));
        return;
      }

    } catch (error) {
      console.error("Error checking test case name:", error);
      alert("Error checking test case name. Please try again.");
      setIsLoading(false);

    }
  };


  const handleOptionClick = (option) => {
    const route = option === "write" ? "/member-write-testcase" : "/member-record";
    navigate(route, {
      state: {
        testCaseInfo: {
          testcase_name,
          testcase_type: testCaseType,
          testcase_priority: testCasePriority,
          projectId: selectedProject.project_name
        }
      }
    });
  };

  const handleCancel = () => {
    navigate("/dashboard-user");
  };

  useEffect(() => {
    const fetchTestCaseTypes = async () => {
      if (!selectedProject?.project_name) {
        return;
      }
      setError(null);
  
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/testcase-types/?project_name=${selectedProject?.project_name}`,
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
        console.log("Fetched Test Case Types:", data);
        settestCaseTypes(data); 
      } catch (error) {
        setError(error.message || "Failed to fetch test case types");
      }
    };
  
    fetchTestCaseTypes();
  }, [selectedProject]);
  
  useEffect(() => {
    const fetchPriorities = async () => {
      if (!selectedProject?.project_name) {
        return;
      }
      setError(null);
  
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/testcase-priorities/?project_name=${selectedProject.project_name}`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch test case priorities");
        }
  
        const data = await response.json();
        console.log("Fetched Priorities:", data);
        setPriorities(data); 
      } catch (error) {
        setError(error.message || "Failed to fetch test case priorities");
      }
    };
  
    fetchPriorities();
  }, [selectedProject]);
  

  return (
    <div>
      <MemberSidebar />
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 lg:ml-[300px] transition-all duration-300 lg:max-w-[calc(100%-300px)] sm:ml-[60px] sm:max-w-full">
          <div className="lg:p-6 sm:p-0">
            <div className="create-test-cases-page-container">
              <div className="create-test-cases-wrapper">
                <div className="create-test-cases-container">
                  <div className="create-test-cases-header">
                    <div className="flex flex-col">
                      <h2 className="create-test-cases-title">Create Test Cases</h2>
                      {selectedProject && (
                        <span className="project-name text-sm text-gray-600 mt-1">
                          {/* Project: {selectedProject.name} */}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="create-test-cases-input-container">
                    <label className="block text-sm font-medium mb-2">
                      Name<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={testcase_name}
                      onChange={(e) => {
                        setTestcaseName(e.target.value);
                        setErrors((prev) => ({ ...prev, name: "" }));
                      }}
                      placeholder="Enter test case name"
                      className={`create-project-input ${
                        errors.testcase_name ? "border-red-500" : "border-gray-300"
                      } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                      disabled={!selectedProject}
                    />
                    {errors.testcase_name && (
                      <span className="text-red-500 text-sm mt-1">{errors.testcase_name}</span>
                    )}
                  </div>
    
                  <div className="create-test-cases-input-container">
                      <label className="block text-sm font-medium mb-2">
                        Test Case Type<span className="text-red-500">*</span>
                      </label>
                      <select
                        value={testCaseType}
                        
                        onChange={(e) => {
                          console.log("User Selected Test Case Type:", e.target.value);
                          setTestCaseType(e.target.value);
                          setErrors((prev) => ({ ...prev, type: "" }));
                        }}
                        className={`create-project-input ${
                          errors.type ? "border-red-500" : "border-gray-300"
                        } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                        disabled={!selectedProject}
                      >
                        <option value="">Select Type</option>
                        {testCaseTypes.map((type) => (
                          <option key={type.id} value={type.name}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                      {errors.type && (
                        <span className="text-red-500 text-sm mt-1">{errors.type}</span>
                      )}
                    </div>

                    <div className="create-test-cases-input-container">
                      <label className="block text-sm font-medium mb-2">
                        Test Case Priority<span className="text-red-500">*</span>
                      </label>
                      <select
                        value={testCasePriority}
                        onChange={(e) => {
                          console.log("User Selected Test Case Priority:", e.target.value); 
                          setTestCasePriority(e.target.value);
                          setErrors((prev) => ({ ...prev, priority: "" }));
                        }}
                        className={`create-project-input ${
                          errors.priority ? "border-red-500" : "border-gray-300"
                        } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                        disabled={!selectedProject}
                      >
                        <option value="">Select Priority</option>
                        {priorities.map((priority) => (
                          <option key={priority.id} value={priority.priority_level}>
                            {priority.priority_level}
                          </option>
                        ))}
                      </select>
                      {errors.priority && (
                        <span className="text-red-500 text-sm mt-1">{errors.priority}</span>
                      )}
                    </div>

    
                    <div className="create-test-cases-button-group">

                      <button onClick={handleCancel} className="cancel-btn">
                        Cancel
                      </button>

                      <button
                        onClick={handleNextClick}
                        className="create-test-cases-btn-manual bg-purple-600"
                        disabled={isLoading}
                      >
                        {isLoading ? "Loading..." : "Next"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {showModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h3 className="modal-title">Choose an option</h3>
                <p className="modal-desc">How do you want to create the test steps?</p>
                <div className="modal-buttons">
                  <button
                    onClick={() => handleOptionClick("write")}
                    className="modal-btn bg-purple-500 hover:bg-purple-600 text-white"
                  >
                    Write Manually
                  </button>
                  <button
                    onClick={() => handleOptionClick("record")}
                    className="modal-btn bg-purple-100 hover:bg-purple-200 text-purple-700"
                  >
                    Record
                  </button>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setIsLoading(false); 
                  }}
                  className="modal-close text-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div> 
    </div> 
    );
  };
  
  export default MemberTestCases;
  

