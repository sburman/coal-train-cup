from dataclasses import dataclass
import pandas as pd
from datetime import datetime

import streamlit as st
from coal_train_cup.services.data_store import all_games
from coal_train_cup.models import Game
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
    dataframe_to_worksheet(df, "Coal Train Cup App 2025", "Games")
    print(f"Saved {len(games)} games to Google Sheets")


def load_games_from_sheets() -> list[Game]:
    # Get the worksheet and convert to DataFrame
    df = worksheet_to_dataframe("Coal Train Cup App 2025", "Games")

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


def games_for_round(round: int, season: int = 2025) -> list[Game]:
    """
    Returns a list of games for the given round.
    """
    games = []
    for game in all_games():
        if game.round == round and game.season == season:
            games.append(game)
    return games


@dataclass
class GameResult:
    season: int
    round: int
    team: str
    opponent: str
    home: bool
    score_for: int
    score_against: int

    @property
    def margin(self) -> int:
        return self.score_for - self.score_against


@st.cache_data
def all_game_results() -> list[GameResult]:
    results = []
    for game in all_games():
        if game.home_score and game.away_score:
            home_result = GameResult(
                season=game.season,
                round=game.round,
                team=game.home_team,
                opponent=game.away_team,
                home=True,
                score_for=game.home_score,
                score_against=game.away_score,
            )
            away_result = GameResult(
                season=game.season,
                round=game.round,
                team=game.away_team,
                opponent=game.home_team,
                home=False,
                score_for=game.away_score,
                score_against=game.home_score,
            )
            results.append(home_result)
            results.append(away_result)
    return results
