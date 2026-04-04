import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BarChart2, LogOut } from 'lucide-react';
import useAppStore from '../store';

export default function Nav() {
  const location = useLocation();
  const logout = useAppStore(state => state.logout);
  const token = useAppStore(state => state.token);

  if (!token) return null;

  const navItems = [
    { path: '/pick', icon: Home, label: 'Practice' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-around items-center z-50 md:top-0 md:bottom-auto md:border-t-0 md:border-b md:px-12">
      <div className="flex items-center gap-8">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={24} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={logout}
          className="flex flex-col items-center gap-1 text-gray-500 hover:text-red-600 transition-colors"
        >
          <LogOut size={24} />
          <span className="text-xs font-medium">Logout</span>
        </button>
      </div>
    </nav>
  );
}
