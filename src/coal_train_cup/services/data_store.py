import streamlit as st
from pydantic import EmailStr
from datetime import datetime
import json
from pathlib import Path
from coal_train_cup.models import UserTip, Game

CURRENT_SEASON = 2025

ALL_TIPS: list[UserTip] = []


def all_tips() -> list[UserTip]:
    return ALL_TIPS


def save_tip(
    email: EmailStr,
    round_id: int,
    team: str,
    opponent: str,
    is_home: bool,
    season: int = CURRENT_SEASON,
) -> UserTip:
    tip = UserTip(
        email=email,
        season=season,
        round=round_id,
        team=team,
        opponent=opponent,
        home=is_home,
    )
    ALL_TIPS.append(tip)


@st.cache_data(ttl=60 * 60)
def all_games() -> list[Game]:
    filename = "games_2025.json"
    if not Path(filename).exists():
        print(f"File {filename} not found")
        return []

    # Read from file
    with open(filename, "r") as f:
        games_data = json.load(f)

    # Convert dictionaries back to Game objects
    games = []
    for game_dict in games_data:
        # Convert ISO format string back to datetime
        game_dict["kickoff"] = datetime.fromisoformat(game_dict["kickoff"])
        games.append(Game(**game_dict))

    print(f"Loaded {len(games)} games from {filename}")
    return games
