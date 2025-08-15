// Home Page Component
import React, { useState, useEffect } from 'react';
import { SystemStats } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';
import icpService from '../services/icpService';

const HomePage: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const result = await icpService.getStats();
      if (result.success && result.data) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to TrustCareConnect
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          A secure healthcare communication platform connecting patients and doctors 
          through AI-assisted consultations with human oversight.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center">
          <LoadingSpinner size="large" message="Loading platform statistics..." />
        </div>
      ) : stats ? (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Platform Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="stat-card bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.totalPatients}</div>
              <div className="text-sm text-blue-600 mt-1">Patients</div>
            </div>
            <div className="stat-card bg-green-50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-green-600">{stats.totalDoctors}</div>
              <div className="text-sm text-green-600 mt-1">Doctors</div>
            </div>
            <div className="stat-card bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-purple-600">{stats.totalQueries}</div>
              <div className="text-sm text-purple-600 mt-1">Total Queries</div>
            </div>
            <div className="stat-card bg-yellow-50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-yellow-600">{stats.pendingQueries}</div>
              <div className="text-sm text-yellow-600 mt-1">Pending</div>
            </div>
            <div className="stat-card bg-emerald-50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-emerald-600">{stats.completedQueries}</div>
              <div className="text-sm text-emerald-600 mt-1">Completed</div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">For Patients</h3>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Submit medical queries and concerns
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Receive AI-assisted responses reviewed by doctors
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Track your query history and responses
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Secure, blockchain-based medical records
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">For Healthcare Providers</h3>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">✓</span>
              Review AI-generated draft responses
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">✓</span>
              Provide expert medical oversight
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">✓</span>
              Manage patient assignments efficiently
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">✓</span>
              Access comprehensive patient histories
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">How It Works</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <span className="text-blue-600 font-bold">1</span>
            </div>
            <h4 className="font-semibold mb-2">Patient Submits Query</h4>
            <p className="text-gray-600 text-sm">Patients submit medical questions through the secure portal</p>
          </div>
          <div className="text-center">
            <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <span className="text-purple-600 font-bold">2</span>
            </div>
            <h4 className="font-semibold mb-2">AI Generates Draft</h4>
            <p className="text-gray-600 text-sm">AI creates an initial response based on medical knowledge</p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <span className="text-green-600 font-bold">3</span>
            </div>
            <h4 className="font-semibold mb-2">Doctor Reviews & Approves</h4>
            <p className="text-gray-600 text-sm">Licensed physician reviews and approves the response</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;