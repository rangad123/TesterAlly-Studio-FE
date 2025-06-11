import React from 'react';
import { useLocation } from 'react-router-dom';
import TestSteps from './TestSteps';
import AndroidTestSteps from '../Android/AndroidTestSteps';

const TestStepSelector = () => {
  const location = useLocation();
  const { ProjectType } = location.state || {};
  console.log("projectType:", ProjectType)
  
  if (ProjectType === 'Mobile Application') {
    return <AndroidTestSteps />;
  } else {
    return <TestSteps />;
  }
};

export default TestStepSelector;