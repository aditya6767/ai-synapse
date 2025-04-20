import React, { useState, useEffect, useCallback } from 'react';
// Removed Link import as it's not used in this component anymore
// import { Link } from 'react-router-dom';

// Helper function to get CSRF token from cookies
function getCsrfToken() {
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

function UserProfilePage() {
  // State for user data and form input
  const [userProfile, setUserProfile] = useState(null); // Store initially fetched profile
  const [sshKeyInput, setSshKeyInput] = useState(''); // State for the textarea input

  // --- New state to control editing mode ---
  const [isEditingSshKey, setIsEditingSshKey] = useState(false);
  // -----------------------------------------

  // State for API interaction
  const [isLoading, setIsLoading] = useState(true); // Loading initial profile data
  const [isSaving, setIsSaving] = useState(false); // Saving SSH key update
  const [error, setError] = useState(null); // General errors
  const [fieldErrors, setFieldErrors] = useState({}); // Field-specific errors
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch user profile data on component mount
  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage('');
    try {
      const response = await fetch('/api/profile/'); // GET request
      if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Failed to fetch profile: ${errorData.detail || response.statusText}`);
      }
      const data = await response.json();
      setUserProfile(data); // Store the fetched profile
      setSshKeyInput(data.ssh_public_key || ''); // Initialize textarea
    } catch (e) {
      console.error("Failed to fetch profile:", e);
      setError(`Failed to load profile data: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Handle form submission (called when 'Save Changes' is clicked)
  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent default only needed if button is type="submit" inside form
    setIsSaving(true);
    setError(null);
    setFieldErrors({});
    setSuccessMessage('');

    const updateData = {
      ssh_public_key: sshKeyInput.trim() || null // Send null if empty, trim whitespace
    };
    const csrfToken = getCsrfToken();

    try {
      const response = await fetch('/api/profile/', {
        method: 'PATCH', // Use PATCH for partial updates
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json().catch(() => null);

      if (response.ok) {
        console.log('Profile updated successfully:', data);
        setSuccessMessage('SSH Key updated successfully!');
        // Update local profile state to match saved value
        const updatedKey = sshKeyInput.trim() || null;
        setUserProfile(prev => ({ ...prev, ssh_public_key: updatedKey }));
        setSshKeyInput(updatedKey || ''); // Ensure input reflects saved value
        setIsEditingSshKey(false); // <<< Exit editing mode on successful save
        setTimeout(() => setSuccessMessage(''), 3000); // Clear message after 3s
      } else {
        console.error('Profile update failed:', data || response.statusText);
        let errorMsg = `Failed to update: ${response.statusText}`;
        if (data && typeof data === 'object') {
            setFieldErrors(data);
            // Prioritize specific field error for ssh_public_key if available
            errorMsg = data.ssh_public_key?.[0] || data.detail || data.error || 'Please correct the errors.';
        }
        setError(errorMsg);
        // Keep editing mode active on error
      }
    } catch (err) {
      console.error('Profile update network error:', err);
      setError('An network or server error occurred. Please try again.');
      // Keep editing mode active on error
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to get error message for a field
  const getFieldError = (fieldName) => fieldErrors[fieldName]?.[0] || null;

  // --- Handler for clicking the Edit/Update button ---
  const handleEditClick = () => {
      // Clear previous errors before enabling edit
      setError(null);
      setFieldErrors({});
      setSuccessMessage('');
      setIsEditingSshKey(true);
      // Optionally focus the textarea
      // setTimeout(() => document.getElementById('ssh_public_key')?.focus(), 0);
  };

  // --- Handler for clicking the Cancel button ---
  const handleCancelClick = () => {
      setIsEditingSshKey(false);
      // Reset input value to the last known saved value from profile state
      setSshKeyInput(userProfile?.ssh_public_key || '');
      // Clear any errors shown during editing
      setError(null);
      setFieldErrors({});
  };


  // Determine initial button text based on whether a key exists
  const keyExists = userProfile?.ssh_public_key && userProfile.ssh_public_key.trim() !== '';
  const editButtonText = keyExists ? 'Update SSH Key' : 'Add SSH Key';

  // Render loading state
  if (isLoading) {
    return <div className="text-center p-6 text-gray-500">Loading profile...</div>;
  }

  // Render error if initial fetch failed badly
  // Show error only if not editing OR if it's not a specific field error during editing
  const showGeneralError = error && (!isEditingSshKey || !getFieldError('ssh_public_key'));

  return (
    <div className="space-y-6 max-w-4xl">
      <h2 className="text-2xl font-semibold text-gray-800">User Profile</h2>

      {/* Display general success/error messages */}
      {successMessage && <div className="p-4 rounded-md bg-green-100 border border-green-200 text-green-800">{successMessage}</div>}
      {showGeneralError && <div className="p-4 rounded-md bg-red-100 border border-red-200 text-red-800">{error}</div>}

      {/* Use onSubmit for the Save action, but button type controls submission */}
      <form onSubmit={handleSubmit}>
        <div className="shadow sm:overflow-hidden sm:rounded-md">
          <div className="space-y-6 bg-white px-4 py-5 sm:p-6">

            {/* Display read-only info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b pb-4 mb-6 border-gray-200">
                <div>
                    <dt className="text-sm font-medium text-gray-500">Username</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-medium">{userProfile?.username || 'N/A'}</dd>
                </div>
                 <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{userProfile?.email || 'N/A'}</dd>
                </div>
            </div>

            {/* SSH Key Textarea */}
            <div>
              <label htmlFor="ssh_public_key" className="block text-sm font-medium text-gray-700">SSH Public Key</label>
              <div className="mt-1">
                <textarea
                  id="ssh_public_key"
                  name="ssh_public_key"
                  rows={6}
                  value={sshKeyInput}
                  onChange={(e) => setSshKeyInput(e.target.value)}
                  // --- Disable textarea when not editing ---
                  disabled={!isEditingSshKey || isSaving}
                  placeholder={isEditingSshKey ? "Paste your public SSH key here (e.g., ssh-ed25519 AAAA...). Leave blank to remove." : (keyExists ? "Key is set. Click 'Update Key' to change." : "No key set. Click 'Add Key' to add one.")}
                  // --- Apply disabled styles ---
                  className={`block w-full rounded-md shadow-sm sm:text-sm text-gray-900 font-mono border ${getFieldError('ssh_public_key') ? 'border-red-500' : 'border-gray-300'} focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed`}
                />
              </div>
               {/* Display specific error for ssh_public_key if backend provides it */}
               {getFieldError('ssh_public_key') && <p className="mt-1 text-xs text-red-600">{getFieldError('ssh_public_key')}</p>}
              <p className="mt-2 text-sm text-gray-500">
                Add your SSH public key (usually found in `~/.ssh/id_rsa.pub` or `~/.ssh/id_ed25519.pub`) to allow secure, passwordless access to launched instances.
              </p>
            </div>

          </div>
          {/* Form Actions - Conditional Buttons */}
          <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
            {!isEditingSshKey ? (
                // --- Show Edit/Add button when not editing ---
                <button type="button" onClick={handleEditClick}
                        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                    {editButtonText} {/* Dynamic text: Add or Update */}
                </button>
            ) : (
                // --- Show Save and Cancel buttons when editing ---
                <div className="flex justify-end space-x-3">
                    <button type="button" onClick={handleCancelClick} disabled={isSaving}
                            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                        Cancel
                    </button>
                    {/* This button triggers the form's onSubmit */}
                    <button type="submit" disabled={isSaving}
                            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-wait">
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

export default UserProfilePage;

