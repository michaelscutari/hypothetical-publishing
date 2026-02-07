import * as React from 'react';

const DashboardSidebarContext = React.createContext<{
  onPageItemClick: (id: string, hasNestedNavigation: boolean) => void;
} | null>(null);

export default DashboardSidebarContext;
