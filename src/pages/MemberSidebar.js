import React, { useState, useEffect, useRef } from "react";
import {
  FaCode,
  FaUserShield,
  FaUsers,
  FaFolderOpen
} from "react-icons/fa";
import { FiSettings } from "react-icons/fi";
import { MdDashboard, MdAccountCircle } from "react-icons/md";
import { useNavigate, useLocation } from "react-router-dom";
import "./Sidebar.css";
import MemberSubBar from "./MemberSubBar";

const MemberSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen ] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false); 
  const [isProjectSettingsVisible, setIsProjectSettingsVisible] = useState(false);
  const [isMTestCasesVisible, setIsMTestCasesVisible] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  const sidebarRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 480);
    };

    handleResize();

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsSettingsVisible(false);
        
        if (window.innerWidth < 640) {
          setIsMTestCasesVisible(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileView]);


  useEffect(() => {
    const handleShowProjectSidebar = (event) => {
      setIsMTestCasesVisible(true);
    };
  
    window.addEventListener("showProjectSidebar", handleShowProjectSidebar);
    return () => {
      window.removeEventListener("showProjectSidebar", handleShowProjectSidebar);
    };
  }, []);

  const toggleSettingsSidebar = () => {
    setIsSettingsVisible((prevState) => !prevState);
    setIsProjectSettingsVisible(false);
    setIsMTestCasesVisible(false);
  };


  const handleNavigateToProfile = () => {
    navigate("/member-profile")
    setIsMTestCasesVisible(false);
    setIsProjectSettingsVisible(false);
    setIsSettingsVisible(false);
  };

  const handleNavigateToDashboard = () => {
    navigate("/member-dashboard");
    setIsMTestCasesVisible(false);
    setIsProjectSettingsVisible(false);
    setIsSettingsVisible(false);
  };

  const handleNavigateToUserRoles = () => {

    setIsSettingsVisible(false);
    setIsMTestCasesVisible(false);
    setIsProjectSettingsVisible(false);
  };

  const handleNavigateToUsers = () => {
    setIsSettingsVisible(false);
    setIsMTestCasesVisible(false);
    setIsProjectSettingsVisible(false);
  };

  const toggleMTestCasesSidebar = () => {
    setIsMTestCasesVisible((prevState) => !prevState);
    setIsProjectSettingsVisible(false);
    setIsSettingsVisible(false);
  };

  const handleProjectList = () => {
    navigate("/member-projects")
    setIsMTestCasesVisible(false);
    setIsProjectSettingsVisible(false);
    setIsSettingsVisible(false);

  };

  useEffect(() => {

    const testCasePages = [
      "/member-test-details",
      "/member-project-details",
      "/member-test-cases/:testCaseId/steps",
      "/member-test-suite",
      "/member-test-requirement",
      "/member-test-data",
      "/member-requirement-types",
      "/member-test-types",
      "/member-prorities",
    ];
  
    if (testCasePages.includes(location.pathname)) {
      setIsMTestCasesVisible(true);
    } else {
      setIsMTestCasesVisible(false);
    }
  }, [location.pathname]);
  

  const currentPath = location.pathname;

  const isAnyOptionActive = currentPath === "/member-project-details" || currentPath === "/member-test-details"
  || currentPath === "/member-test-cases/:testCase.Id/steps"
  || currentPath === "/member-test-suite" || currentPath === "/member-test-requirement" || currentPath === "/member-test-data"  
  || currentPath === "/member-requirement-types" || currentPath === "/member-test-types" || currentPath === "/member-prorities";


  return (
    <div className="sidebar-container" ref={sidebarRef}>
      {/* Main Sidebar */}
      <div className="sidebar collapsed">
        <div className="plus-button mt-[40px]"></div>


    {/* Dashboard Option */}
    <div
      className={`sidebar-option ${currentPath === "/member-dashboard" ? "active" : ""}`}
      onClick={handleNavigateToDashboard}
    >
      <MdDashboard className={`icon project-icon ${window.location.pathname === "/member-dashboard" ? "active-icon" : ""}`}  />
      <div className="option-name-container">
        <span className="option-name">Dashboard</span>
      </div>
    </div>

    <div
      className={`sidebar-option ${currentPath === "/member-projects" ? "active" : ""}`}
      onClick={handleProjectList}
    >
      <FaFolderOpen className={`icon project-icon ${window.location.pathname === "/member-projects" ? "active-icon" : ""}`}  />
      <div className="option-name-container">
        <span className="option-name">Projects</span>
      </div>
    </div>

      {/* Test Development Option */}
    <div
      className={`sidebar-option ${isAnyOptionActive ? "active" : ""}`}
      onClick={toggleMTestCasesSidebar} 
    >
      <FaCode className={`icon project-icon ${isAnyOptionActive ? "active-icon" : ""}`} />
      <div className="option-name-container">
        <span className="option-name">Test Development</span>
      </div>
    </div>

    <MemberSubBar 
      isVisible={isProjectSettingsVisible || isMTestCasesVisible} 
      isProjectSettings={isProjectSettingsVisible}
      isL1Expanded={isSidebarOpen}
      isMobileView={isMobileView}
      onOptionSelect={() => {
        if (isMobileView) {
          setIsMTestCasesVisible(false);
        }
      }}
    />

    {/* Settings Option */}
    <div
      className={`sidebar-option ${ currentPath === "/user-roles" ? "active" : ""}`}
      onClick={toggleSettingsSidebar}
    >
      <FiSettings className={`icon project-icon ${window.location.pathname === "/user-roles" ? "active-icon" : ""}`}  />
      <div className="option-name-container">
        <span className="option-name">Settings</span>
      </div>
    </div>

    {/* Profile Option */}
    <div
      className={`sidebar-option ${currentPath === "/member-profile" ? "active" : ""}`}
      onClick={handleNavigateToProfile}
    >
      <MdAccountCircle className={`icon project-icon ${window.location.pathname === "/member-profile" ? "active-icon" : ""}`}  />
      <div className="option-name-container">
        <span className="option-name">Profile</span>
      </div>
    </div>
  </div>

      {/* Sub-sidebar: Settings */}
      {isSettingsVisible && (
        <div className={`sub-sidebar-settings ${isSidebarOpen ? "aligned-expanded" : "aligned-collapsed"}`}>
          <div className="sub-sidebar-header">Settings</div>
          <div className="sub-sidebar-item" onClick={handleNavigateToUserRoles}>
            <FaUserShield className="icon" />
            <span>Profile Settings</span>
          </div>
          <div className="sub-sidebar-item" onClick={handleNavigateToUsers}>
            <FaUsers className="icon" />
            <span>Generic Settings</span>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default MemberSidebar;
