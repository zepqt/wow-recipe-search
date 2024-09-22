import pandas as pd
import requests
from bs4 import BeautifulSoup
import time

def get_spell_name(spell_id):
    print(f"Fetching spell name for ID: {spell_id}")
    url = f"https://www.wowhead.com/classic/spell={spell_id}"
    
    try:
        response = requests.get(url)
        if response.status_code != 200:
            print(f"Error: Spell ID {spell_id} not found (Status Code: {response.status_code})")
            return "Spell Not Found"
        
        soup = BeautifulSoup(response.content, 'html.parser')
        title = soup.find('title')
        if title:
            spell_name = title.text.replace(" - Spell - Classic World of Warcraft", "").strip()
            print(f"Found: {spell_name}")
            return spell_name
        else:
            print(f"Error: No title found for Spell ID {spell_id}")
            return "Spell Not Found"
    
    except Exception as e:
        print(f"Exception occurred for Spell ID {spell_id}: {e}")
        return "Spell Not Found"

# Load the CSV file
df = pd.read_csv(r'C:\Users\tomwe\Documents\wow-recipe-search\src\Wowhead_Lookup.csv')

# Check if the file loaded correctly
print(df.head())  # Print first few rows to verify data

# Process the spell IDs and add a new column
df['FullSpellName'] = df['SpellID'].apply(get_spell_name)

# Print a preview to see if the column is being populated
print(df.head())

# Save the updated CSV
df.to_csv(r'C:\Users\tomwe\Documents\wow-recipe-search\src\updated_spreadsheet.csv', index=False)
print("CSV has been saved.")
