import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Play, Plus, AlertCircle, CheckCircle, Clock, Target, Zap, Code, X, ThumbsUp, ThumbsDown, XCircle } from 'lucide-react';

function TestSenario() {
  const [promptText, setPromptText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [projectData, setProjectData] = useState(null);

  const [complexityLevel, setComplexityLevel] = useState("simple");
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isTestDataLoading, setIsTestDataLoading] = useState(false);

  const [scenarioName, setScenarioName] = useState('');
  // const [scenarioType, setScenarioType] = useState('');
  // const [scenarioPriority, setScenarioPriority] = useState('');

  const location = useLocation();
  const testCaseInfo = location.state?.testCaseInfo;

const [promptDrafts, setPromptDrafts] = useState([]);
const [showDrafts, setShowDrafts] = useState(false);

const [testUrl, setTestUrl] = useState('');
const [isEditingUrl, setIsEditingUrl] = useState(false);
const [tempUrl, setTempUrl] = useState('');
const [isSavingUrl, setIsSavingUrl] = useState(false);

const [isEnhancing, setIsEnhancing] = useState(false);
const [testResults, setTestResults] = useState(null);
const [showTestResults, setShowTestResults] = useState(false);
const [screenshotModal, setScreenshotModal] = useState({ isOpen: false, src: '', alt: '' });
const [isCreatingTestCase, setIsCreatingTestCase] = useState(false);

const [testFoundModalOpen, setTestFoundModalOpen] = useState(false);
const [foundTestData, setFoundTestData] = useState(null);
const [loadingModal, setLoadingModal] = useState({ isOpen: false, title: '', message: '' });
const [generatedTestFile, setGeneratedTestFile] = useState(null);

const [showFeedback, setShowFeedback] = useState(false);
const [feedbackGiven, setFeedbackGiven] = useState(null); 
const [retryCount, setRetryCount] = useState(0);

const [apiKey, setApiKey] = useState(null);  
const [gptVersion, setGptVersion] = useState(null);


const saveTestUrl = async () => {
  if (!projectData?.id || !tempUrl.trim()) return;
  
  // URL validation and formatting
  const formatAndValidateUrl = (url) => {
    let formattedUrl = url.trim();
    
    // Remove any existing protocol to standardize
    formattedUrl = formattedUrl.replace(/^https?:\/\//, '');
    
    // Check if it looks like a valid domain format
    const domainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.([a-zA-Z]{2,}|[a-zA-Z]{2,}\.[a-zA-Z]{2,})(\/.*)*/;
    const localhostPattern = /^(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/;
    
    if (!domainPattern.test(formattedUrl) && !localhostPattern.test(formattedUrl)) {
      throw new Error('Please enter a valid URL format (e.g., example.com, www.example.com)');
    }
    
    // Add https:// prefix
    return `https://${formattedUrl}`;
  };
  
  try {
    const validatedUrl = formatAndValidateUrl(tempUrl);
    
    setIsSavingUrl(true);
    const response = await fetch(`http://127.0.0.1:8000/api/testdata/${projectData.id}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: validatedUrl
      })
    });
    
    if (response.ok) {
      setTestUrl(validatedUrl);
      setIsEditingUrl(false);
      setTempUrl('');
      console.log('URL saved successfully:', validatedUrl);
    }
  } catch (error) {
    if (error.message.includes('valid URL format')) {
      alert(error.message);
    } else {
      console.error('Error saving URL:', error);
      alert('Failed to save URL');
    }
  } finally {
    setIsSavingUrl(false);
  }
};

const enhancePrompt = async () => {
  if (!promptText.trim()) {
    alert("Please enter a prompt first to enhance.");
    return;
  }

  setIsEnhancing(true);
  try {
    const response = await fetch('http://127.0.0.1:8000/AI/prompt-enhance/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: promptText
      })
    });

    if (!response.ok) {
      throw new Error('Failed to enhance prompt');
    }

    const data = await response.json();

    console.log("Enhanced_Prompt:", data)
    
    if (data.data && data.data.enhanced_prompt) {
      setPromptText(data.data.enhanced_prompt);
    } else {
      alert('No enhanced prompt received.');
    }
  } catch (error) {
    console.error('Error enhancing prompt:', error);
    alert('Failed to enhance prompt. Please try again.');
  } finally {
    setIsEnhancing(false);
  }
};

  useEffect(() => {
    if (testCaseInfo) {
      setScenarioName(testCaseInfo.testcase_name || '');
      // setScenarioType(testCaseInfo.testcase_type || '');
      // setScenarioPriority(testCaseInfo.testcase_priority || '');
    }
  }, [testCaseInfo]);

  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      navigate("/dashboard-user");
      return;
    }

    const savedProjectKey = `selectedProject_${userId}`;
    const savedProject = localStorage.getItem(savedProjectKey);

    if (savedProject) {
        try {
            const parsedProject = JSON.parse(savedProject);
            setProjectData(parsedProject);
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
    if (projectData?.id) {
      setIsTestDataLoading(true);
      fetch(`http://127.0.0.1:8000/api/testdata/${projectData.id}/`)
        .then((res) => res.json())
        .then((data) => {
          console.log("✅ Test data loaded:", data);
          setTestUrl(data?.url || '');
          setApiKey(data?.openai_api_key || null); 
          setGptVersion(data?.gpt_version || null);  
        })
        .catch((err) => {
          console.warn("⚠️ Error fetching test data:", err.message);
        })
        .finally(() => setIsTestDataLoading(false));
    }
  }, [projectData?.id]);

  const stopTestExecution = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/AI/test/stop/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        console.log('🛑 Stop signal sent');
          // Keep button disabled until backend responds
      }
    } catch (error) {
      console.error('Error stopping:', error);
    }
  };

  const handleTestFound = (testData) => {
    setFoundTestData(testData);
    setTestFoundModalOpen(true);
  };

  const runExistingTest = async (testFile) => {
    setLoadingModal({ isOpen: true, title: 'Running Test', message: 'Executing existing test file...' });
    setIsExtracting(true);
    
    try {

      const payload = { test_file: testFile };
      console.log("Request payload (object):", payload);
      console.log("Request payload (JSON):", JSON.stringify(payload));

      const response = await fetch('http://127.0.0.1:8000/AI/test/run-existing/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to run existing test');

      const data = await response.json();
      console.log("✅ API Response:", data);
      setTestResults(data);
      setShowTestResults(true);
      alert(`Test ${data.passed ? 'PASSED' : 'FAILED'}`);
      
    } catch (error) {
      console.error('Error running existing test:', error);
      alert('Failed to run test. Please try again.');
    } finally {
      setIsExtracting(false);
      setLoadingModal({ isOpen: false, title: '', message: '' });
      setTestFoundModalOpen(false);
    }
  };

  const runNewAutomation = async () => {
    const userId = localStorage.getItem("userId");
    setLoadingModal({ isOpen: true, title: 'Creating Automation', message: 'Recording new automation steps...' });
    setIsExtracting(true);
    
    try {
      const response = await fetch('http://127.0.0.1:8000/AI/test/run/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: testUrl,
          user_id: userId,
          prompt: promptText,
          scenarios_name: scenarioName,
          run_mode: "new",
          api_key: apiKey,         
          gpt_version: gptVersion 
        })
      });

      if (!response.ok) throw new Error('Failed to run new automation');

      const data = await response.json();
      console.log("✅ API Response:", data);
      setTestResults(data);
      setShowTestResults(true);
      setShowFeedback(true); 
      setFeedbackGiven(null);

      if (data.test_file_info) {
        setGeneratedTestFile(data.test_file_info);
      }
      alert('New automation completed successfully!');
      
    } catch (error) {
      console.error('Error running new automation:', error);
      alert('Failed to start automation. Please try again.');
    } finally {
      setIsExtracting(false);
      setLoadingModal({ isOpen: false, title: '', message: '' });
      setTestFoundModalOpen(false);
    }
  };

  const parseAction = (action, input) => {
    if (typeof action === "string" && input === undefined) {
      // old string parsing
      const match = action.match(/(\w+)\((.*)\)/);
      if (!match) return { type: action, details: {} };
      const type = match[1];
      const paramsStr = match[2];
      try {
        const jsonStr = paramsStr.replace(/'/g, '"');
        const details = JSON.parse(`{${jsonStr}}`);
        return { type, details };
      } catch {
        return { type, details: {} };
      }
    } else {
      // actual action object
      return { type: action, details: input || {} };
    }
  };

  const getActionInfo = (type, details, elementInfo) => {
    const actions = {
      navigate: {
        icon: Zap,
        label: `Navigated to: ${details.url}`,
        color: 'bg-blue-100 text-blue-600'
      },
      click: {
        icon: Play,
        label: `Clicked on ${elementInfo?.ariaLabel || details?.element_ref || "unknown element"}`,
        color: 'bg-purple-100 text-purple-600'
      },
      fill: {
        icon: Code,
        label: `Typed in ${elementInfo?.ariaLabel || details?.element_ref || "unknown element"}${details?.text ? `: "${details.text}"` : ''}`,
        color: 'bg-green-100 text-green-600'
      },
      snapshot: {
        icon: Target,
        label: 'Took Snapshot',
        color: 'bg-yellow-100 text-yellow-600'
      },
      console_messages: {
        icon: AlertCircle,
        label: 'Retrieved console messages',
        color: 'bg-red-100 text-red-600'
      },
      network_requests: {
        icon: Zap,
        label: 'Captured network requests',
        color: 'bg-indigo-100 text-indigo-600'
      },
      report_completion: {
        icon: CheckCircle,
        label: `Completed - ${details.reason || details.status}`,
        color: 'bg-green-100 text-green-600'
      }
    };
    
    return actions[type] || {
      icon: Code,
      label: type,
      color: 'bg-gray-100 text-gray-600'
    };
  };

  const deleteTestFile = async (filename, metaname) => {
    if (!window.confirm(`Are you sure you want to delete ${filename}?`)) {
      return;
    }

    try {

      const requestBody = {
        filename: filename,
        metadata_file: metaname
      };
      console.log('🗑️ Delete Request Body:', requestBody); 

      const response = await fetch('http://127.0.0.1:8000/AI/api/test-file/delete/', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error('Failed to delete test file');
      }

      const data = await response.json();
      console.log('✅ Deleted:', data);
      
      alert('Test file deleted successfully!');
      setGeneratedTestFile(null);
      
    } catch (error) {
      console.error('Error deleting test file:', error);
      alert('Failed to delete test file');
    }
  };

  const generatePromptFromAssistant = async () => {
    setIsGeneratingPrompt(true);

    // Log current request config
    const requestBody = {
      project_type: projectData?.project_type,
      platform: projectData?.platform,
      category: "interaction",
      complexity: complexityLevel,
    };

    console.log("🧠 Sending prompt generation request:", requestBody);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/generate-prompt/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate prompt");
      }

      const data = await response.json();
      console.log("✅ Received generated prompt:", data);

      if (data.prompt) {
        setPromptText(data.prompt);
      } else {
        alert("No prompt received from assistant.");
      }

      // Update complexity level for next click
      setComplexityLevel((prev) => {
        if (prev === "simple") return "medium";
        if (prev === "medium") return "complex";
        return "simple";
      });
    } catch (error) {
      console.error(
        `❌ Error generating ${complexityLevel} prompt:`,
        error.message
      );
      alert(`Error generating ${complexityLevel} prompt: ${error.message}`);
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const loadDraftsFromBackend = useCallback(async () => {
    if (!projectData?.project_name) {
      console.log("⚠️ No project_name found in projectData:", projectData);
      return;
    }
    
    const userId = localStorage.getItem("userId");
    
    try {
      const url = `http://127.0.0.1:8000/integrate/drafts/?user_id=${userId}&project_name=${projectData.project_name}`;
      console.log("📡 Calling Draft API:", url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPromptDrafts(data.drafts || []);
        console.log("✅ Drafts loaded from backend:", data.drafts);
      } else {
        console.error("❌ Draft API failed:", response.status);
      }
    } catch (error) {
      console.error('❌ Error loading drafts:', error);
    }
  }, [projectData]); 

  const saveDraftToBackend = async (prompt) => {
    if (!prompt.trim() || !projectData?.project_name) {
      console.log("⚠️ Cannot save draft - missing prompt or project_name");
      return;
    }
    
    const userId = localStorage.getItem("userId");
    
    try {
      console.log("💾 Saving draft to backend...");
      const response = await fetch('http://127.0.0.1:8000/integrate/drafts/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          project_name: projectData.project_name, 
          prompt: prompt
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log("💾 Draft saved:", data);
        
        // Reload drafts to update UI
        await loadDraftsFromBackend();
      } else {
        const errorData = await response.json();
        console.log("⚠️", errorData.message || "Failed to save draft");
      }
    } catch (error) {
      console.error('❌ Error saving draft:', error);
    }
  };

  const removeDraftFromBackend = async (draftId) => {
    if (!draftId || !projectData?.project_name) {
      console.log("⚠️ Cannot remove draft - missing draftId or project_name");
      return;
    }
    
    const userId = localStorage.getItem("userId");
    
    try {
      console.log("🗑️ Removing draft ID:", draftId);
      const response = await fetch('http://127.0.0.1:8000/integrate/drafts/', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          project_name: projectData.project_name, 
          draft_id: draftId  
        })
      });

      if (response.ok) {
        console.log("🗑️ Draft removed:", draftId);
        // Reload drafts to update UI
        await loadDraftsFromBackend();
      }
    } catch (error) {
      console.error('❌ Error removing draft:', error);
    }
  };

  const clearPromptDrafts = async () => {
    if (!projectData?.project_name) {
      console.log("⚠️ Cannot clear drafts - missing project_name");
      return;
    }
    
    const userId = localStorage.getItem("userId");
    
    try {
      console.log("🗑️ Clearing all drafts...");
      const response = await fetch('http://127.0.0.1:8000/integrate/drafts/', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          project_name: projectData.project_name,
          // No draft_id means delete all
        })
      });

      if (response.ok) {
        setPromptDrafts([]);
        setShowDrafts(false);
        console.log("🗑️ All drafts cleared");
      }
    } catch (error) {
      console.error('❌ Error clearing drafts:', error);
    }
  };

  const loadPromptFromDraft = (draftItem) => {
    setPromptText(draftItem.prompt);
    setShowDrafts(false);
    console.log("📋 Prompt loaded from draft:", draftItem);
  };

  useEffect(() => {
    if (projectData?.project_name) {
      console.log("🔄 Project changed, loading drafts for:", projectData.project_name);
      loadDraftsFromBackend();
    }
  }, [projectData?.project_name, loadDraftsFromBackend]);

  const extractStepsFromPrompt = async () => {
    const userId = localStorage.getItem("userId");

    if (!promptText.trim()) {
      alert("Please enter a prompt first.");
      return;
    }

    setIsExtracting(true);
    
    // ✅ Save to backend instead of localStorage
    await saveDraftToBackend(promptText);
    
    try {
      console.log("📦 Sending Request Payload:", {
        url: testUrl,
        user_id: userId, 
        prompt: promptText,
        scenarios_name: scenarioName,
        run_mode: "auto",
        api_key: apiKey,          
        gpt_version: gptVersion
      });

      const response = await fetch('http://127.0.0.1:8000/AI/test/run/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: testUrl,
          user_id: userId,
          prompt: promptText,
          scenarios_name: scenarioName,
          run_mode: "auto",
          api_key: apiKey,          
          gpt_version: gptVersion
        })
      });

      if (!response.ok) {
        throw new Error('Failed to run automation');
      }

      const data = await response.json();
      console.log("✅ API Response:", data);

      if (data.status === "test_found") {
        console.log("🔍 Test file found, asking user for choice...");
        handleTestFound(data);
        return;  
      }

      if (data.status === "success") {
        setTestResults(data);
        setShowTestResults(true);
        setShowFeedback(true); 
        setFeedbackGiven(null);

        if (data.test_file_info) {
          setGeneratedTestFile(data.test_file_info);
        }
        alert('Automation completed successfully!');
      } else if (data.status === "incomplete") {
        alert('Automation incomplete. Please try again.');
      } else if (data.status === "error") {
        alert(`Error: ${data.error}`);
      }

    } catch (error) {
      console.error('Error running automation:', error);
      alert('Failed to start automation. Please try again.');
    } finally {
      setIsExtracting(false);
    }
  };

  const createTestScenarioFromResults = async () => {
    if (!testResults || !testResults.actions_taken) {
      alert('No test results available to create scenario.');
      return;
    }

    try {
      setIsCreatingTestCase(true);
      
      const userId = localStorage.getItem("userId");

      const testCasePayload = {
        user_id: parseInt(userId),
        project_name: testCaseInfo.projectId,
        testcase_name: scenarioName || `Test Scenario - ${Date.now()}`,
        testcase_type: testCaseInfo.testcase_type || 'Functional',
        testcase_priority: testCaseInfo.testcase_priority || 'Medium',
        test_scenarios_desc: promptText,
        testfile_name: generatedTestFile?.filename || "",
        testfile_path: generatedTestFile?.test_file || "",
        generated_file_name: generatedTestFile?.metadata_file || "",
        generated_file_path: generatedTestFile?.metadata_path || ""
      };

      console.log("Creating test case with payload:", testCasePayload);

      const testCaseResponse = await fetch("http://127.0.0.1:8000/integrate/testcase/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testCasePayload)
      });

      if (!testCaseResponse.ok) {
        const errorData = await testCaseResponse.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create test case");
      }

      const testCaseData = await testCaseResponse.json();
      console.log("Test case created:", testCaseData);

      //   🚀 NEW PART: SAVE CAG CACHE
      // const saveCAGPayload = {
      //   website: testResults.website,           
      //   scenario_name: scenarioName,            
      //   actions_taken: testResults.actions_taken 
      // };

      // console.log("Saving CAG Cache:", saveCAGPayload);

      // const saveCAGResponse = await fetch("http://127.0.0.1:8000/AI/test/save_cag/", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(saveCAGPayload)
      // });

      // const saveCAGResult = await saveCAGResponse.json().catch(() => ({}));

      // console.log("Save CAG API Response:", saveCAGResult);

      if (generatedTestFile?.test_file) {
        const importPayload = {
          user_id: parseInt(userId),
          project_name: testCaseInfo.projectId,
          file_path: generatedTestFile.test_file
        };

        console.log("Importing test file with payload:", importPayload);

        const importResponse = await fetch("http://127.0.0.1:8000/integrate/test_scripts/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(importPayload)
        });

        if (!importResponse.ok) {
          const errorData = await importResponse.json().catch(() => ({}));
          console.warn("Test file import failed:", errorData);
          alert(`Test Scenario Created Successfully, but failed to copy test file: ${errorData.error || "Unknown error"}`);
        } else {
          const importData = await importResponse.json();
          console.log("Test file imported:", importData);
        }
      }

      alert(`Test Scenario Created Successfully!`);

      // ✅ Find and remove the draft that matches this prompt
      const matchingDraft = promptDrafts.find(d => d.prompt.trim() === promptText.trim());
      if (matchingDraft?.id) {
        console.log("🗑️ Removing draft after test case creation:", matchingDraft.id);
        await removeDraftFromBackend(matchingDraft.id); 
      }
      
      navigate("/test-cases");

    } catch (error) {
      console.error('Error creating test scenario:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsCreatingTestCase(false);
    }
  };

  const handleThumbsDown = async () => {
    if (!testResults || !promptText.trim() || !testUrl) {
      alert("Missing test data to retry.");
      return;
    }

    const userId = localStorage.getItem("userId");
    const newRetryCount = retryCount + 1;
    
    setFeedbackGiven('down');
    setLoadingModal({ 
      isOpen: true, 
      title: 'Analyzing & Retrying', 
      message: `Attempt ${newRetryCount}: Re-planning automation with improvements...` 
    });
    setIsExtracting(true);
    
    try {
      const payload = {
        url: testUrl,
        user_id: userId,
        prompt: promptText,
        scenarios_name: scenarioName,
        previous_test_results: testResults,
        retry_count: newRetryCount,
        run_mode: "replanner",
        api_key: apiKey,         
        gpt_version: gptVersion
      };

      console.log("Compact payload:", payload);
            
      const response = await fetch('http://127.0.0.1:8000/AI/test/rerun/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to retry automation');
      }

      const data = await response.json();
      console.log("✅ Replanner Response:", data);
      
      // Update test results with new data
      setTestResults(data);
      setRetryCount(newRetryCount);
      setShowTestResults(true);
      setShowFeedback(true);
      setFeedbackGiven(null);  // Reset feedback for new results
      
      if (data.test_file_info) {
        setGeneratedTestFile(data.test_file_info);
      }
      
      alert(`Retry attempt ${newRetryCount} completed!`);
      
    } catch (error) {
      console.error('Error retrying automation:', error);
      alert('Failed to retry automation. Please try again.');
      setFeedbackGiven(null);  // Reset on error
    } finally {
      setIsExtracting(false);
      setLoadingModal({ isOpen: false, title: '', message: '' });
    }
  };

  return (
    <div className="flex-1 lg:ml-[300px] transition-all duration-300 lg:max-w-[calc(100%-300px)] sm:ml-[60px] sm:max-w-full ">
      <div className="p-6">
        <div className="min-h-screen p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <div className="flex justify-between items-start">
                  <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                      AI-Powered Test Scenario Creation
                  </h1>
                  <p className="text-gray-600 text-sm md:text-base">
                      Enter your test requirements and let AI generate detailed test steps for you
                  </p>
                  </div>
                  
                  {/* Project Info - Top Right */}
                  {projectData && (
                  <div className="text-right bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
                      <div className="text-sm text-gray-700 mb-1">
                      <span className="text-gray-500">Type:</span> 
                      <span className="font-medium text-blue-700 ml-1">{projectData.project_type}</span>
                      </div>
                      <div className="text-sm text-gray-700">
                      <span className="text-gray-500">Platform:</span> 
                      <span className="font-medium text-green-700 ml-1">{projectData.platform}</span>
                      </div>
                  </div>
                  )}
              </div>
            </div>

            {/* Test Details and URL Combined Section */}
            <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Case Details</h2>
              
              <div className="grid grid-cols-2 gap-8">
                
                {/* Left Half - Test Case Details (Name, Type, Priority) */}
                <div>
                  <div className="grid grid-cols-3 gap-3">
                    {/* Name Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                      <div className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 h-11 flex items-center">
                        {testCaseInfo?.testcase_name || 'Not specified'}
                      </div>
                    </div>
                    
                    {/* Type Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                      <div className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 h-11 flex items-center">
                        {testCaseInfo?.testcase_type || 'Not specified'}
                      </div>
                    </div>

                    {/* Priority Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                      <div className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 h-11 flex items-center">
                        {testCaseInfo?.testcase_priority || 'Not specified'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Half - Test URL Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Test URL</label>
                  
                  <div className="h-11">
                    {!isEditingUrl ? (
                      <>
                        {isTestDataLoading ? (
                          // Loading state
                          <div className="w-full h-full px-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center">
                            <svg className="animate-spin h-4 w-4 text-purple-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-sm text-gray-500">Loading URL...</span>
                          </div>
                        ) : testUrl ? (
                          <div className="w-full h-full px-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center">
                            <span className="text-sm text-gray-700 font-mono truncate flex-1 mr-2">{testUrl}</span>
                            <button
                              onClick={() => {
                                setIsEditingUrl(true);
                                setTempUrl(testUrl);
                              }}
                              className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0"
                              title="Edit URL"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setIsEditingUrl(true)}
                            className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center text-sm"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                            Add URL
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="flex gap-2 h-11">
                        <input
                          type="url"
                          value={tempUrl}
                          onChange={(e) => setTempUrl(e.target.value)}
                          placeholder="Enter test URL"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          autoFocus
                        />
                        <button
                          onClick={saveTestUrl}
                          disabled={!tempUrl.trim() || isSavingUrl}
                          className="px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center"
                        >
                          {isSavingUrl ? (
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            'Save'
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingUrl(false);
                            setTempUrl('');
                          }}
                          className="px-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 gap-6">
            {/* Left Side - Prompt Input */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
                {/* Action Buttons at Top */}
                <div className="flex justify-end gap-3 mb-4">
                {!isExtracting ? (
                    <button
                        onClick={extractStepsFromPrompt}
                        disabled={!promptText.trim()}
                        className="px-6 py-2 bg-white text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-300 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 text-sm md:text-base font-medium"
                    >
                        Start
                    </button>
                ) : (
                    <button
                        onClick={stopTestExecution}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm md:text-base font-medium flex items-center gap-2"
                    >
                        <X className="w-4 h-4" />
                        Stop
                    </button>
                )}

                {/* Add Create Button - Only show after test results are available */}
                {/* {showTestResults && testResults && (
                  <button
                    onClick={createTestScenarioFromResults}
                    disabled={isCreatingTestCase}
                    className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 text-sm md:text-base font-medium"
                  >
                    {isCreatingTestCase ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </span>
                    ) : (
                      'Create'
                    )}
                  </button>
                )} */}

                </div>

                <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Scenario Prompt
                </label>
                <textarea
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="Enter your test scenario requirements here...

    Example: 
    - Test user login functionality
    - Verify password reset feature
    - Test shopping cart checkout process
    - Validate form submission with different inputs"
                    className="w-full h-40 md:h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none text-sm md:text-base"
                    disabled={isExtracting}
                />
                  <div className="flex justify-end items-center gap-3 mt-2">
                    <button
                      onClick={generatePromptFromAssistant}
                      disabled={isGeneratingPrompt}
                      className="text-blue-600 text-sm flex items-center hover:underline disabled:opacity-50"
                    >
                      {isGeneratingPrompt ? (
                        <svg
                          className="animate-spin w-4 h-4 mr-2 text-blue-500"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4H8v4H4z"
                          ></path>
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4 mr-2 text-blue-500"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                      )}
                      {isGeneratingPrompt ? "Generating..." : "Prompt Assistant"}
                    </button>

                    {/* New Enhance Button */}
                    <button
                      onClick={enhancePrompt}
                      disabled={isEnhancing || !promptText.trim()}
                      className="text-green-600 text-sm flex items-center hover:underline disabled:opacity-50"
                    >
                      {isEnhancing ? (
                        <svg
                          className="animate-spin w-4 h-4 mr-2 text-green-500"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4H8v4H4z"
                          ></path>
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4 mr-2 text-green-500"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                          />
                        </svg>
                      )}
                      {isEnhancing ? "Enhancing..." : "Enhance"}
                    </button>

                    {/* ✅ ADD DRAFT TOGGLE BUTTON HERE */}
                    <button
                      onClick={() => setShowDrafts(!showDrafts)}
                      disabled={promptDrafts.length === 0}
                      className="text-purple-600 text-sm flex items-center hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                      {showDrafts ? 'Hide Drafts' : `Drafts (${promptDrafts.length})`}
                    </button>

                  </div>
                </div>
            </div>
            </div>

            {/* ✅ DRAFTS SECTION - Only show when showDrafts is true */}
            {showDrafts && promptDrafts.length > 0 && (
              <div className="mt-4 bg-white rounded-lg shadow-sm border border-purple-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    Recent Drafts ({promptDrafts.length}/5)
                  </h3>
                  <button
                    onClick={clearPromptDrafts}
                    className="text-red-600 text-xs hover:underline flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                    Clear All
                  </button>
                </div>

                {/* Drafts Grid - Responsive */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                  {promptDrafts.slice().reverse().map((draft, index) => (
                    <div
                      key={draft.id}
                      onClick={() => loadPromptFromDraft(draft)}
                      className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-3 cursor-pointer hover:shadow-lg hover:border-purple-400 transition-all duration-200 group"
                    >
                      {/* Draft Number Badge */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                          Test Case #{promptDrafts.length - index}
                        </span>
                        <svg className="w-4 h-4 text-purple-400 group-hover:text-purple-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                        </svg>
                      </div>

                      {/* Timestamp */}
                      <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        {draft.timestamp}
                      </div>

                      {/* Prompt Preview */}
                      <div className="text-sm text-gray-700 line-clamp-3 leading-tight">
                        {draft.prompt}
                      </div>

                      {/* Hover indicator */}
                      <div className="mt-2 text-xs text-purple-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Click to load →
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Helper Text */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                </div>
                <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-900 mb-1">
                    How to use Test Scenario Creation
                </h3>
                <ul className="list-decimal pl-5 text-sm text-blue-700 space-y-1">
                    <li>Enter your test requirements in natural language</li>
                    <li>Click "Create Steps" to generate detailed test steps using AI</li>
                    <li>Review the generated steps and click "Add Steps" to include them in your test case</li>
                </ul>
                </div>
            </div>
            </div>

            {/* ✅ create scenario section */}
            {showFeedback && showTestResults && (
              <div className="mt-6 p-6 bg-white border-2 border-gray-200 rounded-lg shadow-md">
                <h3 className="text-base font-semibold text-gray-800 mb-4 text-center">
                  How did the test execution perform?
                </h3>
                
                {feedbackGiven === null ? (
                  // Show feedback buttons
                  <div className="flex items-center justify-center gap-4">
                    {/* Thumbs Up */}
                    <button
                      onClick={() => {
                        setFeedbackGiven('up');
                        setTimeout(() => {
                          createTestScenarioFromResults();
                        }, 500);
                      }}
                      className="flex items-center gap-2 px-6 py-3 border-2 border-purple-300 rounded-lg hover:bg-purple-50 hover:border-purple-500 transition-all duration-200 group"
                    >
                      <ThumbsUp className="w-5 h-5 text-purple-600 group-hover:text-purple-700" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-700">Test Passed</p>
                        <p className="text-xs text-gray-500">Create test case</p>
                      </div>
                    </button>

                    {/* Thumbs Down */}
                    <button
                      onClick={() => {
                        setFeedbackGiven('down');
                        handleThumbsDown(); 
                      }}
                      className="flex items-center gap-2 px-6 py-3 border-2 border-red-300 rounded-lg hover:bg-red-50 hover:border-red-500 transition-all duration-200 group"
                    >
                      <ThumbsDown className="w-5 h-5 text-red-600 group-hover:text-red-700" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-700">Test Failed</p>
                        <p className="text-xs text-gray-500">Retry with improvements</p>
                      </div>
                    </button>
                  </div>
                ) : feedbackGiven === 'up' ? (
                  // Success feedback
                  <div className="text-center">
                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-purple-600" />
                      <div className="text-left">
                        <p className="text-sm font-semibold text-purple-800">Test execution was successful</p>
                        <p className="text-xs text-purple-600 mt-0.5">Creating test case...</p>
                      </div>
                    </div>
                    
                    {isCreatingTestCase && (
                      <div className="flex items-center justify-center gap-2 text-purple-600 mt-3">
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm">Creating test case...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  // Failure feedback
                  <div className="text-center">
                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-red-50 border border-red-200 rounded-lg">
                      <XCircle className="w-6 h-6 text-red-600" />
                      <div className="text-left">
                        <p className="text-sm font-semibold text-red-800">We'll improve and retry</p>
                        <p className="text-xs text-red-600 mt-0.5">Analyzing what went wrong...</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Test Results Section */}
        {showTestResults && testResults && (
          <div className="mt-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
              
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    testResults.status === 'success' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {testResults.status === 'success' ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Test Execution Report</h2>
                  </div>
                </div>
                <button
                  onClick={() => setShowTestResults(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {/* Status Card */}
                <div className={`border rounded-lg p-4 ${
                  testResults.status === 'success' 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className={`text-2xl font-bold ${
                    testResults.status === 'success' ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {testResults.status === 'success' ? 'Passed' : 'Failed'}
                  </div>
                  <div className={`text-sm ${
                    testResults.status === 'success' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    Status
                  </div>
                </div>

                {/* For NEW AUTOMATION */}
                {testResults.actions_taken && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-900">
                      {testResults.iterations || 0}
                    </div>
                    <div className="text-sm text-purple-700">Actions</div>
                  </div>
                )}

                {/* For RERUN - Test Results */}
                {testResults.summary && (
                  <>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-900">
                        {testResults.summary?.passed || 0}
                      </div>
                      <div className="text-sm text-green-700">Passed</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="text-2xl font-bold text-red-900">
                        {testResults.summary?.failed || 0}
                      </div>
                      <div className="text-sm text-red-700">Failed</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-900">
                        {testResults.summary?.duration}
                      </div>
                      <div className="text-sm text-blue-700">Duration</div>
                    </div>
                  </>
                )}

                {/* Website */}
                {testResults.website && (
                  <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                    <div className="text-lg font-bold text-cyan-900 truncate">
                      {testResults.website}
                    </div>
                    <div className="text-sm text-cyan-700">Website</div>
                  </div>
                )}
              </div>

              {/* Test Task */}
              <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Test Task</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {testResults.task}
                </p>
              </div>

              {/* NEW AUTOMATION - Actions */}
              {testResults.actions_taken && testResults.actions_taken.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Actions Performed</h3>
                  <div className="space-y-3">
                    {testResults.actions_taken.map((action, index) => {
                      const { type, details } = parseAction(action.action, action.input);
                      const elementInfo = action.element_info;
                      const { icon: Icon, label, color } = getActionInfo(type, details, elementInfo);

                      return (
                        <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex-shrink-0 pt-1">
                            <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold">
                              {index + 1}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 mb-3">
                              <div className={`flex-shrink-0 p-2 rounded ${color}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-900">
                                  {label}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5 font-mono">
                                  {action.action}
                                </p>
                              </div>
                            </div>
                            
                            {/* Element Full Context */}
                            {elementInfo && (
                              <div className="bg-white p-3 rounded border border-gray-200 space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-gray-600">Ref ID:</span>
                                  <span className="text-xs bg-blue-100 text-blue-900 px-2 py-1 rounded font-mono">
                                    {elementInfo.ref_id}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-gray-600">Element:</span>
                                  <span className="text-xs bg-purple-100 text-purple-900 px-2 py-1 rounded">
                                    &lt;{elementInfo.tag}&gt; {elementInfo.role}
                                  </span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <span className="text-xs font-semibold text-gray-600">Text:</span>
                                  <span className="text-xs bg-green-100 text-green-900 px-2 py-1 rounded">
                                    "{elementInfo.text}"
                                  </span>
                                </div>
                                {elementInfo.ariaLabel && (
                                  <div className="flex items-start gap-2">
                                    <span className="text-xs font-semibold text-gray-600">Label:</span>
                                    <span className="text-xs bg-yellow-100 text-yellow-900 px-2 py-1 rounded">
                                      {elementInfo.ariaLabel}
                                    </span>
                                  </div>
                                )}
                                {action.input.text && (
                                  <div className="flex items-start gap-2">
                                    <span className="text-xs font-semibold text-gray-600">Input:</span>
                                    <span className="text-xs bg-green-100 text-green-900 px-2 py-1 rounded break-words">
                                      "{action.input.text}"
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* RERUN - Test Results */}
              {testResults.tests && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Test Results</h3>
                  <div className="space-y-3">
                    {testResults.tests.map((test, idx) => (
                      <div key={idx} className={`p-4 rounded-lg border ${
                        test.status === 'passed' 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <h4 className={`font-semibold ${
                            test.status === 'passed' 
                              ? 'text-green-900' 
                              : 'text-red-900'
                          }`}>
                            {test.title}
                          </h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            test.status === 'passed' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {test.status.toUpperCase()}
                          </span>
                        </div>
                        <p className={`text-sm mb-2 ${
                          test.status === 'passed' 
                            ? 'text-green-800' 
                            : 'text-red-800'
                        }`}>
                          Duration: {test.duration}
                        </p>
                        
                        {test.error && (
                          <div className="bg-white p-3 rounded border border-red-300 mt-3">
                            <p className="text-xs font-semibold text-red-900 mb-2">Error:</p>
                            <p className="text-xs text-red-800 mb-2 font-mono break-words">
                              {test.error.message}
                            </p>
                            <p className="text-xs text-red-700 mb-1">
                              <strong>File:</strong> {test.error.file}:{test.error.line}
                            </p>
                            <div className="bg-red-100 p-2 rounded text-xs font-mono text-red-900 overflow-x-auto mt-2">
                              <pre>{test.error.snippet}</pre>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Generated Test File Section */}
              {generatedTestFile && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <Code className="w-5 h-5" />
                        Generated Test File
                      </h4>
                      
                      {/* File Details */}
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-600">File:</span>
                          <span className="text-xs bg-white px-2 py-1 rounded font-mono text-blue-900">
                            {generatedTestFile.filename}
                          </span>
                        </div>
                        {/* <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-600">Path:</span>
                          <span className="text-xs text-gray-700 break-all">
                            {generatedTestFile.test_file}
                          </span>
                        </div> */}
                      </div>

                      {/* Run Command */}
                      {/* <div className="bg-white p-2 rounded border border-blue-300 font-mono text-xs text-gray-800">
                        npx playwright test {generatedTestFile.filename}
                      </div> */}
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => deleteTestFile(generatedTestFile.filename, generatedTestFile.metadata_file)}
                      className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete test file"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Status Message */}
              {testResults.status === 'success' ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-green-900 mb-1">Test Completed Successfully</h4>
                      <p className="text-sm text-green-800">
                        {testResults.actions_taken 
                          ? 'All automated actions were executed successfully. You can now create a test case from these results.'
                          : 'The test file executed successfully without any errors.'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-900 mb-1">Test Execution Failed</h4>
                      <p className="text-sm text-red-800">
                        {testResults.message || 'The test did not complete successfully. Please check the details above.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Screenshot Modal */}
        {screenshotModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-6xl max-h-[90vh] w-full">
              <button
                onClick={() => setScreenshotModal({ isOpen: false, src: '', alt: '' })}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
              <img
                src={screenshotModal.src}
                alt={screenshotModal.alt}
                className="w-full h-full object-contain bg-white rounded-lg"
              />
            </div>
          </div>
        )}

        {/* Test Found Modal */}
        {testFoundModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Test File Found</h2>
                </div>
                <button
                  onClick={() => setTestFoundModalOpen(false)}
                  disabled={isExtracting}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">A test file from a previous run was detected. What would you like to do?</p>
              
              <div className="bg-gray-50 p-3 rounded-lg mb-6 border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Generated:</p>
                <p className="text-sm font-mono text-gray-700">{foundTestData?.generated_at}</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => runExistingTest(foundTestData.test_file)}
                  disabled={isExtracting}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                >
                  {isExtracting ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Run Existing Test (Fast)
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => runNewAutomation()}
                  disabled={isExtracting}
                  className="w-full px-4 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 disabled:bg-gray-400 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create New Automation (Fresh)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading Modal */}
        {loadingModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
              <div className="flex flex-col items-center gap-4">
                <svg className="animate-spin h-12 w-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{loadingModal.title}</h3>
                  <p className="text-sm text-gray-600">{loadingModal.message}</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default TestSenario;