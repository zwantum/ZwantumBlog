import React from 'react';
import { BlogAdmin, BlogAdminProps } from '@zwantum/blog-admin';

export type HostDashboardProps = BlogAdminProps;

export const HostDashboard: React.FC<HostDashboardProps> = (props) => {
  return <BlogAdmin {...props} />;
};
