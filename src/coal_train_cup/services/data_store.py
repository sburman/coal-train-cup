import streamlit as st
from datetime import datetime
import json
import csv
from pathlib import Path
from coal_train_cup.models import User, Game, UserTip

CURRENT_SEASON = 2025


@st.cache_data
def all_games() -> list[Game]:
    filename = "data/games_2025.csv"
    if not Path(filename).exists():
        print(f"File {filename} not found")
        return []

    # Read from CSV file
    games = []
    with open(filename, "r", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Convert empty strings to None for optional integer fields
            if row["home_score"] == "":
                row["home_score"] = None
            else:
                row["home_score"] = int(row["home_score"])

            if row["away_score"] == "":
                row["away_score"] = None
            else:
                row["away_score"] = int(row["away_score"])

            # Convert ISO format string back to datetime
            row["kickoff"] = datetime.fromisoformat(row["kickoff"])

            # Create Game object from row data
            games.append(Game(**row))

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
