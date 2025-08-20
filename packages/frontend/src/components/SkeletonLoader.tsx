import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean | 'full' | 'lg' | 'md' | 'sm';
  animate?: boolean;
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  rounded = true,
  animate = true
}) => {
  const roundedClass = 
    rounded === 'full' ? 'rounded-full' :
    rounded === 'lg' ? 'rounded-lg' :
    rounded === 'md' ? 'rounded-md' :
    rounded === 'sm' ? 'rounded-sm' :
    rounded ? 'rounded' : '';

  const animateClass = animate ? 'animate-pulse' : '';

  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={`bg-gray-200 ${roundedClass} ${animateClass} ${className}`}
      style={style}
    />
  );
};

// Text skeleton with multiple lines
interface SkeletonTextProps {
  lines?: number;
  className?: string;
  animate?: boolean;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  className = '',
  animate = true
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          height={16}
          width={index === lines - 1 ? '75%' : '100%'}
          animate={animate}
        />
      ))}
    </div>
  );
};

// Card skeleton for query cards, patient cards, etc.
interface SkeletonCardProps {
  className?: string;
  showAvatar?: boolean;
  showActions?: boolean;
  animate?: boolean;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  className = '',
  showAvatar = false,
  showActions = true,
  animate = true
}) => {
  return (
    <div className={`bg-white border rounded-lg p-6 ${className}`}>
      <div className="flex items-start space-x-4">
        {showAvatar && (
          <Skeleton width={48} height={48} rounded="full" animate={animate} />
        )}
        
        <div className="flex-1 space-y-3">
          {/* Title */}
          <Skeleton height={20} width="60%" animate={animate} />
          
          {/* Status badge area */}
          <div className="flex justify-between items-start">
            <Skeleton height={16} width="40%" animate={animate} />
            <Skeleton height={24} width={80} rounded="full" animate={animate} />
          </div>
          
          {/* Description */}
          <SkeletonText lines={2} animate={animate} />
          
          {/* Footer info */}
          <div className="flex justify-between items-center pt-2">
            <Skeleton height={14} width="30%" animate={animate} />
            {showActions && (
              <div className="flex space-x-2">
                <Skeleton height={28} width={60} rounded animate={animate} />
                <Skeleton height={28} width={60} rounded animate={animate} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Table skeleton
interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
  animate?: boolean;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  columns = 4,
  className = '',
  animate = true
}) => {
  return (
    <div className={`bg-white border rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="border-b bg-gray-50 p-4">
        <div className="flex space-x-4">
          {Array.from({ length: columns }, (_, index) => (
            <Skeleton key={index} height={16} width="20%" animate={animate} />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="border-b last:border-b-0 p-4">
          <div className="flex space-x-4">
            {Array.from({ length: columns }, (_, colIndex) => (
              <Skeleton 
                key={colIndex} 
                height={16} 
                width={colIndex === 0 ? "25%" : "20%"} 
                animate={animate} 
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Form skeleton
interface SkeletonFormProps {
  fields?: number;
  className?: string;
  animate?: boolean;
}

export const SkeletonForm: React.FC<SkeletonFormProps> = ({
  fields = 4,
  className = '',
  animate = true
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {Array.from({ length: fields }, (_, index) => (
        <div key={index} className="space-y-2">
          {/* Label */}
          <Skeleton height={16} width="20%" animate={animate} />
          
          {/* Input field */}
          <Skeleton height={40} width="100%" rounded animate={animate} />
        </div>
      ))}
      
      {/* Submit button */}
      <div className="pt-4">
        <Skeleton height={40} width={120} rounded animate={animate} />
      </div>
    </div>
  );
};

// Profile skeleton
export const SkeletonProfile: React.FC<{ animate?: boolean }> = ({
  animate = true
}) => {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton height={32} width="40%" animate={animate} />
            <Skeleton height={16} width="25%" animate={animate} />
            <Skeleton height={14} width="30%" animate={animate} />
          </div>
          <div className="flex space-x-2">
            <Skeleton height={36} width={100} rounded animate={animate} />
            <Skeleton height={36} width={120} rounded animate={animate} />
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="flex border-b p-6 pb-0">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton 
              key={index} 
              height={20} 
              width={80} 
              className="mr-8 mb-4" 
              animate={animate} 
            />
          ))}
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton height={16} width="30%" animate={animate} />
                <Skeleton height={40} width="100%" rounded animate={animate} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Query management skeleton
export const SkeletonQueryManagement: React.FC<{ animate?: boolean }> = ({
  animate = true
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Skeleton height={32} width="30%" animate={animate} />
        <Skeleton height={36} width={80} rounded animate={animate} />
      </div>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton height={16} width="40%" animate={animate} />
              <Skeleton height={40} width="100%" rounded animate={animate} />
            </div>
          ))}
        </div>
        <Skeleton height={14} width="25%" animate={animate} />
      </div>
      
      {/* Query cards */}
      <div className="space-y-4">
        {Array.from({ length: 5 }, (_, index) => (
          <SkeletonCard key={index} animate={animate} />
        ))}
      </div>
      
      {/* Pagination */}
      <div className="flex justify-center items-center space-x-2">
        <Skeleton height={32} width={80} rounded animate={animate} />
        <div className="flex space-x-1">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} height={32} width={32} rounded animate={animate} />
          ))}
        </div>
        <Skeleton height={32} width={60} rounded animate={animate} />
      </div>
    </div>
  );
};

// Dashboard skeleton
export const SkeletonDashboard: React.FC<{ animate?: boolean }> = ({
  animate = true
}) => {
  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="bg-white border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton height={14} width="60%" animate={animate} />
                <Skeleton height={28} width="40%" animate={animate} />
              </div>
              <Skeleton width={40} height={40} rounded="full" animate={animate} />
            </div>
          </div>
        ))}
      </div>
      
      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border rounded-lg p-6">
            <Skeleton height={24} width="40%" className="mb-4" animate={animate} />
            <div className="space-y-4">
              {Array.from({ length: 3 }, (_, index) => (
                <SkeletonCard key={index} showAvatar={true} animate={animate} />
              ))}
            </div>
          </div>
        </div>
        
        {/* Right column */}
        <div className="space-y-6">
          <div className="bg-white border rounded-lg p-6">
            <Skeleton height={20} width="50%" className="mb-4" animate={animate} />
            <div className="space-y-3">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="flex justify-between items-center">
                  <Skeleton height={16} width="60%" animate={animate} />
                  <Skeleton height={16} width="20%" animate={animate} />
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white border rounded-lg p-6">
            <Skeleton height={20} width="60%" className="mb-4" animate={animate} />
            <SkeletonText lines={4} animate={animate} />
          </div>
        </div>
      </div>
    </div>
  );
};

// List skeleton for generic lists
interface SkeletonListProps {
  items?: number;
  showAvatar?: boolean;
  className?: string;
  animate?: boolean;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
  items = 5,
  showAvatar = false,
  className = '',
  animate = true
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: items }, (_, index) => (
        <div key={index} className="flex items-center space-x-4 p-4 bg-white border rounded-lg">
          {showAvatar && (
            <Skeleton width={40} height={40} rounded="full" animate={animate} />
          )}
          <div className="flex-1 space-y-2">
            <Skeleton height={16} width="60%" animate={animate} />
            <Skeleton height={14} width="40%" animate={animate} />
          </div>
          <Skeleton height={32} width={60} rounded animate={animate} />
        </div>
      ))}
    </div>
  );
};

export default Skeleton;