// frontend/src/pages/ServerCreatePage.jsx
// Current time: Saturday, April 19, 2025 at 12:15 PM IST. Location: Bengaluru, Karnataka, India.

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// import useAuth from '../hooks/useAuth'; // To check permissions if needed here

// Helper function to get CSRF token
function getCsrfToken() { /* ... same helper function ... */
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
}

function ServerCreatePage() {
  // State for form fields based on your Server model
  const [hostname, setHostname] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  // Add state for other fields like location, total_gpus etc.
  const [isActive, setIsActive] = useState(true); // Default to active?

  const [errors, setErrors] = useState({}); // Field-specific errors {hostname: [...]}
  const [nonFieldError, setNonFieldError] = useState(''); // General errors
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  // const { user } = useAuth(); // Get user to check permissions if needed directly

  // TODO: Add check here or rely on router protection (RequireAdmin)
//   if (!user?.is_staff) return <p>Access Denied</p>;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setErrors({});
    setNonFieldError('');

    const serverData = {
        hostname,
        ip_address: ipAddress, // Match backend field name
        is_active: isActive,
        // Add other fields from state here
    };
    const csrfToken = getCsrfToken();

    console.log("Attempting to create server:", serverData);

    try {
        // --- Replace with your actual Django API endpoint for creating servers ---
        const response = await fetch('/api/server/create/', { // POST to the list endpoint is common REST pattern
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
            },
            body: JSON.stringify(serverData),
        });

        const data = await response.json().catch(() => null); // Attempt to parse JSON

        if (response.ok || response.status === 201) {
            console.log('Server created successfully:', data);
            // Redirect to server list page after successful creation
            navigate('/servers', { state: { message: `Server ${hostname} created successfully.` } });
        } else {
            console.error('Server creation failed:', data || response.statusText);
             if (data && typeof data === 'object') {
                setErrors(data); // Assume backend returns errors keyed by field name
                if(data.non_field_errors) { setNonFieldError(data.non_field_errors.join(' ')); }
                else if (data.error){ setNonFieldError(data.error); }
                else if (data.detail){ setNonFieldError(data.detail); }
                else { setNonFieldError('Please correct the errors highlighted below.'); }
            } else {
                setNonFieldError(data?.detail || `Failed to create server: ${response.statusText}`);
            }
        }
    } catch (err) {
        console.error('Server creation error:', err);
        setNonFieldError('An network or server error occurred. Please try again.');
    } finally {
        setIsLoading(false);
    }
  };

  // Helper to get error message for a field
  const getFieldError = (fieldName) => errors[fieldName]?.[0] || null;

  return (
    <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800">Add New Server</h2>

        <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
                <form className="space-y-6" onSubmit={handleSubmit}>
                    {nonFieldError && (
                    <div className="p-4 rounded-md bg-red-100 border border-red-200 text-red-700" role="alert">
                        {nonFieldError}
                    </div>
                    )}

                    {/* Hostname Field */}
                    <div>
                        <label htmlFor="hostname" className="block text-sm font-medium text-gray-700">Hostname <span className="text-red-500">*</span></label>
                        <div className="mt-1">
                            <input type="text" name="hostname" id="hostname" required value={hostname} onChange={(e) => setHostname(e.target.value)} disabled={isLoading}
                                   className={`text-gray-900 block w-full shadow-sm sm:text-sm rounded-md ${getFieldError('hostname') ? 'border-red-500' : 'border-gray-300'} focus:ring-blue-500 focus:border-blue-500`} />
                            {getFieldError('hostname') && <p className="mt-1 text-xs text-red-600">{getFieldError('hostname')}</p>}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Unique hostname or IP address used for connections.</p>
                    </div>

                    {/* IP Address Field */}
                    <div>
                        <label htmlFor="ipAddress" className="block text-sm font-medium text-gray-700">IP Address (Optional)</label>
                        <div className="mt-1">
                            <input type="text" name="ipAddress" id="ipAddress" value={ipAddress} onChange={(e) => setIpAddress(e.target.value)} disabled={isLoading}
                                   className={`text-gray-900 block w-full shadow-sm sm:text-sm rounded-md ${getFieldError('ip_address') ? 'border-red-500' : 'border-gray-300'} focus:ring-blue-500 focus:border-blue-500`} />
                            {getFieldError('ip_address') && <p className="mt-1 text-xs text-red-600">{getFieldError('ip_address')}</p>}
                        </div>
                    </div>

                    {/* Add other fields for your Server model here (e.g., location, total_gpus) */}

                    {/* Is Active Checkbox */}
                    <div className="relative flex items-start">
                        <div className="flex items-center h-5">
                            <input id="isActive" name="isActive" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} disabled={isLoading}
                                   className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded" />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="isActive" className="font-medium text-gray-700">Server Active?</label>
                            <p className="text-gray-500 text-xs">Allow instances to be scheduled on this server.</p>
                        </div>
                    </div>


                    {/* Form Actions */}
                    <div className="pt-5">
                        <div className="flex justify-end space-x-3">
                            <Link to="/servers" className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                Cancel
                            </Link>
                            <button type="submit" disabled={isLoading}
                                    className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-wait">
                                {isLoading ? 'Saving...' : 'Add Server'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
  );
}

export default ServerCreatePage;
