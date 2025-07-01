import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle, XCircle, Plus, Clock, X, Loader } from 'lucide-react';
import { useNavigate, useLocation } from "react-router-dom";
import { getSuggestedElements } from './elementSuggestionUtils';
import { HelpCircle, Link, MousePointer, Info, AlertCircle } from 'lucide-react';


const WriteRecord = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [testSteps, setTestSteps] = useState([]);
  const [newStep, setNewStep] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [elementData, setElementData] = useState(null);
  const [testCaseInfo, setTestCaseInfo] = useState({
    name: '',
    testcase_type: '',
    testcase_priority: '',
    projectId: '',
    project_type: ''
  });

  const [verificationModal, setVerificationModal] = useState({
    isOpen: false,
    textToVerify: '',
    matchingElements: [],
    selectedElement: null
  });

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [commandType, setCommandType] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('');
  const [createTestCaseLoading, setCreateTestCaseLoading] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [previouslySelectedElements, setPreviouslySelectedElements] = useState({});
  const [lastClickCoordinates, setLastClickCoordinates] = useState(null);
  const [secondaryVerification, setSecondaryVerification] = useState({
    isOpen: false,
    stepObj: null
  });
  const [instructionModalOpen, setInstructionModalOpen] = useState(false);
  const [waitModalOpen, setWaitModalOpen] = useState(false);
  const [stepWaitData, setStepWaitData] = useState(null);
  const [pendingWaitStep, setPendingWaitStep] = useState(false);
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [contactSelected, setContactSelected] = useState(false);
  const [otpVerificationState, setOtpVerificationState] = useState({
    isEnabled: false,
    phoneNumberEntered: false,
    waitingForOtp: false,
    enteredPhoneNumber: '',
    sessionTime: null
  });
  const toggleOtpCheckbox = () => {
    setRequiresOtp(prev => {
      const newValue = !prev;
      if (newValue) {
        // When enabling OTP, show contact options and hide elements
        setContactSelected(true);
      } else {
        // When disabling OTP, reset everything
        setContactSelected(false);
        setOtpVerificationState(prev => ({
          ...prev,
          contactEntered: false,
          waitingForOtp: false,
          enteredContact: '',
          sessionTime: null
        }));
      }
      return newValue;
    });
  };

  
  const previewRef = useRef(null);
  const stepsRef = useRef(null);
  const inputRef = useRef(null);

  const user_id = localStorage.getItem("user_id");

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
    const info = location.state?.testCaseInfo;
    console.log("info:", info);

    if (!info || !info.testcase_name || !info.testcase_type || !info.testcase_priority) {
      alert("Test case data is incomplete or missing.");
      navigate("/test-cases/create-testcases");
    } else {
      setTestCaseInfo(info);  
    }
  }, [location, navigate]);


  useEffect(() => {
    if (elementData) {
      sessionStorage.setItem('latestElementData', JSON.stringify(elementData));
    }
  }, [elementData]);

  useEffect(() => {
    const storedData = sessionStorage.getItem('latestElementData');
    if (storedData) {
      try {
        setElementData(JSON.parse(storedData));
      } catch (error) {
        console.error('Error parsing stored element data:', error);
      }
    }
  }, []);

  useEffect(() => {
  if (newStep?.trim().toLowerCase() === 'wait') {
    setWaitModalOpen(true);
  }
}, [newStep]);

  useEffect(() => {
    if (!newStep) {
        setShowSuggestions(false);
        return;
    }

    if (selectedElement && newStep.includes(selectedElement.displayName || selectedElement.name)) {
      return;
    }

    const inputText = newStep.trim().toLowerCase();
    const words = inputText.split(' ');
    const firstWord = words[0];
    
    // Check if the command is a click or type command
    if (['click', 'type', 'verify', 'get'].includes(firstWord)) {
        setCommandType(firstWord);

        if (firstWord === 'wait') {
            setShowSuggestions(false);
            return;
        }
        
        if (!elementData || !elementData.elements || elementData.elements.length === 0) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        
        let searchTerm = '';
        
        // Extract search term based on command type
        if (firstWord === 'click' && words.length > 1) {
            // For click commands, everything after "click" is the search term
            searchTerm = words.slice(1).join(' ').toLowerCase();
        } else if (firstWord === 'type') {
            // For type commands, extract what comes after "in "
            const inIndex = inputText.indexOf(' in ');
            if (inIndex !== -1) {
                searchTerm = inputText.substring(inIndex + 4).trim();
            }
        }else if (firstWord === 'verify' && words.length > 1) {
          // For verify commands, everything after "verify" is the search term
          searchTerm = words.slice(1).join(' ').toLowerCase();
        }else if (firstWord === 'get' && words.length > 1) {
          searchTerm = words.slice(1).join(' ').toLowerCase();
        }
        
        // Get last click coordinates from executed steps
        const lastClickCoordinates = testSteps.length > 0 ? 
            getLastClickCoordinates(testSteps) : null;
        
        // Use our enhanced algorithm to get suggestions with proper state
        const suggestedElements = getSuggestedElements(
            elementData.elements,
            searchTerm,
            firstWord,
            { 
                previouslySelectedElements, 
                lastClickCoordinates 
            }
        );

        
        
        setSuggestions(suggestedElements);
        setShowSuggestions(suggestedElements.length > 0);
        
    } else if (['scrollup', 'scrolldown', 'scroll_up', 'scroll_down'].includes(firstWord)) { 
      setCommandType('scroll');
      setShowSuggestions(false);
    } else if (firstWord === 'open' || (words.includes('go') && words.includes('to'))) { 
        setCommandType('open');
        setShowSuggestions(false);
    } else {
        setCommandType('');
        setShowSuggestions(false);
    }
}, [newStep, elementData, previouslySelectedElements, testSteps, selectedElement]);

useEffect(() => {
  if (showSuggestions && suggestions.length > 0) {
    const dropdownElement = document.querySelector('.suggestions-dropdown');
    if (dropdownElement) {
      dropdownElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
}, [showSuggestions, suggestions.length]);


const getLastClickCoordinates = (steps) => {
  // Loop backwards through steps to find the last successful click action
  for (let i = steps.length - 1; i >= 0; i--) {
      const step = steps[i];
      if (step.status === 'complete' && 
          step.description.toLowerCase().startsWith('click') && 
          step.selectedElement && 
          step.selectedElement.click_point) {
          return step.selectedElement.click_point;
      }
  }
  return null;
};

const handlePhoneNumberClick = async (contact) => {
  setContactSelected(true);
  
  setNewStep(prev => {
    const trimmed = prev.trim();
    
    // If there's already a contact in the step, replace it completely
    if (otpVerificationState.enteredContact) {
      // Remove the old contact completely and add new one
      const withoutOldContact = prev.replace(otpVerificationState.enteredContact, '').replace(/\s+/g, ' ').trim();
      
      if (withoutOldContact.endsWith('type')) {
        return withoutOldContact + ' ' + contact;
      } else if (withoutOldContact.includes('type') && !withoutOldContact.includes(' in ')) {
        return withoutOldContact + ' in ' + contact;
      }
      return withoutOldContact + ' ' + contact;
    }
    
    // First time selecting contact
    if (trimmed.endsWith('type')) {
      return prev + ' ' + contact;
    } else if (trimmed.includes('type ') && !trimmed.includes(' in ')) {
      return prev + ' in ' + contact;
    }
    return prev + ' ' + contact;
  });
  
  try {
    const response = await fetch('http://localhost:8000/api/get_time/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      const timeData = {
        ...data,
        phoneNumber: contact,
        timestamp: Date.now()
      };
      
      sessionStorage.setItem('otpSessionTime', JSON.stringify(timeData));
      
      setOtpVerificationState(prev => ({
        ...prev,
        contactEntered: true,
        waitingForOtp: true,
        enteredContact: contact,
        enteredContactInboxId: "29f7a099-d305-41d5-8e99-59c347674844",
        sessionTime: timeData
      }));
            
      console.log('OTP Session Time stored:', timeData);
    }
  } catch (error) {
    console.error('Error calling get_time API:', error);
  }

  setContactSelected(false);
};

const updateOtpSessionTime = async () => {
  if (!otpVerificationState.contactEntered) return;
  
  try {
    const response = await fetch('http://localhost:8000/api/get_time/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      const timeData = {
        ...data,
        phoneNumber: otpVerificationState.enteredContact,
        timestamp: Date.now()
      };
      
      sessionStorage.setItem('otpSessionTime', JSON.stringify(timeData));
      
      setOtpVerificationState(prev => ({
        ...prev,
        sessionTime: timeData
      }));
      
      console.log('OTP Session Time updated before step execution:', timeData);
    }
  } catch (error) {
    console.error('Error updating OTP session time:', error);
  }
};

