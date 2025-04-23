
import React, { useState, useEffect } from "react";
import { FaSearch, FaExclamationTriangle, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { Calendar, BarChart2, Download, RefreshCw } from 'lucide-react';

const Reports = () => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [testResults, setTestResults] = useState([]);
  const [activeTab, setActiveTab] = useState("suites");
  const [timeRange, setTimeRange] = useState("last7days");
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [stats, setStats] = useState({
    totalRuns: 0,
    passRate: 0,
    failRate: 0,
    pendingRate: 0
  });

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setLoading(false);
      return;
    }

    const savedProjectKey = `selectedProject_${userId}`;
    const savedProject = localStorage.getItem(savedProjectKey);

    if (savedProject) {
      try {
        const project = JSON.parse(savedProject);
        setSelectedProject(project);
      } catch (err) {
        console.error("Error parsing saved project:", err);
        localStorage.removeItem(savedProjectKey);
      }
    }

    const handleProjectChange = (event) => {
      const newProject = event.detail;
      setSelectedProject(newProject);
    };

    window.addEventListener("projectChanged", handleProjectChange);
    return () => window.removeEventListener("projectChanged", handleProjectChange);
  }, []);

  const fetchTestResults = React.useCallback(async () => {
    setLoading(true);
    try {
      if (!selectedProject?.id) {
        throw new Error("No project selected");
      }
      
      // Get localStorage data directly
      const localStorageKey = activeTab === "suites" ? 'testSuiteResults' : 'testCaseResults';
      const localData = JSON.parse(localStorage.getItem(localStorageKey) || '[]');
      
      console.log(`Raw localStorage data for ${activeTab}:`, localData);
      
      // Filter ONLY by date range, ignore project ID completely
      const filteredLocalData = localData.filter(item => {
        const itemDate = new Date(item.execution_date).toISOString().split('T')[0];
        const fromDate = dateRange.from;
        const toDate = dateRange.to;
        
        return itemDate >= fromDate && itemDate <= toDate;
      });
      
      console.log(`Filtered by date: ${filteredLocalData.length} results`);
      
      // Sort by execution date, most recent first
      const sortedData = filteredLocalData.sort((a, b) => 
        new Date(b.execution_date) - new Date(a.execution_date)
      );
      
      setTestResults(sortedData);
      calculateStats(sortedData);
      
    } catch (error) {
      console.error(`Error fetching ${activeTab} results:`, error);
      setTestResults([]);
      setStats({
        totalRuns: 0,
        passRate: 0,
        failRate: 0,
        pendingRate: 0
      });
    } finally {
      setLoading(false);
    }
  }, [activeTab, dateRange, selectedProject]);

  useEffect(() => {
    if (!selectedProject?.id) {
      setLoading(false);
      return;
    }

    fetchTestResults();
  }, [selectedProject, activeTab, timeRange, dateRange, fetchTestResults]);

  const calculateStats = (data) => {
    if (!data.length) {
      setStats({
        totalRuns: 0,
        passRate: 0,
        failRate: 0,
        pendingRate: 0
      });
      return;
    }

    const totalRuns = data.length;
    const passCount = data.filter(item => 
      item.status === "PASS" || item.status === "passed"
    ).length;
    const failCount = data.filter(item => 
      item.status === "FAIL" || item.status === "failed"
    ).length;
    const pendingCount = data.filter(item => 
      item.status === "PENDING" || item.status === "pending"
    ).length;

    setStats({
      totalRuns,
      passRate: Math.round((passCount / totalRuns) * 100),
      failRate: Math.round((failCount / totalRuns) * 100),
      pendingRate: Math.round((pendingCount / totalRuns) * 100)
    });
  };

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    const today = new Date();
    let fromDate;

    switch (range) {
      case "today":
        fromDate = new Date(today);
        break;
      case "last7days":
        fromDate = new Date(today);
        fromDate.setDate(today.getDate() - 7);
        break;
      case "last30days":
        fromDate = new Date(today);
        fromDate.setDate(today.getDate() - 30);
        break;
      case "last90days":
        fromDate = new Date(today);
        fromDate.setDate(today.getDate() - 90);
        break;
      default:
        fromDate = new Date(today);
        fromDate.setDate(today.getDate() - 7);
    }

    setDateRange({
      from: fromDate.toISOString().split('T')[0],
      to: today.toISOString().split('T')[0]
    });
  };

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
    setTimeRange("custom");
  };

  const handleExportReport = () => {
    if (!testResults.length) {
      alert("No results to export");
      return;
    }
    
    // Create a simple CSV export
    const headers = activeTab === "suites" ? 
      ['Test Suite', 'Execution Date', 'Status', 'Test Cases', 'Passed', 'Failed', 'Time (s)'] :
      ['Test Case', 'Execution Date', 'Status', 'Steps', 'Passed', 'Failed', 'Time (s)'];
    
    const rows = testResults.map(result => {
      if (activeTab === "suites") {
        return [
          result.name,
          new Date(result.execution_date).toLocaleString(),
          result.status,
          result.total_testcases || 0,
          result.passed_testcases || 0,
          result.failed_testcases || 0,
          result.execution_time || 0
        ];
      } else {
        return [
          result.name,
          new Date(result.execution_date).toLocaleString(),
          result.status,
          result.total_steps || 0,
          result.passed_steps || 0,
          result.failed_steps || 0,
          result.execution_time || 0
        ];
      }
    });
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activeTab}-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusIcon = (status) => {
    // Normalize status values
    const normalizedStatus = status?.toUpperCase();
    
    switch (normalizedStatus) {
      case "PASS":
      case "PASSED":
        return <FaCheckCircle className="text-green-500" />;
      case "FAIL":
      case "FAILED":
        return <FaTimesCircle className="text-red-500" />;
      case "PENDING":
        return <FaExclamationTriangle className="text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusClass = (status) => {
    const normalizedStatus = status?.toUpperCase();
    
    switch (normalizedStatus) {
      case "PASS":
      case "PASSED":
        return "text-green-700";
      case "FAIL":
      case "FAILED":
        return "text-red-700";
      case "PENDING":
        return "text-yellow-700";
      default:
        return "text-gray-700";
    }
  };

  const filteredResults = testResults.filter(
    result => result.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderSuiteResults = () => (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Test Suite
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Execution Date
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Test Cases
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Pass/Fail
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Execution Time
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {filteredResults.map((result, idx) => (
          <tr key={result.id || idx} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {result.name}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {formatDate(result.execution_date)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center">
                {getStatusIcon(result.status)}
                <span className={`ml-2 text-sm ${getStatusClass(result.status)}`}>
                  {result.status?.toUpperCase()}
                </span>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {result.total_testcases || 0}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              <span className="text-green-600 font-medium">{result.passed_testcases || 0}</span>
              {" / "}
              <span className="text-red-600 font-medium">{result.failed_testcases || 0}</span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {result.execution_time ? `${result.execution_time}s` : "N/A"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderTestCaseResults = () => (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Test Case
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Execution Date
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Test Steps
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Pass/Fail
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Execution Time
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {filteredResults.map((result, idx) => (
          <tr key={result.id || idx} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {result.name}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {formatDate(result.execution_date)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center">
                {getStatusIcon(result.status)}
                <span className={`ml-2 text-sm ${getStatusClass(result.status)}`}>
                  {result.status?.toUpperCase()}
                </span>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {result.total_steps || 0}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              <span className="text-green-600 font-medium">{result.passed_steps || 0}</span>
              {" / "}
              <span className="text-red-600 font-medium">{result.failed_steps || 0}</span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {result.execution_time ? `${result.execution_time}s` : "N/A"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  // Animation keyframes for counter effect
  const animateValue = (start, end, duration) => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const value = Math.floor(progress * (end - start) + start);
      return value;
    };
    return step;
  };

  // Custom hook for animated counters
  const useCounter = (end, duration = 1500) => {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
      let animationFrameId;
      let start = 0;
      let step = animateValue(start, end, duration);
      
      const updateCount = (timestamp) => {
        const value = step(timestamp);
        setCount(value);
        if (value < end) {
          animationFrameId = requestAnimationFrame(updateCount);
        }
      };
      
      animationFrameId = requestAnimationFrame(updateCount);
      return () => cancelAnimationFrame(animationFrameId);
    }, [end, duration]);
    
    return count;
  };

  // Animated counter values
  const animatedTotalRuns = useCounter(stats.totalRuns);
  const animatedPassRate = useCounter(stats.passRate);
  const animatedFailRate = useCounter(stats.failRate);
  const animatedPendingRate = useCounter(stats.pendingRate);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 lg:ml-[300px] transition-all duration-300 lg:max-w-[calc(100%-300px)] sm:ml-[60px] sm:max-w-full">
        <div className="p-6">
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="flex flex-col lg:flex-row justify-between items-center p-4 border-b">
              <div className="flex space-x-4 mb-4 sm:mb-0">
                <button 
                  className={`px-4 py-2 font-medium ${activeTab === "suites" ? "text-purple-600 border-b-2 border-purple-600" : "text-gray-500 hover:text-purple-600"}`}
                  onClick={() => setActiveTab("suites")}
                >
                  Test Suite Reports
                </button>
                <button 
                  className={`px-4 py-2 font-medium ${activeTab === "cases" ? "text-purple-600 border-b-2 border-purple-600" : "text-gray-500 hover:text-purple-600"}`}
                  onClick={() => setActiveTab("cases")}
                >
                  Test Case Reports
                </button>
              </div>
              <button
                onClick={handleExportReport}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 lg:mt-0 sm:mt-3"
              >
                <Download className="mr-2 w-4 h-4" />
                Export Report
              </button>
            </div>

            <div className="p-4 flex flex-col lg:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <h2 className="text-lg font-medium text-gray-700">
                {selectedProject ? `${activeTab === "suites" ? "Test Suite" : "Test Case"} Reports` : 'Select a Project'}
              </h2>
              {selectedProject && (
                <div className="relative w-full sm:w-64">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={`Search ${activeTab === "suites" ? "test suites" : "test cases"}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}
            </div>
          </div>

          {selectedProject && (
            <div className="bg-white rounded-lg shadow mb-6 p-4">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="flex flex-wrap mb-4 md:mb-0 gap-2">
                  <button
                    onClick={() => handleTimeRangeChange("today")}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                      timeRange === "today" ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => handleTimeRangeChange("last7days")}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                      timeRange === "last7days" ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Last 7 Days
                  </button>
                  <button
                    onClick={() => handleTimeRangeChange("last30days")}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                      timeRange === "last30days" ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Last 30 Days
                  </button>
                  <button
                    onClick={() => handleTimeRangeChange("last90days")}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                      timeRange === "last90days" ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Last 90 Days
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      name="from"
                      value={dateRange.from}
                      onChange={handleDateRangeChange}
                      className="px-3 py-1.5 border rounded-md text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">to</span>
                    <input
                      type="date"
                      name="to"
                      value={dateRange.to}
                      onChange={handleDateRangeChange}
                      className="px-3 py-1.5 border rounded-md text-sm"
                    />
                  </div>
                  <button
                    onClick={fetchTestResults}
                    className="px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm flex items-center justify-center"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          )}

          {selectedProject && (
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800">Test Execution Summary</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6">
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl shadow-sm overflow-hidden transition-all duration-500 hover:shadow-md">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-purple-100 p-3 rounded-lg">
                        <BarChart2 className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Trend</span>
                        <span className="text-green-500 text-sm font-medium">↑ 12%</span>
                      </div>
                    </div>
                    <h4 className="text-lg font-medium text-gray-700">Total Test Runs</h4>
                    <div className="flex items-baseline mt-2">
                      <p className="text-3xl font-bold text-gray-900 transition-all duration-1000">
                        {animatedTotalRuns}
                      </p>
                      <span className="ml-2 text-sm text-gray-500">executions</span>
                    </div>
                    <div className="mt-4 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div className="bg-purple-600 h-full rounded-full" style={{ width: '100%', transition: 'width 1s ease-in-out' }}></div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-sm overflow-hidden transition-all duration-500 hover:shadow-md">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-green-100 p-3 rounded-lg">
                        <FaCheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Trend</span>
                        <span className="text-green-500 text-sm font-medium">↑ 5%</span>
                      </div>
                    </div>
                    <h4 className="text-lg font-medium text-gray-700">Pass Rate</h4>
                    <div className="flex items-baseline mt-2">
                      <p className="text-3xl font-bold text-green-600 transition-all duration-1000">
                        {animatedPassRate}%
                      </p>
                      <span className="ml-2 text-sm text-gray-500">success</span>
                    </div>
                    <div className="mt-4 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div className="bg-green-500 h-full rounded-full" style={{ width: `${stats.passRate}%`, transition: 'width 1s ease-in-out' }}></div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-xl shadow-sm overflow-hidden transition-all duration-500 hover:shadow-md">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-red-100 p-3 rounded-lg">
                        <FaTimesCircle className="w-6 h-6 text-red-600" />
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Trend</span>
                        <span className="text-red-500 text-sm font-medium">↓ 3%</span>
                      </div>
                    </div>
                    <h4 className="text-lg font-medium text-gray-700">Fail Rate</h4>
                    <div className="flex items-baseline mt-2">
                      <p className="text-3xl font-bold text-red-600 transition-all duration-1000">
                        {animatedFailRate}%
                      </p>
                      <span className="ml-2 text-sm text-gray-500">failures</span>
                    </div>
                    <div className="mt-4 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div className="bg-red-500 h-full rounded-full" style={{ width: `${stats.failRate}%`, transition: 'width 1s ease-in-out' }}></div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl shadow-sm overflow-hidden transition-all duration-500 hover:shadow-md">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-yellow-100 p-3 rounded-lg">
                        <FaExclamationTriangle className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Trend</span>
                        <span className="text-yellow-500 text-sm font-medium">↓ 2%</span>
                      </div>
                    </div>
                    <h4 className="text-lg font-medium text-gray-700">Pending Rate</h4>
                    <div className="flex items-baseline mt-2">
                      <p className="text-3xl font-bold text-yellow-600 transition-all duration-1000">
                        {animatedPendingRate}%
                      </p>
                      <span className="ml-2 text-sm text-gray-500">pending</span>
                    </div>
                    <div className="mt-4 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div className="bg-yellow-500 h-full rounded-full" style={{ width: `${stats.pendingRate}%`, transition: 'width 1s ease-in-out' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="p-8 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
              </div>
            ) : !selectedProject ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 text-purple-600 mb-6">
                  <BarChart2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Project Selected</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Please select a project from the sidebar to view test results and analytics
                </p>
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 text-yellow-600 mb-6">
                  <FaExclamationTriangle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  No test results match your current search criteria. Try adjusting your filters or date range.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {activeTab === "suites" ? renderSuiteResults() : renderTestCaseResults()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;