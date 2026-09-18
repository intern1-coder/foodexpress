/**
 * Reusable StatBox Component
 */

import React from 'react';
import Card, { CardBody } from './Card';

const StatBox = ({ title, value, icon, color = 'blue' }) => {
  return (
    <Card className="stat-card">
      <CardBody>
        <div className="stat-icon">{icon}</div>
        <div className="stat-info">
          <h3>{value}</h3>
          <p>{title}</p>
        </div>
      </CardBody>
    </Card>
  );
};

export default StatBox;
