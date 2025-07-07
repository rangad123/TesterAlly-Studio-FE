import React, { useState, useEffect, useCallback } from "react";
import AddStep from "./AddStep";
import { useLocation, useNavigate } from "react-router-dom";
import { Save, X, Edit2, Trash2, Plus, ArrowLeft, Play, CheckSquare, RefreshCw, Eye, EyeOff } from "lucide-react";
//import TestEnvironmentModal from "./TestEnvironmentConfig";

const TestSteps = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { testCaseId, testCaseName, projectName } = location.state || {};
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingStep, setEditingStep] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [activeTab, setActiveTab] = useState("testSteps");
  const [testCase, setTestCase] = useState(null);
  const [editingTestCase, setEditingTestCase] = useState(null);
  const [testCaseTypes, setTestCaseTypes] = useState([]);
  const [testCasePriorities, setTestCasePriorities] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSteps, setSelectedSteps] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false); // FIXED: Added setIsExecuting
  const [executionResults, setExecutionResults] = useState({});
  const [hoveredStep, setHoveredStep] = useState(null);
  const [deletingStepId, setDeletingStepId] = useState(null);
  const [updatingStepId, setUpdatingStepId] = useState(null);
  const [showRunInstructions, setShowRunInstructions] = useState(false);
  const [waitTime, setWaitTime] = useState("");
  const [otpStepIndexInput, setOtpStepIndexInput] = useState("");
  const [showDeviceModal, setShowDeviceModal] = useState(false);

