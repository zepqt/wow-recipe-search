import React, { useState, useEffect, useMemo, useRef } from "react";
import "./style.css";
import anvil from "./anvil.webp";
import cog from "./cog.webp";
import db from "./db.json";
import axios from "axios";

const API_BASE_URL = "https://us.api.blizzard.com/data/wow/media/item";
const NAMESPACE = "static-classic-us";
const LOCALE = "en_US";
const ACCESS_TOKEN = process.env.REACT_APP_BLIZZARD_API_KEY;

const fetchReagentImage = async (itemId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${itemId}`, {
      params: {
        namespace: NAMESPACE,
        locale: LOCALE,
        access_token: ACCESS_TOKEN,
      },
    });
    const imageUrl = response.data.assets.find(
      (asset) => asset.key === "icon"
    ).value;
    console.log(`Fetched image URL for itemId ${itemId}: ${imageUrl}`);
    return imageUrl;
  } catch (error) {
    console.error("Error fetching reagent image:", error);
    return null;
  }
};

const updateReagentsWithImages = async (reagents) => {
  if (!reagents) return [];
  const updatedReagents = await Promise.all(
    reagents.map(async (reagent) => {
      const imageUrl = await fetchReagentImage(reagent.itemId);
      console.log(
        `Updating reagent: ${reagent.reagentName}, itemId: ${reagent.itemId}, imageUrl: ${imageUrl}`
      );
      return { ...reagent, imageUrl };
    })
  );
  console.log("Updated reagents with images:", updatedReagents);
  return updatedReagents;
};

function Splash() {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [pinnedRecipes, setPinnedRecipes] = useState([]);
  const [currentRecipe, setCurrentRecipe] = useState(null);
  const [craftMultiplier, setCraftMultiplier] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [showExplanation, setShowExplanation] = useState(true);

  useEffect(() => {
    if (searchTerm.length > 1) {
      const matchedRecipes = db
        .filter((recipe) =>
          recipe.WowheadName.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, 10);

      const updateRecipesWithImages = async () => {
        const updatedRecipes = await Promise.all(
          matchedRecipes.map(async (recipe) => {
            const updatedReagents = await updateReagentsWithImages(
              recipe.reagents
            );
            console.log(
              `Updated recipe: ${recipe.RecipeName}`,
              updatedReagents
            );
            return { ...recipe, reagents: updatedReagents };
          })
        );
        console.log("Updated recipes with images:", updatedRecipes);
        setSuggestions(updatedRecipes);
      };

      updateRecipesWithImages();
      setIsDropdownOpen(true);
    } else {
      setSuggestions([]);
      setIsDropdownOpen(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    console.log("Current recipe updated:", currentRecipe);
  }, [currentRecipe]);

  useEffect(() => {
    if (window.$WowheadPower && window.$WowheadPower.refreshLinks) {
      window.$WowheadPower.refreshLinks();
    }
  }, [currentRecipe]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = (e) => {
    if (e.key === "Enter" && suggestions.length > 0) {
      searchRecipe(suggestions[0].RecipeID);
      setSearchTerm(suggestions[0].WowheadName);
      setIsDropdownOpen(false);
    }
  };

  function searchRecipe(recipeId) {
    const recipe = db.find((r) => r.RecipeID === recipeId);
    if (recipe) {
      console.log("Setting currentRecipe:", recipe);
      updateReagentsWithImages(recipe.reagents).then((updatedReagents) => {
        setCurrentRecipe({ ...recipe, reagents: updatedReagents });
        setCraftMultiplier(1);
        setSuggestions([]);
        setIsDropdownOpen(false);
        setShowExplanation(false); // Hide the explanation box
      });
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
        reagents: currentRecipe.reagents.map((reagent) => ({
          ...reagent,
          amount: reagent.amount * craftMultiplier,
        })),
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
          reagents: recipe.reagents.map((reagent) => ({
            ...reagent,
            amount: (reagent.amount / recipe.multiplier) * newMultiplier,
          })),
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
    pinnedRecipes.forEach((recipe) => {
      recipe.reagents.forEach((reagent) => {
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
      <img src={anvil} alt="Anvil" className="anvil-image" />
      <div className="header-container">
        <div className="search-container" ref={dropdownRef}>
          <input
            type="search"
            id="recipe-search"
            placeholder="Search for a recipe"
            autoComplete="off"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleSearch}
            onFocus={(e) => (e.target.placeholder = "")}
            onBlur={(e) => (e.target.placeholder = "Search for a recipe")}
          />
          {isDropdownOpen && suggestions.length > 0 && (
            <ul className="suggestions-list">
              {suggestions.map((recipe) => (
                <li
                  key={recipe.RecipeID}
                  onClick={() => {
                    searchRecipe(recipe.RecipeID);
                    setSearchTerm(recipe.WowheadName);
                    setIsDropdownOpen(false);
                  }}
                >
                  {recipe.WowheadName}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {showExplanation && (
        <div className="explanation-box">
          <h3>Classic Recipe Search</h3>
          <p>
            Search for recipes, pin them and get a consolidated shopping list.
          </p>
          <p className="note">
            <img src={cog} alt="Cog" className="cog-image" />
            <br />
            There may be some recipes that are not yet available in the database
            as Blizzard does not provide an API for Classic professions.
            <br />
            I'm working on adding these asap!
          </p>
        </div>
      )}

      {currentRecipe && (
        <div className="results-container">
          <div className="recipe-header">
            <h2>
              <a
                href={`https://www.wowhead.com/classic/spell=${currentRecipe.SpellID}`}
                data-wowhead={`spell=${currentRecipe.SpellID}`}
                data-wh-icon-size="large"
                target="_blank"
                rel="noopener noreferrer"
                className="wowhead-link"
              >
                {currentRecipe.WowheadName}
              </a>
            </h2>
          </div>
          <button onClick={pinRecipe} className="pin-recipe-btn">
            Pin Recipe
          </button>
          <div className="craft-multiplier">
            <label htmlFor="craftMultiplier">Craft Multiplier:</label>
            <input
              type="number"
              id="craftMultiplier"
              value={craftMultiplier}
              min="1"
              max="100"
              step="1"
              onChange={(e) =>
                setCraftMultiplier(Math.max(1, parseInt(e.target.value) || 1))
              }
            />
          </div>
          <h3>Reagents:</h3>
          <ul className="reagent-list">
            {currentRecipe.reagents.map((reagent, index) => {
              console.log("Rendering reagent:", reagent);
              return (
                <li key={index}>
                  {reagent.imageUrl ? (
                    <img
                      src={reagent.imageUrl}
                      alt={reagent.reagentName}
                      className="reagent-image"
                    />
                  ) : (
                    <span>No image available for {reagent.reagentName}</span>
                  )}
                  <span className="reagent-name">{reagent.reagentName}</span>
                  <span className="reagent-quantity">
                    ({reagent.amount * craftMultiplier})
                  </span>
                </li>
              );
            })}
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
                  <button
                    className="close-btn"
                    onClick={() => removePinnedRecipe(index)}
                  >
                    ×
                  </button>
                  <h3>
                    {" "}
                    <a
                      href={`https://www.wowhead.com/classic/spell=${recipe.SpellID}`}
                      data-wowhead={`spell=${currentRecipe.SpellID}`}
                      data-wh-icon-size="large"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="wowhead-link"
                    ></a>{" "}
                    <br />{" "}
                    <span className="x-multiplier">x{recipe.multiplier}</span>
                  </h3>
                  <div className="craft-multiplier">
                    <label htmlFor={`craftMultiplier-${index}`}>
                      Craft Multiplier:
                    </label>
                    <input
                      type="number"
                      id={`craftMultiplier-${index}`}
                      value={recipe.multiplier}
                      min="1"
                      max="100"
                      step="1"
                      onChange={(e) =>
                        updatePinnedRecipeMultiplier(
                          index,
                          Math.max(1, parseInt(e.target.value) || 1)
                        )
                      }
                    />
                  </div>
                  <ul className="reagent-list">
                    {recipe.reagents.map((reagent, reagentIndex) => (
                      <li key={reagentIndex}>
                        {reagent.imageUrl ? (
                          <img
                            src={reagent.imageUrl}
                            alt={reagent.reagentName}
                            className="reagent-image"
                          />
                        ) : (
                          <span>
                            No image available for {reagent.reagentName}
                          </span>
                        )}
                        <span className="reagent-name">
                          {reagent.reagentName}
                        </span>
                        <span className="reagent-quantity">
                          ({Math.round(reagent.amount)})
                        </span>
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
                  {reagent.imageUrl ? (
                    <img
                      src={reagent.imageUrl}
                      alt={reagent.reagentName}
                      className="reagent-image"
                    />
                  ) : (
                    <span>No image available for {reagent.reagentName}</span>
                  )}
                  <span className="reagent-name">{reagent.reagentName}</span>
                  <span className="reagent-quantity">
                    ({Math.round(reagent.amount)})
                  </span>
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
