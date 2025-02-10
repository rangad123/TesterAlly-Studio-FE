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
  const [serverStatus, setServerStatus] = useState(null);


  const osOptions = useMemo(() => ({
    windows: { name: "Windows", browsers: ["chrome", "firefox", "edge"] },
    macos: { name: "macOS", browsers: ["chrome", "firefox", "safari"] },
    linux: { name: "Linux", browsers: ["chrome", "firefox"] },
  }), []);


  useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/health-check', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          setServerStatus('connected');
        } else {
          setServerStatus('error');
        }
      } catch (err) {
        setServerStatus('error');
      }
    };

    checkServer();
  }, []);

  useEffect(() => {
    const availableBrowsers = osOptions[os].browsers;
    if (!availableBrowsers.includes(browser)) {
      setBrowser(availableBrowsers[0]);
    }
  }, [os, browser, osOptions]);

  const handleExecuteTest = async () => {
    try {
      if (serverStatus === 'error') {
        throw new Error('Backend server is not running. Please start the server at http://127.0.0.1:8000');
      }

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

              {serverStatus === 'error' && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
                  Backend server is not running. Please start the server at http://127.0.0.1:8000
                </div>
              )}

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
                    {/* OS Selection */}
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

                    {/* Browser Selection */}
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

                    {/* Display URL from first step */}
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
                    disabled={loading || serverStatus === 'error'}
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