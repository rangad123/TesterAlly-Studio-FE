/*
import React, { useState, useEffect } from 'react';
import { ChevronRight, Check, Camera } from 'lucide-react';

const TestExecution = () => {
  const [steps, setSteps] = useState([]);
  const [testCaseName, setTestCaseName] = useState('');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [executedSteps, setExecutedSteps] = useState([]);

  useEffect(() => {

    const storedSteps = sessionStorage.getItem('testSteps');
    const storedTestName = sessionStorage.getItem('testCaseName');
    
    if (storedSteps && storedTestName) {
      setSteps(JSON.parse(storedSteps));
      setTestCaseName(storedTestName);
    }
  }, []);

  const captureScreenshot = () => {
    return `/api/placeholder/800/600`;
  };

  const handleNextStep = async () => {
    if (currentStepIndex >= steps.length - 1) return;

    const screenshot = captureScreenshot();
    
    setExecutedSteps([
      ...executedSteps,
      {
        stepNumber: currentStepIndex + 1,
        screenshot,
        timestamp: new Date().toISOString()
      }
    ]);
    
    setCurrentStepIndex(prev => prev + 1);
  };


  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'n' && e.ctrlKey) {
        handleNextStep();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentStepIndex, steps]);

  return (
    <div className="flex h-screen">

      <div className="w-[300px] h-full bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">{testCaseName}</h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`p-4 border-b border-gray-200 ${
                index === currentStepIndex ? 'bg-purple-50 border-l-4 border-l-purple-600' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Step {index + 1}</span>
                <span className="text-sm text-gray-500">
                  {index < currentStepIndex ? (
                    <span className="text-green-600 flex items-center">
                      <Check className="w-4 h-4 mr-1" />
                      Completed
                    </span>
                  ) : index === currentStepIndex ? (
                    'In Progress'
                  ) : (
                    'Pending'
                  )}
                </span>
              </div>
              
              <p className="text-gray-700 mb-2">{step.step_description}</p>
              
              {executedSteps[index] && (
                <div className="relative mt-2">
                  <img
                    src={executedSteps[index].screenshot}
                    alt={`Step ${index + 1} result`}
                    className="w-full rounded-md shadow-sm"
                  />
                  <div className="absolute top-2 right-2">
                    <Camera className="w-5 h-5 text-gray-500" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {currentStepIndex < steps.length - 1 && (
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleNextStep}
              className="w-full py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center justify-center"
            >
              <span>Next Step</span>
              <ChevronRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        )}
      </div>

      <div className="ml-[300px] flex-1 h-full">
        {steps[0] && (
          <iframe
            src={steps[0].step_description.startsWith('http') 
              ? steps[0].step_description 
              : `https://${steps[0].step_description}`}
            className="w-full h-full border-none"
            title="Test Target"
          />
        )}
      </div>
    </div>
  );
};

export default TestExecution;

*/


import React, { useState, useEffect } from 'react';
import { Camera, Check, Loader, ArrowRight } from 'lucide-react';

