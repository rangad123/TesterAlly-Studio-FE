
import React from 'react';
import { useLocation } from 'react-router-dom';
import WriteRecord from '../pages/WriteRecord';
import AndroidRecord from './AndroidRecord';

const RecordSelector = () => {
  const location = useLocation();
  const projectType = location.state?.testCaseInfo?.project_type;
  const Platform = location.state?.testCaseInfo?.platform;

  console.log("Platform:", Platform)
  
  if (projectType === 'Mobile Application') {
    if (Platform === 'Android') {
      return <AndroidRecord />;
    } else if (Platform === 'iOS') {
      return <div>iOS steps coming soon</div>; 
      // return <IOSTestSteps />;
    }
  } else if (projectType === 'Web Application') {
    if (Platform === 'Laptop/PC') {
      return <WriteRecord />;
    } else if (Platform === 'Mobile') {
      return <AndroidRecord />;
    }
  }
  
};

export default RecordSelector;