import React from 'react';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'medical' | 'ai' | 'dots' | 'pulse' | 'wave' | 'dna';
  className?: string;
  message?: string;
  color?: 'primary' | 'medical' | 'ai' | 'white';
}

const LoadingSpinnerModern: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  className = '',
  message,
  color = 'primary'
}) => {
  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colorClasses = {
    primary: 'text-primary-500',
    medical: 'text-medical-500',
    ai: 'text-ai-500',
    white: 'text-white'
  };

  const DefaultSpinner = () => (
    <div className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin`}>
      <svg className="w-full h-full" fill="none" viewBox="0 0 24 24">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );

  const MedicalSpinner = () => (
    <div className={`${sizeClasses[size]} relative`}>
      <div className={`absolute inset-0 rounded-full border-4 border-medical-200 dark:border-medical-800`}></div>
      <div className={`absolute inset-0 rounded-full border-4 border-transparent border-t-medical-500 animate-spin`}></div>
      <div className={`absolute inset-2 rounded-full border-4 border-transparent border-t-medical-400 animate-spin`} style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
    </div>
  );

  const AISpinner = () => (
    <div className={`${sizeClasses[size]} relative`}>
      <div className="absolute inset-0 rounded-full">
        <div className="w-full h-full rounded-full border-4 border-transparent border-t-ai-500 animate-spin"></div>
      </div>
      <div className="absolute inset-1 rounded-full">
        <div className="w-full h-full rounded-full border-4 border-transparent border-r-ai-400 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
      </div>
      <div className="absolute inset-2 rounded-full">
        <div className="w-full h-full rounded-full border-2 border-transparent border-b-ai-300 animate-spin" style={{ animationDuration: '2s' }}></div>
      </div>
    </div>
  );

  const DotsSpinner = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={`w-2 h-2 ${colorClasses[color]} rounded-full animate-bounce`}
          style={{ animationDelay: `${index * 0.1}s` }}
        ></div>
      ))}
    </div>
  );

  const PulseSpinner = () => (
    <div className={`${sizeClasses[size]} relative`}>
      <div className={`absolute inset-0 ${colorClasses[color]} rounded-full animate-ping opacity-75`}></div>
      <div className={`relative ${sizeClasses[size]} ${colorClasses[color]} bg-current rounded-full`}></div>
    </div>
  );

  const WaveSpinner = () => (
    <div className="loading-wave">
      <span className={colorClasses[color]}></span>
      <span className={colorClasses[color]}></span>
      <span className={colorClasses[color]}></span>
      <span className={colorClasses[color]}></span>
    </div>
  );

  const DNASpinner = () => (
    <div className={`${sizeClasses[size]} relative`}>
      <div className="absolute inset-0">
        <div className={`w-full h-1/2 border-l-2 border-r-2 ${colorClasses[color]} rounded-t-full animate-spin`} style={{ transformOrigin: 'bottom center' }}></div>
        <div className={`w-full h-1/2 border-l-2 border-r-2 ${colorClasses[color]} rounded-b-full animate-spin`} style={{ transformOrigin: 'top center', animationDirection: 'reverse' }}></div>
      </div>
    </div>
  );

  const renderSpinner = () => {
    switch (variant) {
      case 'medical':
        return <MedicalSpinner />;
      case 'ai':
        return <AISpinner />;
      case 'dots':
        return <DotsSpinner />;
      case 'pulse':
        return <PulseSpinner />;
      case 'wave':
        return <WaveSpinner />;
      case 'dna':
        return <DNASpinner />;
      default:
        return <DefaultSpinner />;
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {renderSpinner()}
      {message && (
        <p className={`mt-3 text-sm ${colorClasses[color]} animate-pulse`}>
          {message}
        </p>
      )}
    </div>
  );
};

// Specialized loading components for specific use cases
export const AIProcessingLoader: React.FC<{ message?: string }> = ({ message = "AI is analyzing..." }) => (
  <div className="flex flex-col items-center justify-center p-8">
    <div className="relative mb-4">
      <div className="w-16 h-16 border-4 border-ai-200 rounded-full"></div>
      <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-ai-500 rounded-full animate-spin"></div>
      <div className="absolute inset-2 w-12 h-12 border-4 border-transparent border-r-ai-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
      <div className="absolute inset-4 w-8 h-8 border-2 border-transparent border-b-ai-300 rounded-full animate-spin" style={{ animationDuration: '2s' }}></div>
    </div>
    <p className="text-ai-500 text-sm animate-pulse">{message}</p>
    <div className="flex space-x-1 mt-2">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="w-1 h-1 bg-ai-400 rounded-full animate-bounce"
          style={{ animationDelay: `${index * 0.2}s` }}
        ></div>
      ))}
    </div>
  </div>
);

export const MedicalDataLoader: React.FC<{ message?: string }> = ({ message = "Loading medical data..." }) => (
  <div className="flex flex-col items-center justify-center p-8">
    <div className="relative mb-4">
      <div className="w-12 h-12 border-4 border-medical-200 rounded-full"></div>
      <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-medical-500 rounded-full animate-spin"></div>
      <div className="absolute inset-1 w-10 h-10 border-3 border-transparent border-r-medical-400 rounded-full animate-spin" style={{ animationDirection: 'reverse' }}></div>
    </div>
    <p className="text-medical-500 text-sm">{message}</p>
    <div className="mt-3 w-32 h-1 bg-medical-100 rounded-full overflow-hidden">
      <div className="h-full bg-gradient-to-r from-medical-400 to-medical-600 rounded-full animate-pulse"></div>
    </div>
  </div>
);

export const FullScreenLoader: React.FC<{ 
  message?: string; 
  variant?: 'medical' | 'ai' | 'default';
  backgroundBlur?: boolean;
}> = ({ 
  message = "Loading...", 
  variant = 'default',
  backgroundBlur = true 
}) => (
  <div className={`fixed inset-0 z-50 flex items-center justify-center ${backgroundBlur ? 'backdrop-blur-sm bg-black/20' : 'bg-black/50'}`}>
    <div className="glass-card p-8 text-center">
      <LoadingSpinnerModern 
        size="xl" 
        variant={variant} 
        color={variant === 'medical' ? 'medical' : variant === 'ai' ? 'ai' : 'white'}
        message={message}
      />
    </div>
  </div>
);

export default LoadingSpinnerModern;