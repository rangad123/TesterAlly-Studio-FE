import { useState, useEffect, useCallback } from 'react';

const SchedulerPage = () => {
  // API base URL for fetching data
  const apiBaseUrl = "http://127.0.0.1:8000/api";
  
  // State for schedules data
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for items selection
  const [testCases, setTestCases] = useState([]);
  const [testSuites, setTestSuites] = useState([]);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduleType, setScheduleType] = useState('one-time'); // one-time, daily, weekly, monthly
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [day, setDay] = useState('Monday');
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [selectedItems, setSelectedItems] = useState([]);
  const [itemType, setItemType] = useState('test-case'); // test-case or test-suite
  const [projectId, setProjectId] = useState(null);
  
  // Fetch user and project info from localStorage
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
        const projectData = JSON.parse(savedProject);
        setProjectId(projectData.id);
      } catch (err) {
        console.error("Error parsing saved project:", err);
        localStorage.removeItem(savedProjectKey);
      }
    }
  }, []);
  
  // Fetch schedules from API
  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBaseUrl}/schedules/?project_id=${projectId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch schedules");
      }
      
      const data = await response.json();
      
      // If API fails or returns no data, use mock data for demonstration
      if (!data || data.length === 0) {
        const mockSchedules = [
          {
            id: 1,
            title: "Daily Regression Tests",
            description: "Run regression test suite every morning",
            schedule_type: "daily",
            time: "08:00",
            item_type: "test-suite",
            items: ["Regression Suite"],
            next_run: "2025-05-20 08:00",
            status: "active"
          },
          {
            id: 2,
            title: "Weekly Performance Check",
            description: "Run performance tests every Monday",
            schedule_type: "weekly",
            day: "Monday",
            time: "01:00",
            item_type: "test-suite",
            items: ["Performance Test Suite"],
            next_run: "2025-05-26 01:00",
            status: "active"
          }
        ];
        
        setSchedules(mockSchedules);
      } else {
        // Map API response to expected format
        const formattedSchedules = data.map(schedule => ({
          id: schedule.id,
          title: schedule.title,
          description: schedule.description,
          schedule_type: schedule.schedule_type,
          day: schedule.day,
          time: schedule.time,
          day_of_month: schedule.day_of_month,
          date: schedule.date,
          item_type: schedule.item_type,
          items: schedule.items || [],
          next_run: schedule.next_run,
          status: schedule.status
        }));
        
        setSchedules(formattedSchedules);
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Error fetching schedules:", err);
      setError("Failed to fetch schedules");
      setLoading(false);
    }
  }, [projectId]);
  
  // Fetch test cases and test suites for dropdown selection
  const fetchTestItems = useCallback(async () => {
    try {
      // Fetch test cases
      const testCasesResponse = await fetch(`${apiBaseUrl}/testcases/?project_id=${projectId}`);
      if (!testCasesResponse.ok) {
        throw new Error("Failed to fetch test cases");
      }
      
      const testCasesData = await testCasesResponse.ok ? await testCasesResponse.json() : [];
      
      // Fetch test suites
      const testSuitesResponse = await fetch(`${apiBaseUrl}/testsuites/?project_id=${projectId}`);
      if (!testSuitesResponse.ok) {
        throw new Error("Failed to fetch test suites");
      }
      
      const testSuitesData = await testSuitesResponse.ok ? await testSuitesResponse.json() : [];
      
      // If API fails or returns no data, use mock data for demonstration
      setTestCases(testCasesData.length > 0 ? testCasesData : [
        { id: 1, title: "Test_Record" },
        { id: 2, title: "Test_Write" }
      ]);
      
      setTestSuites(testSuitesData.length > 0 ? testSuitesData : [
        { id: 1, title: "Regression Suite" },
        { id: 2, title: "Performance Test Suite" },
        { id: 3, title: "UI Tests" }
      ]);
    } catch (err) {
      console.error("Error fetching test items:", err);
      setError("Failed to fetch test cases and test suites");
      
      // Fallback to mock data
      setTestCases([
        { id: 1, title: "Test_Record" },
        { id: 2, title: "Test_Write" }
      ]);
      
      setTestSuites([
        { id: 1, title: "Regression Suite" },
        { id: 2, title: "Performance Test Suite" },
        { id: 3, title: "UI Tests" }
      ]);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      fetchSchedules();
      fetchTestItems();
    }
  }, [projectId, fetchSchedules, fetchTestItems]);
  
  const handleItemTypeChange = (newType) => {
    setItemType(newType);
    setSelectedItems([]); // Reset selections when changing item type
  };
  
  const handleItemSelection = (e) => {
    const options = e.target.options;
    const selectedValues = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(options[i].value);
      }
    }
    setSelectedItems(selectedValues);
  };
  
  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!title || !time || selectedItems.length === 0) {
        setError("Please fill in all required fields");
        return;
      }
      
      if (scheduleType === 'one-time' && !date) {
        setError("Please select a date");
        return;
      }
      
      // Create schedule object for API
      const scheduleData = {
        title,
        description,
        schedule_type: scheduleType,
        date: scheduleType === 'one-time' ? date : null,
        time,
        day: scheduleType === 'weekly' ? day : null,
        day_of_month: scheduleType === 'monthly' ? dayOfMonth : null,
        item_type: itemType,
        items: selectedItems,
        project_id: projectId,
        status: 'active'
      };
      
      // Send to API
      const response = await fetch(`${apiBaseUrl}/schedules/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scheduleData),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create schedule");
      }
      
      // If successful, add to UI
      const newSchedule = {
        id: schedules.length + 1, // This will be replaced by the API response in production
        title,
        description,
        schedule_type: scheduleType,
        date,
        time,
        day,
        day_of_month: dayOfMonth,
        item_type: itemType,
        items: selectedItems,
        next_run: scheduleType === 'one-time' 
          ? `${date} ${time}`
          : calculateNextRun(scheduleType, day, dayOfMonth, time),
        status: 'active'
      };
      
      setSchedules([...schedules, newSchedule]);
      setShowCreateModal(false);
      resetForm();
      
    } catch (err) {
      console.error("Error creating schedule:", err);
      setError("Failed to create schedule");
    }
  };
  
  const calculateNextRun = (type, day, dayOfMonth, time) => {
    const today = new Date();
    let nextRun = new Date(today);
    
    if (type === 'daily') {
      // Set to tomorrow if today's time has already passed
      if (today.getHours() > parseInt(time.split(':')[0])) {
        nextRun.setDate(today.getDate() + 1);
      }
    } else if (type === 'weekly') {
      // Map day names to day numbers (0 = Sunday, 1 = Monday, etc.)
      const dayMap = {
        'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
        'Thursday': 4, 'Friday': 5, 'Saturday': 6
      };
      
      const dayNumber = dayMap[day];
      const currentDay = today.getDay();
      
      // Calculate days until next occurrence
      let daysUntilNextRun = dayNumber - currentDay;
      if (daysUntilNextRun <= 0) {
        daysUntilNextRun += 7;
      }
      
      nextRun.setDate(today.getDate() + daysUntilNextRun);
    } else if (type === 'monthly') {
      // Set to the specified day of the current month
      nextRun.setDate(dayOfMonth);
      
      // If that day has already passed this month, move to next month
      if (nextRun < today) {
        nextRun.setMonth(nextRun.getMonth() + 1);
      }
    }
    
    // Set the time
    const [hours, minutes] = time.split(':').map(Number);
    nextRun.setHours(hours, minutes, 0, 0);
    
    return `${nextRun.getFullYear()}-${String(nextRun.getMonth() + 1).padStart(2, '0')}-${String(nextRun.getDate()).padStart(2, '0')} ${time}`;
  };
  
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setScheduleType('one-time');
    setDate('');
    setTime('');
    setDay('Monday');
    setDayOfMonth(1);
    setSelectedItems([]);
    setItemType('test-case');
    setError(null);
  };
  
  const handleDelete = async (id) => {
    try {
      // Call API to delete
      const response = await fetch(`${apiBaseUrl}/schedules/${id}/`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete schedule");
      }
      
      // Update UI by removing the deleted schedule
      setSchedules(schedules.filter(schedule => schedule.id !== id));
    } catch (err) {
      console.error("Error deleting schedule:", err);
      setError("Failed to delete schedule");
    }
  };
  
  const toggleScheduleStatus = async (id) => {
    try {
      // Find the schedule to update
      const scheduleToUpdate = schedules.find(s => s.id === id);
      const newStatus = scheduleToUpdate.status === 'active' ? 'inactive' : 'active';
      
      // Call API to update status
      const response = await fetch(`${apiBaseUrl}/schedules/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update schedule status");
      }
      
      // Update UI
      setSchedules(schedules.map(schedule => 
        schedule.id === id ? { ...schedule, status: newStatus } : schedule
      ));
    } catch (err) {
      console.error("Error updating schedule status:", err);
      setError("Failed to update schedule status");
    }
  };
  
  // Helper to display schedule type in a readable format
  const formatScheduleType = (schedule) => {
    switch (schedule.schedule_type) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return `Weekly (${schedule.day})`;
      case 'monthly':
        return `Monthly (Day ${schedule.day_of_month})`;
      case 'one-time':
        return `One-time (${schedule.date})`;
      default:
        return schedule.schedule_type;
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 lg:ml-[300px] transition-all duration-300 lg:max-w-[calc(100%-300px)] sm:ml-[60px] sm:max-w-full">
        <div className="p-6">
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="flex justify-between items-center p-6">
              <h1 className="text-2xl font-semibold text-purple-800">Scheduler</h1>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center"
              >
                <span className="mr-1">+</span> Create
              </button>
            </div>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mx-6 mb-4">
                {error}
                <button 
                  onClick={() => setError(null)} 
                  className="float-right font-bold"
                >
                  &times;
                </button>
              </div>
            )}
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-700"></div>
              </div>
            ) : (
              <>
                {schedules.length === 0 ? (
                  <div className="bg-white shadow-md rounded-lg p-8 text-center m-6">
                    <p className="text-gray-600">No schedules found. Create your first schedule by clicking the Create button.</p>
                  </div>
                ) : (
                  <div className="bg-white shadow-md rounded-lg overflow-hidden mx-6 mb-6">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Title
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Schedule Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Next Run
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Items
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {schedules.map((schedule) => (
                          <tr key={schedule.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{schedule.title}</div>
                              <div className="text-sm text-gray-500">{schedule.description}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatScheduleType(schedule)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {schedule.next_run}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div>
                                <span className="text-xs font-medium text-gray-700">
                                  {schedule.item_type === 'test-case' ? 'Test Cases' : 'Test Suites'}
                                </span>
                                <ul className="text-xs mt-1">
                                  {schedule.items && schedule.items.map((item, idx) => (
                                    <li key={idx}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                schedule.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {schedule.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button 
                                onClick={() => toggleScheduleStatus(schedule.id)}
                                className="text-indigo-600 hover:text-indigo-900 mr-3"
                              >
                                {schedule.status === 'active' ? 'Disable' : 'Enable'}
                              </button>
                              <button 
                                onClick={() => handleDelete(schedule.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
            
            {/* Create Schedule Modal */}
            {showCreateModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center z-10">
                    <h2 className="text-xl font-semibold text-purple-800">Create New Schedule</h2>
                    <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">
                      &times;
                    </button>
                  </div>
                  
                  <div className="p-4">
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                        Title *
                      </label>
                      <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="Enter schedule title"
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                        Description
                      </label>
                      <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        rows="2"
                        placeholder="Enter schedule description"
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="scheduleType">
                        Schedule Type *
                      </label>
                      <select
                        id="scheduleType"
                        value={scheduleType}
                        onChange={(e) => setScheduleType(e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      >
                        <option value="one-time">One-time</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    
                    {scheduleType === 'one-time' && (
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="date">
                          Date *
                        </label>
                        <input
                          type="date"
                          id="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                      </div>
                    )}
                    
                    {scheduleType === 'weekly' && (
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="day">
                          Day of Week *
                        </label>
                        <select
                          id="day"
                          value={day}
                          onChange={(e) => setDay(e.target.value)}
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        >
                          <option value="Monday">Monday</option>
                          <option value="Tuesday">Tuesday</option>
                          <option value="Wednesday">Wednesday</option>
                          <option value="Thursday">Thursday</option>
                          <option value="Friday">Friday</option>
                          <option value="Saturday">Saturday</option>
                          <option value="Sunday">Sunday</option>
                        </select>
                      </div>
                    )}
                    
                    {scheduleType === 'monthly' && (
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dayOfMonth">
                          Day of Month *
                        </label>
                        <select
                          id="dayOfMonth"
                          value={dayOfMonth}
                          onChange={(e) => setDayOfMonth(parseInt(e.target.value))}
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        >
                          {[...Array(31)].map((_, i) => (
                            <option key={i+1} value={i+1}>{i+1}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="time">
                        Time *
                      </label>
                      <input
                        type="time"
                        id="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Select Item Type *
                      </label>
                      <div className="flex space-x-4">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            checked={itemType === 'test-case'}
                            onChange={() => handleItemTypeChange('test-case')}
                            className="h-4 w-4 text-purple-600"
                          />
                          <span className="ml-2 text-gray-700">Test Cases</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            checked={itemType === 'test-suite'}
                            onChange={() => handleItemTypeChange('test-suite')}
                            className="h-4 w-4 text-purple-600"
                          />
                          <span className="ml-2 text-gray-700">Test Suites</span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="selectedItems">
                        {itemType === 'test-case' ? 'Select Test Cases *' : 'Select Test Suites *'}
                      </label>
                      <select
                        multiple
                        id="selectedItems"
                        value={selectedItems}
                        onChange={handleItemSelection}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
                      >
                        {itemType === 'test-case' 
                          ? testCases.map(tc => (
                            <option key={tc.id} value={tc.title}>{tc.title}</option>
                            ))
                          : testSuites.map(ts => (
                            <option key={ts.id} value={ts.title}>{ts.title}</option>
                            ))
                        }
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple items</p>
                    </div>
                    
                    <div className="flex justify-end border-t pt-4">
                      <button
                        onClick={() => {
                          setShowCreateModal(false);
                          resetForm();
                        }}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmit}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
                      >
                        Create Schedule
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchedulerPage;