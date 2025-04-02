import streamlit as st
from coal_train_cup.models import User, Game, UserTip, GameResult
from coal_train_cup.services.nrl_api_service import get_latest_draw_from_nrl_api
from coal_train_cup.services.data_service_games import (
    load_games_from_sheets,
    save_games_to_sheets,
)
from coal_train_cup.services.data_service_users import (
    load_users_from_sheets,
)
from coal_train_cup.services.data_service_user_tips import (
    load_user_tips_from_sheets,
)

CURRENT_SEASON = 2025


@st.cache_data
def all_user_tips() -> list[UserTip]:
    return load_user_tips_from_sheets()


@st.cache_data
def all_users() -> list[User]:
    return load_users_from_sheets()


@st.cache_data
def all_games(force_update: bool = False) -> list[Game]:
    # updates the sheet from nrl api each time we don't hit cache
    if force_update:
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
