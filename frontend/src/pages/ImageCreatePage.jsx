// frontend/src/pages/ImageCreatePage.jsx
// Current time: Saturday, April 19, 2025 at 11:24 PM IST. Location: Bengaluru, Karnataka, India.

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// import apiClient from '../apiClient'; // Or use fetch

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


function ImageCreatePage() {
  // State for form fields corresponding to the Image model
  const [name, setName] = useState('');
  const [imageTag, setImageTag] = useState('');
  const [description, setDescription] = useState('');
  const [osName, setOsName] = useState('');
  const [osVersion, setOsVersion] = useState('');
  const [cudaVersion, setCudaVersion] = useState('');
  const [architecture, setArchitecture] = useState('x86_64'); // Default example
  const [isAvailable, setIsAvailable] = useState(true);

  // State for API interaction
  const [errors, setErrors] = useState({}); // Field-specific errors { name: [...], ... }
  const [nonFieldError, setNonFieldError] = useState(''); // General form error
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Helper to get error message for a field
  const getFieldError = (fieldName) => errors[fieldName]?.[0] || null;

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setErrors({});
    setNonFieldError('');

    const imageData = {
      name: name,
      tag: imageTag, // Match backend model field name
      description: description,
      os_name: osName,
      os_version: osVersion,
      cuda_version: cudaVersion,
      architecture: architecture,
      is_available: isAvailable,
    };
    const csrfToken = getCsrfToken();

    console.log("Submitting Image Definition:", imageData);

    try {
      // --- Replace with your actual Django API endpoint for creating images ---
      const response = await fetch('/api/image/create/', { // Example: POST to list endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify(imageData),
      });

      const data = await response.json().catch(() => null); // Try parsing JSON always

      if (response.ok || response.status === 201) { // Check for 201 Created
        console.log('Image definition created successfully:', data);
        // Redirect to image list page with a success message
        navigate('/images', { state: { message: `Image definition "${name}" created successfully.` } });
      } else {
        // Handle validation errors or other failures
        console.error('Image definition creation failed:', data || response.statusText);
        if (data && typeof data === 'object') {
            setErrors(data); // Assume backend returns errors keyed by field name
            if(data.non_field_errors) { setNonFieldError(data.non_field_errors.join(' ')); }
            else if (data.error){ setNonFieldError(data.error); }
            else if (data.detail){ setNonFieldError(data.detail); }
            else if (Object.keys(data).length > 0) { setNonFieldError('Please correct the errors highlighted below.'); }
            else { setNonFieldError(`Failed: ${response.statusText}`);}
        } else {
            setNonFieldError(data?.detail || `Failed to create image definition: ${response.statusText}`);
        }
      }
    } catch (err) {
      console.error('Image creation network error:', err);
      setNonFieldError('An network or server error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">Define New Image</h2>

      <form onSubmit={handleSubmit}>
        <div className="shadow sm:overflow-hidden sm:rounded-md">
          <div className="space-y-6 bg-white px-4 py-5 sm:p-6">
            {/* General Errors */}
            {nonFieldError && (
              <div className="p-4 rounded-md bg-red-100 border border-red-200 text-red-700" role="alert">
                {nonFieldError}
              </div>
            )}

            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Display Name <span className="text-red-500">*</span></label>
              <input type="text" name="name" id="name" required value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading}
                     className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm text-gray-900 ${getFieldError('name') ? 'border-red-500' : 'border-gray-300'} focus:border-blue-500 focus:ring-blue-500`} />
              {getFieldError('name') && <p className="mt-1 text-xs text-red-600">{getFieldError('name')}</p>}
            </div>

            {/* Registry Path Field */}
            <div>
              <label htmlFor="imageTag" className="block text-sm font-medium text-gray-700">Image Tag <span className="text-red-500">*</span></label>
              <input type="text" name="imageTag" id="imageTag" required value={imageTag} onChange={(e) => setImageTag(e.target.value)} disabled={isLoading} placeholder="e.g., your_image_repo/image_name:tag"
                     className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm text-gray-900 font-mono ${getFieldError('custom_registry_image_name') ? 'border-red-500' : 'border-gray-300'} focus:border-blue-500 focus:ring-blue-500`} />
              {getFieldError('custom_registry_image_name') && <p className="mt-1 text-xs text-red-600">{getFieldError('custom_registry_image_name')}</p>}
              <p className="mt-1 text-xs text-gray-500">The exact tag of the image. You must push the image manually.</p>
            </div>

            {/* Description Field */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
              <div className="mt-1">
                <textarea id="description" name="description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} disabled={isLoading}
                          className={`block w-full rounded-md shadow-sm sm:text-sm text-gray-900 ${getFieldError('description') ? 'border-red-500' : 'border-gray-300'} focus:border-blue-500 focus:ring-blue-500`} />
              </div>
              {getFieldError('description') && <p className="mt-1 text-xs text-red-600">{getFieldError('description')}</p>}
              <p className="mt-1 text-xs text-gray-500">Brief description of the image and its purpose.</p>
            </div>

            {/* OS Fields */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                    <label htmlFor="osName" className="block text-sm font-medium text-gray-700">OS Name</label>
                    <input type="text" name="osName" id="osName" value={osName} onChange={(e) => setOsName(e.target.value)} disabled={isLoading} placeholder="e.g., Ubuntu"
                           className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm text-gray-900 ${getFieldError('os_name') ? 'border-red-500' : 'border-gray-300'} focus:border-blue-500 focus:ring-blue-500`} />
                    {getFieldError('os_name') && <p className="mt-1 text-xs text-red-600">{getFieldError('os_name')}</p>}
                </div>
                 <div>
                    <label htmlFor="osVersion" className="block text-sm font-medium text-gray-700">OS Version</label>
                    <input type="text" name="osVersion" id="osVersion" value={osVersion} onChange={(e) => setOsVersion(e.target.value)} disabled={isLoading} placeholder="e.g., 22.04"
                           className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm text-gray-900 ${getFieldError('os_version') ? 'border-red-500' : 'border-gray-300'} focus:border-blue-500 focus:ring-blue-500`} />
                    {getFieldError('os_version') && <p className="mt-1 text-xs text-red-600">{getFieldError('os_version')}</p>}
                </div>
            </div>

             {/* CUDA Version Field */}
            <div>
              <label htmlFor="cudaVersion" className="block text-sm font-medium text-gray-700">CUDA Version (if applicable)</label>
              <input type="text" name="cudaVersion" id="cudaVersion" value={cudaVersion} onChange={(e) => setCudaVersion(e.target.value)} disabled={isLoading} placeholder="e.g., 11.8"
                     className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm text-gray-900 ${getFieldError('cuda_version') ? 'border-red-500' : 'border-gray-300'} focus:border-blue-500 focus:ring-blue-500`} />
              {getFieldError('cuda_version') && <p className="mt-1 text-xs text-red-600">{getFieldError('cuda_version')}</p>}
            </div>

            {/* Architecture Field (Example using Select) */}
             <div>
                <label htmlFor="architecture" className="block text-sm font-medium text-gray-700">Architecture</label>
                <select id="architecture" name="architecture" value={architecture} onChange={(e) => setArchitecture(e.target.value)} disabled={isLoading}
                        className={`mt-1 block w-full rounded-md border py-2 px-3 shadow-sm sm:text-sm text-gray-900 ${getFieldError('architecture') ? 'border-red-500' : 'border-gray-300'} focus:border-blue-500 focus:outline-none focus:ring-blue-500`}>
                    <option value="x86_64">x86_64 / amd64</option>
                    <option value="arm64">arm64 / aarch64</option>
                    {/* Add other architectures if needed */}
                </select>
                {getFieldError('architecture') && <p className="mt-1 text-xs text-red-600">{getFieldError('architecture')}</p>}
            </div>

            {/* Is Available Checkbox */}
            <div className="relative flex items-start">
                <div className="flex h-5 items-center">
                    <input id="isAvailable" name="isAvailable" type="checkbox" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} disabled={isLoading}
                           className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                </div>
                <div className="ml-3 text-sm">
                    <label htmlFor="isAvailable" className="font-medium text-gray-700">Available for Launch?</label>
                    <p className="text-xs text-gray-500">Allow users to select this image definition when launching new instances.</p>
                </div>
            </div>

          </div>
          {/* Form Actions */}
          <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
            <Link to="/images" className="mr-3 inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Cancel
            </Link>
            <button type="submit" disabled={isLoading}
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-wait">
              {isLoading ? 'Saving...' : 'Save Image Definition'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default ImageCreatePage;
