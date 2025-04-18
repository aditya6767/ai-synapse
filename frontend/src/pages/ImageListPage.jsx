import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

function ImageListPage() {
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchImages = useCallback(async (showLoadingIndicator = false) => {
    if (showLoadingIndicator) setIsLoading(true);
    setError(null);
    try {
      // --- Replace with your actual API endpoint ---
      const response = await fetch('/api/images/');
      if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`HTTP error! status: ${response.status} - ${errorData.detail || 'Failed to fetch'}`);
      }
      const data = await response.json();
      setImages(data);
    } catch (e) {
      setError(`Failed to load images: ${e.message}`);
    } finally {
      if (showLoadingIndicator) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages(true);
  }, [fetchImages]);

  if (isLoading) return <div className="text-center p-6 text-gray-500">Loading images...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">Image Definitions</h2>
        {/* TODO: Link to actual Define Image page/modal */}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {images.length === 0 && !isLoading ? (
                 <tr><td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500 italic">No image definitions found.</td></tr>
              ) : (
                images.map((image) => (
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

export default ImageListPage;