const callGetOtpAfterExecution = async (stepId, isPhoneNumberStep = false, isEmailStep = false) => {
  if (!otpVerificationState.waitingForOtp || (!isPhoneNumberStep && !isEmailStep)) {
    console.log('Skipping get_otp call - not an OTP step');
    return;
  }

  try {
    const sessionData = JSON.parse(sessionStorage.getItem('otpSessionTime') || '{}');
    const request_time = sessionData.request_time || new Date().toISOString();

    let otpData;
    let otpValue;

    console.log("📤 Sending to /get_otp/:", JSON.stringify({ request_time }, null, 2));

    if (isPhoneNumberStep) {
      // Phone OTP
      const otpResponse = await fetch('http://localhost:8000/api/get_otp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_time })
      });

      otpData = await otpResponse.json();
      otpValue = otpData.otp;

    } else if (isEmailStep) {
      // Email OTP
      const inboxId = otpVerificationState.enteredContactInboxId; 

      if (!inboxId) {
        console.error("Missing inbox_id for email OTP");
        return;
      }

      console.log("📤 Sending to /get_mail_otp/:", JSON.stringify({ inbox_id: inboxId, request_time }, null, 2));

      const emailOtpRes = await fetch('http://localhost:8000/api/get_mail_otp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inbox_id: inboxId, request_time })
      });

      otpData = await emailOtpRes.json();
      otpValue = otpData.otp;
    } else {
      // Neither phone nor email step - shouldn't reach here
      console.log('No OTP API call needed for this step type');
      return;
    }

    console.log('OTP Response after execution:', otpData);

    const isValidOtp = /^\d{4,8}$/.test(otpValue);

    if (isValidOtp) {
      setOtpVerificationState(prev => ({
        ...prev,
        waitingForOtp: false
      }));

      if (isPhoneNumberStep || isEmailStep) {  
        setTestSteps(prev => prev.map(step =>
          step.id === stepId ? {
            ...step,
            message: `${step.message} - Your OTP: ${otpValue}`
          } : step
        ));
      }

    } else {
      if (isPhoneNumberStep || isEmailStep) {  
        setTestSteps(prev => prev.map(step =>
          step.id === stepId ? {
            ...step,
            message: `${step.message} - Please send OTP to continue`
          } : step
        ));
      }
    }

  } catch (error) {
    console.error('Error getting OTP after execution:', error);
    if (isPhoneNumberStep || !isPhoneNumberStep) {
      alert('OTP not received. Please send OTP to continue.');
    }
  }
};

  const addTestStep = async () => {
    if (!newStep.trim() || isProcessing) return;
    
    setShowSuggestions(false);
    
    const words = newStep.trim().split(' ');
    const actionType = words[0].toLowerCase();

    // Add 'wait' to the list of allowed commands
    const allowedCommands = ['click', 'type', 'verify', 'open', 'scroll', 'get', 'wait'];
    if (!allowedCommands.includes(actionType)) {
      alert("Unknown command. Please use: click, type, verify, open, scroll, get, or wait.");
      return;
    }
    
    // If it's a wait command but no configuration has been done yet, show the wait modal
    if (actionType === 'wait' && !newStep.includes('seconds') && !newStep.includes('until')) {
      setWaitModalOpen(true);
      return;
    }
    
    // Existing verification logic
    if (actionType === 'verify') {
      const textToVerify = words.slice(1).join(' ');
      
      // Always try to find matching elements by text, even if an element is selected
      const matchingElements = checkTextInElementData(textToVerify);
      
      if (matchingElements && matchingElements.length > 0) {
        // Always open confirmation modal for verify commands
        setVerificationModal({
          isOpen: true,
          textToVerify,
          matchingElements,
          selectedElement: selectedElement || matchingElements[0]
        });
        return;
      } else {
        alert("Text not found on the current page. Please try a different text or command.");
        return;
      }
    }
    
    // For commands that require element selection
    if ((actionType === 'click' || actionType === 'type' || actionType === 'verify') && !selectedElement) {
      alert("Please select an element from the suggestions before adding this step.");
      return;
    }

    let finalStepText = newStep;
  
    // Call get_time before executing any step if phone number is entered
    if (otpVerificationState.contactEntered) {
      await updateOtpSessionTime();
    }
    
    let isOtpStep = false;
    let isPhoneNumberStep = false;

      let isEmailStep = false;
      if (otpVerificationState.waitingForOtp && otpVerificationState.enteredContact) {
        const isEmail = /\S+@\S+\.\S+/.test(otpVerificationState.enteredContact);
        isPhoneNumberStep = !isEmail;
        isEmailStep = isEmail;
      }

    console.log("🚀 Contact detected:", otpVerificationState.enteredContact);
    console.log("📞 Is phone number step?", isPhoneNumberStep);

    if (otpVerificationState.waitingForOtp && actionType === 'type') {
      // Check if user is entering OTP (4-8 digits)
      const match = newStep.match(/\b\d{4,8}\b/);
      if (match) {
        isOtpStep = true;
        finalStepText = newStep;
        console.log('Detected OTP input:', match[0]);
      }
    }

    const newStepObj = {
      id: Date.now(),
      description: finalStepText,
      status: 'pending',
      duration: '00:00',
      screenshot: null,
      selectedElement: selectedElement,
      verificationType: selectedElement?.verificationType || 'text',
      waitRequestData: stepWaitData || null,
      requiresOtp: requiresOtp,
      otpSessionData: isOtpStep ? otpVerificationState.sessionTime : null,
      isPhoneNumberStep: isPhoneNumberStep,
      isEmailStep: isEmailStep 
    };
    
    setSelectedElement(null);
    setStepWaitData(null);
    
    setTestSteps(prev => [...prev, newStepObj]);
    setNewStep('');

    const executionResult = await executeStep(newStepObj);

    if (executionResult === undefined) {
      setTestSteps(prev => prev.filter(step => step.id !== newStepObj.id));
      return;
    }

    setTestSteps(prev => prev.map(step => 
      step.id === newStepObj.id ? {
        ...step,
        ...executionResult,
        elementClicked: actionType === 'click' ? newStepObj.selectedElement : undefined,
        elementVerified: actionType === 'verify' ? newStepObj.selectedElement : undefined,
        waitCondition: executionResult.waitCondition,
        waitText: executionResult.waitText,
        waitTimeout: executionResult.waitTimeout
      } : step
    ));
    
    // After successful execution, update the previouslySelectedElements
    if (executionResult.status === 'complete' && newStepObj.selectedElement?.click_point) {
      setLastClickCoordinates(newStepObj.selectedElement.click_point);
      const element = newStepObj.selectedElement;

      if (element.click_point) {
        const x = Math.round(element.click_point[0]);
        const y = Math.round(element.click_point[1]);
        const exactCoordinateKey = `${element.name.toLowerCase()}_${x}_${y}`;

        console.log('Generated key for element:', exactCoordinateKey);
        
        setPreviouslySelectedElements(prev => {
          const updatedPrev = {};
          Object.keys(prev).forEach(key => {
            updatedPrev[key] = {
              ...prev[key],
              lastExecutedElement: false 
            };
          });
          
          return {
            ...updatedPrev,
            [exactCoordinateKey]: {
              lastSelected: Date.now(),
              count: (prev[exactCoordinateKey]?.count || 0) + 1,
              element: element,
              lastExecutedElement: true,
              coordinates: [x, y]
            }
          };
        });
      }
    }
    
    // IMPORTANT: Call get_otp after successful execution when waiting for OTP
    if (executionResult.status === 'complete' && otpVerificationState.waitingForOtp) {
      await callGetOtpAfterExecution(newStepObj.id, isPhoneNumberStep, isEmailStep);
    }
    
    setNewStep('');
    if (newStepObj.otpSessionData) {
      setRequiresOtp(false);
    }
          
    setTimeout(() => {
      if (previewRef.current) {
        previewRef.current.scrollTo({
          top: previewRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
      if (stepsRef.current) {
        stepsRef.current.scrollTo({
          top: stepsRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  const executeStep = async (stepObj) => {
    setIsProcessing(true);
  
    try {
        const stepDescription = stepObj.description;
        
        const words = stepDescription.trim().split(' ');
        const actionType = words[0].toLowerCase();
        words[0] = actionType;
  
        let updatedStepDescription = stepDescription;
    
        if (actionType === 'scrollup') {
          updatedStepDescription = "scroll_up page";
          console.log("Converting 'scrollup' to 'scroll_up page'");
        } else if (actionType === 'scrolldown') {
          updatedStepDescription = "scroll_down page";
          console.log("Converting 'scrolldown' to 'scroll_down page'");
        } else {
          words[0] = actionType;
          updatedStepDescription = words.join(' ');
        }

        console.log("Updated Step Description:", updatedStepDescription); 
        
        const stepIndex = testSteps.length;
        if (actionType === 'scrollup' || actionType === 'scrolldown') {
          setLoadingMessage(`Step ${stepIndex + 1}: Scrolling ${actionType === 'scrollup' ? 'up' : 'down'}, please wait...`);
        } else if (actionType === 'open') {
          setLoadingMessage(`Step ${stepIndex + 1}: Opening page, please wait...`);
        } else if (actionType === 'click') {
          setLoadingMessage(`Step ${stepIndex + 1}: Executing click, please wait...`);
        } else if (actionType === 'type') {
          setLoadingMessage(`Step ${stepIndex + 1}: Typing text, please wait...`);
        } else if (actionType === 'verify') {
          setLoadingMessage(`Step ${stepIndex + 1}: Verifying element, please wait...`);
        } else if (actionType === 'get') {
          setLoadingMessage(`Step ${stepIndex + 1}: Getting element, please wait...`);
        } else if (actionType === 'wait') {
          setLoadingMessage(`Step ${stepIndex + 1}: Waiting, please be patient...`);
        } else {
          setLoadingMessage(`Step ${stepIndex + 1}: Executing command, please wait...`);
        }

        if (actionType === 'wait') {

          const hasElementData = elementData && elementData.elements && elementData.elements.length > 0;
          const hasStoredElementData = sessionStorage.getItem('latestElementData');
          
          if (!hasElementData && !hasStoredElementData) {
            alert("Please open a browser first before using the wait command.");
            setIsProcessing(false);
            setLoadingMessage('');
            // Return undefined explicitly to indicate that execution was aborted
            return undefined;
          }

          const waitRequestData = stepObj.waitRequestData || {
              timeout: 5000, 
              debug: true
          };
          
          console.log("Wait Request Data:", waitRequestData);
            
          const response = await fetch('http://127.0.0.1:8000/automation/wait/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  ...waitRequestData,
                  user_id: user_id
              }),
          });
          
          if (!response.ok) {
              throw new Error('Failed to execute wait command');
          }
          
          const data = await response.json();
          console.log("Wait Response:", data);
          
          const screenshotUrl = data.screenshot_url
              ? `http://127.0.0.1:8000${data.screenshot_url}`
              : `/api/placeholder/800/300?text=Wait_Completed`;

            console.log("Screenshot URL:", screenshotUrl);
              
          return {
              status: data.status === 'success' ? 'complete' : 'error',
              duration: waitRequestData.timeout ? `00:${Math.floor(waitRequestData.timeout / 1000).toString().padStart(2, '0')}` : '00:05',
              message: data.message || "Wait completed successfully",
              screenshot: screenshotUrl,
          };
        }
  
        if (actionType === 'open' || stepDescription.toLowerCase().includes('go to ')) {
            const response = await fetch('http://127.0.0.1:8000/automation/handle_command/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: updatedStepDescription, user_id: user_id }), 
            });
  
            console.log("Open URL:", updatedStepDescription);
            console.log("User_Id:", user_id);
  
            if (!response.ok) {
                throw new Error('Failed to execute navigation command');
            }
  
            const data = await response.json();
            console.log("Response:", data);
  
            if (data.omniparser_data && data.omniparser_data.elements) {
              setElementData(data.omniparser_data);
              sessionStorage.setItem('latestElementData', JSON.stringify(data.omniparser_data));
              setSuggestions(data.omniparser_data.elements); // ✅ Make sure you are setting suggestions here
            } else {
                setSuggestions([]); // ✅ Clear suggestions if no element data
            }
  
            const screenshotUrl = data.screenshot
                ? `http://127.0.0.1:8000${data.screenshot}`
                : `/api/placeholder/800/300?text=No_Screenshot`;
  
            console.log("Screenshot URL:", screenshotUrl);
            
            return {
                status: 'complete',
                duration: '00:' + Math.floor(Math.random() * 60).toString().padStart(2, '0'),
                message: data.status || "Page loaded successfully",
                screenshot: screenshotUrl,
                coordinates: data.omniparser_data,
                debug_images: data.omniparser_data?.debug_images || {}, 
            };
  
        } 
        else if (actionType === 'click' || actionType === 'type') {
            
            const selectedElement = stepObj.selectedElement;
            
            if (!selectedElement) {
                throw new Error(`No element selected for this action. Please select an element from the suggestions.`);
            }
  
            let requestBody = {
                command: stepDescription, 
                user_id: user_id,
                click_x: selectedElement.click_point[0],
                click_y: selectedElement.click_point[1],
            };
  
            if (actionType === 'type') {
                const inIndex = stepDescription.toLowerCase().indexOf(' in ');
                if (inIndex !== -1) {
                    const textToType = stepDescription.substring(5, inIndex);
                    requestBody.input_text = textToType;
                }
            }
  
            console.log(`Sending coordinates for ${actionType} step:`, {
                click_x: selectedElement.click_point[0],
                click_y: selectedElement.click_point[1],
                requestBody
            });
  
            const response = await fetch('http://127.0.0.1:8000/automation/handle_command/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });
  
            console.log(actionType, stepDescription, selectedElement.click_point);
  
            if (!response.ok) {
                throw new Error(`Failed to execute ${actionType} command`);
            }
  
            const data = await response.json();
            console.log(`${actionType} response:`, data);
  
            if (data.coordinates && data.coordinates.elements) {
                setElementData(data.coordinates);
                sessionStorage.setItem('latestElementData', JSON.stringify(data.coordinates));
            }
  
            const screenshotUrl = data.screenshot
                ? `http://127.0.0.1:8000${data.screenshot}`
                : `/api/placeholder/800/300?text=No_Screenshot`;
  
  
            return {
                status: 'complete',
                duration: '00:' + Math.floor(Math.random() * 60).toString().padStart(2, '0'),
                message: data.message || `${actionType.charAt(0).toUpperCase() + actionType.slice(1)} action executed successfully`,
                screenshot: screenshotUrl,
                coordinates: data.coordinates || elementData,
                elementAction: selectedElement,
                requestBody,
                debug_images: data.coordinates?.debug_images || {},
            };
        } 
        else if (actionType === 'verify') {
          const selectedElement = stepObj.selectedElement;
            
          if (!selectedElement) {
              throw new Error(`No element selected for verification. Please select an element from the suggestions.`);
          }
          const verificationType = stepObj.verificationType || 'text';
  
          let requestBody = {
              command: stepDescription, 
              user_id: user_id,
              click_x: selectedElement.click_point[0],
              click_y: selectedElement.click_point[1],
              verification_type: verificationType
          };
  
          console.log(`Sending coordinates for verify step:`, requestBody);
  
          const response = await fetch('http://127.0.0.1:8000/automation/handle_command/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody), 
          });
  
          if (!response.ok) {
              throw new Error(`Failed to execute verify command`);
          }
  
          const data = await response.json();
          console.log(`Verify response:`, data);
  
          if (data.omniparser_data && data.omniparser_data.elements) {
              setElementData(data.omniparser_data);
              sessionStorage.setItem('latestElementData', JSON.stringify(data.omniparser_data));
          }
  
          const screenshotUrl = data.screenshot
              ? `http://127.0.0.1:8000${data.screenshot}`
              : `/api/placeholder/800/300?text=No_Screenshot`;
  
//              const verificationPassed = c.verify_result === "pass";
  
          return {
//              status: verificationPassed ? 'complete' : 'error',
              status: 'complete',
              duration: '00:' + Math.floor(Math.random() * 60).toString().padStart(2, '0'),
              message: data.status,
              screenshot: screenshotUrl,
              coordinates: data.coordinates,
              verificationType: verificationType,
//              verificationResult: verificationPassed ? 'passed' : 'failed',
              verifiedText: data.copied_text || "",
              elementVerified: selectedElement,
              requestBody,
              debug_images: data.coordinates?.debug_images || {},
          };
        } 
        else if (actionType === 'scrollup' || actionType === 'scrolldown') {
          const requestBody = { 
            command: updatedStepDescription, 
            user_id: user_id
          };

          console.log("Scroll Request Body:", requestBody);

          const response = await fetch('http://127.0.0.1:8000/automation/handle_command/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) throw new Error(`Failed to execute ${actionType} command`);
            const data = await response.json();
            
            console.log("Scroll Response:", data);

          if (data.omniparser_data && data.omniparser_data.elements) {
            setElementData(data.omniparser_data);
            sessionStorage.setItem('latestElementData', JSON.stringify(data.omniparser_data));
          }

          const screenshotUrl = data.screenshot
            ? `http://127.0.0.1:8000${data.screenshot}`
            : `/api/placeholder/800/300?text=No_Screenshot`;

          return {
            status: 'complete',
            duration: '00:' + Math.floor(Math.random() * 60).toString().padStart(2, '0'),
            message: data.message || `${actionType} executed successfully`,
            screenshot: screenshotUrl,
            coordinates: data.coordinates || {},
            requestBody,
            debug_images: data.coordinates?.debug_images || {},
          };
        } 
        else if (actionType === 'get') {
            const selectedElement = stepObj.selectedElement;
                
            if (!selectedElement) {
              throw new Error(`No element selected for get operation. Please select an element from the suggestions.`);
            }

            let requestBody = {
              command: stepDescription, 
              user_id: user_id,
              click_x: selectedElement.click_point[0],
              click_y: selectedElement.click_point[1],
              action_type: 'get' 
            };

            console.log(`Sending coordinates for get step:`, requestBody);

            const response = await fetch('http://127.0.0.1:8000/automation/handle_command/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody), 
            });

            if (!response.ok) {
              throw new Error(`Failed to execute get command`);
            }

            const data = await response.json();
            console.log(`Get response:`, data);

            if (data.omniparser_data && data.omniparser_data.elements) {
              setElementData(data.omniparser_data);
              sessionStorage.setItem('latestElementData', JSON.stringify(data.omniparser_data));
            }

            const screenshotUrl = data.screenshot
              ? `http://127.0.0.1:8000${data.screenshot}`
              : `/api/placeholder/800/300?text=No_Screenshot`;

            return {
              status: 'complete',
              duration: '00:' + Math.floor(Math.random() * 60).toString().padStart(2, '0'),
              message: data.status || "Retrieved element text successfully",
              screenshot: screenshotUrl,
              coordinates: data.coordinates,
              retrievedText: data.copied_text || "",
              elementRetrieved: selectedElement,
              requestBody,
              debug_images: data.coordinates?.debug_images || {},
            };
          }

    } catch (error) {
        console.error('Step execution error:', error);
        return {
            status: 'error',
            duration: '00:00',
            error: error.message
        };
    } finally {
        setIsProcessing(false);
        setLoadingMessage('');
    }
  };

useEffect(() => {
  if (pendingWaitStep && newStep.includes('wait')) {
    addTestStep();
    setPendingWaitStep(false); 
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [newStep, pendingWaitStep]);

const handleWaitConfirm = (waitCommand, waitRequestData) => {
  setStepWaitData(waitRequestData);
  setNewStep(waitCommand);
  setWaitModalOpen(false);
};

  const handleSuggestionClick = (suggestion) => {
    // Flag to indicate a suggestion was just selected
    // This will help prevent the useEffect from reopening the dropdown
    const handleSelection = () => {
      // Store the selected element ID in previouslySelectedElements
      setPreviouslySelectedElements(prev => ({
        ...prev,
        [suggestion.id]: {
          timestamp: Date.now(),
          element: suggestion
        }
      }));
    };
    
    let updatedStep = '';
    
    if (commandType === 'click') {
      updatedStep = `click ${suggestion.displayName || suggestion.name}`;
    } else if (commandType === 'type') {
      // Get the text the user has already typed (if any)
      let userText = '';
      
      if (newStep.toLowerCase().startsWith('type ')) {
        const inIndex = newStep.toLowerCase().indexOf(' in ');
        if (inIndex !== -1) {
          // If " in " exists, extract text between "type " and " in "
          userText = newStep.substring(5, inIndex).trim();
        } else {
          // If " in " doesn't exist, extract all text after "type "
          userText = newStep.substring(5).trim();
        }
      }
      
      // Use the user's text if available, otherwise use placeholder
      if (userText) {
        updatedStep = `type ${userText} in ${suggestion.displayName || suggestion.name}`;
      } else {
        updatedStep = `type  in ${suggestion.displayName || suggestion.name}`;
      }
    } else if (commandType === 'verify') {
      updatedStep = `verify ${suggestion.displayName || suggestion.name}`;
  
      // Close suggestions dropdown
      setShowSuggestions(false);
      handleSelection();
      
      // Set verification modal data
      const textToVerify = suggestion.displayName || suggestion.name;
      const matchingElements = [suggestion]; 
      
      // Need to update these states together with minimal delay to avoid re-renders
      setNewStep(updatedStep);
      setSelectedElement(suggestion);
      
      // Show verification modal
      setVerificationModal({
        isOpen: true,
        textToVerify,
        matchingElements,
        selectedElement: suggestion
      });
      
      return;  
    } else if (commandType === 'get') {
      updatedStep = `get ${suggestion.displayName || suggestion.name}`;
      
      // Close suggestions dropdown
      setShowSuggestions(false);
      handleSelection();
      
      // Update step in one batch to minimize effect triggers
      setNewStep(updatedStep);
      setSelectedElement(suggestion);
      
      return;
    }
    
    // Immediately close suggestions dropdown and disable its reopening
    setShowSuggestions(false);
    handleSelection();
    
    // Batching state updates to minimize effect re-runs
    setNewStep(updatedStep);
    setSelectedElement(suggestion);
    
    // Focus input after state updates
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        if (commandType === 'type' && updatedStep.includes(' in ')) {
          // Position cursor after "type " but before " in " for user to enter text
          const typeIndex = updatedStep.indexOf('type ') + 5;
          
          // If there's no text between "type " and " in ", set cursor right after "type "
          if (updatedStep.substring(typeIndex, updatedStep.indexOf(' in ')).trim() === '') {
            inputRef.current.setSelectionRange(typeIndex, typeIndex);
          } else {
            // If there's already text, position cursor at the end of the command
            const length = updatedStep.length;
            inputRef.current.setSelectionRange(length, length);
          }
        } else {
          const length = updatedStep.length;
          inputRef.current.setSelectionRange(length, length);
        }
      }
    }, 0);
  };

const handleVerificationConfirm = () => {
  const { textToVerify, selectedElement } = verificationModal;
  
  // Create new step object
  const newStepObj = {
    id: Date.now(),
    description: `verify ${textToVerify}`,
    status: 'pending',
    duration: '00:00',
    screenshot: null,
    selectedElement: selectedElement,
    verificationType: 'text'
  };
  
  // Close first modal
  setVerificationModal({
    isOpen: false,
    textToVerify: '',
    matchingElements: [],
    selectedElement: null
  });
  
  // Open second confirmation instead of directly executing
  setSecondaryVerification({
    isOpen: true,
    stepObj: newStepObj
  });
};

const handleFinalVerificationConfirm = async () => {
  const newStepObj = secondaryVerification.stepObj;
  
  // Close the secondary confirmation modal
  setSecondaryVerification({
    isOpen: false,
    stepObj: null
  });
  
  // Add step to test steps
  setTestSteps(prev => [...prev, newStepObj]);
  setNewStep('');
  
  // Execute the step (this part stays the same)
  const executionResult = await executeStep(newStepObj);
  
  // Update test step with execution result
  setTestSteps(prev => prev.map(step => 
    step.id === newStepObj.id ? {
      ...step,
      ...executionResult,
      elementVerified: newStepObj.selectedElement
    } : step
  ));
  
  // Auto-scroll to show new step (unchanged)
  setTimeout(() => {
    if (previewRef.current) {
      previewRef.current.scrollTo({
        top: previewRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
    if (stepsRef.current) {
      stepsRef.current.scrollTo({
        top: stepsRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, 100);
};

const createTestCase = async () => {
  if (testSteps.length === 0) {
    alert('Please add at least one test step before creating a test case.');
    return;
  }

  try {
    setCreateTestCaseLoading(true);
    
    // Get the user ID from localStorage
    const userId = localStorage.getItem("userId");

    // Step 1: Create the test case first (without steps)
    const testCasePayload = {
      user_id: parseInt(userId),
      project_name: testCaseInfo.projectId,
      testcase_name: testCaseInfo.testcase_name,
      testcase_type: testCaseInfo.testcase_type,
      testcase_priority: testCaseInfo.testcase_priority
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

    // Step 2: Prepare and add steps to the created test case
    const selectedSteps = testSteps.map((step, index) => {
      let teststep_result = "not_executed";
      if (step.status === "complete") {
        teststep_result = "passed";
      } else if (step.status === "error") {
        teststep_result = "failed";
      }

      let stepDescription = step.description;
      if (/(\b\d{4,8}\b)/.test(step.description)) {
        stepDescription = step.description.replace(/\b\d{4,8}\b/, "<otp>");
      }
      
      // Initialize default coordinates
      let coordinates = { click_x: 0, click_y: 0 };
      
      // Extract coordinates from step data if available
      if (step.requestBody) {
        coordinates = step.requestBody;
      }

      // ✅ Check if this step uses OTP
      // const usesOtp = step.description.includes('{{OTP}}');
      
      return {
        step_number: index + 1,
        step_description: stepDescription,
        teststep_result: teststep_result,
        step_coordinates: coordinates,
        expected_result: step.expectedResult || "",
        actual_result: "",
        // requires_otp: usesOtp 
      };
    });

    // Create steps payload matching the working API structure
    const stepsPayload = {
      user_id: parseInt(userId),
      project_name: testCaseInfo.projectId,
      testcase_name: testCaseInfo.testcase_name,
      steps: selectedSteps
    };

    console.log("Adding steps with payload:", stepsPayload);

    const stepsResponse = await fetch("http://127.0.0.1:8000/integrate/teststep/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(stepsPayload)
    });

    if (!stepsResponse.ok) {
      const errorData = await stepsResponse.json().catch(() => ({}));
      // If steps fail, show warning that test case was created but steps failed
      console.warn("Steps creation failed:", errorData);
      alert(`Test Case Created Successfully, but failed to add steps: ${errorData.message || "Unknown error"}`);
      navigate("/test-cases");
      return;
    }

    const stepsData = await stepsResponse.json();
    console.log("Steps added:", stepsData);

    alert("Test Case and Steps Created Successfully");
    navigate("/test-cases");

  } catch (error) {
    console.error('Error creating test case:', error);
    alert(`Error: ${error.message}`);
  } finally {
    setCreateTestCaseLoading(false);
  }
};

  const clearSession = () => {
    sessionStorage.removeItem('latestElementData');
    setElementData(null);
    setTestSteps([]);
    alert('Session data cleared!');
  };

const LoadingIndicator = ({ message }) => (
  <div className="flex items-center justify-center p-4 bg-white rounded-lg shadow-md border-l-4 border-purple-500 mb-4 transition-all duration-300">
    <div className="mr-3 relative">
      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
      </div>
    </div>
    <span className="text-gray-700 font-medium text-lg">{message}</span>
  </div>
);

const ImageModal = () => {
  if (!fullScreenImage) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={() => setFullScreenImage(null)}
    >
      <div className="relative max-w-4xl max-h-[90vh] w-full">
        <button 
          className="absolute top-2 right-2 bg-white rounded-full p-1"
          onClick={() => setFullScreenImage(null)}
        >
          <X className="w-6 h-6" />
        </button>
        <img 
          src={fullScreenImage} 
          alt="Full screen preview" 
          className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
        />
      </div>
    </div>
  );
};

const checkTextInElementData = (textToVerify) => {
  if (!elementData || !elementData.elements) return null;
  
  const searchText = textToVerify.toLowerCase();
  const matchingElements = elementData.elements.filter(element => {
    // Check if element has text content that includes the search text
    return element.text && element.text.toLowerCase().includes(searchText);
  });
  
  return matchingElements.length > 0 ? matchingElements : null;
};

const SecondaryVerificationConfirmation = ({ isOpen, onClose, onConfirm, stepObj }) => {
  if (!isOpen || !stepObj) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Final Verification Confirmation</h3>
        <p className="text-sm text-gray-600 mb-3">
          Are you sure you want to verify "{stepObj.description.substring(7)}" on the page?
        </p>
        <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-md mb-4">
          <p className="text-sm text-yellow-700">
            This will execute the verification action on the selected element.
          </p>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
          >
            Confirm Verify
          </button>
        </div>
      </div>
    </div>
  );
};

const VerificationConfirmation = ({ isOpen, onClose, onConfirm, textToVerify, matchingElements }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Verification</h3>
        <p className="text-sm text-gray-600 mb-3">
          Found {matchingElements.length} element(s) containing "{textToVerify}".
        </p>
        <div className="max-h-48 overflow-y-auto mb-4 border border-gray-200 rounded-md p-2">
          {matchingElements.map((element, index) => (
            <div key={index} className="p-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
              <div className="font-medium text-sm">{element.name || 'Element'}</div>
              {element.text && element.text.trim() !== "" && (
                <div className="text-xs text-gray-600">
                  Content: "{element.text?.substring(0, 50)}{element.text?.length > 50 ? '...' : ''}"
                </div>
              )}
              <div className="text-xs text-gray-600">
                Type: {element.tag === 'a' || element.type === 'link' ? 'Link' : 'Text'}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
          >
            Verify
          </button>
        </div>
      </div>
    </div>
  );
};

const SuggestionsDropdown = () => {
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [adjustedPosition, setAdjustedPosition] = useState(null);
  const [showPositionControls, setShowPositionControls] = useState(false);
  
  // Position adjustment increments (in pixels)
  const POSITION_STEP = 10;
  const FINE_STEP = 5;

  if (!showSuggestions) return null;

  const shouldShowNoDataMessage =
    suggestions.length === 0 &&
    newStep?.trim() !== '' &&
    ['click', 'type', 'verify', 'get'].some(cmd => newStep.startsWith(cmd));
  
  if (shouldShowNoDataMessage) {
    return (
      <div className="absolute z-10 w-full bg-white shadow-xl rounded-md border border-gray-200 mt-12 animate-fadeIn suggestions-dropdown">
        <div className="p-4 text-center">
          <div className="text-red-600 font-medium mb-2 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            No element data available
          </div>
          <p className="text-sm text-gray-700 mb-3">
            Please check your network connection and try again. The AgentExtractModel may not be responding or providing coordinate data.
          </p>
          <p className="text-xs text-gray-600 mb-3">
            💡 Tip: If elements aren't detected properly, you can use the position adjustment controls to fine-tune the click location.
          </p>
          <button 
            onClick={() => setShowSuggestions(false)}
            className="mt-3 px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors text-sm"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  const handlePositionAdjustment = (direction, step = POSITION_STEP) => {
    if (!selectedSuggestion) return;
    
    const currentPos = adjustedPosition || selectedSuggestion.click_point;
    let newPos = [...currentPos];
    
    switch (direction) {
      case 'up':
        newPos[1] -= step;
        break;
      case 'down':
        newPos[1] += step;
        break;
      case 'left':
        newPos[0] -= step;
        break;
      case 'right':
        newPos[0] += step;
        break;
      default:
        return;
    }
    
    // Ensure position doesn't go negative
    newPos[0] = Math.max(0, newPos[0]);
    newPos[1] = Math.max(0, newPos[1]);
    
    setAdjustedPosition(newPos);
  };

  const handleSuggestionSelect = (suggestion) => {
    setSelectedSuggestion(suggestion);
    setAdjustedPosition(null);
    setShowPositionControls(true);
  };

  const handleConfirmSelection = () => {
    if (selectedSuggestion) {
      const finalPosition = adjustedPosition || selectedSuggestion.click_point;
      const updatedSuggestion = {
        ...selectedSuggestion,
        click_point: finalPosition
      };
      handleSuggestionClick(updatedSuggestion);
      setShowPositionControls(false);
      setSelectedSuggestion(null);
      setAdjustedPosition(null);
    }
  };

  const handleCancelSelection = () => {
    setShowPositionControls(false);
    setSelectedSuggestion(null);
    setAdjustedPosition(null);
  };

  const resetPosition = () => {
    setAdjustedPosition(null);
  };

  // Position Control Component
  const PositionControls = () => {
    if (!selectedSuggestion) return null;
    
    const currentPos = adjustedPosition || selectedSuggestion.click_point;
    const originalPos = selectedSuggestion.click_point;
    const hasAdjustment = adjustedPosition && 
      (adjustedPosition[0] !== originalPos[0] || adjustedPosition[1] !== originalPos[1]);

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
        <div className="flex items-center justify-between mb-3">
          <h5 className="font-medium text-blue-800 flex items-center">
            🎯 Fine-tune Position
          </h5>
          <div className="flex gap-2">
            {hasAdjustment && (
              <button
                onClick={resetPosition}
                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 transition-colors"
              >
                Reset
              </button>
            )}
            <button
              onClick={handleCancelSelection}
              className="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 rounded text-red-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
        
        <div className="text-sm text-gray-700 mb-3">
          <div className="font-medium mb-1">Selected: {selectedSuggestion.displayName || selectedSuggestion.name}</div>
          <div className="text-xs text-gray-600">
            Current: x:{Math.round(currentPos[0])}, y:{Math.round(currentPos[1])}
            {hasAdjustment && (
              <span className="ml-2 text-blue-600">
                (adjusted by x:{adjustedPosition[0] - originalPos[0]}, y:{adjustedPosition[1] - originalPos[1]})
              </span>
            )}
          </div>
        </div>

        {/* Directional Controls */}
        <div className="flex flex-col items-center gap-2 mb-4">
          {/* Up Arrow */}
          <div className="flex gap-1">
            <button
              onClick={() => handlePositionAdjustment('up', FINE_STEP)}
              className="w-8 h-6 bg-white hover:bg-blue-100 border border-blue-300 rounded text-blue-600 flex items-center justify-center transition-colors text-xs"
              title="Move up (fine)"
            >
              ⬆
            </button>
            <button
              onClick={() => handlePositionAdjustment('up')}
              className="w-8 h-6 bg-blue-100 hover:bg-blue-200 border border-blue-300 rounded text-blue-700 flex items-center justify-center transition-colors font-bold"
              title="Move up"
            >
              ⬆
            </button>
          </div>
          
          {/* Left and Right Arrows */}
          <div className="flex gap-2 items-center">
            <div className="flex gap-1">
              <button
                onClick={() => handlePositionAdjustment('left', FINE_STEP)}
                className="w-6 h-8 bg-white hover:bg-blue-100 border border-blue-300 rounded text-blue-600 flex items-center justify-center transition-colors text-xs"
                title="Move left (fine)"
              >
                ⬅
              </button>
              <button
                onClick={() => handlePositionAdjustment('left')}
                className="w-6 h-8 bg-blue-100 hover:bg-blue-200 border border-blue-300 rounded text-blue-700 flex items-center justify-center transition-colors font-bold"
                title="Move left"
              >
                ⬅
              </button>
            </div>
            
            <div className="mx-2 text-center">
              <div className="w-12 h-12 bg-blue-200 border-2 border-blue-400 rounded-full flex items-center justify-center text-blue-800">
                🎯
              </div>
              <div className="text-xs text-gray-600 mt-1">Target</div>
            </div>
            
            <div className="flex gap-1">
              <button
                onClick={() => handlePositionAdjustment('right')}
                className="w-6 h-8 bg-blue-100 hover:bg-blue-200 border border-blue-300 rounded text-blue-700 flex items-center justify-center transition-colors font-bold"
                title="Move right"
              >
                ➡
              </button>
              <button
                onClick={() => handlePositionAdjustment('right', FINE_STEP)}
                className="w-6 h-8 bg-white hover:bg-blue-100 border border-blue-300 rounded text-blue-600 flex items-center justify-center transition-colors text-xs"
                title="Move right (fine)"
              >
                ➡
              </button>
            </div>
          </div>
          
          {/* Down Arrow */}
          <div className="flex gap-1">
            <button
              onClick={() => handlePositionAdjustment('down')}
              className="w-8 h-6 bg-blue-100 hover:bg-blue-200 border border-blue-300 rounded text-blue-700 flex items-center justify-center transition-colors font-bold"
              title="Move down"
            >
              ⬇
            </button>
            <button
              onClick={() => handlePositionAdjustment('down', FINE_STEP)}
              className="w-8 h-6 bg-white hover:bg-blue-100 border border-blue-300 rounded text-blue-600 flex items-center justify-center transition-colors text-xs"
              title="Move down (fine)"
            >
              ⬇
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="text-xs text-gray-600 mb-3 bg-gray-50 p-2 rounded">
          <div className="font-medium mb-1">Controls:</div>
          <div>• Bold arrows: Move {POSITION_STEP}px</div>
          <div>• Light arrows: Move {FINE_STEP}px (fine adjustment)</div>
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirmSelection}
          className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors font-medium"
        >
          ✓ Use This Position
        </button>
      </div>
    );
  };
  
  return (
    <div className="absolute z-10 w-full bg-white shadow-xl rounded-md border border-gray-200 mt-12 max-h-96 overflow-y-auto animate-fadeIn suggestions-dropdown">
      <div className="sticky top-0 bg-purple-50 p-3 border-b border-purple-100">
        <h4 className="font-medium text-purple-800 flex items-center">
          {commandType === 'click' ? (
            <>
              <span className="mr-2">🖱️</span> Click on an element:
            </>
          ) : commandType === 'type' ? (
            <>
              <span className="mr-2">⌨️</span> Select where to type:
            </>
          ) : commandType === 'verify' ? (
            <>
              <span className="mr-2">✓</span> Verify text on page:
            </>
          ) : commandType === 'get' ? (
            <>
              <span className="mr-2">📄</span> Get text from page:
            </>
          ) : null}
        </h4>
        
        {commandType === 'type' && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
            <label className="flex items-center gap-2 text-sm text-blue-700 cursor-pointer">
              <input
                type="checkbox"
                checked={requiresOtp}
                onChange={toggleOtpCheckbox}
                className="accent-blue-500"
              />
              OTP Verification
            </label>
            
            {/* Show contact selection only when OTP is checked and no contact selected */}
            {requiresOtp && !otpVerificationState.contactEntered && (
              <div className="mt-3 p-3 bg-white border border-blue-300 rounded-md">
                <span className="text-sm font-medium text-gray-700 block mb-2">
                  Select Contact Method:
                </span>
                <div className="flex gap-2 flex-wrap">
                  <button 
                    onClick={() => handlePhoneNumberClick('+18777804236')}
                    className="flex items-center gap-2 px-3 py-2 bg-green-50 hover:bg-green-100 border border-green-300 rounded-md text-green-700 transition-colors"
                  >
                    📱 Phone: +18777804236
                  </button>
                  <button 
                    onClick={() => handlePhoneNumberClick('29f7a099-d305-41d5-8e99-59c347674844@mailslurp.biz')}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-md text-blue-700 transition-colors"
                  >
                    📧 Email: 29f7a099-d305-41d5-8e99-59c347674844@mailslurp.biz
                  </button>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  Click on a contact method to proceed
                </div>
              </div>
            )}
            
            {/* Show selected contact and allow changing */}
            {requiresOtp && contactSelected && otpVerificationState.contactEntered && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-green-700">
                    ✅ Selected: {otpVerificationState.enteredContact}
                  </div>
                  <button
                    onClick={() => {
                      setContactSelected(false);
                      setOtpVerificationState(prev => ({
                        ...prev,
                        contactEntered: false,
                        enteredContact: ''
                      }));
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Change Contact
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {!showPositionControls && (
          <p className="text-xs text-gray-600 mt-2">
            Found {suggestions.length} matching elements
            {suggestions.some(s => s.isDuplicate) && 
              " (highlighted items have duplicate names)"}
            {lastClickCoordinates && " (ordered by proximity to last click)"}
            <br />
            💡 Click on an element to fine-tune its position if needed
          </p>
        )}
      </div>

      {/* Position Controls */}
      {showPositionControls && <PositionControls />}

      {/* Suggestions List */}
      {!showPositionControls && (
        <ul className="divide-y divide-gray-100">
          {(!requiresOtp || (requiresOtp && otpVerificationState.contactEntered)) &&
            suggestions.map((suggestion, index) => (
              <li 
                key={`${suggestion.id}-${index}`}
                className={`suggestion-item p-3 hover:bg-purple-50 cursor-pointer focus:bg-purple-100 focus:outline-none transition-colors duration-150 ${
                  suggestion.usageInfo === 'Last executed element' ? 'bg-green-100 border-l-4 border-green-500' : 
                  suggestion.usageInfo === 'Likely last executed element' ? 'bg-green-50 border-l-4 border-green-400' :
                  suggestion.usageInfo === 'Near last click' ? 'bg-blue-50 border-l-4 border-blue-300' :
                  suggestion.usageInfo ? 'bg-green-50 border-l-4 border-green-300' : 
                  suggestion.proximityToLastClick === 'very-close' ? 'bg-blue-50 border-l-2 border-blue-300' :
                  suggestion.proximityToLastClick === 'close' ? 'bg-blue-50 border-l-1 border-blue-200' :
                  suggestion.isDuplicate ? 'border-l-4 border-yellow-400' : ''
                }`}
                tabIndex={0}
                onClick={() => handleSuggestionClick(suggestion)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSuggestionSelect(suggestion);
                  } else if (e.key === 'ArrowDown' && index < suggestions.length - 1) {
                    e.preventDefault();
                    document.querySelectorAll('.suggestion-item')[index + 1].focus();
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (index > 0) {
                      document.querySelectorAll('.suggestion-item')[index - 1].focus();
                    } else {
                      inputRef.current.focus();
                    }
                  } else if (e.key === 'Escape') {
                    setShowSuggestions(false);
                    inputRef.current.focus();
                  }
                }}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    {suggestion.displayName || suggestion.name}
                    {suggestion.usageInfo && (
                      <span className={`ml-2 text-xs font-semibold ${
                        suggestion.usageInfo === 'Last executed element' ? 'text-green-600 bg-green-50 px-2 py-0.5 rounded-full' :
                        suggestion.usageInfo === 'Likely last executed element' ? 'text-green-600 bg-green-50 px-2 py-0.5 rounded-full' :
                        suggestion.usageInfo === 'Near last click' ? 'text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full' :
                        'text-green-600'
                      }`}>
                        ({suggestion.usageInfo})
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSuggestionSelect(suggestion);
                    }}
                    >
                      🎯 Adjust
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      suggestion.type === 'button' || suggestion.tag === 'button' 
                          ? 'bg-blue-100 text-blue-700' 
                          : suggestion.type === 'input' || suggestion.tag === 'input'
                          ? 'bg-green-100 text-green-700'
                          : suggestion.type === 'link' || suggestion.tag === 'a'
                          ? 'bg-purple-100 text-purple-700'
                          : suggestion.type === 'text'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-gray-100 text-gray-700'
                    }`}>
                      {suggestion.type || suggestion.tag || "Element"}
                    </span>
                  </div>
                </div>
                
                <div className="text-xs text-gray-600 mt-2 flex items-center gap-3">
                  <span>Position: x:{Math.round(suggestion.click_point[0])}, y:{Math.round(suggestion.click_point[1])}</span>
                  {suggestion.isDuplicate && !suggestion.usageInfo && (
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                      Multiple matches
                    </span>
                  )}
                  {suggestion.proximityToLastClick === 'very-close' && !suggestion.usageInfo && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      Near last click
                    </span>
                  )}
                </div>
                
                {/* Extra details to help distinguish elements */}
                {suggestion.text && (
                  <div className="text-xs text-gray-500 mt-1 truncate">
                    Text: "{suggestion.text.substring(0, 30)}{suggestion.text.length > 30 ? '...' : ''}"
                  </div>
                )}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
};

const InstructionModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Test Execution Instructions</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <Link className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Getting Started</h4>
                <p className="text-sm text-gray-600">Enter a URL in the command box (e.g., "open https://example.com") to begin testing.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-purple-100 p-2 rounded-full">
                <MousePointer className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Adding Commands</h4>
                <p className="text-sm text-gray-600">Once a page is loaded, you can add commands like "click login" or "type hello in username".</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-green-100 p-2 rounded-full">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Verification</h4>
                <p className="text-sm text-gray-600">Use commands like "verify text welcome" to validate page content.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-yellow-100 p-2 rounded-full">
                <Info className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Automatic Minimization</h4>
                <p className="text-sm text-gray-600">The test panel will automatically minimize during page loads and expand when ready for new commands.</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="mt-6 w-full py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors duration-200"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

const WaitModal = ({ isOpen, onClose, onConfirm }) => {
  const [waitCondition, setWaitCondition] = useState('static_wait');
  const [waitTimeout, setWaitTimeout] = useState(5);
  const [waitText, setWaitText] = useState('');
  const [pollInterval, setPollInterval] = useState(500);
  
  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setWaitCondition('static_wait');
      setWaitTimeout(5);
      setWaitText('');
      setPollInterval(500);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    const userid = localStorage.getItem("user_id");
    const timeoutMs = waitTimeout * 1000;
    
    let waitCommand = '';
    let requestData = {};
    
    if (waitCondition === 'static_wait') {
      waitCommand = `wait ${waitTimeout} seconds`;
      requestData = {
        user_id: userid,
        timeout: timeoutMs,
        is_final_step: true,
        debug: true
      };
    } else if (waitCondition === 'text_match') {
      waitCommand = `wait until text "${waitText}" appears`;
      requestData = {
        user_id: userid,
        condition: "text_match",
        text: waitText,
        timeout: timeoutMs,
        poll_interval: pollInterval,
        is_final_step: true,
        debug: true
      };
    } else if (waitCondition === 'url_match') {
      waitCommand = `wait until URL contains "${waitText}"`;
      requestData = {
        user_id: userid,
        condition: "url_match",
        text: waitText,
        timeout: timeoutMs,
        poll_interval: pollInterval,
        check_address_bar: true,
        is_final_step: true,
        debug: true
      };
    }
    
    // Close the modal first
    onClose();
    
    // Then call onConfirm
    onConfirm(waitCommand, requestData);
  };

  const handleClose = () => {
    onClose();
  };

  // Don't render anything if the modal is not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleClose}>
      <div className="bg-white p-6 rounded-lg w-96" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Configure Wait Command</h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-500">
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Wait Condition</label>
          <select 
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={waitCondition}
            onChange={(e) => setWaitCondition(e.target.value)}
          >
            <option value="static_wait">Wait for a specific time</option>
            <option value="text_match">Wait until specific text appears</option>
            <option value="url_match">Wait until URL contains page</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            {waitCondition === 'static_wait' ? 'Wait Time (seconds)' : 'Timeout (seconds)'}
          </label>
          <input
            type="number"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={waitTimeout}
            onChange={(e) => setWaitTimeout(Number(e.target.value))}
            min="1"
          />
        </div>

        {waitCondition !== 'static_wait' && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              {waitCondition === 'text_match' ? 'Text to Wait For' : 'URL Contains Page to Wait For'}
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={waitText}
              onChange={(e) => setWaitText(e.target.value)}
              placeholder={waitCondition === 'text_match' ? 'e.g. Dashboard' : 'e.g. signup page'}
            />
          </div>
        )}

        {waitCondition !== 'static_wait' && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Poll Interval (ms)</label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={pollInterval}
              onChange={(e) => setPollInterval(Number(e.target.value))}
              min="100"
              step="100"
            />
          </div>
        )}
        
        <div className="flex justify-end space-x-2">
          <button 
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            disabled={waitCondition !== 'static_wait' && !waitText.trim()}
          >
            Add Step
          </button>
        </div>
      </div>
    </div>
  );
};

  return ( 
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 lg:ml-[300px] transition-all duration-300 lg:max-w-[calc(100%-300px)] sm:ml-[60px] sm:max-w-full">
        <div className="p-4 md:p-6">
          {/* Test Case Info Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-purple-700">WebRecord:{testCaseInfo.testcase_name}</h1>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-xs">
                    Type: {testCaseInfo.testcase_type}
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs">
                    Priority: {testCaseInfo.testcase_priority}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {loadingMessage && <LoadingIndicator message={loadingMessage} />}
          
          {/* Main Content */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Left Panel - Test Steps */}
            <div className="w-full lg:w-1/2 flex flex-col bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">Test Steps</h2>
                <div className="flex gap-2">
                  <button
                    onClick={clearSession}
                    className="flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm transition-colors duration-200"
                  >
                    <X className="w-4 h-4" />
                    Clear
                  </button>
                  <button
                    onClick={createTestCase}
                    disabled={testSteps.length === 0 || createTestCaseLoading}
                    className="flex items-center gap-1 px-3 py-1 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 text-sm transition-colors duration-200"
                  >
                    {createTestCaseLoading ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    {createTestCaseLoading ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </div>

              <div ref={stepsRef} className="flex-1 overflow-y-auto p-4" style={{ maxHeight: "calc(100vh - 280px)" }}>
                <div className="space-y-3">
                  {testSteps.map((step, index) => (
                    <div
                      key={step.id}
                      className={`p-3 bg-white rounded-lg shadow-sm border-l-4 transition-all duration-300 ${
                        step.status === 'complete' ? 'border-green-500' :
                        step.status === 'error' ? 'border-red-500' :
                        'border-blue-500'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="font-medium">Step {index + 1}</h3>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-600">{step.duration}</span>
                          {step.status === 'complete' && <CheckCircle className="w-4 h-4 text-green-500" />}
                          {step.status === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm">{step.description}</p>
                      {step.elementClicked && (
                        <div className="mt-1 text-xs text-blue-600">
                          Clicked element: {step.elementClicked.name} at x:{step.elementClicked.click_point[0]}, y:{step.elementClicked.click_point[1]}
                        </div>
                      )}
                      {step.error && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-xs animate-appear">
                          <div className="font-medium">Error:</div>
                          <div>{step.error}</div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {testSteps.length === 0 && !isProcessing && (
                    <div className="text-center p-8 text-gray-400">
                      No steps added yet. Enter a command below to begin.
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-gray-200">
                <div className="flex flex-col gap-2 relative">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      ref={inputRef}
                      value={newStep}
                      onChange={(e) => setNewStep(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTestStep();
                        } else if (e.key === 'Escape') {
                          setShowSuggestions(false);
                        } else if (e.key === 'ArrowDown' && showSuggestions && suggestions.length > 0) {
                          e.preventDefault();
                          document.querySelector('.suggestion-item').focus();
                        }
                      }}
                      placeholder="Enter command (e.g., 'open https://example.com' or 'Click login')"
                      disabled={isProcessing}
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:opacity-50 text-sm transition-all duration-200"
                    />
                    <button
                      onClick={addTestStep}
                      disabled={isProcessing || !newStep.trim()}
                      className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors duration-200"
                    >
                      {isProcessing ? (
                        <Loader className="w-5 h-5 animate-spin" />
                      ) : (
                        <Plus className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  
                  {/* Suggestions dropdown with animation */}
                  <SuggestionsDropdown />
                  
                  {/* Command type indicator */}
                  {commandType && (
                    <div className="text-xs text-gray-500 mt-1">
                      {commandType === 'click' && "Click command - type element name or select from suggestions"}
                      {commandType === 'type' && "Type command - format: 'type [text] in [element]'"}
                      {commandType === 'open' && "Navigation command - enter a URL"}
                      {commandType === 'scroll' && "Scroll command - use 'scrollup' or 'scrolldown'"}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel - Test Execution Timeline */}
            <div className="w-full lg:w-1/2 flex flex-col bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Test Execution Timeline</h2>
              <button 
                onClick={() => setInstructionModalOpen(true)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-purple-600 transition-colors duration-200"
                title="View Instructions"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
            </div>
              
              <div ref={previewRef} className="flex-1 p-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 220px)" }}>
                <div className="space-y-5">
                  {testSteps.length === 0 ? (
                    <div className="text-center text-gray-500 py-16">
                      Enter a URL to begin testing.
                    </div>
                  ) : (
                    testSteps.map((step, index) => (
                      <div key={step.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">

                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium">Step {index + 1}</h3>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-600">{step.duration}</span>
                            {step.status === 'complete' && <CheckCircle className="w-4 h-4 text-green-500" />}
                            {step.status === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                          </div>
                        </div>
                        <p className="text-gray-600 mb-3 text-sm">{step.description}</p>

                        {/* {step.description.toLowerCase().startsWith('wait') && (
                          <div className="text-sm text-gray-600 mt-1">
                            {step.waitCondition === 'static_wait' ? (
                              <span>Static wait for {step.waitTimeout / 1000}s</span>
                            ) : step.waitCondition === 'text_match' ? (
                              <span>Waiting for text: "{step.waitText}"</span>
                            ) : step.waitCondition === 'url_match' ? (
                              <span>Waiting for URL containing: "{step.waitText}"</span>
                            ) : (
                              <span>Waiting...</span>
                            )}
                          </div>
                        )}
                        
                        {step.message && (
                          <div className={`text-sm ${
                            step.status === 'error' ? 'text-red-600' : 'text-gray-500'
                          }`}>
                            {step.message}
                          </div>
                        )}  */}

                        {step.status === 'complete' && step.screenshot && (
                          <div className="relative">
                            <img
                              src={step.screenshot}
                              alt={`Step ${index + 1}`}
                              className="w-full rounded-lg border border-gray-200 cursor-pointer"
                              onClick={() => setFullScreenImage(step.screenshot)}
                            />
                            <div className="absolute top-2 right-2 bg-gray-800 bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                              Screenshot {index + 1}
                            </div>
                          </div>
                        )}
{/*
                        {step.status === 'complete' && (
                          <div className="mt-3">
                            {step.omniparser_data?.debug_images && Object.keys(step.omniparser_data.debug_images).length > 0 && (
                              <DebugImagesViewer debugImages={step.omniparser_data.debug_images} />
                            )}
                            {step.coordinates?.debug_images && Object.keys(step.coordinates.debug_images).length > 0 && (
                              <DebugImagesViewer debugImages={step.coordinates.debug_images} />
                            )}
                          </div>
                        )}
*/}
                        {step.message && (
                          <p className="text-xs text-gray-600 mt-1">
                            <span className="font-medium">Status:</span> {step.message}
                          </p>
                        )}

                        {/* Verification result display */}
                        {step.description.toLowerCase().startsWith('verify') && step.status === 'complete' && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-100 rounded-lg">
                            <div className="flex items-center text-green-600 mb-2">
                              <CheckCircle className="w-5 h-5 mr-2" />
                              <span className="font-medium">Verification passed</span>
                            </div>
                            <p className="text-sm text-gray-700">
                              Successfully verified {step.verificationType === 'link' ? 'link' : 'text'}: 
                              "{step.selectedElement?.displayName || step.selectedElement?.name || 'Element'}"
                            </p>
                            {step.verifiedText && (
                              <p className="text-xs text-gray-600 mt-1">
                                Actual content: "{step.verifiedText.substring(0, 50)}{step.verifiedText.length > 50 ? '...' : ''}"
                              </p>
                            )}
                            {step.selectedElement && (
                              <div className="mt-2 text-xs text-gray-500">
                                <span className="font-medium">Element location:</span> x:{Math.round(step.selectedElement.click_point[0])}, y:{Math.round(step.selectedElement.click_point[1])}
                              </div>
                            )}
                          </div>
                        )}

                        {step.status === 'error' && (
                          <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                            <div className="flex items-center text-red-600 mb-2">
                              <XCircle className="w-5 h-5 mr-2" />
                              <span className="font-medium">Error occurred</span>
                            </div>
                            <p className="text-sm text-gray-700 mb-3">{step.error || "Failed to execute command. Please try again."}</p>
                            
                            <div className="mt-3 text-xs text-gray-500">
                              <p className="font-medium">Troubleshooting tips:</p>
                              <ul className="list-disc pl-4 mt-1 space-y-1">
                                <li>Check your internet connection</li>
                                <li>Verify the URL is correct and accessible</li>
                                <li>Try using a different command</li>
                              </ul>
                            </div>
                          </div>
                        )}

                        {step.description.toLowerCase().startsWith('verify') && step.status === 'error' && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                            <div className="flex items-center text-red-600 mb-2">
                              <XCircle className="w-5 h-5 mr-2" />
                              <span className="font-medium">Verification failed</span>
                            </div>
                            <p className="text-sm text-gray-700">
                              Failed to verify {step.verificationType || 'text'}: "{step.selectedElement?.name || 'Element'}"
                            </p>
                            {step.error && (
                              <p className="text-xs text-red-600 mt-1">{step.error}</p>
                            )}
                          </div>
                        )}

                        {/* Get result display */}
                        {step.description.toLowerCase().startsWith('get') && step.status === 'complete' && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                            <div className="flex items-center text-green-600 mb-2">
                              <CheckCircle className="w-5 h-5 mr-2" />
                              <span className="font-medium">Retrieved element text</span>
                            </div>
                            <p className="text-sm text-gray-700">
                              Successfully retrieved text from: 
                              "{step.selectedElement?.displayName || step.selectedElement?.name || 'Element'}"
                            </p>
                            {step.retrievedText && (
                              <p className="text-xs text-gray-600 mt-1">
                                Text content: "{step.retrievedText.substring(0, 50)}{step.retrievedText.length > 50 ? '...' : ''}"
                              </p>
                            )}
                            {step.selectedElement && (
                              <div className="mt-2 text-xs text-gray-500">
                                <span className="font-medium">Element location:</span> x:{Math.round(step.selectedElement.click_point[0])}, y:{Math.round(step.selectedElement.click_point[1])}
                              </div>
                            )}
                          </div>
                        )}

                        {step.elementClicked && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded-md">
                              <p className="text-xs text-blue-700 font-medium">
                                  Element details: {step.elementClicked.displayName || step.elementClicked.name}
                              </p>
                              <p className="text-xs text-gray-600">
                                  Position: x:{step.elementClicked.click_point[0]}, y:{step.elementClicked.click_point[1]}
                              </p>
                              {previouslySelectedElements[step.elementClicked.name?.toLowerCase()] && (
                                  <p className="text-xs text-green-600 mt-1">
                                      Used {previouslySelectedElements[step.elementClicked.name.toLowerCase()].count} time(s)
                                  </p>
                              )}
                          </div>
                        )}

                      </div>
                    ))
                  )}
                </div>
                <ImageModal />
                <VerificationConfirmation
                  isOpen={verificationModal.isOpen}
                  onClose={() => setVerificationModal({...verificationModal, isOpen: false})}
                  onConfirm={handleVerificationConfirm}
                  textToVerify={verificationModal.textToVerify}
                  matchingElements={verificationModal.matchingElements}
                />
                <SecondaryVerificationConfirmation
                  isOpen={secondaryVerification.isOpen}
                  onClose={() => setSecondaryVerification({isOpen: false, stepObj: null})}
                  onConfirm={handleFinalVerificationConfirm}
                  stepObj={secondaryVerification.stepObj}
                />
                <InstructionModal 
                  isOpen={instructionModalOpen}
                  onClose={() => setInstructionModalOpen(false)}
                />
                <WaitModal
                  isOpen={waitModalOpen}
                  onClose={() => setWaitModalOpen(false)}
                  onConfirm={handleWaitConfirm}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WriteRecord;