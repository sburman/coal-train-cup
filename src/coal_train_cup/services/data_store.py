import streamlit as st
from datetime import datetime
import json
from pathlib import Path
from coal_train_cup.models import User, Game, UserTip

CURRENT_SEASON = 2025


@st.cache_data
def all_games() -> list[Game]:
    filename = "data/games_2025.json"
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


@st.cache_data
def all_user_tips() -> list[UserTip]:
    filename = "data/user_tips_2025.json"
    with open(filename, "r") as f:
        tips_data = json.load(f)

    tips = []
    for tip_dict in tips_data:
        tips.append(UserTip(**tip_dict))

    return tips


@st.cache_data
def all_users() -> list[User]:
    filename = "data/users_2025.json"
    with open(filename, "r") as f:
        users_data = json.load(f)

    users = []
    for user_dict in users_data:
        users.append(User(**user_dict))

    return users
