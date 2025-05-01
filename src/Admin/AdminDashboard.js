import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import BarChartIcon from "@mui/icons-material/BarChart";
import NotificationsIcon from "@mui/icons-material/Notifications";
import SettingsIcon from "@mui/icons-material/Settings";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState({
    totalTests: 0,
    successRate: 0,
    activeUsers: 0,
  });

  useEffect(() => {
    // Fetch dashboard stats (mock data for now)
    setMetrics({
      totalTests: 120,
      successRate: 85,
      activeUsers: 35,
    });
  }, []);

  return (
    <div className="admin-dashboard-container">
      {/* Left Panel */}
      <div className="dashboard-left-panel">
        <div className="dashboard-metrics">
          <div className="metric-card">
            <h3>Total Test Runs</h3>
            <p>{metrics.totalTests}</p>
          </div>
          <div className="metric-card">
            <h3>Success Rate</h3>
            <p>{metrics.successRate}%</p>
          </div>
          <div className="metric-card">
            <h3>Active Users</h3>
            <p>{metrics.activeUsers}</p>
          </div>
        </div>

        <div className="admin-actions">
          <Link to="/admin-reports" className="admin-action">
            <BarChartIcon /> Reports & Analytics
          </Link>
          <Link to="/admin-notifications" className="admin-action">
            <NotificationsIcon /> Notifications
          </Link>
          <Link to="/admin-settings" className="admin-action">
            <SettingsIcon /> System Settings
          </Link>
        </div>
      </div>

      {/* Right Panel */}
      <div className="dashboard-right-panel">
        <h1>Welcome to <span className="highlight">Testerally World</span></h1>
        <p>Here you can track key metrics, manage notifications, and customize system settings.</p>
        <p>The dashboard is designed to provide you with all the tools you need to manage and analyze the application effectively.</p>
      </div>
    </div>
  );
};

export default AdminDashboard;
