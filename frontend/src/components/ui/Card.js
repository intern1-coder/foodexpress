/**
 * Reusable Card Component
 */

import React from 'react';

const Card = ({ children, className = '', onClick }) => {
  return (
    <div
      className={`card ${className} ${onClick ? 'card-clickable' : ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={`card-header ${className}`}>{children}</div>
);

export const CardBody = ({ children, className = '' }) => (
  <div className={`card-body ${className}`}>{children}</div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={`card-footer ${className}`}>{children}</div>
);

export default Card;