//  const [elementData, setElementData] = useState(null);
//  const [isEnvironmentModalOpen, setIsEnvironmentModalOpen] = useState(false);

  const apiBaseUrl = "http://127.0.0.1:8000/api";

  const [detectedOtpSteps, setDetectedOtpSteps] = useState([]);
  const [testData, setTestData] = useState({});
  const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editedEmail, setEditedEmail] = useState("");
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [otpReceiver, setOtpReceiver] = useState('');
  const [otpReceiverError, setOtpReceiverError] = useState('');
  const [editedPassword, setEditedPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showSenderEmailField, setShowSenderEmailField] = useState(false);
  const [senderEmail, setSenderEmail] = useState('');


  useEffect(() => {
    const otpSteps = steps.filter((step) => containsOtpPlaceholder(
      step.step_description || step.description || step.command || ''
    ));

    // console.log("OTP Steps found:", otpSteps);
    setDetectedOtpSteps(otpSteps);

    if (otpSteps.length > 0) {
      const otpStep = otpSteps[0];

      setOtpStepIndexInput(otpStep.step_number.toString());
      // console.log("Showing OTP Step Number (UI):", otpStep.step_number.toString());

      // const backendOtpIndex = otpStep.step_number - 1;
      // console.log("Sending OTP Step Index (Backend):", backendOtpIndex);
    }
  }, [steps]);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const projectKey = `selectedProject_${userId}`;
    const selectedProject = JSON.parse(localStorage.getItem(projectKey));

    if (selectedProject?.id) {
      // setIsTestDataLoading(true);
      fetch(`http://127.0.0.1:8000/api/testdata/${selectedProject.id}/`)
        .then((res) => res.json())
        .then((data) => {
          console.log("✅ Test data loaded in parent:", data);
          setTestData(data);
        })
        .catch((err) => {
          console.warn("⚠️ Error fetching test data in parent:", err.message);
          setTestData(null);
        })
        // .finally(() => setIsTestDataLoading(false));
    }
  }, []);

  const fetchTestCase = useCallback(async (testcaseName, projectName) => {
    try {
      const userId = localStorage.getItem("userId");
      const response = await fetch(
        `http://127.0.0.1:8000/integrate/testcase/?user_id=${userId}&project_name=${projectName}&testcase_name=${testcaseName}`
      );
      if (!response.ok) throw new Error("Failed to fetch test case");
      const data = await response.json();
      console.log("Testcase response :",data)
      setTestCase(data.testcase);
    } catch (err) {
      console.error("Error fetching test case:", err);
      setError("Failed to fetch test case details");
    }
  }, []);

  const fetchTestCaseMetadata = useCallback(async () => {
    try {
      const [typesResponse, prioritiesResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/testcase-types/?project_id=${location.state.projectId}`),
        fetch(`${apiBaseUrl}/testcase-priorities/?project_id=${location.state.projectId}`)
      ]);

      const typesData = await typesResponse.json();
      const prioritiesData = await prioritiesResponse.json();

      setTestCaseTypes(typesData);
      setTestCasePriorities(prioritiesData);
    } catch (err) {
      console.error("Error fetching metadata:", err);
      setError("Failed to fetch test case metadata");
    }
  }, [location.state.projectId]);

  useEffect(() => {
    if (activeTab === "testCaseInfo" && testCaseName && projectName) {
      fetchTestCase(testCaseName, projectName);
      fetchTestCaseMetadata();
    }
  }, [activeTab, fetchTestCase, fetchTestCaseMetadata, testCaseName, projectName]);


  const handleEditTestCase = () => {
    setIsEditing(true);
    setEditingTestCase({
      name: testCase.testcase_name,
      type: testCase.testcase_type,
      priority: testCase.testcase_priority,
    });
  };

const handleUpdateTestCase = async () => {
  try {
    const userId = localStorage.getItem("userId");
    
    const response = await fetch(
      `http://127.0.0.1:8000/integrate/testcase/`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          project_name: projectName,
          testcase_name: testCaseName, 
          new_testcase_name: editingTestCase.name, 
          testcase_type: editingTestCase.type,
          testcase_priority: editingTestCase.priority
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Update failed:", errorData);
      throw new Error(errorData.message || "Failed to update test case");
    }
    
    setTestCase(prev => ({
      ...prev,
      testcase_name: editingTestCase.name,
      testcase_type: editingTestCase.type,
      testcase_priority: editingTestCase.priority
    }));

    setIsEditing(false);
    setEditingTestCase(null);

  } catch (err) {
    console.error("Error updating test case:", err);
    setError("Failed to update test case: " + err.message);
  }
};

  const handleDeleteTestCase = async () => {
    if (!window.confirm("Are you sure you want to delete this test case?")) return;

    try {
      const response = await fetch(
        `${apiBaseUrl}/testcases/${testCaseId}/?project_id=${location.state.projectId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) throw new Error("Failed to delete test case");
      
      navigate("/test-cases");
    } catch (err) {
      console.error("Error deleting test case:", err);
      setError("Failed to delete test case");
    }
  };

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
        JSON.parse(savedProject);
      } catch (err) {
        console.error("Error parsing saved project:", err);
        localStorage.removeItem(savedProjectKey);
      }
    }

    const handleProjectChange = () => {
      
      navigate("/test-cases");
    };

    window.addEventListener("projectChanged", handleProjectChange);
    return () => window.removeEventListener("projectChanged", handleProjectChange);
  }, [navigate]); 

  useEffect(() => {
    if (!testCaseId) {
      navigate("/test-cases");
    }
  }, [testCaseId, testCaseName, navigate]); 

  const fetchSteps = useCallback(async (testcaseName, projectName) => {
    const userId = localStorage.getItem("userId");

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://127.0.0.1:8000/integrate/teststep/?user_id=${userId}&project_name=${projectName}&testcase_name=${testcaseName}`);
      if (!response.ok) throw new Error('Failed to fetch test steps');
      const data = await response.json();
      console.log("Test Step Response:", data.steps);
      setSteps(data.steps); // Use the 'steps' array from API response
    } catch (err) {
      setError(err.message);
      console.error("Error fetching steps:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleWaitConfirmation = (waitCommand, requestData) => {
    if (editingStep) {
      // Update the editValue when editing a step
      setEditValue(waitCommand);
      // Close the modal
      addStepComponent.handleWaitConfirm(waitCommand, requestData);
      // Automatically update the step
      handleUpdateStep(editingStep);
    } else {
      // Let the AddStep component handle new steps
      addStepComponent.handleWaitConfirm(waitCommand, requestData);
    }
  };

  const resetEditState = () => {
    setEditingStep(null);
  }

  const updateEditValue = (newValue) => {
    setEditValue(newValue);
  };

  const addStepComponent = AddStep({
    testCaseId,
    testCaseName,        
    projectName,
    steps,
    fetchSteps,
    apiBaseUrl,
    hoveredStep,
    isExecuting,
    executionResults,
    setHoveredStep,
    resetEditState,
    updateEditValue
  });

  const handleViewExecutionScreenshot = (screenshot) => {
    addStepComponent.handleExpandScreenshot(screenshot);
  };

  useEffect(() => {
    if (testCaseName && projectName ) {
      fetchSteps(testCaseName, projectName);
    }
  }, [testCaseName, projectName, fetchSteps]);

const handleDeleteStep = async (stepNumber) => {
  if (!window.confirm("Are you sure you want to delete this step?")) return;
  setError(null);
  setDeletingStepId(stepNumber);
  const userId = localStorage.getItem("userId");

  try {
    console.log("Deleting step with data:", {
      user_id: userId,
      project_name: projectName,
      testcase_name: testCaseName,
      step_number: stepNumber
    });
    
    // Step 1: Delete the step
    const deleteResponse = await fetch("http://127.0.0.1:8000/integrate/teststep/", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId, 
        project_name: projectName,
        testcase_name: testCaseName,
        step_number: stepNumber
      })
    });

    if (!deleteResponse.ok) {
      const errorData = await deleteResponse.json();
      console.error("Delete failed:", errorData);
      throw new Error("Failed to delete step");
    }

    // // Step 2: Get the remaining steps and reorder them
    // const remainingSteps = steps
    //   .filter(step => step.step_number !== stepNumber)
    //   .sort((a, b) => a.step_number - b.step_number);

    // // Step 3: Update step numbers sequentially
    // for (let i = 0; i < remainingSteps.length; i++) {
    //   const step = remainingSteps[i];
    //   const newStepNumber = i + 1;
      
    //   // Only update if the step number needs to change
    //   if (step.step_number !== newStepNumber) {
    //     console.log(`Updating step ${step.step_number} to ${newStepNumber}`);
        
    //     const updateResponse = await fetch("http://127.0.0.1:8000/integrate/teststep/", {
    //       method: "PUT",
    //       headers: { "Content-Type": "application/json" },
    //       body: JSON.stringify({
    //         user_id: userId,
    //         project_name: projectName,
    //         testcase_name: testCaseName,
    //         step_number: newStepNumber,
    //         step_description: step.step_description,
    //         step_coordinates: step.step_coordinates || { click_x: 0, click_y: 0 },
    //         old_step_number: step.step_number // Add this to help backend identify which step to update
    //       })
    //     });

    //     if (!updateResponse.ok) {
    //       const errorText = await updateResponse.text();
    //       console.error(`Failed to update step ${step.step_number} to ${newStepNumber}:`, errorText);
    //       throw new Error(`Failed to update step numbers: ${errorText}`);
    //     }
    //   }
    // }

    // Step 4: Refresh the steps to show updated data
    await fetchSteps(testCaseName, projectName);

  } catch (err) {
    setError("Error deleting step. Please try again.");
    console.error("Delete operation failed:", err);
  } finally {
    setDeletingStepId(null);
  }
};

  const startEditing = (step) => {

    if (step.step_description.includes("<otp>")) {
      alert("OTP steps cannot be edited to maintain test integrity.");
      return;
    }

    setEditingStep(step.step_number);
    setEditValue(step.step_description);
    
    // Important: Clear any previous suggestions first
    addStepComponent.clearSuggestions();
    
    // Small delay to ensure state is updated before requesting suggestions
    setTimeout(() => {
      const words = step.step_description.trim().split(' ');
      const command = words[0].toLowerCase();
      
      if (['click', 'type', 'verify', 'get', 'wait'].includes(command)) {
        // This triggers the suggestion system
        addStepComponent.handleEditCommandInput(step.step_number, step.step_description, command);
      }
    }, 100);
  };

