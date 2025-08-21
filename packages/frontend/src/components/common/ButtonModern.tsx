import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'medical' | 'ai' | 'glass' | 'neon' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  glow?: boolean;
  holographic?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const LoadingWave: React.FC = () => (
  <div className="loading-wave mr-2">
    <span></span>
    <span></span>
    <span></span>
    <span></span>
  </div>
);

const ModernButton: React.FC<ButtonProps> = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  glow = false,
  holographic = false,
  onClick,
  className = '',
  icon,
  iconPosition = 'left'
}) => {
  const baseClasses = [
    'relative',
    'inline-flex',
    'items-center',
    'justify-center',
    'font-medium',
    'transition-all',
    'duration-300',
    'ease-out',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2',
    'focus:ring-offset-transparent',
    'disabled:cursor-not-allowed',
    'overflow-hidden',
    'group'
  ];

  const sizeClasses = {
    xs: 'px-2.5 py-1.5 text-xs rounded-md',
    sm: 'px-3 py-2 text-sm rounded-lg',
    md: 'px-4 py-2.5 text-sm rounded-lg',
    lg: 'px-6 py-3 text-base rounded-xl',
    xl: 'px-8 py-4 text-lg rounded-xl'
  };

  const variantClasses = {
    primary: [
      'bg-gradient-to-r from-primary-500 to-primary-600',
      'text-white',
      'border border-primary-400/50',
      'hover:from-primary-600 hover:to-primary-700',
      'focus:ring-primary-500',
      'shadow-lg shadow-primary-500/25',
      'disabled:from-primary-300 disabled:to-primary-400',
      'disabled:shadow-none'
    ],
    
    secondary: [
      'bg-white/10',
      'text-white',
      'border border-white/20',
      'backdrop-blur-sm',
      'hover:bg-white/20',
      'focus:ring-white/50',
      'disabled:bg-white/5',
      'disabled:text-white/50'
    ],
    
    medical: [
      'bg-gradient-to-r from-medical-500 to-medical-600',
      'text-white',
      'border border-medical-400/50',
      'hover:from-medical-600 hover:to-medical-700',
      'focus:ring-medical-500',
      'shadow-lg shadow-medical-500/25',
      'disabled:from-medical-300 disabled:to-medical-400',
      'disabled:shadow-none'
    ],
    
    ai: [
      'bg-gradient-to-r from-ai-500 to-ai-600',
      'text-white',
      'border border-ai-400/50',
      'hover:from-ai-600 hover:to-ai-700',
      'focus:ring-ai-500',
      'shadow-lg shadow-ai-500/25',
      'disabled:from-ai-300 disabled:to-ai-400',
      'disabled:shadow-none'
    ],
    
    glass: [
      'bg-white/5',
      'text-white',
      'border border-white/10',
      'backdrop-blur-md',
      'hover:bg-white/10',
      'focus:ring-white/30',
      'disabled:bg-white/2',
      'disabled:text-white/30'
    ],
    
    neon: [
      'bg-black/20',
      'text-neon-blue',
      'border border-neon-blue',
      'hover:bg-neon-blue/10',
      'focus:ring-neon-blue',
      'shadow-lg shadow-neon-blue/25',
      'disabled:text-neon-blue/30',
      'disabled:border-neon-blue/30',
      'disabled:shadow-none'
    ],
    
    danger: [
      'bg-gradient-to-r from-red-500 to-red-600',
      'text-white',
      'border border-red-400/50',
      'hover:from-red-600 hover:to-red-700',
      'focus:ring-red-500',
      'shadow-lg shadow-red-500/25',
      'disabled:from-red-300 disabled:to-red-400',
      'disabled:shadow-none'
    ],
    
    success: [
      'bg-gradient-to-r from-green-500 to-green-600',
      'text-white',
      'border border-green-400/50',
      'hover:from-green-600 hover:to-green-700',
      'focus:ring-green-500',
      'shadow-lg shadow-green-500/25',
      'disabled:from-green-300 disabled:to-green-400',
      'disabled:shadow-none'
    ]
  };

  const glowClasses = glow ? [
    'before:absolute',
    'before:inset-0',
    'before:rounded-inherit',
    'before:p-[2px]',
    'before:bg-gradient-to-r',
    'before:from-current',
    'before:to-transparent',
    'before:opacity-0',
    'hover:before:opacity-100',
    'before:transition-opacity',
    'before:duration-300',
    'before:-z-10'
  ] : [];

  const holographicClasses = holographic ? [
    'holographic',
    'text-white',
    'border-0'
  ] : [];

  const interactionClasses = [
    'hover:scale-105',
    'hover:shadow-xl',
    'active:scale-95',
    'transform',
    'transition-transform'
  ];

  const widthClass = fullWidth ? 'w-full' : '';

  const allClasses = [
    ...baseClasses,
    sizeClasses[size],
    ...variantClasses[variant],
    ...(glow ? glowClasses : []),
    ...(holographic ? holographicClasses : []),
    ...(disabled || loading ? [] : interactionClasses),
    widthClass,
    className
  ].filter(Boolean).join(' ');

  const renderIcon = () => {
    if (!icon) return null;
    return (
      <span className={`${iconPosition === 'right' ? 'ml-2' : 'mr-2'} transition-transform group-hover:scale-110`}>
        {icon}
      </span>
    );
  };

  const renderContent = () => (
    <>
      {/* Shimmer Effect */}
      {!disabled && !loading && (
        <span className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out"></span>
      )}
      
      {/* Content */}
      <span className="relative z-10 flex items-center">
        {loading && <LoadingWave />}
        {!loading && iconPosition === 'left' && renderIcon()}
        <span className={loading ? 'opacity-75' : ''}>{children}</span>
        {!loading && iconPosition === 'right' && renderIcon()}
      </span>
    </>
  );

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={allClasses}
    >
      {renderContent()}
    </button>
  );
};

export default ModernButton;