// // App.js

// import { BrowserRouter, Route, Routes } from "react-router-dom";
// import "./App.css";
// import AppNavBar from "./components/AppNavBar";
// import Login from "./pages/Login";
// import Register from "./pages/Register";
// import Home from "./pages/Home";
// import ForgotPassword from "./pages/ForgotPassword";
// import { ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import ResetPassword from "./pages/ResetPassword";
// import Profile from "./pages/Profile";
// import PostLogin from "./pages/DashBoard";
// import Sidebar from "./pages/Sidebar";
// import { useState,useEffect } from "react";
// import { TiThMenu } from "react-icons/ti";

// const App = () => {
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);

//   useEffect(() => {
//     // Check if the user is logged in when the app loads
//     const storedIsLoggedIn = localStorage.getItem("isLoggedIn");
//     const storedName = localStorage.getItem("name");
//     const storedEmail = localStorage.getItem("email");

//     if (storedIsLoggedIn === "true") {
//       setIsLoggedIn(true);
//       setName(storedName);
//       setEmail(storedEmail);
//     }
//   }, []);

//   const toggleSidebar = () => {
//     setIsSidebarOpen((prev) => !prev); // Toggle sidebar visibility
//   };

//   return (
//     <div className="md:h-screen bg-purple-100">
//       <BrowserRouter>
//         <ToastContainer />
//         <AppNavBar
//           isLoggedIn={isLoggedIn}
//           setIsLoggedIn={setIsLoggedIn}
//           name={name}
//           setName={setName}
//           email={email}
//           setEmail={setEmail}
//         />
//         {isLoggedIn && (
//           <button
//             onClick={toggleSidebar}
//             className="fixed top-14 left-0 z-50 px-4 py-2 bg-gray-300 rounded shadow-md"
//           >
//             <TiThMenu />
//           </button>
//         )}
//         {/* Sidebar Component */}
//         <div className="">
//         <Sidebar
//           isOpen={isSidebarOpen}
//           toggleSidebar={toggleSidebar}
//           isLoggedIn={isLoggedIn}
//           setIsLoggedIn={setIsLoggedIn}
//           setName={setName}
//           setEmail={setEmail}
//         />

//         <div
//         // className={`transition-all duration-300 ease-in-out ${
//         //       isSidebarOpen ? "ml-96" : "ml-64"
//         //     }`}

//             >
//           <Routes>
//             <Route path="/" exact
//               element={
//                 <Home isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
//               }
//             />
//             <Route path="register" exact
//               element={
//                 <Register
//                   isLoggedIn={isLoggedIn}
//                   setIsLoggedIn={setIsLoggedIn}
//                   setName={setName}
//                   setEmail={setEmail}
//                 />
//               }
//             />
//             <Route path="login" exact
//               element={
//                 <Login
//                   isLoggedIn={isLoggedIn}
//                   setIsLoggedIn={setIsLoggedIn}
//                   setName={setName}
//                   setEmail={setEmail}
//                 />
//               }
//             />
//             <Route path="forgotPassword" exact
//               element={<ForgotPassword isLoggedIn={isLoggedIn} />}
//             />
//             <Route path="resetPassword"
//               element={<ResetPassword isLoggedIn={isLoggedIn} />}
//             />
//             <Route path="profile" exact
//               element={
//                 <Profile isLoggedIn={isLoggedIn} name={name} email={email} />
//               }
//             />
//             <Route path="dashboard" exact
//               element={
//                 <PostLogin isLoggedIn={isLoggedIn} name={name} email={email} />
//               }
//             />
//           </Routes>
//           </div>
//         </div>
//       </BrowserRouter>
//     </div>
//   );
// };

// export default App;

// import { BrowserRouter, Route, Routes } from "react-router-dom";
// import "./App.css";
// import AppNavBar from "./components/AppNavBar";
// import Login from "./pages/Login";
// import Register from "./pages/Register";
// import Home from "./pages/Home";
// import ForgotPassword from "./pages/ForgotPassword";
// import { ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import ResetPassword from "./pages/ResetPassword";
// import Profile from "./pages/Profile";
// import PostLogin from "./pages/DashBoard";
// import Sidebar from "./pages/Sidebar";
// import { useState, useEffect } from "react";
// import { TiThMenu } from "react-icons/ti";

// const App = () => {
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);

//   useEffect(() => {
//     const storedIsLoggedIn = localStorage.getItem("isLoggedIn");
//     const storedName = localStorage.getItem("name");
//     const storedEmail = localStorage.getItem("email");

//     if (storedIsLoggedIn === "true") {
//       setIsLoggedIn(true);
//       setName(storedName);
//       setEmail(storedEmail);
//     }
//   }, []);

//   const toggleSidebar = () => {
//     setIsSidebarOpen((prev) => !prev);
//   };

//   const handleLogout = () => {
//     setIsLoggedIn(false);
//     setIsSidebarOpen(false); // Reset sidebar state on logout
//     setName("");
//     setEmail("");
//     localStorage.removeItem("isLoggedIn");
//     localStorage.removeItem("name");
//     localStorage.removeItem("email");
//   };

//   return (
//     <div className="md:h-screen bg-purple-100">
//       <BrowserRouter>
//         <ToastContainer />
//         {/* <div className="fixed top-0 left-0 w-full z-50 bg-white"> */}
//         <AppNavBar
//           isLoggedIn={isLoggedIn}
//           setIsLoggedIn={setIsLoggedIn}
//           name={name}
//           setName={setName}
//           email={email}
//           setEmail={setEmail}
//         />
//         {/* </div> */}
//         <div className="h-full flex">
//           {isLoggedIn && (
//             <>
//               <button
//                 onClick={toggleSidebar}
//                 className="fixed left-0 z-50 px-4 py-2 bg-gray-300 rounded shadow-md"
//                 style={{ top: "52px" }}
//               >
//                 <TiThMenu />
//               </button>
//               <Sidebar
//                 isOpen={isSidebarOpen}
//                 toggleSidebar={toggleSidebar}
//                 isLoggedIn={isLoggedIn}
//                 setIsLoggedIn={setIsLoggedIn}
//                 setName={setName}
//                 setEmail={setEmail}
//                 onLogout={handleLogout}
//               />
//             </>
//           )}
//           <div
//             className={`transition-all duration-300 ease-in-out flex-grow ${
//               isSidebarOpen && isLoggedIn ? "ml-72" : "ml-0"
//             }`}
//           >
//             <Routes>
//               <Route
//                 path="/"
//                 exact
//                 element={
//                   <Home isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
//                 }
//               />
//               <Route
//                 path="register"
//                 exact
//                 element={
//                   <Register
//                     isLoggedIn={isLoggedIn}
//                     setIsLoggedIn={setIsLoggedIn}
//                     setName={setName}
//                     setEmail={setEmail}
//                   />
//                 }
//               />
//               <Route
//                 path="login"
//                 exact
//                 element={
//                   <Login
//                     isLoggedIn={isLoggedIn}
//                     setIsLoggedIn={setIsLoggedIn}
//                     setName={setName}
//                     setEmail={setEmail}
//                   />
//                 }
//               />
//               <Route
//                 path="forgotPassword"
//                 exact
//                 element={<ForgotPassword isLoggedIn={isLoggedIn} />}
//               />
//               <Route
//                 path="resetPassword"
//                 element={<ResetPassword isLoggedIn={isLoggedIn} />}
//               />
//               <Route
//                 path="profile"
//                 exact
//                 element={
//                   <Profile isLoggedIn={isLoggedIn} name={name} email={email} />
//                 }
//               />
//               <Route
//                 path="dashboard"
//                 exact
//                 element={
//                   <PostLogin
//                     isLoggedIn={isLoggedIn}
//                     name={name}
//                     email={email}
//                   />
//                 }
//               />
//             </Routes>
//           </div>
//         </div>
//       </BrowserRouter>
//     </div>
//   );
// };


import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import AppNavBar from "./components/AppNavBar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import ForgotPassword from "./pages/ForgotPassword";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import Sidebar from "./pages/Sidebar";
import UserDashboard from "./pages/UserDashboard";
import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
import CreateProject from "./pages/CreateProject";
import CreateTestCases from "./pages/CreateTestCases";
import WriteTestManually from "./pages/WriteTestManually";
import TestSuite from "./pages/TestSuite";
import CreateTestSuite from "./pages/CreateTestSuite";
import DashBoard from "./pages/DashBoard";
import PrivateRoute from "./pages/PrivateRoute";
import ProjectDetails from "./pages/ProjectDetails";
import ProjectMembers from "./pages/ProjectMembers";
import TestCasePriorities from "./pages/TestCasePriorities";
import TestCases from "./pages/TestCases";
import Requirement from "./pages/Requirement";
import RequirementTypes from "./pages/RequirementTypes";
import TestcasesTypes from "./pages/TestcasesTypes"
import TestSuites from "./pages/TestSuites";
import RequirementDetails from "./pages/RequirementDetails";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminProjects from "./pages/AdminProjects";
import AdminTestCases from "./pages/AdminTestCases";
import AdminRequirements from "./pages/AdminRequirements";
import AdminTestSuite from "./pages/AdminTestSuite";
import ProjectList from "./pages/ProjectList";
import TestData from "./pages/TestData";
import MemberRegister from "./pages/MemberRegister";
import ProjectListDetails from "./pages/ProjectListDetails";
import UserRoles from "./pages/UserRoles";
import TestSteps from "./pages/TestSteps";
import AdminOrganization from "./pages/AdminOrganization";
import { useLocation } from 'react-router-dom';
import MemberDashBoard from "./pages/MemberDashBoard";
import AdminSetting from "./pages/AdminSetting";
import MemberProjects from "./pages/MemberProjects";
import MemberProjectDetails from "./pages/MemberProjectDetails";
import MemberProfile from "./pages/MemberProfile";
import MemberTestDetails from "./pages/MemberTestDetails";
import MemberTestCases from "./pages/MemberTestCases";
import MemberWriteTest from "./pages/MemberWriteTest";
import MemberTestStep from "./pages/MemberTestStep";
import AdminProjectDetails from "./pages/AdminProjectDetails";
import AdminLayout from "./pages/AdminLayout";
import MemberTestData from "./pages/MemberTestData";
import TestEnvironmentConfig from "./pages/TestEnvironmentConfig";
import MemberTestSuites from "./pages/MemberTestSuites";
import MemberRequirement from "./pages/MemberRequirement";
import MemberTestType from "./pages/MemberTestType";
import MemberRequirementType from "./pages/MemberRequirementType";
import MemberPriorities from "./pages/MemberPriorities";

// import { MdDashboard } from "react-icons/md";
// import { FaUserCircle } from "react-icons/fa";
// import { RiLogoutBoxLine } from "react-icons/ri";
// import Dropdown from "./pages/Dropdown";

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);


  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  useEffect(() => {
    const storedIsLoggedIn = localStorage.getItem("isLoggedIn");
    const storedName = localStorage.getItem("name");
    const storedEmail = localStorage.getItem("email");
    const sessionActive = sessionStorage.getItem("sessionActive");

    if (storedIsLoggedIn === "true" && sessionActive !== "true") {
      handleLogout();
    } else if (storedIsLoggedIn === "true") {
      setIsLoggedIn(true);
      setName(storedName);
      setEmail(storedEmail);
      sessionStorage.setItem("sessionActive", "true");
    }

    const handleStorageChange = (event) => {
      if (event.key === "isLoggedIn" && event.newValue !== "true") {
        handleLogout(); 
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      localStorage.removeItem(`selectedProject_${userId}`);
    }
    localStorage.removeItem("userId");

    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("name");
    localStorage.removeItem("email");
    sessionStorage.removeItem("sessionActive");
    localStorage.removeItem("projects");

    setIsLoggedIn(false);
    setName("");
    setEmail("");

  };

  console.log("localStorage after logout:", localStorage);
  console.log("sessionStorage after logout:", sessionStorage);

  
  const MainContent = () => {
    const location = useLocation();
    const isAdminRoute = location.pathname.includes('admin');
    const isMemberRoute = location.pathname.includes('member-');

  return (

    <div className="h-full flex flex-col" style={{ paddingTop: "64px" }}>
        {/* Only show sidebar if logged in AND not on admin routes */}
        {isLoggedIn && !isAdminRoute && !isMemberRoute && (
          <div>
            <Sidebar
              isOpen={isSidebarOpen}
              toggleSidebar={toggleSidebar}
              isLoggedIn={isLoggedIn}
              setIsLoggedIn={setIsLoggedIn}
              setName={setName}
              setEmail={setEmail}
              onLogout={handleLogout}
              className='w-64 md:w-48 h-full md:h-64'
            />
          </div>
        )}

        {/* Content Area */}
        <div
          className={`transition-all duration-300 ease-in-out flex-grow ${
            isSidebarOpen && isLoggedIn && !isAdminRoute ? "ml-64" : "ml-0"
          }`}
        >
            <Routes>
              <Route
                path="dashboard"
                exact
                element={
                  <Home isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
                }
              />
              <Route
                path="/adminlogin"
                exact
                element={
                  <AdminLogin isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
                }
              />
              <Route
                path="/admin-dashboard"
                exact
                element={
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <AdminDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin-project-details"
                exact
                element={
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <AdminLayout>
                      <AdminProjectDetails />
                    </AdminLayout>
                  </PrivateRoute>
                }
              />
              <Route 
                path="/admin-organization"
                exact
                element={
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <AdminLayout>
                      <AdminOrganization/>
                    </AdminLayout>
                  </PrivateRoute>
                }
                />
                <Route
                  path="/admin-setting"
                  exact
                  element={
                    <PrivateRoute  isLoggedIn={isLoggedIn}>
                      <AdminSetting/>
                    </PrivateRoute>
                  }
                  />
              <Route
                path="/admin-users"
                exact
                element={
                  <AdminUsers isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
                }
              />
              <Route
                path="/admin-projects"
                exact
                element={
                  <AdminProjects isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
                }
              />
              <Route
                path="/admin-testcases"
                exact
                element={
                  <AdminTestCases isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
                }
              />
              <Route
                path="/admin-requirements"
                exact
                element={
                  <AdminRequirements isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
                }
              />
              <Route
                path="/admin-testsuites"
                exact
                element={
                  <AdminTestSuite isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
                }
              />
              <Route
                path="dashboard/register"
                exact
                element={
                  <Register
                    isLoggedIn={isLoggedIn}
                    setIsLoggedIn={setIsLoggedIn}
                    setName={setName}
                    setEmail={setEmail}
                  />
                }
              />
              <Route
                path="member-register/:token"
                exact
                element={
                  <MemberRegister
                    isLoggedIn={isLoggedIn}
                    setIsLoggedIn={setIsLoggedIn}
                    setName={setName}
                    setEmail={setEmail}
                  />
                }
              />
              <Route
                path="dashboard/login"
                exact
                element={
                  <Login
                    isLoggedIn={isLoggedIn}
                    setIsLoggedIn={setIsLoggedIn}
                    setName={setName}
                    setEmail={setEmail}
                  />
                }
              />
              <Route
                path="forgotPassword"
                exact
                element={<ForgotPassword isLoggedIn={isLoggedIn} />}
              />
              <Route
                path="resetPassword/:token"
                element={<ResetPassword isLoggedIn={isLoggedIn} />}
              />
              <Route
                path="profile"
                exact
                element={
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <Profile name={name} email={email} />
                  </PrivateRoute>
                }
              />
              <Route
                path="/"
                exact
                element={
                  <DashBoard
                    isLoggedIn={isLoggedIn}
                    name={name}
                    email={email}
                  />
                }
              />
              <Route
                path="dashboard-user"
                exact
                element={ 
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <UserDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/member-dashboard"
                exact
                element={ 
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <MemberDashBoard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/member-projects"
                exact
                element={ 
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <MemberProjects />
                  </PrivateRoute>
                }
              />
              <Route
                path="/member-project-details"
                exact
                element={ 
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <MemberProjectDetails />
                  </PrivateRoute>
                }
              />
              <Route
                path="/member-profile"
                exact
                element={ 
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <MemberProfile />
                  </PrivateRoute>
                }
              />
              <Route
                path="/member-test-details"
                exact
                element={ 
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <MemberTestDetails />
                  </PrivateRoute>
                }
              />
              <Route
                path="/member-create-testcase"
                exact
                element={ 
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <MemberTestCases />
                  </PrivateRoute>
                }
              />
              <Route
                path="/member-write-testcase"
                exact
                element={ 
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <MemberWriteTest />
                  </PrivateRoute>
                }
              />
              <Route
                path="/member-test-cases/:testCaseId/steps"
                exact
                element={ 
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <MemberTestStep />
                  </PrivateRoute>
                }
              />
              <Route
                path="/member-test-data"
                exact
                element={ 
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <MemberTestData />
                  </PrivateRoute>
                }
              />
              <Route
                path="/member-test-suite"
                exact
                element={ 
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <MemberTestSuites />
                  </PrivateRoute>
                }
              />
              <Route
                path="/member-test-requirement"
                exact
                element={ 
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <MemberRequirement />
                  </PrivateRoute>
                }
              />
              <Route
                path="/member-test-types"
                exact
                element={ 
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <MemberTestType />
                  </PrivateRoute>
                }
              />
              <Route
                path="/member-requirement-types"
                exact
                element={ 
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <MemberRequirementType />
                  </PrivateRoute>
                }
              />
              <Route
                path="/member-prorities"
                exact
                element={ 
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <MemberPriorities />
                  </PrivateRoute>
                }
              />
              <Route
                path="create-project"
                exact
                element={
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <CreateProject  />
                  </PrivateRoute>
                }
              />
              <Route
                path="test-cases/create-testcases"
                exact
                element={
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <CreateTestCases />
                  </PrivateRoute>
                }
              />
              <Route
                path="write-manually"
                exact
                element={
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <WriteTestManually />
                  </PrivateRoute>
                }
              />
              <Route
                path="testsuite"
                exact
                element={
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <TestSuite />
                  </PrivateRoute>
                }
              />
              <Route
                path="test-data"
                exact
                element={
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <TestData />
                  </PrivateRoute>
                }
              />
              <Route
                path="/test-suites/create-testsuite"
                exact
                element={
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <CreateTestSuite />
                  </PrivateRoute>
                }
              />
              <Route
                path="project-details"
                exact
                element={
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <ProjectDetails />
                  </PrivateRoute>
                }
              />
              <Route
                path="projects-list"
                exact
                element={
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <ProjectList />
                  </PrivateRoute>
                }
              />
              <Route
                path="/project-details/project-list-details"
                exact
                element={
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <ProjectListDetails />
                  </PrivateRoute>
                }
              />
              <Route
                path="project-members"
                exact
                element={
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <ProjectMembers />
                  </PrivateRoute>
                }
              />
              <Route
                path="test-cases"
                exact
                element={
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <TestCases />
                  </PrivateRoute>
                }
              />
              <Route
                path="test-cases/:testCaseId/steps"
                exact
                element={
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <TestSteps />
                  </PrivateRoute>
                }
              />

              <Route
                path="testcase-Priorities"
                exact
                element={
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <TestCasePriorities />
                  </PrivateRoute>
                }
              />
              <Route
                path="create-requirement"
                exact
                element={
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <Requirement />
                  </PrivateRoute>
                }
              />
              <Route
                path="requirement-type"
                exact
                element={
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <RequirementTypes />
                  </PrivateRoute>
                }
              />
              <Route
                path="testcases-type"
                exact
                element={
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <TestcasesTypes />
                  </PrivateRoute>
                }
              />
              <Route
                path="test-suites"
                exact
                element={
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <TestSuites />
                  </PrivateRoute>
                }
              />
              <Route
                path="requirement-details"
                exact
                element={
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <RequirementDetails />
                  </PrivateRoute>
                }
              />
              <Route 
                path="user-roles"
                exact
                element={
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <UserRoles/>
                  </PrivateRoute>
                }
                />
                <Route
                path="/environment-run"
                exact
                element={ 
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <TestEnvironmentConfig />
                  </PrivateRoute>
                }
              />
            </Routes>
          </div>
    </div>
  );
};


return (
  <div className="bg-purple-100">
    <BrowserRouter>
      <ToastContainer />
      <div className="fixed top-0 left-0 w-full z-50 bg-white shadow-md">
        <AppNavBar
          isLoggedIn={isLoggedIn}
          setIsLoggedIn={setIsLoggedIn}
          name={name}
          setName={setName}
          email={email}
          setEmail={setEmail}
        />
      </div>
      <MainContent />
    </BrowserRouter>
  </div>
);
};

export default App;