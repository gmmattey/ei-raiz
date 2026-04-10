import React from 'react';
import AppLayout from './AppLayout';

export default function PageContainer({ children }) {
  return <AppLayout>{children}</AppLayout>;
}
