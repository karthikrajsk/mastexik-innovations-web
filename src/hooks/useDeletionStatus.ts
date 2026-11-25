import { useState, useEffect } from 'react';
import apiService from '@/services/ApiService';

interface UseDeletionStatusOptions {
  endpoint: string;
  items: Array<{ id: number | string; [key: string]: any }>;
  enabled?: boolean;
  parentEndpoint?: string;
  parentIdField?: string;
}

export function useDeletionStatus({
  endpoint,
  items,
  enabled = true,
  parentEndpoint,
  parentIdField
}: UseDeletionStatusOptions) {
  const [deletionStatus, setDeletionStatus] = useState<Record<number | string, boolean>>({});
  const [deletionErrors, setDeletionErrors] = useState<Record<number | string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !items || items.length === 0) {
      return;
    }

    const fetchDeletionStatus = async () => {
      setLoading(true);
      try {
        const statuses: Record<number | string, boolean> = {};
        const errors: Record<number | string, string> = {};

        const cleanEndpoint = endpoint.startsWith('/api/') ? endpoint.replace('/api/', '/') : endpoint;
        const baseEndpoint = cleanEndpoint.endsWith('/') ? cleanEndpoint : `${cleanEndpoint}/`;

        for (const item of items) {
          try {
            const data = await apiService.get(`${baseEndpoint}${item.id}/can-delete`);
            
            // Check if the API returned a success response
            if (data.status === 'success' || data.status === 'error') {
              const canDelete = data.data?.canDelete ?? true;
              statuses[item.id] = canDelete;
              
              // If cannot delete, store the error message
              if (!canDelete) {
                // Try to get the message from different possible locations
                const errorMsg = data.data?.message || 
                               data.message || 
                               'Cannot delete: Data is already in use';
                errors[item.id] = errorMsg;
              }
            } else {
              // Handle unexpected response format
              statuses[item.id] = true;
            }
          } catch (error) {
            console.error(`Error fetching deletion status for item ${item.id}:`, error);
            statuses[item.id] = true;
          }
        }

        setDeletionStatus(statuses);
        setDeletionErrors(errors);
      } catch (error) {
        console.error('Error fetching deletion status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeletionStatus();
  }, [endpoint, items, enabled, parentEndpoint, parentIdField]);

  return {
    deletionStatus,
    deletionErrors,
    loading,
    canDelete: (id: number | string) => deletionStatus[id] !== false,
    getError: (id: number | string) => deletionErrors[id] || ''
  };
}