const containsOtpPlaceholder = (text) => { 
  if (!text) return false;
  return text.includes('<otp>') || text.toLowerCase().includes('<otp>');
};

  const handleUpdateStep = async (stepNumber) => {
    setUpdatingStepId(stepNumber);
    const userId = localStorage.getItem("userId");

    try {
      const step = steps.find(s => s.step_number === stepNumber);
      if (!step) return;

      // Get existing coordinates or use selected element coordinates if available
      let coordinates = step.step_coordinates || { click_x: 0, click_y: 0 };
      
      // If a new element was selected during editing, use its coordinates
      if (addStepComponent.selectedElement) {
        if (addStepComponent.selectedElement.click_point && Array.isArray(addStepComponent.selectedElement.click_point)) {
          coordinates = {
            click_x: addStepComponent.selectedElement.click_point[0],
            click_y: addStepComponent.selectedElement.click_point[1]
          };
        } else if (addStepComponent.selectedElement.coordinates) {
          if (Array.isArray(addStepComponent.selectedElement.coordinates)) {
            coordinates = {
              click_x: addStepComponent.selectedElement.coordinates[0],
              click_y: addStepComponent.selectedElement.coordinates[1]
            };
          } else {
            coordinates = {
              click_x: addStepComponent.selectedElement.coordinates.x || addStepComponent.selectedElement.coordinates.click_x || 0,
              click_y: addStepComponent.selectedElement.coordinates.y || addStepComponent.selectedElement.coordinates.click_y || 0
            };
          }
        }
      }

      // Make sure we're using the full wait command, not just "wait"
      const stepDescription = editValue;

      const otpState = addStepComponent.getOtpState();

      const actionType = stepDescription.trim().split(' ')[0].toLowerCase();

      if (otpState.requiresOtp && actionType === 'type') {
        const emailInStep = stepDescription.match(/\S+@\S+\.\S+/);
        const selectedContact = otpState.enteredContact?.trim();

        // Check only if selected contact is an email
        if (emailInStep && selectedContact && /\S+@\S+\.\S+/.test(selectedContact)) {
          const selectedEmail = selectedContact;
          const emailTyped = emailInStep[0].trim();

          if (emailTyped !== selectedEmail) {
            alert(`For OTP verification, please use the selected email: ${selectedEmail}`);
            setUpdatingStepId(null);
            return;
          }
        }
      }

      const requestBody = {
        user_id: userId,  
        project_name: projectName,  
        testcase_name: testCaseName, 
        step_number: step.step_number,
        step_description: stepDescription,
        step_coordinates: coordinates,
        requires_otp: containsOtpPlaceholder(stepDescription) ? true : (otpState.otpPlaceholderUsed ? false : (otpState.requiresOtp || false)),
        otp_type: otpState.requiresOtp && otpState.enteredContact 
          ? (/\S+@\S+\.\S+/.test(otpState.enteredContact) ? 'email' : 'phone') 
          : null
      };

      console.log("🟦 PUT request body to /integrate/teststep/:", requestBody);


      const response = await fetch("http://127.0.0.1:8000/integrate/teststep/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,  
          project_name: projectName,  
          testcase_name: testCaseName, 
          step_number: step.step_number,
          step_description: stepDescription,
          step_coordinates: coordinates,
          requires_otp: otpState.requiresOtp || false,
          otp_type: otpState.requiresOtp && otpState.enteredContact ? 
            (/\S+@\S+\.\S+/.test(otpState.enteredContact) ? 'email' : 'phone') : 
            null
        })
      });

      if (!response.ok) {
        throw new Error("Failed to update step");
      }

      // Refresh steps to show updated data
      await fetchSteps(testCaseName, projectName); 

      setEditingStep(null);
      addStepComponent.clearSuggestions();
    } catch (error) {
      console.error("Error updating step:", error);
    } finally {
      setUpdatingStepId(null);
    }
  };

  const cancelEdit = () => {
    setEditingStep(null);
    setEditValue("");
    addStepComponent.clearSuggestions();
  };

  const handleRunSteps = () => {

    const hasEmailOtp = steps.some(step => step.otp_type === "email");
  
    if (hasEmailOtp) {
      setEditedEmail(testData?.email || "");
      setIsEditingEmail(false);
      setShowEmailVerificationModal(true);
      return;
    }
  
    // Just show the instructions modal, don't run tests yet
    setShowRunInstructions(true);
    
    // If no steps are selected, select all steps
    if (selectedSteps.length === 0) {
      const allStepIds = steps.map(step => step.id);
      setSelectedSteps(allStepIds);
    }
  };

  const handleEmailVerificationConfirm = () => {
    setShowEmailVerificationModal(false);
    setShowRunInstructions(true);
    
    // If no steps are selected, select all steps
    if (selectedSteps.length === 0) {
      const allStepIds = steps.map(step => step.id);
      setSelectedSteps(allStepIds);
    }
  };

  const handleSaveEmail = async () => {
    if (!editedEmail.trim()) {
      alert("Please enter a valid email address.");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editedEmail.trim())) {
      alert("Please enter a valid email format.");
      return;
    }

    if (!editedPassword.trim()) {
      alert("Please enter your email app password.");
      return;
    }

    setIsSavingEmail(true);
    try {
      const userId = localStorage.getItem("userId");
      const projectKey = `selectedProject_${userId}`;
      const selectedProject = JSON.parse(localStorage.getItem(projectKey));

      if (!selectedProject?.id) {
        alert("Project not found. Please select a project.");
        setIsSavingEmail(false);
        return;
      }

      // Create payload similar to your existing API structure
      const payload = {
        url: testData?.url || null,
        email: editedEmail.trim(),
        email_app_password: editedPassword.trim(),
        phone_number: testData?.phone_number || null,
        region: testData?.region || null
      };

      console.log("Saving email payload:", payload);

      const response = await fetch(
        `http://127.0.0.1:8000/api/testdata/${selectedProject.id}/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to save email: ${response.status}`);
      }

      const data = await response.json();
      console.log("Email saved successfully:", data);
      
      // Update local testData state
      setTestData(prev => ({
        ...prev,
        email: editedEmail.trim(),
        email_app_password: editedPassword.trim()
      }));
      
      setIsEditingEmail(false);
      alert("Email saved successfully!");
      
    } catch (error) {
      console.error("Error saving email:", error);
      alert(`Error saving email: ${error.message}`);
    } finally {
      setIsSavingEmail(false);
    }
  };

