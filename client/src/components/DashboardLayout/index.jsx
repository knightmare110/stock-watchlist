import React from "react";

const DashboardLayout = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md h-full">
        <div className="p-4 border-b">
          <h1 className="text-2xl font-semibold text-gray-800">YourLogo</h1>
        </div>
        <nav className="mt-4">
          <ul>
            <li className="py-2 px-6 hover:bg-gray-200 cursor-pointer">
              Dashboard
            </li>
            <li className="py-2 px-6 hover:bg-gray-200 cursor-pointer">
              Profile
            </li>
            <li className="py-2 px-6 hover:bg-gray-200 cursor-pointer">
              Settings
            </li>
            <li className="py-2 px-6 hover:bg-gray-200 cursor-pointer">
              Notifications
            </li>
            <li className="py-2 px-6 hover:bg-gray-200 cursor-pointer">
              Logout
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between bg-white p-4 shadow">
          <div className="text-lg font-semibold text-gray-700">Dashboard</div>
          <div className="flex items-center">
            <div className="mr-4">Hello, User</div>
            <img
              className="w-10 h-10 rounded-full"
              src="https://www.gravatar.com/avatar/2c7d99fe281ecd3bcd65ab915bac6dd5?s=250"
              alt="User profile"
            />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
