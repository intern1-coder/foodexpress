/**
 * Reusable ErrorMessage Component
 */

import React from 'react';

const ErrorMessage = ({ message }) => {
  if (!message) return null;

  return (
    <div className="alert alert-error">
      {message}
    </div>
  );
};

export default ErrorMessage;
