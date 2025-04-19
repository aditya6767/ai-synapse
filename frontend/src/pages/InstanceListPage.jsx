// frontend/src/pages/InstanceListPage.jsx
// Current time: Saturday, April 19, 2025 at 1:47 PM IST. Location: Bengaluru, Karnataka, India.

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

// --- Reusable Status Badge Component ---
function StatusBadge({ status }) { /* ... same as before ... */
    status = status ? status.toLowerCase() : 'unknown';
    let bgColor = 'bg-gray-100'; let textColor = 'text-gray-800'; let animate = '';
    let text = status.charAt(0).toUpperCase() + status.slice(1);
    switch (status) {
        case 'running': bgColor = 'bg-green-100'; textColor = 'text-green-800'; break;
        case 'stopped': bgColor = 'bg-gray-100'; textColor = 'text-gray-800'; break;
        case 'error': bgColor = 'bg-red-100'; textColor = 'text-red-800'; break;
        case 'pending': case 'starting': case 'stopping': bgColor = 'bg-yellow-100'; textColor = 'text-yellow-800'; animate = 'animate-pulse'; break;
        default: bgColor = 'bg-blue-100'; textColor = 'text-blue-800'; text = 'Unknown'; break;
    }
    return <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor} ${animate}`}>{text}</span>;
}

// --- CSRF Token Helper ---
function getCsrfToken() { /* ... same as before ... */
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
  // Initialize state with an empty array - CRITICAL
  const [instances, setInstances] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // For initial load
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // Tracks instance ID being actioned

  // Fetch instances function with updated response handling
  const fetchInstances = useCallback(async (showLoadingIndicator = false) => {
    if (showLoadingIndicator) setIsLoading(true);
    setError(null); // Clear previous errors on fetch attempt
    console.log("Fetching instances from /api/instances/ ...");
    try {
      const response = await fetch('/api/instance/list/'); // Your API endpoint

      if (!response.ok) {
        // Handle non-OK responses (4xx, 5xx) first
        let errorDetail = `Failed to fetch: ${response.statusText} (Status: ${response.status})`;
        try {
          const errorData = await response.json(); // Try to get more specific error from JSON body
          errorDetail = errorData.detail || errorData.error || JSON.stringify(errorData);
        } catch (e) {
          console.warn("Could not parse error response JSON.");
           try { // If not JSON, try getting text
               const textError = await response.text();
               console.error("Non-JSON error response text:", textError);
               errorDetail = textError.substring(0, 200) || errorDetail; // Limit length
           } catch(e2) { /* Use statusText if text fails */ }
        }
        throw new Error(errorDetail); // Throw error to be caught below
      }

      // --- Handle OK response (2xx) ---
      const contentType = response.headers.get("content-type");
      // Check content length as an additional hint for empty body
      const contentLength = response.headers.get("content-length");
      let finalData = []; // Default to empty array for instances

      // Only attempt to parse JSON if Content-Type indicates it AND Content-Length isn't '0'
      // This handles 200 OK with empty body more reliably. 204 No Content has no body/type usually.
      if (response.status !== 204 && contentLength !== '0' && contentType && contentType.includes("application/json")) {
          try {
              const parsedData = await response.json();
              // --- Ensure the final data is an array ---
              if (Array.isArray(parsedData)) {
                  finalData = parsedData;
              } else if (parsedData && Array.isArray(parsedData.results)) {
                  // Handle DRF paginated response common structure
                  console.log("API response looks paginated, using 'results' array.");
                  finalData = parsedData.results;
              } else {
                  // Log warning if JSON but not array/paginated structure
                  console.warn("API response OK and JSON, but not an array or expected structure:", parsedData);
                  // Keep finalData as empty array, maybe set a non-blocking warning?
                  // setError("Received unexpected data format from server."); // Avoid setting error on success
              }
              // --------------------------------------
          } catch (jsonError) {
              // Got 2xx status but body wasn't valid JSON (maybe empty despite headers?)
              console.warn("Received OK response but failed to parse JSON body (likely empty):", jsonError);
              // Keep finalData as empty array, do not set component error state
          }
      } else {
          // Got 2xx status (including 204) but no JSON content detected
          // (either Content-Type wasn't JSON, Content-Length was 0, or status was 204)
          console.log("Received OK response but no JSON content detected:", { status: response.status, contentType, contentLength });
          // Keep finalData as empty array
      }

      console.log("Setting instances state with:", finalData);
      setInstances(finalData); // Update state with parsed data or default empty array

    } catch (e) {
      // Catch network errors or errors thrown from response handling
      console.error("ERROR in fetchInstances:", e);
      setError(`Failed to load instances: ${e.message}`);
      setInstances([]); // Set to empty array on fetch error to prevent .map issues
    } finally {
      if (showLoadingIndicator) setIsLoading(false);
    }
  }, []); // useCallback dependency array is empty

  // Initial fetch effect remains the same
  useEffect(() => {
    fetchInstances(true);
    const intervalId = setInterval(() => fetchInstances(false), 20000);
    return () => clearInterval(intervalId);
  }, [fetchInstances]);

  // Action Handler remains the same
  const handleInstanceAction = async (instanceId, action) => {
      setActionLoading(instanceId);
      setError(null);
      const csrfToken = getCsrfToken();
      const apiUrl = `/api/instances/${instanceId}/${action}/`;
      console.log(`Requesting action '${action}' for instance ${instanceId}`);
      try {
          const response = await fetch(apiUrl, { method: 'POST', headers: { 'X-CSRFToken': csrfToken } });
          // --- Safer Response Handling for Actions (Handles empty 2xx) ---
          let resultMessage = `Action '${action}' processed.`;
          let errorDetail = null;
          let data = null;
          const contentType = response.headers.get("content-type");
          const contentLength = response.headers.get("content-length");

          // Try parsing JSON only if response suggests it has content
          if (response.status !== 204 && contentLength !== '0' && contentType?.includes("application/json")) {
              try { data = await response.json(); } catch (e) { console.warn("Could not parse action response JSON"); }
          }

          if (response.ok) { // Includes 200, 201, 202, 204 etc.
               console.log(`${action} successful for ${instanceId}:`, data || response.statusText);
               resultMessage = data?.message || data?.detail || resultMessage;
               // Optimistic UI update
               setInstances(prev => prev.map(inst => inst.instance_id === instanceId ? { ...inst, status: action === 'start' ? 'starting' : 'stopping' } : inst));
               setTimeout(() => fetchInstances(false), 3000); // Refresh list later
               // Optionally show success message using setError or a dedicated message state
               // setError(resultMessage); // Example using error state for feedback
          } else { // Handle 4xx, 5xx errors
               errorDetail = data?.detail || data?.error || `Action failed: ${response.statusText}`;
               console.error(`Failed to ${action} instance ${instanceId}:`, errorDetail);
               setError(errorDetail); // Set error state
               setTimeout(() => fetchInstances(false), 1000); // Revert optimistic update maybe
          }
          // --- End Safer Response Handling ---
      } catch (err) {
          console.error(`Network/fetch error during ${action} action for ${instanceId}:`, err);
          setError(`Network error trying to ${action} instance ${instanceId}.`);
      } finally {
          setActionLoading(null);
      }
   };

  // --- Render Logic (remains the same) ---
  if (isLoading) { return <div className="text-center p-6 text-gray-500">Loading instances...</div>; }

  // --- DEBUGGING LOG ---
  console.log('Rendering InstanceListPage with instances:', instances, 'Is Array:', Array.isArray(instances));
  // --------------------

  return (
    <div className="space-y-6">
       {/* ... Page Title and Launch Button ... */}
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-800">Instances</h2>
            <Link to="/instances/launch" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Launch Instance
            </Link>
        </div>
       {error && <div className="mb-4 p-4 rounded-md bg-red-100 border border-red-200 text-red-800" role="alert">{error}</div>}
       {/* ... Table Structure ... */}
       <div className="bg-white shadow overflow-hidden sm:rounded-lg">
         <div className="overflow-x-auto">
           <table className="min-w-full divide-y divide-gray-200">
             <thead className="bg-gray-50">{/* ... Table Headers ... */}</thead>
             <tbody className="bg-white divide-y divide-gray-200">
               {/* Explicitly check if instances is an array before mapping */}
               {!isLoading && !Array.isArray(instances) && (
                   <tr><td colSpan="6" className="px-6 py-4 text-center text-sm text-red-600 italic">Error: Instance data is not in the expected array format. Check console & API response.</td></tr>
               )}
               {!isLoading && Array.isArray(instances) && instances.length === 0 ? (
                 <tr><td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500 italic">No instances found.</td></tr>
               ) : (
                 /* Only map if it's confirmed to be an array */
                 Array.isArray(instances) && instances.map((instance) => (
                   <tr key={instance.instance_id} className="hover:bg-gray-50">
                     {/* ... Table Cells ... */}
                     <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-700" title={instance.instance_id}>{instance.instance_id?.substring(0, 12) || '-'}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{instance.image_name || '-'}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{instance.server_hostname || '-'}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm"><StatusBadge status={instance.status} /></td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{instance.created_at ? new Date(instance.created_at).toLocaleDateString() : '-'}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                       {/* Action Buttons */}
                       {(instance.status === 'stopped' || instance.status === 'error') && <button onClick={() => handleInstanceAction(instance.instance_id, 'start')} disabled={actionLoading === instance.instance_id || instance.status === 'starting'} className="px-2 py-1 text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 disabled:opacity-50 disabled:cursor-wait"> {actionLoading === instance.instance_id ? '...' : 'Start'} </button>}
                       {instance.status === 'running' && <button onClick={() => handleInstanceAction(instance.instance_id, 'stop')} disabled={actionLoading === instance.instance_id || instance.status === 'stopping'} className="px-2 py-1 text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 disabled:opacity-50 disabled:cursor-wait"> {actionLoading === instance.instance_id ? '...' : 'Stop'} </button>}
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
