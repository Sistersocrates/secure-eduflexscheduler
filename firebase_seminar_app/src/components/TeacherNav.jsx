import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { Home, BookOpen, PlusCircle, History, Users, Settings, LogOut, UserCircle as ProfileIcon } from 'lucide-react';

const TeacherNav = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'My Seminars', path: '/teacher/my-seminars', icon: BookOpen },
    { name: 'Create Seminar', path: '/teacher/create-seminar', icon: PlusCircle },
    { name: 'Attendance History', path: '/teacher/my-seminars', icon: History },
  ];

  const bottomNavItems = [
    { name: 'Settings', path: '/teacher/settings', icon: Settings },
    { name: 'Logout', action: handleLogout, icon: LogOut },
  ];

  return (
    <aside className="w-full md:w-64 bg-slate-800/70 backdrop-blur-md p-6 flex flex-col shadow-2xl md:min-h-screen border-r border-slate-700">
      <div className="flex items-center mb-10">
        <ProfileIcon className="h-10 w-10 text-sky-400 mr-3" />
        <div>
          <h2 className="text-xl font-semibold text-sky-300">{user?.displayName}</h2>
          <p className="text-xs text-slate-400 capitalize">Teacher Portal</p>
        </div>
      </div>

      <nav className="flex-grow space-y-2">
        {navItems.map((item, index) => (
          <div key={item.name}>
            <NavLink
              to={item.path}
              end={item.path === "/teacher/my-seminars"}
              className={({ isActive }) =>
                `flex items-center py-2.5 px-4 rounded-lg transition-all duration-200 ease-in-out
                 ${isActive 
                    ? 'bg-sky-500/20 text-sky-300 shadow-inner border-l-4 border-sky-400 font-medium' 
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-sky-400'}`
              }
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </NavLink>
          </div>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-slate-700/50 space-y-2">
        {bottomNavItems.map((item, index) => (
          <div key={item.name}>
            {item.path ? (
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center py-2.5 px-4 rounded-lg transition-colors duration-200
                  ${isActive 
                      ? 'bg-sky-500/10 text-sky-300' 
                      : 'text-slate-400 hover:bg-slate-700/50 hover:text-sky-400'}`
                }
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </NavLink>
            ) : (
              <button
                onClick={item.action}
                className="w-full flex items-center justify-start py-2.5 px-4 text-slate-400 hover:bg-red-500/20 hover:text-red-300 transition-colors duration-200 rounded-lg"
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </button>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
};

export default TeacherNav;