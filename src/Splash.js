import React, { useState, useEffect, useMemo } from "react";
import "./style.css";
import logo from "./enchant_icon.webp";
import recipeList from "./recipe_list.json";

// Add this line at the top of your file
const API_KEY = process.env.REACT_APP_BLIZZARD_API_KEY;

function Splash() {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pinnedRecipes, setPinnedRecipes] = useState([]);
  const [currentRecipe, setCurrentRecipe] = useState(null);
  const [craftMultiplier, setCraftMultiplier] = useState(1);

  useEffect(() => {
    if (searchTerm.length > 1) {
      const matchedRecipes = recipeList
        .filter(recipe => 
          recipe.WowheadName && typeof recipe.WowheadName === 'string' &&
          recipe.WowheadName.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, 10);
      setSuggestions(matchedRecipes);
    } else {
      setSuggestions([]);
    }
  }, [searchTerm]);

  async function searchRecipe(recipeId) {
    setIsLoading(true);
    try {
      const [recipeResponse, mediaResponse] = await Promise.all([
        fetch(`https://us.api.blizzard.com/data/wow/recipe/${recipeId}?namespace=static-us&locale=en_US&access_token=${API_KEY}`),
        fetch(`https://us.api.blizzard.com/data/wow/media/recipe/${recipeId}?namespace=static-us&locale=en_US&access_token=${API_KEY}`)
      ]);

      const recipeData = await recipeResponse.json();
      const mediaData = await mediaResponse.json();

      const itemName = recipeData.name;
      const iconUrl = mediaData.assets[0].value;

      const matchedRecipe = recipeList.find(recipe => recipe.RecipeID === recipeId);
      const spellId = matchedRecipe ? matchedRecipe.SpellID : recipeId;

      const reagentsWithIcons = await Promise.all(recipeData.reagents.map(async (reagent) => {
        const reagentMediaResponse = await fetch(`https://us.api.blizzard.com/data/wow/media/item/${reagent.reagent.id}?namespace=static-us&locale=en_US&access_token=${API_KEY}`);
        const reagentMediaData = await reagentMediaResponse.json();
        return {
          name: reagent.reagent.name,
          quantity: reagent.quantity,
          iconUrl: reagentMediaData.assets[0].value
        };
      }));

      setCurrentRecipe({ itemName, reagents: reagentsWithIcons, spellId, iconUrl });
      setCraftMultiplier(1);
      setSuggestions([]);
    } catch (error) {
      console.error("Error fetching recipe:", error);
      setCurrentRecipe(null);
    } finally {
      setIsLoading(false);
    }
  }

  function pinRecipe() {
    if (currentRecipe) {
      const newPinnedRecipe = {
        ...currentRecipe,
        multiplier: craftMultiplier,
        reagents: currentRecipe.reagents.map(reagent => ({
          ...reagent,
          quantity: reagent.quantity * craftMultiplier
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
            quantity: (reagent.quantity / recipe.multiplier) * newMultiplier
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

  // Add this new function to calculate the shopping list
  const shoppingList = useMemo(() => {
    const list = {};
    pinnedRecipes.forEach(recipe => {
      recipe.reagents.forEach(reagent => {
        if (list[reagent.name]) {
          list[reagent.name].quantity += reagent.quantity;
        } else {
          list[reagent.name] = { ...reagent };
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
            <img src={currentRecipe.iconUrl} alt={currentRecipe.itemName} className="recipe-icon" />
            <h2>
              <a href={`https://www.wowhead.com/classic/spell=${currentRecipe.spellId}`} target="_blank" rel="noopener noreferrer">
                {currentRecipe.itemName}
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
                <img src={reagent.iconUrl} alt={reagent.name} className="reagent-icon" />
                <span className="reagent-name">{reagent.name}</span>
                <span className="reagent-quantity">({reagent.quantity * craftMultiplier})</span>
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
                  <img src={recipe.iconUrl} alt={recipe.itemName} className="recipe-icon" />
                  <h3>{recipe.itemName}</h3>
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
                        <img src={reagent.iconUrl} alt={reagent.name} className="reagent-icon" />
                        <span className="reagent-name">{reagent.name}</span>
                        <span className="reagent-quantity">({Math.round(reagent.quantity)})</span>
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
                  <img src={reagent.iconUrl} alt={reagent.name} className="reagent-icon" />
                  <span className="reagent-name">{reagent.name}</span>
                  <span className="reagent-quantity">({Math.round(reagent.quantity)})</span>
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
