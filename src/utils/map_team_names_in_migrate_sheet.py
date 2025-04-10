import pandas as pd
import gspread

from coal_train_cup.services.secrets import get_secrets


def connection() -> None:
    secrets = get_secrets()

    config = secrets["connections"]["gsheets"]
    gc = gspread.service_account_from_dict(config)
    spreadsheet = gc.open("tips")

    # Get the first worksheet
    worksheet = spreadsheet.worksheet("migration")

    dataframe = pd.DataFrame(worksheet.get_all_records())

    def enforce_long_name(name: str) -> str:
        name = name.strip()

        if not name:
            return ""

        if name.lower().strip() == "illegal":
            print(f"Found illegal value: '{name}'")
            return ""

        team_name_map = {
            "Sharks": "Cronulla-Sutherland Sharks",
            "Sea Eagles": "Manly-Warringah Sea Eagles",
            "Raiders": "Canberra Raiders",
            "Panthers": "Penrith Panthers",
            "Eels": "Parramatta Eels",
            "Rabbitohs": "South Sydney Rabbitohs",
            "Knights": "Newcastle Knights",
            "Cowboys": "North Queensland Cowboys",
            "Roosters": "Sydney Roosters",
            "Bulldogs": "Canterbury-Bankstown Bulldogs",
            "Broncos": "Brisbane Broncos",
            "Warriors": "New Zealand Warriors",
            "Tigers": "Wests Tigers",
            "Dolphins": "Dolphins",  # Same in both formats
            "Dragons": "St. George Illawarra Dragons",
            "Storm": "Melbourne Storm",
            "Titans": "Gold Coast Titans",
        }

        if name in team_name_map.keys():
            return team_name_map[name]

        # Check if it's already a full team name (in the values)
        if name in team_name_map.values():
            return name
        else:
            raise ValueError(f"Team name '{name}' not found in team names list.")

    dataframe["round 1"] = dataframe["round 1"].apply(enforce_long_name)
    dataframe["round 2"] = dataframe["round 2"].apply(enforce_long_name)
    dataframe["round 3"] = dataframe["round 3"].apply(enforce_long_name)
    dataframe["round 4"] = dataframe["round 4"].apply(enforce_long_name)
    dataframe["round 5"] = dataframe["round 5"].apply(enforce_long_name)

    worksheet.update([dataframe.columns.values.tolist()] + dataframe.values.tolist())


if __name__ == "__main__":
    connection()
