import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom'; // Added useLocation

// --- Reusable Status Badge Component ---
// Updated logic for simplified statuses: PENDING, RUNNING, STOPPED
function StatusBadge({ status }) {
    const lowerStatus = status ? status.toLowerCase() : 'unknown';
    let bgColor = 'bg-blue-100';    // Default/Unknown color
    let textColor = 'text-blue-800';
    let content = 'UNKNOWN'; // Default text
    let showSpinner = false;

    // --- Updated Status Mapping ---
    if (lowerStatus === 'running') {
        content = 'RUNNING';
        bgColor = 'bg-green-100';
        textColor = 'text-green-800';
        showSpinner = false;
    } else if (lowerStatus === 'stopped' || lowerStatus === 'error') {
        // Grouping stopped and error under 'STOPPED' display
        content = 'STOPPED';
        bgColor = 'bg-gray-100'; // Using gray for stopped/error state
        textColor = 'text-gray-800';
        showSpinner = false;
    } else if (['pending', 'starting', 'stopping'].includes(lowerStatus)) {
        // Grouping transitional states under 'PENDING' display
        content = 'PENDING';
        bgColor = 'bg-yellow-100';
        textColor = 'text-yellow-800';
        showSpinner = true; // Show spinner for pending states
    }
    // --- End Updated Status Mapping ---

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
            {showSpinner && (
                // Simple SVG Spinner with Tailwind animation
                <svg className="animate-spin -ml-0.5 mr-1.5 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {content}
        </span>
    );
}

// --- CSRF Token Helper ---
function getCsrfToken() { /* ... same helper function ... */
    let csrfToken = null;
    if (document.cookie && document.cookie !== '') { /* ... cookie parsing ... */
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
}


// --- Main Page Component ---
function InstanceListPage() {
  const [instances, setInstances] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // For initial load
  const [error, setError] = useState(null); // For fetch/action errors
  const [actionLoading, setActionLoading] = useState(null); // Tracks instance ID being actioned
  const [successMessage, setSuccessMessage] = useState(''); // For messages from redirects

  const location = useLocation(); // Get location state for messages

  // Effect to handle success messages passed via navigation state
  useEffect(() => {
      if (location.state?.message) {
          setSuccessMessage(location.state.message);
          const timer = setTimeout(() => setSuccessMessage(''), 5000);
          // Clear location state after showing message (optional)
          // window.history.replaceState({}, document.title)
          return () => clearTimeout(timer);
      }
  }, [location]);


  // Fetch instances function (using robust handling from previous step)
  const fetchInstances = useCallback(async (showLoadingIndicator = false) => {
    if (showLoadingIndicator) setIsLoading(true);
    // setError(null); // Keep previous error until success? Or clear? Let's clear on attempt.
    console.log("Fetching instances from /api/instance/list/ ...");
    try {
      const response = await fetch('/api/instance/list/'); // Your API endpoint

      if (!response.ok) { /* ... error handling as before ... */
        let errorDetail = `Failed to fetch: ${response.statusText} (Status: ${response.status})`;
        try { const errorData = await response.json(); errorDetail = errorData.detail || errorData.error || JSON.stringify(errorData); } catch (e) {}
        throw new Error(errorDetail);
      }

      // --- Handle OK response (2xx) ---
      const contentType = response.headers.get("content-type");
      const contentLength = response.headers.get("content-length");
      let finalData = [];
      if (response.status !== 204 && contentLength !== '0' && contentType && contentType.includes("application/json")) {
          try {
              const parsedData = await response.json();
              if (Array.isArray(parsedData)) { finalData = parsedData; }
              else if (parsedData && Array.isArray(parsedData.results)) { finalData = parsedData.results; }
              else { console.warn("API response OK/JSON but not array/paginated:", parsedData); }
          } catch (jsonError) { console.warn("Received OK response but failed to parse JSON body:", jsonError); }
      } else { console.log("Received OK response but no JSON content detected:", { status: response.status, contentType, contentLength }); }

      setInstances(finalData);
      // Clear error only if fetch was fully successful
      if (response.ok) { setError(null); }

    } catch (e) {
      console.error("ERROR in fetchInstances:", e);
      setError(`Failed to load instances: ${e.message}`);
      setInstances([]); // Set to empty array on fetch error
    } finally {
      if (showLoadingIndicator) setIsLoading(false);
    }
  }, []); // useCallback dependency array is empty

  // Initial fetch and polling effect
  useEffect(() => {
    fetchInstances(true); // Initial load
    const intervalId = setInterval(() => fetchInstances(false), 10000); // Poll every 10 seconds
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [fetchInstances]);

  // --- Action Handler - Implemented ---
  // This logic remains the same, the StatusBadge handles the display change
  const handleInstanceAction = async (instanceId, action) => {
      if (actionLoading) return; // Prevent double clicks

      setActionLoading(instanceId); // Show loading state for this specific button/row
      setError(null); // Clear previous general errors
      setSuccessMessage(''); // Clear previous success messages
      const csrfToken = getCsrfToken();
      // --- Ensure these match your Django API URLs ---
      const apiUrl = `/api/instances/${instanceId}/${action}/`; // e.g., /api/instances/xyz/start/

      console.log(`Requesting action '${action}' for instance ${instanceId}`);

      // Optimistic UI update still uses 'starting' or 'stopping' internally
      setInstances(prevInstances =>
        prevInstances.map(inst =>
          inst.instance_id === instanceId
            ? { ...inst, status: action === 'start' ? 'starting' : 'stopping' } // Set intermediate status
            : inst
        )
      );

      try {
          const response = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                  // Content-Type might not be needed if no body is sent
                  'X-CSRFToken': csrfToken,
              },
              // body: JSON.stringify({}) // Add body if your API expects one
          });

          // --- Safer Response Handling for Actions ---
          let resultMessage = `Action '${action}' processed successfully.`;
          let errorDetail = null;
          let data = null;
          const contentType = response.headers.get("content-type");
          if (response.status !== 204 && contentType?.includes("application/json")) {
              try { data = await response.json(); } catch (e) { console.warn("Could not parse action response JSON"); }
          }
          if (response.ok) { // Includes 200, 201, 202, 204 etc.
               console.log(`${action} successful for ${instanceId}:`, data || response.statusText);
               resultMessage = data?.message || data?.detail || resultMessage;
               setSuccessMessage(resultMessage); // Show success feedback
               // Refresh the list after a short delay to get confirmed status from backend
               setTimeout(() => fetchInstances(false), 3000);
          } else { // Handle 4xx, 5xx errors
               errorDetail = data?.detail || data?.error || `Action failed: ${response.statusText}`;
               console.error(`Failed to ${action} instance ${instanceId}:`, errorDetail);
               setError(errorDetail); // Set error state
               fetchInstances(false); // Revert optimistic update immediately on error
          }
      } catch (err) {
          console.error(`Network/fetch error during ${action} action for ${instanceId}:`, err);
          setError(`Network error trying to ${action} instance ${instanceId}.`);
          fetchInstances(false); // Revert optimistic update on network error
      } finally {
          // Clear loading indicator after a short delay
          setTimeout(() => setActionLoading(null), 500);
      }
   };

  // --- Render Logic ---
  if (isLoading) { return <div className="text-center p-6 text-gray-500">Loading instances...</div>; }

  console.log('Rendering InstanceListPage with instances:', instances, 'Is Array:', Array.isArray(instances)); // Keep for debugging

  return (
    <div className="space-y-6">
       {/* Page Title and Launch Button */}
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-800">Instances</h2>
            <Link to="/instances/launch" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Launch Instance
            </Link>
        </div>

       {/* Display Success/Error Messages */}
       {successMessage && <div className="p-4 rounded-md bg-green-100 border border-green-200 text-green-800" role="alert">{successMessage}</div>}
       {error && <div className="p-4 rounded-md bg-red-100 border border-red-200 text-red-800" role="alert">{error}</div>}

       {/* Table */}
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
               {/* Check if instances is an array before mapping */}
               {!isLoading && !Array.isArray(instances) && (
                   <tr><td colSpan="6" className="px-6 py-4 text-center text-sm text-red-600 italic">Error: Invalid instance data format.</td></tr>
               )}
               {!isLoading && Array.isArray(instances) && instances.length === 0 ? (
                 <tr><td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500 italic">No instances found.</td></tr>
               ) : (
                 Array.isArray(instances) && instances.map((instance) => (
                   <tr key={instance.instance_id} className="hover:bg-gray-50">
                     {/* Table Cells */}
                     <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-700" title={instance.instance_id}>{instance.instance_id?.substring(0, 12) || '-'}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{instance.image_name || '-'}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{instance.server_hostname || '-'}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm">
                       <StatusBadge status={instance.status} /> {/* Use **updated** badge */}
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{instance.created_at ? new Date(instance.created_at).toLocaleDateString() : '-'}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                       {/* Action Buttons - Logic still based on actual backend status */}
                       {(instance.status === 'stopped' || instance.status === 'error') &&
                        <button onClick={() => handleInstanceAction(instance.instance_id, 'start')} disabled={actionLoading === instance.instance_id}
                                className="px-2 py-1 text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 disabled:opacity-50 disabled:cursor-wait">
                          {actionLoading === instance.instance_id ? '...' : 'Start'}
                        </button>
                       }
                       {instance.status === 'running' &&
                        <button onClick={() => handleInstanceAction(instance.instance_id, 'stop')} disabled={actionLoading === instance.instance_id}
                                className="px-2 py-1 text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 disabled:opacity-50 disabled:cursor-wait">
                          {actionLoading === instance.instance_id ? '...' : 'Stop'}
                        </button>
                       }
                       {/* No actions shown during pending states */}
                       {(instance.status === 'pending' || instance.status === 'starting' || instance.status === 'stopping') &&
                            <span className="text-xs text-gray-400 italic">(Action unavailable)</span>
                       }
                       {/* SSH Info Button */}
                       {instance.status === 'running' && instance.ssh_host_port && <button onClick={() => alert(`SSH to host ${instance.server_hostname} on port ${instance.ssh_host_port}`)} className="px-2 py-1 text-xs font-medium rounded text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-500"> SSH </button>}
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
