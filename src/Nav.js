import React from 'react';
import './nav.css';
import quest from './quest.webp';
import hammer from './hammer.webp';
import anvil from './anvil.webp';

const Nav = () => {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <img src={quest} alt="quest" className="navbar-logo" />
        <h1 className="navbar-logo-text">classic.quest</h1>
        <ul className="nav-items">
          <li><a href="/recipes"><img src={hammer} alt="hammer" className="navbar-crafting-icon" />Crafting Tool</a></li>
          <li><a href="/professions"><img src={anvil} alt="anvil" className="navbar-crafting-icon" />Armory</a></li>
          <li><a href="/crafting"><img src={hammer} alt="hammer" className="navbar-crafting-icon" />Blue Tracker</a></li>
        </ul>
      </div>
      <div className="navbar-right">
        <ul className="nav-items">
          <li><a href="/about">About</a></li>
          <li><a href="/contact">Contact</a></li>
        </ul>
      </div>
    </nav>
  );
};

export default Nav;
