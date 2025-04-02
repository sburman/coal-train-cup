import streamlit as st
import json
from coal_train_cup.models import User, Game, UserTip, GameResult
from coal_train_cup.services.nrl_api_service import get_latest_draw_from_nrl_api
from coal_train_cup.services.games_service import (
    load_games_from_sheets,
    save_games_to_sheets,
)

CURRENT_SEASON = 2025


@st.cache_data
def all_games() -> list[Game]:
    # updates the sheet from nrl api each time we don't hit cache
    nrl_api_games = get_latest_draw_from_nrl_api()
    save_games_to_sheets(nrl_api_games)
    return load_games_from_sheets()


def games_for_round(round: int, season: int = 2025) -> list[Game]:
    """
    Returns a list of games for the given round.
    """
    games = []
    for game in all_games():
        if game.round == round and game.season == season:
            games.append(game)
    return games


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