const calculateExecutionTime = (executedSteps) => {
  if (!executedSteps || executedSteps.length === 0) return "0s";
  // Simple calculation - you can modify this based on your actual timing data
  return `${executedSteps.length * 2}s`;
};

const checkAndroidConnection = async () => {
  try {
    const response = await fetch('http://localhost:8000/android/connection/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.status === "success";
    }
    return false;
  } catch (error) {
    console.error('Error checking Android connection:', error);
    return false;
  }
};

const handleModalOkClick = async () => {
  setShowRunInstructions(false);

  const userId = localStorage.getItem("userId");

  if (!userId || !projectName || !testCaseName) {
    alert("Missing required fields to run test case.");
    return;
  }

  setIsExecuting(true);
  setError(null);
  setExecutionResults({});

  try {
    const otpSteps = steps.filter((step) => containsOtpPlaceholder(step.step_description || step.command));
    // Find the actual array index of the OTP step
    const otpStepIndex = otpSteps.length > 0 ? steps.findIndex(step => step.step_number === otpSteps[0].step_number) : -1;
    // let otpStep = otpSteps.length > 0 ? otpSteps[0] : null;

    console.log("OTP Steps found:", otpSteps);
    console.log("First OTP Step Number (for backend):", otpStepIndex);

    // DEBUG: Log all steps and their OTP types
    // console.log("=== DEBUG: All Steps OTP Types ===");
    // steps.forEach((step, index) => {
    //   console.log(`Step ${step.step_number}: otp_type = "${step.otp_type}", requires_otp = ${step.requires_otp}`);
    // });
    // console.log("=== END DEBUG ===");

    // Check for OTP types
    const hasPhoneOtp = steps.some(step => step.otp_type === "phone");
    const hasEmailOtp = steps.some(step => step.otp_type === "email");

    // console.log("hasPhoneOtp:", hasPhoneOtp);
    // console.log("hasEmailOtp:", hasEmailOtp);

    let detectedOtpType = null;

    if (hasPhoneOtp) {
      detectedOtpType = "phone";
    } else if (hasEmailOtp) {
      detectedOtpType = "email";
    }

    console.log("detected Otp Type:", detectedOtpType);

    if (otpReceiver) {
      detectedOtpType = otpReceiver;
      console.log("OTP Type Overridden by User Choice:", detectedOtpType);
    }

    // Base payload
    let payloadToSend = {
      user_id: userId,
      project_name: projectName,
      testcase_name: testCaseName,
      wait_time: waitTime ? parseInt(waitTime) : 2,
    };

    // Only add OTP config if OTP type is detected
    if (detectedOtpType === "phone") {
      const isConnected = await checkAndroidConnection();
      if (!isConnected) {
        setShowDeviceModal(true);
        setIsExecuting(false);
        return;
      }
      // Find the first phone OTP step for index
      // const phoneOtpStep = steps.find(step => step.otp_type === "phone");
      // const otpStepIndex = steps.findIndex(step => step.step_number === phoneOtpStep.step_number);
      payloadToSend.otp_step_index = otpStepIndex;
      
      } else if (detectedOtpType === "email") {
      const isConnected = await checkAndroidConnection();
      if (!isConnected) {
        setShowDeviceModal(true);
        setIsExecuting(false);
        return;
      }
      if (!testData?.email) {
        alert("Please save email in test data for getting correct OTP");
        setIsExecuting(false);
        return;
      }
      
      // Find the first email OTP step for index
      // const emailOtpStep = steps.find(step => step.otp_type === "email");
      // const otpStepIndex = steps.findIndex(step => step.step_number === emailOtpStep.step_number);
      payloadToSend.otp_step_index = otpStepIndex;
      if (senderEmail.trim()) {
        payloadToSend.email_otp_config = {
          expected_sender: senderEmail.trim()
        };
      }
    }
    
    console.log("📤 Final Request Body:", JSON.stringify(payloadToSend, null, 2));

    const response = await fetch("http://127.0.0.1:8000/integrate/run_testcase/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payloadToSend) 
    });

    if (!response.ok) {
      throw new Error("Failed to run test case");
    }

    const result = await response.json();
    console.log("Test case run result:", result);

    // Process results regardless of success or failure
    let testRunSummary;
    
    if (result.status === "success" && result.executed_steps) {
      // Handle successful execution
      const newExecutionResults = {};

      result.executed_steps.forEach((executedStep) => {
        const step = steps.find(s => s.step_number === executedStep.step_number);
        if (step) {
          newExecutionResults[step.step_number] = {
            status: 'complete',
            message: executedStep.response.status,
            screenshot: executedStep.response.screenshot ? `http://127.0.0.1:8000${executedStep.response.screenshot}` : null,
            duration: null,
            url: executedStep.response.url || null,
            activeWindow: executedStep.response.active_window || null
          };
        }
      });

      setExecutionResults(newExecutionResults);

      // Create summary for successful execution
      testRunSummary = {
        execution_date: new Date().toISOString(),
        name: testCaseName,
        project_name: projectName,
        status: result.executed_steps.some(step => 
          step.response.status === 'error' || 
          step.response.status === 'timeout'
        ) ? "FAIL" : "PASS",
        total_steps: result.executed_steps.length,
        passed_steps: result.executed_steps.filter(step => 
          step.response.status === 'success' || 
          step.response.status !== 'error'
        ).length,
        failed_steps: result.executed_steps.filter(step => 
          step.response.status === 'error'
        ).length,
        execution_time: calculateExecutionTime(result.executed_steps),
        id: Date.now().toString(),
        error_message: null
      };

      alert(`Test case "${result.testcase_name}" executed successfully! ${result.executed_steps.length} steps completed.`);
      
    } else {
      // Handle failed execution
      setError(result.message || "Test execution failed");
      
      testRunSummary = {
        execution_date: new Date().toISOString(),
        name: testCaseName,
        project_name: projectName,
        status: "FAIL",
        total_steps: steps.length, // Use original steps count
        passed_steps: 0,
        failed_steps: steps.length,
        execution_time: "0s",
        id: Date.now().toString(),
        error_message: result.message || "Test execution failed"
      };

      alert("Test case execution failed. Please check the details.");
    }

    // Store results in localStorage (both pass and fail)
    const savedResults = JSON.parse(localStorage.getItem('testCaseResults') || '[]');
    savedResults.push(testRunSummary);
    const latestResults = savedResults.slice(-10); // Keep only last 10 results
    localStorage.setItem('testCaseResults', JSON.stringify(latestResults));

    // Call report API regardless of pass/fail
    try {
      const reportResponse = await fetch('http://127.0.0.1:8000/integrate/case_report/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          project_name: projectName,
          testcase_name: testCaseName  
        }),
      });

      if (reportResponse.ok) {
        const reportData = await reportResponse.json();
        console.log("Test report response:", reportData);
        // Optionally: display this report somewhere in UI
      } else {
        console.error("Failed to fetch test report.");
      }
    } catch (reportErr) {
      console.error("Error fetching test report:", reportErr);
    }

  } catch (error) {
    // Handle network/fetch errors
    console.error("Error running test case:", error);
    setError("An error occurred while running the test case: " + error.message);
    
    // Store error result in localStorage
    const testRunSummary = {
      execution_date: new Date().toISOString(),
      name: testCaseName,
      project_name: projectName,
      status: "FAIL",
      total_steps: steps.length,
      passed_steps: 0,
      failed_steps: steps.length,
      execution_time: "0s",
      id: Date.now().toString(),
      error_message: error.message
    };

    const savedResults = JSON.parse(localStorage.getItem('testCaseResults') || '[]');
    savedResults.push(testRunSummary);
    const latestResults = savedResults.slice(-10);
    localStorage.setItem('testCaseResults', JSON.stringify(latestResults));

    alert("An error occurred while running the test case.");
  } finally {
    setIsExecuting(false);
  }
};

  const handleModalCancelClick = () => {
    setShowRunInstructions(false);
  };

  const handleResetExecution = () => {
    setExecutionResults({});
  };

