// frontend/src/App.jsx
// Current time: Friday, April 18, 2025 at 9:21 PM IST. Location: Bengaluru, Karnataka, India.

import React from 'react';
// Import React Router components
import { Routes, Route, Link, Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';

// --- Import your actual page components ---
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignUpPage';
import InstanceListPage from './pages/InstanceListPage';
import ImageListPage from './pages/ImageListPage';
import ServerListPage from './pages/ServerListPage';
import ServerCreatePage from './pages/ServerCreatePage';
import ImageCreatePage from './pages/ImageCreatePage';
import LaunchInstancePage from './pages/LaunchInstancePage';
import UserProfilePage from './pages/UserProfilePage';

// --- Import placeholder components for new routes ---
const DefineImagePage = () => <div className="p-4"><h2 className="text-xl font-semibold">Define New Image</h2><p><ImageCreatePage/></p></div>;
const AddServerPage = () => <div className="p-4"><h2 className="text-xl font-semibold">Add New Server</h2><p>(Build Component Here)</p></div>;
const LaunchInstancePageComp = () => <div className="p-4"><p><LaunchInstancePage/></p></div>;
const NotFoundPage = () => <div className="p-4 text-center"><h2>404 - Page Not Found</h2><Link to="/" className="text-blue-600">Go Home</Link></div>;


// --- Authentication / Authorization Placeholders ---
// Replace this with your actual auth context or state management hook
const useAuth = () => {
  // Placeholder hook - simulates a logged-in admin user
  // In a real app, this would check local storage, context, etc.
  const user = { username: 'admin_user', is_staff: true, is_authenticated: true }; // Example logged-in admin
  // const user = null; // Example logged-out user

  const isAuthenticated = !!user?.is_authenticated;
  const isAdmin = !!user?.is_staff;

  // Placeholder logout function
  const logout = async () => {
    console.log("Attempting logout...");
    // TODO: Call actual logout API endpoint
    // const csrfToken = getCsrfToken(); // Assume getCsrfToken helper exists
    // try {
    //   await fetch('/api/accounts/logout/', {
    //      method: 'POST',
    //      headers: {'X-CSRFToken': csrfToken }
    //   });
    // } catch (e) { console.error("Logout API call failed:", e); }

    // TODO: Clear global auth state (context, zustand, redux, local storage...)
    console.log("Placeholder: Clearing auth state.");

    // Force redirect to login - simple approach for placeholder
    window.location.replace('/login');
  };

  return { user, isAuthenticated, isAdmin, logout };
};

// Placeholder component to protect routes
function RequireAuth({ children }) {
  let { isAuthenticated } = useAuth();
  let location = useLocation();

  if (!isAuthenticated) {
    // Redirect them to the /login page, saving the location they were trying to reach
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children; // Render the protected content (e.g., MainLayout)
}

// Placeholder component for admin-only routes
function RequireAdmin({ children }) {
    let { isAdmin, isAuthenticated } = useAuth(); // Use isAdmin flag from useAuth
    let location = useLocation();

    if (!isAuthenticated) { // Must be authenticated first
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    if (!isAdmin) {
         // Redirect non-admins away from admin pages
         return <Navigate to="/" state={{ message: "Admin access required." }} replace />;
         // Or show an "Unauthorized" component: return <UnauthorizedPage />;
    }
    return children; // Render protected admin content
}


// --- Main Layout Component (Sidebar + Content) ---
function MainLayout() {
  const { user, logout } = useAuth(); // Get user and logout function
  const isAdmin = user?.is_staff;

  const handleLogout = async () => {
      await logout(); // Call the logout function from the hook
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-gray-800 text-gray-200 flex flex-col">
        <div className="h-16 flex items-center justify-center text-white text-xl font-bold border-b border-gray-700 flex-shrink-0">
             AI Synapse
        </div>
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto  px-2 py-4 space-y-1">
          <NavLink to="/">Instances</NavLink>
          <NavLink to="/images">Images</NavLink>
          {/* Conditionally render admin link */}
          {isAdmin && <NavLink to="/servers">Servers (Admin)</NavLink>}
        </nav>
         {/* User Area */}
         <div className="flex-shrink-0 border-t border-gray-700 p-4">
             {/* Conditionally show user info/logout OR login link */}
             {user ? (
                <>
                    <div className="text-sm font-medium text-white mb-1">User: {user.username}</div>
                    <div>
                        <NavLink to="/profile">Profile</NavLink>
                    </div>
                    <button onClick={handleLogout} className="w-full text-left text-gray-400 hover:text-white text-xs focus:outline-none">Logout</button>
                </>
             ) : (
                 <NavLink to="/login">Login</NavLink>
             )}
        </div>
      </aside>
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <Outlet /> {/* Child route components render here */}
      </main>
    </div>
  );
}

// Helper NavLink component (can be enhanced with NavLink from react-router-dom for active styles)
function NavLink({ to, children }) {
    return (
        <Link to={to} className="text-gray-300 hover:bg-gray-700 hover:text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md">
            {children}
        </Link>
    );
}

// --- App Component Defining Routes ---
function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Protected routes nested under the main layout */}
      {/* Wrap the entire layout section with RequireAuth */}
      <Route element={<RequireAuth><MainLayout /></RequireAuth>}>
        <Route index element={<InstanceListPage />} /> {/* Default for "/" */}
        <Route path="images" element={<ImageListPage />} />
        <Route path="images/define" element={<DefineImagePage />} /> {/* Route for defining images */}
        <Route path="instances/launch" element={<LaunchInstancePageComp />} /> {/* Route for launching instances */}
        <Route path="/profile" element={<UserProfilePage />} />

        {/* Admin-protected routes */}
        {/* Wrap specific admin routes with RequireAdmin */}
        <Route path="servers" element={<RequireAdmin><ServerListPage /></RequireAdmin>} />
        <Route path="servers/add" element={<RequireAdmin><ServerCreatePage /></RequireAdmin>} />

        {/* Fallback for unmatched routes *within* the authenticated layout */}
         <Route path="*" element={<div className="p-4 text-center"><h2>404 - Page Not Found in App</h2><Link to="/" className="text-blue-600">Go Home</Link></div>} />
      </Route>

      {/* Fallback for any route not matching above (e.g., if user tries protected route when logged out) */}
      {/* This might not be reached if RequireAuth redirects first */}
      <Route path="*" element={<NotFoundPage />} />

    </Routes>
  );
}

export default App;
