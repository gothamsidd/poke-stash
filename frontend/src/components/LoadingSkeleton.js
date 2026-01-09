import React from 'react';
import './LoadingSkeleton.css';

export const ProductCardSkeleton = () => {
  return (
    <div className="skeleton-card">
      <div className="skeleton-image"></div>
      <div className="skeleton-content">
        <div className="skeleton-line skeleton-title"></div>
        <div className="skeleton-line skeleton-text"></div>
        <div className="skeleton-line skeleton-price"></div>
      </div>
    </div>
  );
};

export const StatCardSkeleton = () => {
  return (
    <div className="skeleton-stat">
      <div className="skeleton-line skeleton-number"></div>
      <div className="skeleton-line skeleton-label"></div>
    </div>
  );
};

export default ProductCardSkeleton;
