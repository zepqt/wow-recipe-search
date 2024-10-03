import React from 'react';
import './nav.css';
import quest from './quest.webp';
import anvil from './anvil.webp';
import hammer from './hammer.webp';
import portal from './portal.webp';
import blizz from './blizz.webp';
import runecloth from './runecloth.webp';

const Nav = () => {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <img src={quest} alt="quest" className="navbar-logo" />
        <h1 className="navbar-logo-text">classic<span className="navbar-logo-text-quest">.quest</span></h1>
      </div>
      <div className="navbar-right">
      <ul className="nav-items">
          <li><a href="/recipes"><img src={hammer} alt="hammer" className="navbar-crafting-icon" />Crafting Tool</a></li>
          <li><a href="/professions"><img src={portal} alt="portal" className="navbar-crafting-icon" />Armory</a></li>
          <li><a href="/crafting"><img src={runecloth} alt="runecloth" className="navbar-crafting-icon" />City Rep</a></li>
          <li><a href="/crafting"><img src={blizz} alt="blizz" className="navbar-blizz-icon" />Blue Tracker</a></li>
        </ul>
      </div>
    </nav>
  );
};

export default Nav;
