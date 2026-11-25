import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const SessionTimeoutWarning: React.FC = () => {
  const { remainingSessionTime, logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (remainingSessionTime <= 5 && remainingSessionTime > 0) {
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  }, [remainingSessionTime]);

  const handleExtendSession = () => {
    // User activity will automatically extend the session
    setShowWarning(false);
  };

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Session Timeout Warning
        </h3>
        <p className="text-gray-600 mb-4">
          Your session will expire in {remainingSessionTime} minutes due to inactivity. 
          Do you want to continue?
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={logout}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Logout
          </button>
          <button
            onClick={handleExtendSession}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            Continue Working
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionTimeoutWarning;