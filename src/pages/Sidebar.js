import React, { useState, useEffect, useRef } from "react";
import {
  FaFolderPlus,
  FaTasks,
  FaCode,
  FaCogs,
  FaUserShield,
  FaUsers,
  FaFolderOpen,
  FaGithub,
  FaCreditCard
} from "react-icons/fa";
import { FiSettings } from "react-icons/fi";
import { MdDashboard, MdAccountCircle } from "react-icons/md";
//import { RiRobot2Fill } from "react-icons/ri";
import { BiAddToQueue } from "react-icons/bi";
import { useNavigate, useLocation } from "react-router-dom";
import "./Sidebar.css";
import Projectsidebar from "./Projectsidebar";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen ] = useState(false);
  const [isSubSidebarVisible, setIsSubSidebarVisible] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false); 
  const [isProjectSettingsVisible, setIsProjectSettingsVisible] = useState(false);
  const [isTestCasesVisible, setIsTestCasesVisible] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isIntegrationVisible, setIsIntegrationVisible] = useState(false);
  const [isProfileVisible, setIsProfileVisible] = useState(false);

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
        setIsSubSidebarVisible(false);
        setIsSettingsVisible(false);
        setIsIntegrationVisible(false);
        setIsProfileVisible(false);
        
        if (window.innerWidth < 640) {
          setIsTestCasesVisible(false);
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
      setIsTestCasesVisible(true);
    };
  
    window.addEventListener("showProjectSidebar", handleShowProjectSidebar);
    return () => {
      window.removeEventListener("showProjectSidebar", handleShowProjectSidebar);
    };
  }, []);

  
  const toggleSubSidebar = () => {
    setIsSubSidebarVisible((prevState) => !prevState);
    setIsSettingsVisible(false); 
    setIsProjectSettingsVisible(false);
    setIsTestCasesVisible(false);
    setIsIntegrationVisible(false);
    setIsProfileVisible(false);

  };

  const toggleSettingsSidebar = () => {
    setIsSettingsVisible((prevState) => !prevState);
    setIsSubSidebarVisible(false); 
    setIsProjectSettingsVisible(false);
    setIsTestCasesVisible(false);
    setIsIntegrationVisible(false);
    setIsProfileVisible(false);
  };

  const handleNavigateToCreateProject = () => {
    navigate("/create-project");
    setIsSubSidebarVisible(false);
    setIsProjectSettingsVisible(false);
    setIsTestCasesVisible(false);
    setIsIntegrationVisible(false);

  };

  const handleNavigateToCreateTestCases = () => {
    navigate("test-cases/create-testcases");
    setIsSubSidebarVisible(false);
    setIsTestCasesVisible(true);
    setIsIntegrationVisible(false);

  };

  const handleNavigateToTestSuite = () => {
    navigate("test-suites/create-testsuite");
    setIsSubSidebarVisible(false);
    setIsTestCasesVisible(true);
    setIsIntegrationVisible(false);

  };

  const toggleProfileSidebar = () => {
    setIsProfileVisible((prevState) => !prevState);
    setIsSubSidebarVisible(false);
    setIsSettingsVisible(false);
    setIsTestCasesVisible(false);
    setIsProjectSettingsVisible(false);
    setIsIntegrationVisible(false);
  };

  const handleNavigateToViewProfile = () => {
    navigate("/profile");
    setIsProfileVisible(false);
  };

  const handleNavigateToBilling = () => {
    navigate("/billing");
    setIsProfileVisible(false);
  };

  const toggleIntegrationSidebar = () => {
    setIsIntegrationVisible((prevState) => !prevState);
    setIsSubSidebarVisible(false);
    setIsSettingsVisible(false);
    setIsTestCasesVisible(false);
    setIsProjectSettingsVisible(false);
    setIsProfileVisible(false);
  };

  const handleNavigateToGithubIntegration = () => {
    navigate("/github");
    setIsIntegrationVisible(false);
  };


  const handleNavigateToDashboard = () => {
    navigate("/dashboard-user");
    setIsSubSidebarVisible(false);
    setIsTestCasesVisible(false);
    setIsProjectSettingsVisible(false);
    setIsSettingsVisible(false);
    setIsIntegrationVisible(false);
    setIsProfileVisible(false);
  };

  const handleNavigateToUserRoles = () => {
    navigate("/user-roles");
    setIsSettingsVisible(false);
    setIsTestCasesVisible(false);
    setIsProjectSettingsVisible(false);
    setIsIntegrationVisible(false);
  };

  const handleNavigateToUsers = () => {
    navigate("/users");
    setIsSettingsVisible(false);
    setIsTestCasesVisible(false);
    setIsProjectSettingsVisible(false);
    setIsIntegrationVisible(false);

  };

  const toggleTestCasesSidebar = () => {
    setIsTestCasesVisible((prevState) => !prevState);
    setIsProjectSettingsVisible(false);
    setIsSettingsVisible(false);
    setIsSubSidebarVisible(false);
    setIsIntegrationVisible(false);
    setIsProfileVisible(false);
  };

  const handleProjectList = () => {
    navigate("/projects-list")
    setIsTestCasesVisible(false);
    setIsProjectSettingsVisible(false);
    setIsSettingsVisible(false);
    setIsSubSidebarVisible(false);
    setIsIntegrationVisible(false);


  };

  const currentPath = location.pathname;

  const isAnyOptionActive = currentPath === "/test-suites" || currentPath === "/test-cases"
  || currentPath === "/create-requirement"
  || currentPath === "/project-members" || currentPath === "/project-details" || currentPath === "/test-scenario"
  || currentPath === "/requirement-details" || currentPath === "/requirement-type" || currentPath === "/reports"
  || currentPath === "/testcase-Priorities" || currentPath === "/testcases-type" || currentPath === "/test-data";


  return (
    <div className="sidebar-container" ref={sidebarRef}>
      {/* Main Sidebar */}
      <div className="sidebar collapsed">
        <div className="plus-button mt-[40px]"></div>

        {/* Create Project Option */}
        <div
          className={`sidebar-option ${ currentPath === "/create-project" || currentPath === "/test-cases/create-testcases" || currentPath === "/test-suites/create-testsuite"  ? "active" : ""}`}
          onClick={toggleSubSidebar}
        >
      <BiAddToQueue className={`icon project-icon ${ currentPath === "/create-project" || currentPath === "/test-cases/create-testcases" || currentPath === "/test-suites/create-testsuite"  ? "active-icon" : ""}`} />
      <div className="option-name-container">
        <span className="option-name">Create Project</span>
      </div>
    </div>

    {/* Dashboard Option */}
    <div
      className={`sidebar-option ${currentPath === "/dashboard-user" ? "active" : ""}`}
      onClick={handleNavigateToDashboard}
    >
      <MdDashboard className={`icon project-icon ${window.location.pathname === "/dashboard-user" ? "active-icon" : ""}`}  />
      <div className="option-name-container">
        <span className="option-name">Dashboard</span>
      </div>
    </div>

    <div
      className={`sidebar-option ${currentPath === "/projects-list" ? "active" : ""}`}
      onClick={handleProjectList}
    >
      <FaFolderOpen className={`icon project-icon ${window.location.pathname === "/projects-list" ? "active-icon" : ""}`}  />
      <div className="option-name-container">
        <span className="option-name">Project List</span>
      </div>
    </div>

      {/* Test Development Option */}
    <div
      className={`sidebar-option ${isAnyOptionActive ? "active" : ""}`}
      onClick={toggleTestCasesSidebar}
    >
      <FaCode className={`icon project-icon ${isAnyOptionActive ? "active-icon" : ""}`} />
      <div className="option-name-container">
        <span className="option-name">Test Development</span>
      </div>
    </div>

    <Projectsidebar 
      isVisible={isProjectSettingsVisible || isTestCasesVisible} 
      isProjectSettings={isProjectSettingsVisible}
      isL1Expanded={isSidebarOpen}
      isMobileView={isMobileView}
      onOptionSelect={() => {
        setIsTestCasesVisible(false);
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

    {/* Integration Option */}
    <div
      className={`sidebar-option ${currentPath === "/github" ? "active" : ""}`}
      onClick={toggleIntegrationSidebar}
    >
      <FaCogs className={`icon project-icon ${currentPath === "/github" ? "active-icon" : ""}`} />
      <div className="option-name-container">
        <span className="option-name">Integration</span>
      </div>
    </div>

    {/* Profile Option */}
    <div
      className={`sidebar-option ${currentPath === "/profile" || currentPath === "/billing" ? "active" : ""}`}
      onClick={toggleProfileSidebar}
    >
      <MdAccountCircle className={`icon project-icon ${currentPath === "/profile" || currentPath === "/billing" ? "active-icon" : ""}`} />
      <div className="option-name-container">
        <span className="option-name">Profile</span>
      </div>
    </div>

  </div>

      {/* Sub-sidebar: Create Project */}
      {isSubSidebarVisible && (
        <div
          className={`sub-sidebar ${isSidebarOpen ? "aligned-expanded" : "aligned-collapsed"}`}
        >
          <div className="sub-sidebar-header">Create Project Options</div>
          <div className="sub-sidebar-item" onClick={handleNavigateToCreateProject}>
            <FaFolderPlus className="icon" />
            <span>Create Project</span>
          </div>
          <div className="sub-sidebar-item" onClick={handleNavigateToCreateTestCases}>
            <FaTasks className="icon" />
            <span>Create Test Cases</span>
          </div>
          <div className="sub-sidebar-item" onClick={handleNavigateToTestSuite}>
            <FaCogs className="icon" />
            <span>Test Suite</span>
          </div>
        </div>
      )}

      {/* Sub-sidebar: Settings */}
      {isSettingsVisible && (
        <div className={`sub-sidebar-settings ${isSidebarOpen ? "aligned-expanded" : "aligned-collapsed"}`}>
          <div className="sub-sidebar-header">Settings</div>
          <div className="sub-sidebar-item" onClick={handleNavigateToUserRoles}>
            <FaUserShield className="icon" />
            <span>User Roles</span>
          </div>
          <div className="sub-sidebar-item" onClick={handleNavigateToUsers}>
            <FaUsers className="icon" />
            <span>Users</span>
          </div>
        </div>
      )}

      {isProfileVisible && (
        <div className={`sub-sidebar-settings ${isSidebarOpen ? "aligned-expanded" : "aligned-collapsed"}`}>
          <div className="sub-sidebar-header">Account Settings</div>
          <div className="sub-sidebar-item" onClick={handleNavigateToViewProfile}>
            <MdAccountCircle className="icon" />
            <span>View Profile</span>
          </div>
          <div className="sub-sidebar-item" onClick={handleNavigateToBilling}>
            <FaCreditCard className="icon" />
            <span>Billing</span>
          </div>
        </div>
      )}

      {isIntegrationVisible && (
        <div className={`sub-sidebar-settings ${isSidebarOpen ? "aligned-expanded" : "aligned-collapsed"}`}>
          <div className="sub-sidebar-header">Integration</div>
          <div className="sub-sidebar-item" onClick={handleNavigateToGithubIntegration}>
            <FaGithub className="icon" />
            <span>GitHub Integration</span>
          </div>
        </div>
      )}

      
    </div>
  );
};

export default Sidebar;
