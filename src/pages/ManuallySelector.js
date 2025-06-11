import React from 'react';
import { useLocation } from 'react-router-dom';
import AndroidManually from '../Android/AndroidManually';
import WriteManually from './WriteManually';

const ManuallySelector = () => {
  const location = useLocation();
  const projectType = location.state?.testCaseInfo?.project_type;

  if (projectType === 'Mobile Application') {
    return <AndroidManually />;
  } else {
    return <WriteManually />;
  }
};

export default ManuallySelector;
