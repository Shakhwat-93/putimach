import React from 'react';
import { Badge as ShadcnBadge } from './ui/badge';

export const Badge = ({ children, variant = 'default', className = '' }) => {
  return (
    <ShadcnBadge variant={variant} className={className}>
      {children}
    </ShadcnBadge>
  );
};
