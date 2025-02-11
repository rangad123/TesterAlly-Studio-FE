/*
import React, { useState, useMemo, useEffect } from 'react';
import { X, Play } from 'lucide-react';

const TestEnvironmentModal = ({ isOpen, onClose, onExecute, testCaseName, testCaseId, steps, projectId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [os, setOs] = useState("windows");
  const [browser, setBrowser] = useState("chrome");

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const osOptions = useMemo(() => ({
    windows: { name: "Windows", browsers: ["chrome", "firefox", "edge"] },
    macos: { name: "macOS", browsers: ["chrome", "firefox", "safari"] },
    linux: { name: "Linux", browsers: ["chrome", "firefox"] },
  }), []);

  const executeTest = async () => {
    try {
      setLoading(true);
      setError(null);

      const requestBody = {
        os,
        browser,
        testCaseId,
        projectId,
        steps
      };

      const response = await fetch('http://127.0.0.1:8000/api/execute-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to execute test');
      }

      const data = await response.json();
      console.log('Test execution response:', data);

      onClose();
      onExecute?.(data);
    } catch (err) {
      console.error('Error executing test:', err);
      setError(err.message || 'Failed to execute test. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black bg-opacity-50" 
        onClick={onClose}
      />

      <div className="relative bg-white rounded-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Execute Test: {testCaseName}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-sm hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4">
          {error && (
            <div className="p-3 mb-4 text-sm bg-red-50 text-red-600 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Operating System
              </label>
              <select
                value={os}
                onChange={(e) => setOs(e.target.value)}
                className="mt-1 w-full p-2 bg-white border border-gray-300 rounded-md"
              >
                {Object.entries(osOptions).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Browser
              </label>
              <select
                value={browser}
                onChange={(e) => setBrowser(e.target.value)}
                className="mt-1 w-full p-2 bg-white border border-gray-300 rounded-md"
              >
                {osOptions[os].browsers.map((browserOption) => (
                  <option key={browserOption} value={browserOption}>
                    {browserOption.charAt(0).toUpperCase() + browserOption.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={executeTest}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:bg-purple-400"
            >
              <Play className="w-4 h-4 mr-2" />
              {loading ? "Executing..." : "Execute Test"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestEnvironmentModal;





*/

import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Play } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const TestEnvironmentConfig = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { testCaseName, steps } = location.state || {};
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [os, setOs] = useState("windows");
  const [browser, setBrowser] = useState("chrome");



  const osOptions = useMemo(() => ({
    windows: { name: "Windows", browsers: ["chrome", "firefox", "edge"] },
    macos: { name: "macOS", browsers: ["chrome", "firefox", "safari"] },
    linux: { name: "Linux", browsers: ["chrome", "firefox"] },
  }), []);


  useEffect(() => {
    const availableBrowsers = osOptions[os].browsers;
    if (!availableBrowsers.includes(browser)) {
      setBrowser(availableBrowsers[0]);
    }
  }, [os, browser, osOptions]);

  const handleExecuteTest = async () => {
    try {
      setLoading(true);
      setError(null);

      const firstStep = steps?.[0];
      if (!firstStep?.step_description) {
        throw new Error("No URL found in test steps");
      }

      let url = firstStep.step_description.trim();

      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        throw new Error("Invalid URL: URL must start with http:// or https://");
      }

      const requestBody = {
        os: os,
        browser: browser,
        url: url
      };

      console.log('Sending request with body:', requestBody);

      const response = await fetch('http://127.0.0.1:8000/api/open-browser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to open browser');
      }

      const data = await response.json();
      console.log('Response:', data);
      alert('Browser opened successfully!');
      
    } catch (err) {
      console.error('Error executing test:', err);
      setError(err.message || 'Failed to execute test. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6 min-h-screen bg-gray-50">
      <div className="flex-1 lg:ml-[300px] transition-all duration-300 lg:max-w-[calc(100%-300px)] sm:ml-[60px] sm:max-w-full">
        <div className="p-6">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Test Steps
          </button>

          <div className="bg-white shadow-md rounded-lg">
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">
                Run Test: {testCaseName}
              </h1>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
                  {error}
                </div>
              )}

              <div className="grid gap-6">
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Test Environment
                  </h2>

                  <div className="grid gap-4">

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Operating System
                      </label>
                      <select
                        value={os}
                        onChange={(e) => setOs(e.target.value)}
                        className="w-full p-2 bg-gray-50 border border-gray-300 rounded-md"
                      >
                        {Object.entries(osOptions).map(([key, value]) => (
                          <option key={key} value={key}>
                            {value.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Browser
                      </label>
                      <select
                        value={browser}
                        onChange={(e) => setBrowser(e.target.value)}
                        className="w-full p-2 bg-gray-50 border border-gray-300 rounded-md"
                      >
                        {osOptions[os].browsers.map((browserOption) => (
                          <option key={browserOption} value={browserOption}>
                            {browserOption.charAt(0).toUpperCase() + browserOption.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        URL to Test (from Step 1)
                      </label>
                      <div className="p-2 bg-gray-50 border border-gray-300 rounded-md">
                        {steps?.[0]?.step_description || 'No URL found'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6">
                  <button
                    onClick={handleExecuteTest}
                    disabled={loading}
                    className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {loading ? "Executing Test..." : "Execute Test"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestEnvironmentConfig;