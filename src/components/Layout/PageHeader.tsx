
import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  children
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div className="flex-1">
        <h1 className="text-2xl font-bold text-gray-900">
          {title}
        </h1>
        {description && (
          <p className="text-gray-600 mt-1">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex gap-2">
          {children}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
