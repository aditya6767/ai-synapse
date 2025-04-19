import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// Optional: Import context for setting auth state
// import { useAuth } from '../context/AuthContext';

// Helper function to get CSRF token from Django's cookie
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

function LoginPage() {
  const [identifier, setIdentifier] = useState(''); // Handles email or username
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  // const { login } = useAuth(); // Example if using auth context

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    const isEmail = identifier.includes('@');
    const loginData = isEmail ? { email: identifier, password } : { username: identifier, password };
    const csrfToken = getCsrfToken();

    try {
      // API call using relative path (Vite proxy handles it in dev)
      const response = await fetch('/api/login/', { // Your Django API endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken, // Required for Django session auth POSTs
        },
        body: JSON.stringify(loginData),
      });
      console.log('Response:', response); // Debugging line
      let data = null;
      const contentType = response.headers.get("content-type");

      // Try to parse JSON only if content type suggests it
      if (contentType && contentType.includes("application/json")) {
          try {
              data = await response.json();
          } catch (jsonError) {
              console.error("Failed to parse JSON response:", jsonError);
              // If parsing fails, data remains null. Error handled below by response.ok check.
          }
      }

      if (response.ok) {
        // Login expects user data back
        if (data) { // Check if data and data.user exist
            console.log('Login successful:', data);
        } else {
             // 2xx status but no valid user data in JSON? Unexpected backend response.
             console.log('Login response OK but missing user data:');
        }
        navigate('/');
      } else {
        let errorDetail = `Login failed: ${response.statusText}`; // Default error
        if (data && typeof data === 'object') {
             // Use error message from JSON data if available
             errorDetail = data.error || data.detail || JSON.stringify(data); // Use .error OR .detail
        } else if (!contentType?.includes("application/json")) {
             // If the response wasn't JSON, maybe try getting text? (Optional)
             try {
                 const textError = await response.text();
                 console.error("Non-JSON error response text:", textError);
                 // Avoid showing raw HTML in error message
                 errorDetail = `Login failed (${response.status})`;
             } catch(textErrorErr) { /* Ignore error reading text body */ }
        }
        console.error('Login failed:', errorDetail);
        setError(errorDetail);
      }
    } catch (networkError) {
      console.error('Network error during login:', networkError);
      setError('Network error. Unable to connect to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Using Tailwind classes for styling
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to AI Synapse
        </h2>
         <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500">
            create a new account
          </Link>
        </p>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-4 rounded-md bg-red-100 border border-red-200 text-red-700" role="alert">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">
                Username or Email
              </label>
              <div className="mt-1">
                <input id="identifier" name="identifier" type="text" autoComplete="username email" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} disabled={isLoading}
                       className="appearance-none block text-gray-900 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"/>
              </div>
            </div>
            <div>
              <label htmlFor="password"className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading}
                       className="appearance-none block text-gray-900 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"/>
              </div>
            </div>
            <div>
              <button type="submit" disabled={isLoading}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-wait">
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
export default LoginPage;
