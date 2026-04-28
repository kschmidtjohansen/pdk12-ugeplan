import React from 'react';
import { Link } from 'react-router-dom';
import polygonMark from '@/assets/polygon-mark.png';

const Logo: React.FC = () => {
  return (
    <Link to="/dashboard" className="flex-shrink-0 flex items-center" aria-label="Polygon">
      <img
        src={polygonMark}
        alt="Polygon"
        className="h-8 w-8 object-contain"
        loading="eager"
        fetchPriority="high"
      />
    </Link>
  );
};

export default Logo;
