import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  return (
    <>
      <Navbar />
      <main className="pt-14 min-h-screen text-black px-4">
        <div className="w-full">
          <div className="max-w-6xl mx-auto">{children}</div>
        </div>
      </main>
    </>
  );
};

export default Layout;