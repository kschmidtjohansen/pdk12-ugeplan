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
  return;
};
export default PageHeader;