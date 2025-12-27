import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav style={{ 
      height: '70px', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '0 7%', 
      background: '#ffffff', 
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <Link to="/" style={{ textDecoration: 'none' }}>
        <h2 style={{ color: '#004e92', margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
          WATCH<span style={{ color: '#f57c00' }}>PARTY</span>
        </h2>
      </Link>
      
      <div>
        <Link to="/" style={{ textDecoration: 'none', color: '#333', fontWeight: '500', fontSize: '1rem' }}>
          Home
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;