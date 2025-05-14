
import React from 'react';
import VacationContainer from './VacationContainer';

interface VacationPageContainerProps {
  headerComponent: React.ReactNode;
}

const VacationPageContainer: React.FC<VacationPageContainerProps> = ({ headerComponent }) => {
  return <VacationContainer headerComponent={headerComponent} />;
};

export default VacationPageContainer;
