import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

// --- Reusable Status Badge Component ---
// (Move to src/components/StatusBadge.jsx for better organization)
function StatusBadge({ status }) {
  status = status ? status.toLowerCase() : 'unknown';
  let bgColor = 'bg-gray-100';
  let textColor = 'text-gray-800';
  let animate = '';
  let text = status.charAt(0).toUpperCase() + status.slice(1);

  switch (status) {
    case 'running': bgColor = 'bg-green-100'; textColor = 'text-green-800'; break;
    case 'stopped': bgColor = 'bg-gray-100'; textColor = 'text-gray-800'; break;
    case 'error': bgColor = 'bg-red-100'; textColor = 'text-red-800'; break;
    case 'pending': case 'starting': case 'stopping':
      bgColor = 'bg-yellow-100'; textColor = 'text-yellow-800'; animate = 'animate-pulse'; break;
    default:
      bgColor = 'bg-blue-100'; textColor = 'text-blue-800'; text = 'Unknown'; break;
  }
  return (
    <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor} ${animate}`}>
      {text}
    </span>
  );
}

// --- Main Page Component ---
function InstanceListPage() {
  const [instances, setInstances] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // For initial load
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // Tracks instance ID being actioned

  const getCsrfToken = () => { /* ... same helper function as in LoginPage ... */
      let csrfToken = null;
      if (document.cookie && document.cookie !== '') {
          const cookies = document.cookie.split(';');
          for (let i = 0; i < cookies.length; i++) {
              const cookie = cookies[i].trim();
              if (cookie.substring(0, 'csrftoken'.length + 1) === ('csrftoken' + '=')) {
                  csrfToken = decodeURIComponent(cookie.substring('csrftoken'.length + 1));
                  break;
              }
          }
      }
      return csrfToken;
  };

  // Fetch instances function
  const fetchInstances = useCallback(async (showLoadingIndicator = false) => {
    if (showLoadingIndicator) setIsLoading(true);
    // setError(null); // Decide if refresh should clear errors
    console.log("Fetching instances...");
    try {
      // --- Replace with your actual API endpoint ---
      const response = await fetch('/api/instances/'); // GET request
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP error! status: ${response.status} - ${errorData.detail || 'Failed to fetch'}`);
      }
      const data = await response.json();
      // Assuming API returns list like [{instance_id: '...', image_name: '...', server_hostname: '...', status: '...', created_at: 'ISO_DATE_STR', ssh_host_port: 2222}, ...]
      setInstances(data);
      setError(null); // Clear error on successful fetch
    } catch (e) {
      console.error("Failed to fetch instances:", e);
      setError(`Failed to load instances: ${e.message}`);
    } finally {
      if (showLoadingIndicator) setIsLoading(false);
    }
  }, []);

  // Initial fetch and optional polling
  useEffect(() => {
    fetchInstances(true); // Initial load
    const intervalId = setInterval(() => fetchInstances(false), 20000); // Poll every 20 seconds
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [fetchInstances]);

  // --- Action Handlers ---
  const handleInstanceAction = async (instanceId, action) => {
      setActionLoading(instanceId);
      setError(null);
      const csrfToken = getCsrfToken();
      // --- Replace with your actual API endpoints ---
      const apiUrl = `/api/instances/${instanceId}/${action}/`; // e.g., /api/instances/xyz/start/

      console.log(`Requesting action '${action}' for instance ${instanceId}`);
      try {
          const response = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'X-CSRFToken': csrfToken },
          });
          const result = await response.json().catch(() => ({ message: response.statusText }));

          if (response.ok) {
               console.log(`${action} successful for ${instanceId}:`, result);
               // Optimistic UI update
               setInstances(prevInstances =>
                   prevInstances.map(inst =>
                       inst.instance_id === instanceId
                           ? { ...inst, status: action === 'start' ? 'starting' : 'stopping' }
                           : inst
                   )
               );
               // Refresh the list after a delay to get confirmed status
               setTimeout(() => fetchInstances(false), 3000);
          } else {
               console.error(`Failed to ${action} instance ${instanceId}:`, result);
               setError(`Failed to ${action} instance ${instanceId}: ${result.detail || result.message || response.statusText}`);
               // Optionally refetch to revert optimistic update on error
               setTimeout(() => fetchInstances(false), 1000);
          }
      } catch (err) {
          console.error(`Network/fetch error during ${action} action for ${instanceId}:`, err);
          setError(`Network error trying to ${action} instance ${instanceId}.`);
      } finally {
          setActionLoading(null); // Clear loading indicator
      }
   };

  // --- Render Logic ---
  if (isLoading) {
    return <div className="text-center p-6 text-gray-500">Loading instances...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">Instances</h2>
        {/* TODO: Link to actual Launch Instance page/modal */}
        <Link to="/instances/launch" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          Launch Instance
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-red-100 border border-red-200 text-red-800" role="alert">
          {error}
        </div>
      )}

      <div className="shadow border border-gray-200 sm:rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Server</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {instances.length === 0 ? (
                 <tr><td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500 italic">No instances found.</td></tr>
              ) : (
                instances.map((instance) => (
                  <tr key={instance.instance_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-700" title={instance.instance_id}>
                      {instance.instance_id?.substring(0, 12) || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{instance.image_name || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{instance.server_hostname || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <StatusBadge status={instance.status} />
                    </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" title={instance.created_at || ''}>
                        {instance.created_at ? new Date(instance.created_at).toLocaleDateString() : '-'}
                     </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {/* Action Buttons */}
                      {(instance.status === 'stopped' || instance.status === 'error') &&
                        <button onClick={() => handleInstanceAction(instance.instance_id, 'start')} disabled={actionLoading === instance.instance_id || instance.status === 'starting'}
                                className="px-2 py-1 text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 disabled:opacity-50 disabled:cursor-wait">
                          {actionLoading === instance.instance_id ? '...' : 'Start'}
                        </button>
                      }
                      {instance.status === 'running' &&
                        <button onClick={() => handleInstanceAction(instance.instance_id, 'stop')} disabled={actionLoading === instance.instance_id || instance.status === 'stopping'}
                                className="px-2 py-1 text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 disabled:opacity-50 disabled:cursor-wait">
                          {actionLoading === instance.instance_id ? '...' : 'Stop'}
                        </button>
                      }
                       {/* SSH Info Button */}
                       {instance.status === 'running' && instance.ssh_host_port &&
                         <button onClick={() => alert(`Connect via SSH:\nHost: ${instance.server_hostname}\nPort: ${instance.ssh_host_port}\nUser: root (or specific user)`)}
                                 className="px-2 py-1 text-xs font-medium rounded text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-500">
                           SSH
                         </button>
                       }
                       {/* TODO: Add Delete Button/Action */}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default InstanceListPage;
