
import React from 'react';
import { Link } from 'react-router-dom';

const Logo: React.FC = () => {
  return (
    <Link to="/dashboard" className="flex-shrink-0 flex items-center">
      <img 
        src="https://www.polygongroup.com/UI/build/svg/polygon-logo.svg" 
        alt="Polygon Logo" 
        className="h-8 w-auto"
        width="120"
        height="32"
        loading="lazy"
      />
    </Link>
  );
};

export default Logo;
