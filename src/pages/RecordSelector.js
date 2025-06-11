
import React from 'react';
import { useLocation } from 'react-router-dom';
import WriteRecord from './WriteRecord';
import AndroidRecord from '../Android/AndroidRecord';

const RecordSelector = () => {
  const location = useLocation();
  const projectType = location.state?.testCaseInfo?.project_type;
  
  if (projectType === 'Mobile Application') {
    return <AndroidRecord />;
  } else {
    return <WriteRecord />;
  }
};

export default RecordSelector;