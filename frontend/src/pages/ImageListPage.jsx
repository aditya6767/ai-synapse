// frontend/src/pages/ImageListPage.jsx
// Current time: Saturday, April 19, 2025 at 1:51 PM IST. Location: Bengaluru, Karnataka, India.

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

function ImageListPage() {
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch images function with updated response handling
  const fetchImages = useCallback(async (showLoadingIndicator = false) => {
    if (showLoadingIndicator) setIsLoading(true);
    setError(null); // Clear previous errors on fetch attempt
    console.log("Fetching images from /api/image/list/ ...");
    try {
      // --- Replace with your actual API endpoint ---
      const response = await fetch('/api/image/list/');
      if (!response.ok) {
        // Handle non-OK responses (4xx, 5xx) first
        let errorDetail = `Failed to fetch: ${response.statusText} (Status: ${response.status})`;
        try {
          const errorData = await response.json(); // Try to get more specific error from JSON body
          errorDetail = errorData.detail || errorData.error || JSON.stringify(errorData);
        } catch (e) { console.warn("Could not parse error response JSON."); }
        throw new Error(errorDetail); // Throw error to be caught below
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
                  console.log("API response looks paginated, using 'results' array.");
                  finalData = parsedData.results;
              } else {
                  console.warn("API response OK and JSON, but not an array or expected structure:", parsedData);
                  setError("Received unexpected data format from server."); // Set non-blocking warning/error
              }
          } catch (jsonError) {
              console.warn("Received OK response but failed to parse JSON body (likely empty):", jsonError);
              // Keep finalData as empty array, do not set component error state for this
          }
      } else {
          // Got 2xx status but no JSON content detected
          console.log("Received OK response but no JSON content detected:", { status: response.status, contentType, contentLength });
          // Keep finalData as empty array
      }

      console.log("Setting images state with:", finalData);
      setImages(finalData); // Update state with parsed data or default empty array

    } catch (e) {
      // Catch network errors or errors thrown from response handling
      console.error("ERROR in fetchImages:", e);
      setError(`Failed to load images: ${e.message}`);
      setImages([]); // Set to empty array on fetch error
    } finally {
      if (showLoadingIndicator) setIsLoading(false);
    }
  }, []); // useCallback dependency array is empty

  useEffect(() => {
    fetchImages(true); // Initial fetch
    // Optional: Add polling or other refresh mechanisms if needed
  }, [fetchImages]);

  // Placeholder handlers for actions (implement fetch calls similar to InstanceListPage)
  const handleEditImage = (imageId) => { console.log("TODO: Edit image", imageId); /* Navigate or show modal */ };
  const handleDeleteImage = async (imageId) => {
      console.log("TODO: Delete image", imageId);
      // Example:
      // if (!confirm("Are you sure you want to delete this image definition?")) return;
      // setError(null);
      // try {
      //   const response = await fetch(`/api/images/${imageId}/`, { method: 'DELETE', headers: {'X-CSRFToken': getCsrfToken()}});
      //   if (response.ok || response.status === 204) { fetchImages(); } else { /* handle error */ }
      // } catch (e) { setError(...) }
  };


  if (isLoading) return <div className="text-center p-6 text-gray-500">Loading images...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">Image Definitions</h2>
        <Link to="/images/define" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          Define New Image
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registry Path</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CUDA</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OS</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th> */}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Add explicit check for Array before mapping */}
              {!isLoading && !Array.isArray(images) && (
                   <tr><td colSpan="6" className="px-6 py-4 text-center text-sm text-red-600 italic">Error: Invalid image data format received.</td></tr>
              )}
              {!isLoading && Array.isArray(images) && images.length === 0 ? (
                 <tr><td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500 italic">No image definitions found.</td></tr>
              ) : (
                Array.isArray(images) && images.map((image) => (
                  <tr key={image.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{image.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-700 max-w-xs truncate" title={image.custom_registry_image_name}>
                        {image.custom_registry_image_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{image.cuda_version || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{image.os_name || ''} {image.os_version || ''}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {image.is_available ?
                            <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Yes</span>
                           : <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">No</span>}
                    </td>
                    {/* <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button onClick={() => handleEditImage(image.id)} className="text-indigo-600 hover:text-indigo-900 text-xs">Edit</button>
                        <button onClick={() => handleDeleteImage(image.id)} className="text-red-600 hover:text-red-900 text-xs">Delete</button>
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

export default ImageListPage;