const handleStepSelection = (stepNumber) => {  
  setSelectedSteps(prev => 
    prev.includes(stepNumber) 
      ? prev.filter(num => num !== stepNumber)
      : [...prev, stepNumber]
  );
};

const selectAllSteps = () => {
  if (selectedSteps.length === steps.length) {
    setSelectedSteps([]);
  } else {
    setSelectedSteps(steps.map(step => step.step_number));
  }
};

  const renderTestCaseInfo = () => {
    if (!testCase) return <div>Loading test case details...</div>;

    if (isEditing) {
      return (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editingTestCase.name}
              onChange={(e) => setEditingTestCase(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Case Type<span className="text-red-500">*</span>
            </label>
            <select
              value={editingTestCase.type}
              onChange={(e) => setEditingTestCase(prev => ({ ...prev, type: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Select Type</option>
              {testCaseTypes.map((type) => (
                <option key={type.id} value={type.name}>{type.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Case Priority<span className="text-red-500">*</span>
            </label>
            <select
              value={editingTestCase.priority}
              onChange={(e) => setEditingTestCase(prev => ({ ...prev, priority: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Select Priority</option>
              {testCasePriorities.map((priority) => (
                <option key={priority.id} value={priority.priority_level}>
                  {priority.priority_level}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={handleUpdateTestCase}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditingTestCase(null);
              }}
              className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Test Case Details</h2>
          <div className="space-x-2">
            <button
              onClick={handleEditTestCase}
              className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
            >
              <Edit2 className="w-4 h-4 mr-1" />
              Edit
            </button>
            <button
              onClick={handleDeleteTestCase}
              className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </button>
          </div>
        </div>

        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500">Name</label>
            <p className="mt-1 text-lg text-gray-900">{testCase.testcase_name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Type</label>
            <p className="mt-1 text-lg text-gray-900">{testCase.testcase_type || "Not specified"}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Priority</label>
            <p className="mt-1 text-lg text-gray-900">{testCase.testcase_priority || "Not specified"}</p>
          </div>
        </div>
      </div>
    );
  };

  if (loading && !isExecuting) {
    return (
      <div className="flex-1 lg:ml-[300px] p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 lg:ml-[300px] transition-all duration-300 lg:max-w-[calc(100%-300px)] sm:ml-[60px] sm:max-w-full ">
      <div className="p-6">
        <button
          onClick={() => navigate("/test-cases")}
          className="mb-6 inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Test Cases
        </button>

        <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{testCaseName}</h1>

          <div className="flex space-x-2">
            {Object.keys(executionResults).length > 0 && (
              <button
                onClick={handleResetExecution}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </button>
            )}
            <button
              onClick={handleRunSteps}
              disabled={isExecuting || steps.length === 0}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              {isExecuting ? (
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Run Test
            </button>
          </div> 
        </div>

        {showRunInstructions && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium mb-2">Test Execution</h3>
              <p className="mb-4">Your test is now ready to run. The system will execute all selected steps in sequence.</p>

              <p className="mb-4">
                For best results, please set Google Chrome as your default browser before starting the test.
              </p>

              {/* Wait Time Input Field */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wait time between steps (in seconds)
                </label>
                <input
                  type="number"
                  value={waitTime}
                  onChange={(e) => setWaitTime(e.target.value)}
                  placeholder="e.g., 2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-purple-300"
                  min="0"
                />
              </div>

              {/* OTP Step Input (editable) */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-red-600 mb-1">
                  OTP Step Index (if applicable)
                </label>
                <input
                  type="number"
                  value={otpStepIndexInput}
                  onChange={(e) => setOtpStepIndexInput(e.target.value)}
                  placeholder="Detected step index with <otp>"
                  className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring focus:border-red-400"
                  min="1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Detected OTP steps: <strong>
                    {detectedOtpSteps.length > 0 
                      ? detectedOtpSteps.map(step => `Step ${step.step_number}`).join(', ')
                      : 'None'
                    }
                  </strong> (using first one: {otpStepIndexInput || 'None'})
                </p>
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-2">
                <button
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  onClick={handleModalCancelClick}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                  onClick={handleModalOkClick}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex border-b mb-4">
          <button onClick={() => setActiveTab("testSteps")} className={`px-4 py-2 ${activeTab === "testSteps" ? "border-b-2 border-purple-600" : "text-gray-500"}`}>Test Steps</button>
          <button onClick={() => setActiveTab("testCaseInfo")} className={`px-4 py-2 ${activeTab === "testCaseInfo" ? "border-b-2 border-purple-600" : "text-gray-500"}`}>Test Case Info</button>
        </div>

        {activeTab === "testSteps" ? (
          <>
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
              {error}
            </div>
          )}

          {/* ADDED: Execution loading indicator */}
          {isExecuting && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center">
                <div className="w-5 h-5 mr-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-blue-700 font-medium">Executing test case...</span>
              </div>
            </div>
          )}

          <div className="flex justify-end mb-2">
            <button
              onClick={selectAllSteps}
              className="inline-flex items-center text-sm text-gray-600 hover:text-purple-600"
              disabled={isExecuting || steps.length === 0}
            >
              {selectedSteps.length !== steps.length && steps.length > 0 && (
                <CheckSquare className="w-4 h-4 mr-1" />
              )}
              {selectedSteps.length === steps.length && steps.length > 0 ? 'Unselect All' : 'Select All'}
            </button>
          </div>

          <div className="space-y-3 ">
          {steps.map((step, index) => (
            <React.Fragment key={step.step_number}>
              <div
                className="relative flex items-center gap-4 bg-white border border-gray-200 rounded-lg p-4 transition-all duration-200"
                onMouseEnter={() => setHoveredStep(step.step_number)}
                onMouseLeave={() => setHoveredStep(null)}
              >
                {activeTab === "testSteps" && (
                  <input
                    type="checkbox"
                    checked={selectedSteps.includes(step.step_number)}
                    onChange={() => handleStepSelection(step.step_number)}
                    className="w-4 h-4 text-purple-600 rounded"
                    disabled={isExecuting}
                  />
                )}
                <span className="min-w-[60px] font-medium">#{step.step_number}</span>
                
                {editingStep === step.step_number ? (
                <div className="flex-1 flex items-center gap-2 relative">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setEditValue(newValue);
                      
                      const words = newValue.trim().split(' ');
                      const command = words[0].toLowerCase();
                      
                      console.log("Edit input changed:", newValue, "Command:", command);
                      
                      if (['click', 'type', 'verify', 'get', 'wait'].includes(command)) {
                        addStepComponent.handleEditCommandInput(step.step_number, newValue, command);
                      }
                    }}
                    className="flex-1 p-2 border border-gray-300 rounded-md"
                    autoFocus
                    data-step-id={step.step_number}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleUpdateStep(step.step_number);
                      } else if (e.key === 'Escape') {
                        cancelEdit();
                      }
                    }}
                  />
                  <button
                    onClick={() => handleUpdateStep(step.step_number)}
                    disabled={updatingStepId === step.step_number}
                    className="p-2 text-green-600 hover:text-green-700"
                  >
                    {updatingStepId === step.step_number ? (
                      <div className="px-3 py-1 bg-blue-100 text-blue-600 rounded-md flex items-center">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                        Updating...
                      </div>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                        <polyline points="17 21 17 13 7 13 7 21" />
                        <polyline points="7 3 7 8 15 8" />
                      </svg>
                    )}
                  </button>

                  <button
                    onClick={cancelEdit}
                    className="p-2 text-gray-600 hover:text-gray-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                  
                  {/* This is the critical part - it must be positioned correctly */}
                  <div className="absolute w-full left-0 top-full z-50">
                    {addStepComponent.renderEditSuggestions(step.step_number, setEditValue)}
                  </div>
                </div>
                ) : (
                  <>
                    <div 
                      className={`flex-1 text-gray-700 break-words whitespace-pre-wrap overflow-hidden ${
                        step.step_description.includes("<otp>") ? 'bg-orange-50 border-l-4 border-orange-400 pl-2' : ''
                      }`}
                      onDoubleClick={() => startEditing(step)}
                    >
                      {step.step_description}
                      {step.step_description.includes("<otp>") && (
                        <span className="ml-2 text-xs text-orange-600 font-medium">(OTP - Protected)</span>
                      )}
                      {executionResults[step.step_number] && (
                        <div className={`mt-2 text-sm p-2 rounded ${
                          executionResults[step.step_number].status === 'running' ? 'bg-yellow-50 text-yellow-700' : 
                          executionResults[step.step_number].status === 'complete' ? 'bg-green-50 text-green-700' : 
                          executionResults[step.step_number].status === 'error' ? 'bg-red-50 text-red-700' : ''
                        }`}>
                          {executionResults[step.step_number].status === 'running' ? (
                            <div className="flex items-center">
                              <div className="w-4 h-4 mr-2 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                              Running: {executionResults[step.step_number].message || 'Executing step...'}
                            </div>
                          ) : executionResults[step.step_number].status === 'complete' ? (
                            <div>
                              <div className="flex items-center">
                                <span className="mr-2">✓</span>
                                {executionResults[step.step_number].message === 'timeout' ? (
                                  <span className="text-yellow-700">Executed, but the condition was <strong>not met</strong> (timeout)</span>
                                ) : (
                                  <span className="text-green-700">Executed successfully {executionResults[step.step_number].duration ? `(${executionResults[step.id].duration})` : ''}</span>
                                )}
                              </div>
                              {/* Countdown display */}
                              {executionResults[step.step_number].countdown !== undefined && (
                                <div className="mt-2 text-yellow-700 bg-yellow-50 p-2 rounded">
                                  Waiting for next step: {executionResults[step.step_number].countdown} seconds
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <span className="mr-2">✗</span> 
                              Failed: {executionResults[step.step_number].error || 'Unknown error'}
                            </div>
                          )}
                        </div>
                      )}
                      {executionResults[step.step_number] && executionResults[step.step_number].screenshot && (
                        <div className="mt-2">
                          <img 
                            src={executionResults[step.step_number].screenshot} 
                            alt="Execution result" 
                            className="w-full max-h-40 object-contain mt-2 border border-gray-200 rounded-md cursor-pointer"
                            onClick={() => handleViewExecutionScreenshot(executionResults[step.step_number].screenshot)}
                          />
                        </div>
                      )}
                    </div>
                    {!isExecuting && !executionResults[step.step_number] && (
                      <div className="flex gap-2">
                        {addStepComponent.insertingAfterStep !== step.step_number && (
                          <button
                            onClick={() => addStepComponent.setInsertingAfterStep(step.step_number)}
                            className="p-2 text-purple-600 hover:text-purple-700"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteStep(step.step_number)}
                          disabled={deletingStepId === step.step_number}
                          className="p-2 text-red-600 hover:text-red-700"
                        >
                          {deletingStepId === step.step_number ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </>
                )}

                {addStepComponent.renderStepActions(step)}
              </div>
              
              {/* This is where we render the step content BELOW the step */}
              {addStepComponent.renderStepContent(step)}
            </React.Fragment>
          ))}
          </div>
        </>
      ) : (
        renderTestCaseInfo()
      )}

          {showDeviceModal && (
            <div style={{
              position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
              backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', zIndex: 1000
            }}>
              <div style={{
                backgroundColor: '#fff', padding: 20, borderRadius: 8,
                maxWidth: 400, width: '90%', textAlign: 'center'
              }}>
                <h3>Connect Device</h3>
                <p>Please connect your Android device via USB and enable USB debugging.</p>
                <button
                  style={{ marginTop: 10 }}
                  onClick={() => setShowDeviceModal(false)}
                >
                  OK
                </button>
              </div>
            </div>
          )}

          {showEmailVerificationModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4 text-purple-600">
                  Email Verification Required
                </h3>

                <div className="space-y-4">
                  {/* Email Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Your Email:
                    </label>
                    {isEditingEmail ? (
                      <>
                        <input
                          type="email"
                          value={editedEmail}
                          onChange={(e) => setEditedEmail(e.target.value)}
                          placeholder="Enter email address"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                        />

                        <div className="relative mt-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email App Password:
                          </label>
                          <input
                            type={showPassword ? "text" : "password"}
                            value={editedPassword}
                            onChange={(e) => setEditedPassword(e.target.value)}
                            placeholder="Enter email app password"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute right-3 top-10 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                          >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                        <span className="text-gray-700">
                          {testData?.email || "No email added"}
                        </span>
                        <button
                          onClick={() => {
                            setIsEditingEmail(true);
                            setEditedEmail(testData?.email || "");
                            setEditedPassword(testData?.email_app_password || "");
                          }}
                          className="text-purple-600 text-sm hover:text-purple-800"
                        >
                          {testData?.email ? "Edit" : "Add"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* OTP Receiver */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Where will you receive OTP?{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="flex space-x-4">
                      <button
                        onClick={() => {
                          setOtpReceiver("email");
                          setOtpReceiverError("");
                        }}
                        className={`flex-1 px-4 py-2 rounded-md text-center font-medium ${
                          otpReceiver === "email"
                            ? "bg-purple-600 text-white"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        Email
                      </button>
                      <button
                        onClick={() => {
                          setOtpReceiver("phone");
                          setOtpReceiverError("");
                        }}
                        className={`flex-1 px-4 py-2 rounded-md text-center font-medium ${
                          otpReceiver === "phone"
                            ? "bg-purple-600 text-white"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        Phone Number
                      </button>
                    </div>
                    {otpReceiverError && (
                      <p className="text-red-500 text-sm mt-2">{otpReceiverError}</p>
                    )}
                  </div>

                  {/* Sender Email Option */}
                  <div className="mt-4">
                    <button
                      onClick={() => setShowSenderEmailField(prev => !prev)}
                      className="text-purple-600 text-sm hover:text-purple-800"
                    >
                      {showSenderEmailField ? "Hide Sender Email Field" : "Add Sender Email (Optional)"}
                    </button>

                    {showSenderEmailField && (
                      <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sender Email for OTP (Optional):
                        </label>
                        <input
                          type="email"
                          value={senderEmail}
                          onChange={(e) => setSenderEmail(e.target.value)}
                          placeholder="e.g., no-reply@example.com"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                        />
                      </div>
                    )}
                  </div>

                  <div className="bg-purple-50 p-3 rounded-md">
                    <p className="text-sm text-purple-700">
                      <strong>Note:</strong> The OTP will be sent to the selected method.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 mt-6">
                  <button
                    onClick={() => {
                      setShowEmailVerificationModal(false);
                      setIsEditingEmail(false);
                      setOtpReceiver("");
                      setOtpReceiverError("");
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  {isEditingEmail ? (
                    <button
                      onClick={handleSaveEmail}
                      disabled={!editedEmail.trim() || !editedPassword.trim()}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
                    >
                      {isSavingEmail ? "Saving..." : "Save"}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (!otpReceiver) {
                          setOtpReceiverError(
                            "Please select where you want to receive OTP"
                          );
                          return;
                        }
                        handleEmailVerificationConfirm();
                      }}
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                      disabled={!testData?.email}
                    >
                      Continue
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <addStepComponent.BrowserTabsModal />
          <addStepComponent.ScreenshotModal />
          <addStepComponent.InstructionsModal />
          <addStepComponent.WaitModal onWaitConfirm={handleWaitConfirmation} />
        </div>
      </div>
    </div>
  );
};

export default TestSteps;