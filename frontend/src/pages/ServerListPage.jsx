import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
// import useAuth from '../hooks/useAuth'; // Example hook for checking permissions

function ServerListPage() {
  const [servers, setServers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // const { user } = useAuth(); // Get user info
  // const isAdmin = user?.is_staff; // Example permission check

  // TODO: Replace with actual permission check based on user state
  const isAdmin = true; // Placeholder - !!! IMPORTANT: Implement real check !!!

  const fetchServers = useCallback(async (showLoadingIndicator = false) => {
    if (!isAdmin) return; // Don't fetch if not admin
    if (showLoadingIndicator) setIsLoading(true);
    setError(null);
    try {
      // --- Replace with your actual API endpoint (ensure it's admin-protected) ---
      const response = await fetch('/api/servers/');
      if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          // Handle 403 Forbidden specifically if API enforces permission
          if (response.status === 403) throw new Error("Permission Denied");
          throw new Error(`HTTP error! status: ${response.status} - ${errorData.detail || 'Failed to fetch'}`);
      }
      const data = await response.json();
      setServers(data);
    } catch (e) {
      setError(`Failed to load servers: ${e.message}`);
    } finally {
      if (showLoadingIndicator) setIsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchServers(true);
    } else {
      setError("Access Denied: You do not have permission to view servers.");
      setIsLoading(false);
    }
  }, [fetchServers, isAdmin]);

  // Render permission error or loading state
  if (!isAdmin && !isLoading) {
     return <div className="p-4 rounded-md bg-yellow-100 border border-yellow-200 text-yellow-800" role="alert">{error || "Permission Denied."}</div>;
  }
  if (isLoading) return <div className="text-center p-6 text-gray-500">Loading servers...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">Servers (Admin)</h2>
        {/* TODO: Link to actual Add Server page/modal */}
        <Link to="/servers/add" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          Add Server
        </Link>
      </div>

      {error && !isLoading && ( // Show fetch error only if user had permission initially
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {servers.length === 0 && !isLoading ? (
                 <tr><td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500 italic">No servers defined.</td></tr>
              ) : (
                servers.map((server) => (
                  <tr key={server.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{server.hostname}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-700">{server.ip_address || '-'}</td>
                    {/* Add other cells */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                       {server.is_active ?
                          <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                        : <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Inactive</span>
                       }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {/* TODO: Add Edit/Delete buttons and handlers */}
                        <button className="text-indigo-600 hover:text-indigo-900 text-xs">Edit</button>
                        <button className="text-red-600 hover:text-red-900 text-xs">Delete</button>
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

export default ServerListPage;
