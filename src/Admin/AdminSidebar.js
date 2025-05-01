import React, { useState, useEffect } from "react";
import {
  MdDashboard,
  MdBusiness,
} from "react-icons/md";
import { useNavigate, useLocation } from "react-router-dom";
import OrganizationSidebar from "./OrganizationSidebar";

const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOrganizationSidebarVisible, setIsOrganizationSidebarVisible] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 480);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavigateToDashboard = () => {
    navigate("/admin-dashboard");
    setIsOrganizationSidebarVisible(false);
  };

  const toggleOrganizationSidebar = () => {
    setIsOrganizationSidebarVisible(prevState => !prevState);
  };

  const currentPath = location.pathname;

  return (
    <div className="sidebar-container">
      {/* Main Sidebar */}
      <div className="sidebar collapsed">
        <div className="plus-button mt-[40px]"></div>
        {/* Dashboard Option */}
        <div
          className={`sidebar-option ${currentPath === "/admin-dashboard" ? "active" : ""}`}
          onClick={handleNavigateToDashboard}
        >
          <MdDashboard className={`icon project-icon ${currentPath === "/admin-dashboard" ? "active-icon" : ""}`} />
          <div className="option-name-container">
            <span className="option-name">Dashboard</span>
          </div>
        </div>

        {/* Organizations Option */}
        <div
          className={`sidebar-option ${isOrganizationSidebarVisible ? "active" : ""}`}
          onClick={toggleOrganizationSidebar}
        >
          <MdBusiness className={`icon project-icon ${isOrganizationSidebarVisible ? "active-icon" : ""}`} />
          <div className="option-name-container">
            <span className="option-name">Organizations</span>
          </div>
        </div>
      </div>

      <OrganizationSidebar 
        isVisible={isOrganizationSidebarVisible} 
        isMobileView={isMobileView}
        onOptionSelect={() => {
          if (isMobileView) {
            setIsOrganizationSidebarVisible(false);
          }
        }}
      />
    </div>
  );
};

export default AdminSidebar;