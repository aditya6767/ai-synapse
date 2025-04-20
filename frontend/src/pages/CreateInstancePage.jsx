import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';

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

function CreateInstancePage() {
  // State for form inputs - Server selection removed
  const [selectedImageId, setSelectedImageId] = useState('');
  const [numGpus, setNumGpus] = useState(1); // Default to 1 GPU

  // State for data fetched from API - Only Images needed
  const [availableImages, setAvailableImages] = useState([]);

  // State for API interaction
  const [isDataLoading, setIsDataLoading] = useState(true); // Loading dropdown data
  const [isSubmitting, setIsSubmitting] = useState(false); // Submitting the form
  const [error, setError] = useState(null); // General/non-field errors
  const [fieldErrors, setFieldErrors] = useState({}); // Field-specific errors

  const navigate = useNavigate();

  // Fetch available images when component mounts - Server fetch removed
  const fetchData = useCallback(async () => {
    setIsDataLoading(true);
    setError(null);
    setAvailableImages([]); // Reset
    try {
      // --- Fetch only available images ---
      // Ensure this API endpoint exists and returns available images
      const imagesResponse = await fetch('/api/image/list/');

      if (!imagesResponse.ok) {
          const errorData = await imagesResponse.json().catch(() => ({}));
          throw new Error(`Failed to fetch images: ${errorData.detail || imagesResponse.statusText}`);
      }

      const imagesData = await imagesResponse.json();

      // Handle direct array or paginated response
      setAvailableImages(Array.isArray(imagesData) ? imagesData : (imagesData?.results || []));

    } catch (e) {
      console.error("Failed to fetch initial data:", e);
      setError(`Failed to load necessary image data: ${e.message}`);
    } finally {
      setIsDataLoading(false);
    }
  }, []); // Empty dependency array, runs once on mount

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle form submission - Sends only image_id and n_gpus
  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});
    setError('');

    // Data to send
    const launchData = {
      image_id: selectedImageId,
      n_gpus: parseInt(numGpus, 10),
    };
    const csrfToken = getCsrfToken();

    // Basic frontend validation
    if (!launchData.image_id) {
        setError("Please select an image.");
        setIsSubmitting(false);
        return;
    }
    if (isNaN(launchData.n_gpus) || launchData.n_gpus < 1) {
         setError("Please enter a valid number of GPUs (minimum 1).");
         setIsSubmitting(false);
         return;
    }

    console.log("Submitting Launch Request:", launchData);

    try {
      // API endpoint for creating/launching instances
      // Backend needs to handle server selection based on this data
      const response = await fetch('/api/instance/create/', { // POST to create/launch
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify(launchData),
      });

      const data = await response.json().catch(() => null); // Attempt to parse JSON

      if (response.ok || response.status === 201 || response.status === 202) { // Check for Created or Accepted
        console.log('Instance launch request successful:', data);
        // Redirect to instance list page with a success message
        navigate('/', { state: { message: `Instance launch initiated successfully (ID: ${data?.instance_id || 'N/A'}). Check dashboard for status.` } });
      } else {
        // Handle validation errors or other failures
        console.error('Instance launch failed:', data || response.statusText);
        if (data && typeof data === 'object') {
            setFieldErrors(data); // Assume backend returns errors keyed by field name
            if(data.non_field_errors) { setError(data.non_field_errors.join(' ')); }
            else if (data.error){ setError(data.error); }
            else if (data.detail){ setError(data.detail); }
            // Add specific field check for better UX
            else if (getFieldError('image_id') || getFieldError('n_gpus')) { setError('Please correct the errors highlighted below.'); }
            else { setError(`Failed: ${response.statusText}`);}
        } else {
            setError(data?.detail || `Failed to launch instance: ${response.statusText}`);
        }
      }
    } catch (err) {
      console.error('Instance launch network error:', err);
      setError('An network or server error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to get error message for a field
  const getFieldError = (fieldName) => fieldErrors[fieldName]?.[0] || null;

  // Render loading state for initial data fetch
  if (isDataLoading) {
    return <div className="text-center p-6 text-gray-500">Loading launch options...</div>;
  }
  // Render error if initial data fetch failed
  if (error && availableImages.length === 0) {
     return <div className="p-4 rounded-md bg-red-100 border border-red-200 text-red-800" role="alert">{error}</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl"> {/* Added max-width for form readability */}
      <h2 className="text-2xl font-semibold text-gray-800">Launch New Instance</h2>
      <p className="text-sm text-gray-600">Select an image and specify resources. An appropriate server will be assigned automatically by the backend.</p>

      <form onSubmit={handleSubmit}>
        <div className="shadow sm:overflow-hidden sm:rounded-md">
          <div className="space-y-6 bg-white px-4 py-5 sm:p-6">
            {/* General Errors */}
            {error && (
              <div className="p-4 rounded-md bg-red-100 border border-red-200 text-red-700" role="alert">
                {error}
              </div>
            )}

            {/* Image Selection */}
            <div>
              <label htmlFor="image" className="block text-sm font-medium text-gray-700">Image Template <span className="text-red-500">*</span></label>
              <select id="image" name="image" required value={selectedImageId} onChange={(e) => setSelectedImageId(e.target.value)} disabled={isSubmitting || availableImages.length === 0}
                      className={`mt-1 block w-full rounded-md border py-2 px-3 shadow-sm sm:text-sm text-gray-900 ${getFieldError('image_id') ? 'border-red-500' : 'border-gray-300'} focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed`}> {/* Changed focus color */}
                  <option value="" disabled>-- Select an Image --</option>
                  {availableImages.map(image => (
                      // Assuming image object has id and name from API
                      <option key={image.id} value={image.id}>{image.name} ({image.os_name || 'OS N/A'})</option>
                  ))}
              </select>
              {getFieldError('image_id') && <p className="mt-1 text-xs text-red-600">{getFieldError('image_id')}</p>}
               {availableImages.length === 0 && !isDataLoading && <p className="mt-1 text-xs text-yellow-600">No available images found. Cannot launch.</p>}
            </div>

            {/* GPU Count */}
            <div>
              <label htmlFor="numGpus" className="block text-sm font-medium text-gray-700">Number of GPUs <span className="text-red-500">*</span></label>
              <input type="number" name="numGpus" id="numGpus" required min="1" step="1" value={numGpus} onChange={(e) => setNumGpus(e.target.value)} disabled={isSubmitting}
                     className={`mt-1 block w-40 rounded-md shadow-sm sm:text-sm text-gray-900 ${getFieldError('n_gpus') ? 'border-red-500' : 'border-gray-300'} focus:border-indigo-500 focus:ring-indigo-500`} /> {/* Changed focus color */}
              {getFieldError('n_gpus') && <p className="mt-1 text-xs text-red-600">{getFieldError('n_gpus')}</p>}
              <p className="mt-1 text-xs text-gray-500">Select the number of GPUs for this instance.</p>
            </div>

             {/* Add other configuration options here if needed (e.g., instance name/label?) */}

          </div>
          {/* Form Actions */}
          <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
            <Link to="/" className="mr-3 inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"> {/* Changed focus color */}
              Cancel
            </Link>
            {/* --- Updated Button Style --- */}
            <button type="submit" disabled={isSubmitting || isDataLoading || availableImages.length === 0 || !selectedImageId}
                    className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-wait">
              {isSubmitting ? 'Launching...' : 'Launch Instance'}
            </button>
            {/* --- End Updated Button Style --- */}
          </div>
        </div>
      </form>
    </div>
  );
}

export default CreateInstancePage;
