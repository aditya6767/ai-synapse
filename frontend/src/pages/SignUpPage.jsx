import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function SignupPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [errors, setErrors] = useState({}); // For field-specific errors {username: [...], email: [...]}
  const [nonFieldError, setNonFieldError] = useState(''); // For general form errors
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const getCsrfToken = () => { /* ... same helper function as in LoginPage ... */
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
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setErrors({});
    setNonFieldError('');

    if (password !== password2) {
      setErrors({ password2: ['Passwords do not match.'] });
      setIsLoading(false);
      return;
    }

    const signupData = { username, email, password, password2 };
    const csrfToken = getCsrfToken();

    try {
      // --- Replace with your actual Django signup API endpoint ---
      const response = await fetch('/api/signup/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify(signupData),
      });

      let data = null;
      const contentType = response.headers.get("content-type");

      // Try to parse JSON only if content type suggests it, regardless of status first
      // This helps get error details even on failure responses
      if (contentType && contentType.includes("application/json")) {
          try {
              data = await response.json();
          } catch (jsonError) {
              console.error("Failed to parse JSON response");
          }
      }


      if (response.ok || response.status === 201) { // Check for 201 Created
        console.log('Signup successful:');
        // Redirect to login page with a success message (using state)
        navigate('/login', { state: { message: 'Signup successful! Please log in.' } });
      } else {
        console.error('Signup failed');
        if (data && typeof data === 'object') {
            setErrors(data); // Assume backend returns errors keyed by field name
            if(data.non_field_errors) { setNonFieldError(data.non_field_errors.join(' ')); }
            else if (data.error){ setNonFieldError(data.error); }
            else if (data.detail){ setNonFieldError(data.detail); }
            else if (Object.keys(data).length > 0) { setNonFieldError('Please correct the errors highlighted below.'); }
            else { setNonFieldError('An unknown error occurred during signup.');}
        } else {
            setNonFieldError(data?.detail || 'Signup failed. Please check your input.');
        }
      }
    } catch (err) {
      console.error('Signup error:', err);
      setNonFieldError('An network or server error occurred during signup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getFieldError = (fieldName) => errors[fieldName]?.[0] || null;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your AI Synapse account
        </h2>
         <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            sign in if you already have an account
          </Link>
        </p>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {nonFieldError && (
              <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-700" role="alert">
                {nonFieldError}
              </div>
            )}
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username <span className="text-red-500">*</span></label>
              <div className="mt-1">
                <input id="username" name="username" type="text" required value={username} onChange={(e) => setUsername(e.target.value)} disabled={isLoading}
                       className={`appearance-none block text-gray-900 w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${getFieldError('username') ? 'border-red-500' : 'border-gray-300'}`} />
                {getFieldError('username') && <p className="mt-1 text-xs text-red-600">{getFieldError('username')}</p>}
              </div>
            </div>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
              <div className="mt-1">
                <input id="email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading}
                       className={`appearance-none block text-gray-900 w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${getFieldError('email') ? 'border-red-500' : 'border-gray-300'}`} />
                {getFieldError('email') && <p className="mt-1 text-xs text-red-600">{getFieldError('email')}</p>}
              </div>
            </div>
            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password <span className="text-red-500">*</span></label>
              <div className="mt-1">
                <input id="password" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading}
                       className={`appearance-none block text-gray-900 w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${getFieldError('password') ? 'border-red-500' : 'border-gray-300'}`} />
                 {getFieldError('password') && <p className="mt-1 text-xs text-red-600">{getFieldError('password')}</p>}
              </div>
            </div>
            {/* Password Confirmation Field */}
             <div>
              <label htmlFor="password2" className="block text-sm font-medium text-gray-700">Confirm Password <span className="text-red-500">*</span></label>
              <div className="mt-1">
                <input id="password2" name="password2" type="password" required value={password2} onChange={(e) => setPassword2(e.target.value)} disabled={isLoading}
                       className={`appearance-none block text-gray-900 w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${getFieldError('password2') ? 'border-red-500' : 'border-gray-300'}`} />
                 {getFieldError('password2') && <p className="mt-1 text-xs text-red-600">{getFieldError('password2')}</p>}
              </div>
            </div>
            {/* Submit Button */}
            <div>
              <button type="submit" disabled={isLoading}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-wait">
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
export default SignupPage;