const TestAutomationControl = () => {
  // State for managing execution
  const [executionStatus, setExecutionStatus] = useState({});
  const [currentStep, setCurrentStep] = useState(1); 
  const [isExecuting, setIsExecuting] = useState(false);

  const testSteps = [
    { 
      id: 1, 
      action: "navigate", 
      value: "https://www.claude.com", 
      description: "Open URL: https://www.claude.com",
      autoExecuted: true 
    },
    { 
      id: 2, 
      action: "click", 
      target: "Login button", 
      description: "Click on Login button",
      coordinates: { x: 100, y: 200 } 
    },
    { 
      id: 3, 
      action: "type", 
      target: "Username field", 
      value: "testuser", 
      description: "Enter username in the field",
      coordinates: { x: 150, y: 250 } 
    },
    { 
      id: 4, 
      action: "type", 
      target: "Password field", 
      value: "password123", 
      description: "Enter password in the field",
      coordinates: { x: 150, y: 300 } 
    },
    { 
      id: 5, 
      action: "click", 
      target: "Submit button", 
      description: "Click on Submit button",
      coordinates: { x: 200, y: 350 } 
    }
  ];

  // Auto-execute first step on component mount
  useEffect(() => {
    const autoExecuteFirstStep = async () => {
      // Simulate taking screenshot of opened browser
      const screenshot = `data:image/svg+xml,${encodeURIComponent(
        `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#f0f0f0"/>
          <text x="50%" y="50%" text-anchor="middle">Initial page load screenshot</text>
        </svg>`
      )}`;

      setExecutionStatus(prev => ({
        ...prev,
        1: {
          status: 'completed',
          screenshot,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
    };

    autoExecuteFirstStep();
  }, []);

  // Simulate executing a step
  const executeStep = async (step) => {
    setIsExecuting(true);

    try {
      // Simulate PyAutoGUI action
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate taking screenshot after action
      const screenshot = `data:image/svg+xml,${encodeURIComponent(
        `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#f0f0f0"/>
          <text x="50%" y="50%" text-anchor="middle">Screenshot after ${step.description}</text>
        </svg>`
      )}`;

      setExecutionStatus(prev => ({
        ...prev,
        [step.id]: {
          status: 'completed',
          screenshot,
          timestamp: new Date().toLocaleTimeString()
        }
      }));

      setCurrentStep(prev => prev + 1);
    } catch (error) {
      setExecutionStatus(prev => ({
        ...prev,
        [step.id]: {
          status: 'failed',
          error: error.message,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left Panel - Test Control & Results */}
      <div className="w-1/3 p-4 overflow-y-auto border-r bg-white">
        <h2 className="text-xl font-bold mb-4">Test Execution</h2>
        
        {testSteps.map((step, index) => (
          <div 
            key={step.id}
            className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                {executionStatus[step.id]?.status === 'completed' ? (
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                ) : currentStep === index && isExecuting ? (
                  <Loader className="w-5 h-5 text-blue-500 mr-2 animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-gray-400 mr-2" />
                )}
                <span className="font-medium">
                  Step {step.id}: {step.description}
                </span>
              </div>
              {executionStatus[step.id]?.timestamp && (
                <span className="text-xs text-gray-500">
                  {executionStatus[step.id].timestamp}
                </span>
              )}
            </div>

            {/* Show coordinate info */}
            {step.coordinates && executionStatus[step.id]?.status === 'completed' && (
              <div className="text-sm text-gray-500 mt-1">
                Action at: x={step.coordinates.x}, y={step.coordinates.y}
              </div>
            )}

            {/* Show screenshot if available */}
            {executionStatus[step.id]?.screenshot && (
              <div className="mt-2">
                <img 
                  src={executionStatus[step.id].screenshot}
                  alt={`Step ${step.id} result`}
                  className="w-full h-32 object-cover rounded border border-gray-200"
                />
              </div>
            )}

            {/* Show execute button only for non-auto-executed steps */}
            {!step.autoExecuted && currentStep === index && !isExecuting && (
              <button
                onClick={() => executeStep(step)}
                className="mt-2 w-full py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center justify-center"
                disabled={isExecuting}
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Execute Next Step
              </button>
            )}

            {/* Show error if step failed */}
            {executionStatus[step.id]?.status === 'failed' && (
              <div className="mt-2 text-red-500 text-sm">
                Error: {executionStatus[step.id].error}
              </div>
            )}
          </div>
        ))}

        {currentStep >= testSteps.length && (
          <div className="p-4 bg-green-50 text-green-700 rounded-lg">
            Test execution completed successfully!
          </div>
        )}
      </div>

      {/* Right Panel - Live Browser View Notice */}
      <div className="w-2/3 p-4">
        <div className="w-full h-full flex flex-col items-center justify-center bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">External Browser Window</h3>
          <p className="text-gray-600 text-center">
            The actual website is open in an external browser window. <br/>
            This tool controls that window using PyAutoGUI.
          </p>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">
              Current URL: {testSteps[0].value}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestAutomationControl;