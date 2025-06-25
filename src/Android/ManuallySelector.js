import React from 'react';
import { useLocation } from 'react-router-dom';
import AndroidManually from './AndroidManually';
import WriteManually from '../pages/WriteManually';
import MobileManually from './MobileManually';

const ManuallySelector = () => {
  const location = useLocation();
  const projectType = location.state?.testCaseInfo?.project_type;
  const Platform = location.state?.testCaseInfo?.platform;
  
  console.log("Platform:", Platform)

  if (projectType === 'Mobile Application') {
    if (Platform === 'Android') {
      return <AndroidManually />;
    } else if (Platform === 'iOS') {
      return <div>iOS steps coming soon</div>; 
      // return <IOSTestSteps />;
    }
  } else if (projectType === 'Web Application') {
    if (Platform === 'Laptop/PC') {
      return <WriteManually />;
    } else if (Platform === 'Mobile') {
      return <MobileManually />;
    }
  }

  
};

export default ManuallySelector;
