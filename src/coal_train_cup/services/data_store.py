import streamlit as st
from datetime import datetime, timezone
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

CACHE_TTL_SECONDS = 60 * 60 * 8  # 8 hours


def _round_needing_lookup(games: list[Game]) -> int:
    at_time: datetime = datetime.now(timezone.utc)

    all_rounds = set(game.round for game in games)
    closed = []
    for round in all_rounds:
        games_in_round = [game for game in games if game.round == round]
        if all(game.kickoff <= at_time for game in games_in_round):
            closed.append(round)

    return max(closed)


@st.cache_data(ttl=CACHE_TTL_SECONDS)
def all_user_tips() -> list[UserTip]:
    return load_user_tips_from_sheets()


@st.cache_data(ttl=CACHE_TTL_SECONDS)
def all_users() -> list[User]:
    return load_users_from_sheets()


@st.cache_data(ttl=CACHE_TTL_SECONDS)
def all_games() -> list[Game]:
    existing = load_games_from_sheets()
    latest_closed = _round_needing_lookup(existing)
    nrl_api_games = get_latest_draw_from_nrl_api(
        existing, [latest_closed, latest_closed + 1]
    )
    save_games_to_sheets(nrl_api_games)
    return nrl_api_games


@st.cache_data(ttl=CACHE_TTL_SECONDS)
def all_teams() -> list[str]:
    return list(set([game.home_team for game in all_games()]))


@st.cache_data(ttl=CACHE_TTL_SECONDS)
def all_game_results() -> list[GameResult]:
    results = []
    for game in all_games():
        if game.home_score is not None and game.away_score is not None:
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
