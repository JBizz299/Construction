import { NavLink } from 'react-router-dom';

export default function Navbar() {
  const baseStyle =
    "text-sm font-semibold px-3 py-2 rounded-md transition-colors duration-150";
  const activeStyle = "text-white underline";
  const inactiveStyle = "text-white hover:bg-orange-500";

  return (
    <nav className="fixed top-0 left-0 right-0 bg-orange-600 h-14 z-50 shadow-md">
      <div className="max-w-6xl mx-auto px-4 h-full flex items-center space-x-4">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`
          }
        >
          Home
        </NavLink>
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`
          }
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/orders"
          className={({ isActive }) =>
            `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`
          }
        >
          Orders
        </NavLink>
        <NavLink
          to="/inventory"
          className={({ isActive }) =>
            `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`
          }
        >
          Inventory
        </NavLink>
        <NavLink
          to="/login"
          className={({ isActive }) =>
            `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`
          }
        >
          Login
        </NavLink>
      </div>
    </nav>
  );
}