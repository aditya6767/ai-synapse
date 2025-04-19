// frontend/src/pages/ServerListPage.jsx
// Current time: Saturday, April 19, 2025 at 1:54 PM IST. Location: Bengaluru, Karnataka, India.

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
// import useAuth from '../hooks/useAuth'; // Example hook for checking permissions

// --- CSRF Token Helper ---
function getCsrfToken() {
    let csrfToken = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, 'csrftoken'.length + 1) === ('csrftoken' + '=')) {
                csrfToken = decodeURIComponent(cookie.substring('csrftoken'.length + 1));
                break;
            }
        }
    }
    return csrfToken;
}

function ServerListPage() {
  const [servers, setServers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // const { user } = useAuth(); // Get user info from global state/context
  // const isAdmin = user?.is_staff; // Example permission check

  // TODO: Replace with actual permission check based on user state/context
  const isAdmin = true; // Placeholder - !!! IMPORTANT: Implement real check !!!

  // Fetch servers function with updated response handling
  const fetchServers = useCallback(async (showLoadingIndicator = false) => {
    if (!isAdmin) { // Don't fetch if user doesn't have permission
        setError("Access Denied: You do not have permission to view servers.");
        setIsLoading(false); // Ensure loading stops if permission denied early
        return;
    }
    if (showLoadingIndicator) setIsLoading(true);
    setError(null); // Clear previous errors on fetch attempt
    console.log("Fetching servers from /api/server/list/ ...");
    try {
      // --- Replace with your actual API endpoint (ensure it's admin-protected) ---
      const response = await fetch('/api/server/list/');
      if (!response.ok) {
        let errorDetail = `Failed to fetch: ${response.statusText} (Status: ${response.status})`;
        try {
            const errorData = await response.json();
            errorDetail = errorData.detail || errorData.error || JSON.stringify(errorData);
            // Handle 403 Forbidden specifically
            if (response.status === 403) errorDetail = "Permission Denied by API.";
        } catch (e) { console.warn("Could not parse error response JSON."); }
        throw new Error(errorDetail);
      }

      // --- Handle OK response (2xx) ---
      const contentType = response.headers.get("content-type");
      const contentLength = response.headers.get("content-length");
      let finalData = []; // Default to empty array

      // Only attempt to parse JSON if Content-Type indicates it AND Content-Length isn't '0'
      if (response.status !== 204 && contentLength !== '0' && contentType && contentType.includes("application/json")) {
          try {
              const parsedData = await response.json();
              // Ensure the final data is an array (handle direct array or paginated results)
              if (Array.isArray(parsedData)) {
                  finalData = parsedData;
              } else if (parsedData && Array.isArray(parsedData.results)) {
                  console.log("Server API response looks paginated, using 'results' array.");
                  finalData = parsedData.results;
              } else {
                  console.warn("Server API response OK/JSON but not array/paginated:", parsedData);
                  setError("Received unexpected server data format."); // Set non-blocking warning/error
              }
          } catch (jsonError) {
              console.warn("Received OK server response but failed to parse JSON body:", jsonError);
              setError("Received success status but invalid/empty server data.");
              // Keep finalData as empty array
          }
      } else {
          console.log("Received OK server response but no JSON content detected:", { status: response.status, contentType, contentLength });
          // Keep finalData as empty array
      }
      console.log("Setting servers state with:", finalData);
      setServers(finalData);

    } catch (e) {
      console.error("ERROR in fetchServers:", e);
      setError(`Failed to load servers: ${e.message}`);
      setServers([]); // Set empty on error
    } finally {
      if (showLoadingIndicator) setIsLoading(false);
    }
  }, [isAdmin]); // Depend on isAdmin status

  useEffect(() => {
    // Fetch data only if admin permission is confirmed
    if (isAdmin) {
      fetchServers(true);
    } else {
      // Set error immediately if not admin (redundant with check in fetchServers, but safe)
      setError("Access Denied: You do not have permission to view servers.");
      setIsLoading(false);
    }
  }, [fetchServers, isAdmin]);


  // Render permission error or loading state first
  if (isLoading) {
      return <div className="text-center p-6 text-gray-500">Loading servers...</div>;
  }
  if (!isAdmin) {
     return <div className="p-4 rounded-md bg-yellow-100 border border-yellow-200 text-yellow-800" role="alert">{error || "Permission Denied."}</div>;
  }


  // Placeholder action handlers
  const handleEditServer = (serverId) => {
      console.log("TODO: Navigate to edit server page/modal for ID:", serverId);
      // navigate(`/servers/edit/${serverId}`);
  };
  const handleDeleteServer = async (serverId) => {
      console.log("TODO: Implement Delete server API call for ID:", serverId);
      // if (!confirm(`Are you sure you want to delete server ${serverId}?`)) return;
      // setError(null);
      // try {
      //   const response = await fetch(`/api/servers/${serverId}/`, { method: 'DELETE', headers: {'X-CSRFToken': getCsrfToken()}});
      //   if (response.ok || response.status === 204) { fetchServers(); } else { /* handle error */ }
      // } catch (e) { setError(...) }
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">Servers (Admin)</h2>
        <Link to="/servers/add" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          Add Server
        </Link>
      </div>

      {/* Display fetch errors (if user had permission but fetch failed) */}
      {error && (
        <div className="p-4 rounded-md bg-red-100 border border-red-200 text-red-800" role="alert">
          {error}
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hostname</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                {/* Add other headers: GPUs, Location, Memory, etc. */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th> */}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Add explicit check for Array before mapping */}
              {!isLoading && !Array.isArray(servers) && (
                   <tr><td colSpan="4" className="px-6 py-4 text-center text-sm text-red-600 italic">Error: Invalid server data format received.</td></tr>
              )}
               {!isLoading && Array.isArray(servers) && servers.length === 0 ? (
                 <tr><td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500 italic">No servers defined.</td></tr>
              ) : (
                Array.isArray(servers) && servers.map((server) => (
                  <tr key={server.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{server.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-700">{server.ip_address || '-'}</td>
                    {/* Add other cells for server details */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                       {server.is_active ?
                          <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                        : <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Inactive</span>
                       }
                    </td>
                    {/* <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button onClick={() => handleEditServer(server.id)} className="text-indigo-600 hover:text-indigo-900 text-xs">Edit</button>
                        <button onClick={() => handleDeleteServer(server.id)} className="text-red-600 hover:text-red-900 text-xs">Delete</button>
                    </td> */}
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

export default ServerListPage;
