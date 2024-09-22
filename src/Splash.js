import React, { useState, useEffect, useMemo } from "react";
import "./style.css";
import logo from "./enchant_icon.webp";
import db from "./db.json";

function Splash() {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [pinnedRecipes, setPinnedRecipes] = useState([]);
  const [currentRecipe, setCurrentRecipe] = useState(null);
  const [craftMultiplier, setCraftMultiplier] = useState(1);

  useEffect(() => {
    if (searchTerm.length > 1) {
      const matchedRecipes = db
        .filter(recipe => 
          recipe.WowheadName.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, 10);
      setSuggestions(matchedRecipes);
    } else {
      setSuggestions([]);
    }
  }, [searchTerm]);

  function searchRecipe(recipeId) {
    const recipe = db.find(r => r.RecipeID === recipeId);
    if (recipe) {
      setCurrentRecipe(recipe);
      setCraftMultiplier(1);
      setSuggestions([]);
    } else {
      console.error("Recipe not found:", recipeId);
      setCurrentRecipe(null);
    }
  }

  function pinRecipe() {
    if (currentRecipe) {
      const newPinnedRecipe = {
        ...currentRecipe,
        multiplier: craftMultiplier,
        reagents: currentRecipe.reagents.map(reagent => ({
          ...reagent,
          amount: reagent.amount * craftMultiplier
        }))
      };
      setPinnedRecipes([...pinnedRecipes, newPinnedRecipe]);
    }
  }

  function updatePinnedRecipeMultiplier(index, newMultiplier) {
    const updatedPinnedRecipes = pinnedRecipes.map((recipe, i) => {
      if (i === index) {
        return {
          ...recipe,
          multiplier: newMultiplier,
          reagents: recipe.reagents.map(reagent => ({
            ...reagent,
            amount: (reagent.amount / recipe.multiplier) * newMultiplier
          }))
        };
      }
      return recipe;
    });
    setPinnedRecipes(updatedPinnedRecipes);
  }

  function removePinnedRecipe(index) {
    const updatedPinnedRecipes = pinnedRecipes.filter((_, i) => i !== index);
    setPinnedRecipes(updatedPinnedRecipes);
  }

  const shoppingList = useMemo(() => {
    const list = {};
    pinnedRecipes.forEach(recipe => {
      recipe.reagents.forEach(reagent => {
        if (list[reagent.reagentName]) {
          list[reagent.reagentName].amount += reagent.amount;
        } else {
          list[reagent.reagentName] = { ...reagent };
        }
      });
    });
    return Object.values(list);
  }, [pinnedRecipes]);

  return (
    <div className="splash-container">
      <img src={logo} alt="Recipe Search" className="wow-logo" />
      <h1>Classic Recipe Search</h1>
      <div className="search-container">
        <input
          type="search"
          id="recipe-search"
          placeholder="Search for a recipe"
          autoComplete="off"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button onClick={() => searchRecipe(suggestions[0]?.RecipeID)} className="search-button">Search</button>
        {suggestions.length > 0 && (
          <ul className="suggestions-list">
            {suggestions.map((recipe) => (
              <li 
                key={recipe.RecipeID} 
                onClick={() => {
                  searchRecipe(recipe.RecipeID);
                  setSearchTerm(recipe.WowheadName);
                }}
              >
                {recipe.WowheadName}
              </li>
            ))}
          </ul>
        )}
      </div>
      {currentRecipe && (
        <div className="results-container">
          <div className="recipe-header">
            <h2>
              <a href={`https://www.wowhead.com/classic/spell=${currentRecipe.SpellID}`} target="_blank" rel="noopener noreferrer">
                {currentRecipe.WowheadName}
              </a>
            </h2>
            <button onClick={pinRecipe} className="pin-recipe-btn">Pin this recipe</button>
          </div>
          <div className="craft-multiplier">
            <label htmlFor="craftMultiplier">Craft Multiplier:</label>
            <input
              type="number"
              id="craftMultiplier"
              value={craftMultiplier}
              min="1"
              max="100"
              step="1"
              onChange={(e) => setCraftMultiplier(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>
          <h3>Reagents:</h3>
          <ul className="reagent-list">
            {currentRecipe.reagents.map((reagent, index) => (
              <li key={index}>
                <span className="reagent-name">{reagent.reagentName}</span>
                <span className="reagent-quantity">({reagent.amount * craftMultiplier})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {pinnedRecipes.length > 0 && (
        <>
          <div className="pinned-recipes-container">
            <h2>Pinned Recipes</h2>
            <div className="pinned-recipes-grid">
              {pinnedRecipes.map((recipe, index) => (
                <div key={index} className="pinned-recipe">
                  <button className="close-btn" onClick={() => removePinnedRecipe(index)}>×</button>
                  <h3>{recipe.WowheadName}</h3>
                  <div className="craft-multiplier">
                    <label htmlFor={`craftMultiplier-${index}`}>Craft Multiplier:</label>
                    <input
                      type="number"
                      id={`craftMultiplier-${index}`}
                      value={recipe.multiplier}
                      min="1"
                      max="100"
                      step="1"
                      onChange={(e) => updatePinnedRecipeMultiplier(index, Math.max(1, parseInt(e.target.value) || 1))}
                    />
                  </div>
                  <ul className="reagent-list">
                    {recipe.reagents.map((reagent, reagentIndex) => (
                      <li key={reagentIndex}>
                        <span className="reagent-name">{reagent.reagentName}</span>
                        <span className="reagent-quantity">({Math.round(reagent.amount)})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          
          <div className="shopping-list-container">
            <h2>Shopping List</h2>
            <ul className="reagent-list">
              {shoppingList.map((reagent, index) => (
                <li key={index}>
                  <span className="reagent-name">{reagent.reagentName}</span>
                  <span className="reagent-quantity">({Math.round(reagent.amount)})</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
      
      <footer className="footer">
        <p>Built by Zep.</p>
      </footer>
    </div>
  );
}

export default Splash;
