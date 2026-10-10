import React from 'react';

export const Card = ({
  children,
  className = '',
  hover = false,
  padding = 'md',
  onClick,
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const hoverStyle = hover
    ? 'transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-blue-200 cursor-pointer'
    : 'shadow-xs';

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200/80 ${paddingStyles[padding]} ${hoverStyle} ${className}`}
    >
      {children}
    </div>
  );
};
