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


/*

import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Play, AlertCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const TestEnvironmentConfig = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { testCaseName, testCaseId, projectId } = location.state || {};
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [os, setOs] = useState("windows");
  const [browser, setBrowser] = useState("chrome");
  const [testUrl, setTestUrl] = useState("");
  const [testSteps, setTestSteps] = useState([]);
  const [loadingSteps, setLoadingSteps] = useState(false);

  const osOptions = {
    windows: "Windows",
    macos: "macOS",
    linux: "Linux"
  };

  const browserOptions = useMemo(() => ({
    windows: ["chrome", "firefox", "edge"],
    macos: ["chrome", "firefox", "safari"],
    linux: ["chrome", "firefox"]
  }), []);


  useEffect(() => {
    if (!browserOptions[os].includes(browser)) {
      setBrowser(browserOptions[os][0]);
    }
  }, [os, browser, browserOptions]);

  useEffect(() => {
    const fetchTestUrl = async () => {
      try {
        const response = await fetch(`https://api.testerally.ai/api/testdata/${projectId}/`);
        if (!response.ok) throw new Error('Failed to fetch test URL');
        const data = await response.json();
        setTestUrl(data.url || '');
      } catch (err) {
        console.error('Error fetching test URL:', err);
      }
    };

    const fetchTestSteps = async () => {
      setLoadingSteps(true);
      try {
        const response = await fetch(`https://api.testerally.ai/api/teststeps/?testcase_id=${testCaseId}`);
        if (!response.ok) throw new Error('Failed to fetch test steps');
        const data = await response.json();
        setTestSteps(data.sort((a, b) => a.step_number - b.step_number));
      } catch (err) {
        console.error('Error fetching test steps:', err);
      } finally {
        setLoadingSteps(false);
      }
    };

    if (projectId) fetchTestUrl();
    if (testCaseId) fetchTestSteps();
  }, [projectId, testCaseId]);

  const handleExecuteTest = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!testUrl) {
        throw new Error("No URL configured for this project");
      }

      const requestBody = {
        os,
        browser,
        url: testUrl
      };

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
      setError(err.message || 'Failed to execute test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 lg:ml-[300px] transition-all duration-300 lg:max-w-[calc(100%-300px)] sm:ml-[60px] sm:max-w-full">
        <div className="p-6">
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Test Steps
        </button>

        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900">Test Environment Configuration</h1>
              <p className="mt-2 text-sm text-gray-600">Configure and execute test case: {testCaseName}</p>
            </div>
          </div>
          
          <div className="p-6 space-y-8">
            {error && (
              <div className="flex items-center gap-2 p-4 text-red-600 bg-red-50 rounded-md">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <section className="space-y-6">
              <div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Operating System
                    </label>
                    <select
                      value={os}
                      onChange={(e) => setOs(e.target.value)}
                      className="w-full p-2.5 bg-white border border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    >
                      {Object.entries(osOptions).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
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
                      className="w-full p-2.5 bg-white border border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    >
                      {browserOptions[os].map((browserOption) => (
                        <option key={browserOption} value={browserOption}>
                          {browserOption.charAt(0).toUpperCase() + browserOption.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Test URL</h2>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                  {testUrl ? (
                    <code className="text-sm text-gray-800">{testUrl}</code>
                  ) : (
                    <p className="text-gray-500">No URL configured for this project</p>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Steps</h2>
                {loadingSteps ? (
                  <div className="text-center py-8 text-gray-600">Loading test steps...</div>
                ) : (
                  <div className="space-y-3 border border-gray-200 rounded-md divide-y divide-gray-200">
                    {testSteps.map((step) => (
                      <div
                        key={step.id}
                        className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors"
                      >
                        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-purple-100 text-purple-600 font-medium">
                          {step.step_number}
                        </span>
                        <div className="flex-1 text-gray-700 break-words">
                          {step.step_description}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                onClick={handleExecuteTest}
                disabled={loading}
                className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Play className="w-4 h-4 mr-2" />
                {loading ? "Executing Test..." : "Execute Test"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div></div></div></div>
  );
};

export default TestEnvironmentConfig;

*/