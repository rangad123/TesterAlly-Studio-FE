import React from 'react';
import { useLocation } from 'react-router-dom';
import TestSteps from '../pages/TestSteps';
import AndroidTestSteps from './AndroidTestSteps';

const TestStepSelector = () => {
  const location = useLocation();
  const { ProjectType } = location.state || {};
  const { Platform } = location.state || {};

  console.log("projectType:", ProjectType)
  console.log("Platform:", Platform)

  if (ProjectType === 'Mobile Application') {
    if (Platform === 'Android') {
      return <AndroidTestSteps />;
    } else if (Platform === 'iOS') {
      return <div>iOS steps coming soon</div>; 
      // return <IOSTestSteps />;
    }
  } else if (ProjectType === 'Web Application') {
    if (Platform === 'Laptop/PC') {
      return <TestSteps />;
    } else if (Platform === 'Mobile') {
      return <AndroidTestSteps />;
    }
  }

};

export default TestStepSelector;