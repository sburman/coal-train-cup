import pandas as pd
from datetime import datetime

from coal_train_cup.models import Game
from coal_train_cup.constants import SPREADSHEET_NAME
from coal_train_cup.services.sheets_service import (
    dataframe_to_worksheet,
    worksheet_to_dataframe,
)


def save_games_to_sheets(games: list[Game]) -> None:
    # Convert games to a list of dictionaries
    games_data = []
    for game in games:
        game_dict = game.model_dump()
        # Convert datetime to ISO format string for serialization
        game_dict["kickoff"] = game_dict["kickoff"].isoformat()
        games_data.append(game_dict)

    # Convert to DataFrame
    df = pd.DataFrame(games_data)

    # More comprehensive NaN handling
    df = df.replace({pd.NA: None, pd.NaT: None, float("nan"): None})
    # Handle any remaining NaN values
    df = df.where(pd.notna(df), None)

    # Get the worksheet and update it
    dataframe_to_worksheet(df, SPREADSHEET_NAME, "Games")
    print(f"Saved {len(games)} games to Google Sheets")


def load_games_from_sheets(spreadsheet_name: str | None = None) -> list[Game]:
    sheet = spreadsheet_name or SPREADSHEET_NAME
    # Get the worksheet and convert to DataFrame
    df = worksheet_to_dataframe(sheet, "Games")

    # Convert DataFrame rows to Game objects
    games = []
    for _, row in df.iterrows():
        # Convert empty values to None for optional integer fields
        row["home_score"] = (
            None
            if pd.isna(row["home_score"]) or row["home_score"] == ""
            else int(float(row["home_score"]))
        )
        row["away_score"] = (
            None
            if pd.isna(row["away_score"]) or row["away_score"] == ""
            else int(float(row["away_score"]))
        )

        # Convert ISO format string back to datetime
        row["kickoff"] = datetime.fromisoformat(row["kickoff"])

        # Create Game object from row data
        games.append(Game(**row.to_dict()))

    print(f"Loaded {len(games)} games from Google Sheets")
    return games
