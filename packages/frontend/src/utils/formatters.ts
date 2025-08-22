// Utility functions for formatting data
import { QueryStatus } from '../types';

export const formatQueryStatus = (status: QueryStatus): string => {
  switch (status) {
    case 'pending': return 'Pending Review';
    case 'doctor_review': return 'Under Doctor Review';
    case 'completed': return 'Completed';
    default: return 'Unknown';
  }
};

export const formatTimestamp = (timestamp: number): string => {
  return new Date(Number(timestamp) / 1000000).toLocaleString();
};

export const formatUserRole = (userType: 'patient' | 'doctor', name: string): string => {
  return userType === 'doctor' ? `Dr. ${name}` : name;
};

export const truncateText = (text: string, maxLength: number): string => {
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

export const sanitizeInput = (input: string, maxLength: number): string => {
  return input.trim().substring(0, maxLength);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const capitalizeFirst = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const getStatusClassName = (status: QueryStatus): string => {
  const statusText = formatQueryStatus(status);
  return statusText.toLowerCase().replace(' ', '-');
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

// Default export for convenience
export const formatters = {
  formatQueryStatus,
  formatTimestamp,
  formatUserRole,
  truncateText,
  sanitizeInput,
  validateEmail,
  capitalizeFirst,
  getStatusClassName,
  formatDate
};