
import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  className,
  children,
}) => {
  return (
    <div className={cn("mb-8 flex flex-col md:flex-row md:items-center md:justify-between", className)}>
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{title}</h1>
        {description && (
          <p className="mt-1 text-gray-500">{description}</p>
        )}
      </div>
      {children && (
        <div className="mt-4 md:mt-0 flex-shrink-0">
          {children}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
