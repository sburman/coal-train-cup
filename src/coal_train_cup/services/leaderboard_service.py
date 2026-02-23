import streamlit as st
from dataclasses import dataclass
from coal_train_cup.services.data_store import (
    all_users,
    all_user_tips,
    all_game_results,
)
from coal_train_cup.services.data_service_user_tips import load_user_tips_from_sheets
from coal_train_cup.services.data_service_games import load_games_from_sheets
from coal_train_cup.models import GameResult
import pandas as pd

CACHE_TTL_SECONDS = 60 * 60 * 8  # 8 hours


@dataclass
class LeaderboardEntry:
    name: str
    tipped: int
    correct: int
    incorrect: int
    margin: int

    @property
    def points(self) -> int:
        """
        Calculate points based on the number of correct and incorrect tips.
        """
        return self.correct * 2


def _empty_results_dataframe() -> pd.DataFrame:
    """Empty DataFrame with expected schema for start-of-season (no tips yet)."""
    return pd.DataFrame(
        columns=[
            "email", "username", "season", "round", "team", "opponent", "home",
            "tipped_at", "margin", "win", "draw", "loss", "points",
        ]
    )


def _empty_game_results_dataframe() -> pd.DataFrame:
    """Empty DataFrame with merge columns for when no games have results yet."""
    return pd.DataFrame(
        columns=[
            "season", "round", "team", "opponent", "home",
            "score_for", "score_against", "margin",
        ]
    )


@st.cache_data(ttl=CACHE_TTL_SECONDS)
def build_full_results_dataframe() -> pd.DataFrame:
    all_user_tips_list = all_user_tips()
    if not all_user_tips_list:
        return _empty_results_dataframe()

    all_users_df = pd.DataFrame([user.model_dump() for user in all_users()])
    all_user_tips_df = pd.DataFrame([tip.model_dump() for tip in all_user_tips_list])
    # drop username column as it complicates the merge
    all_users_df = all_users_df.drop(columns=["username"])

    game_results = all_game_results()
    if not game_results:
        game_results_df = _empty_game_results_dataframe()
    else:
        game_results_df = pd.DataFrame(
            [
                {
                    "season": r.season,
                    "round": r.round,
                    "team": r.team,
                    "opponent": r.opponent,
                    "home": r.home,
                    "score_for": r.score_for,
                    "score_against": r.score_against,
                    "margin": r.margin,
                }
                for r in game_results
            ]
        )

    # merges user emails with username for display
    all_results_df = all_user_tips_df.merge(all_users_df, on="email")

    # merges results with tips
    all_results_df = all_results_df.merge(
        game_results_df, on=["season", "round", "team", "opponent", "home"]
    )

    # adds result column
    all_results_df["win"] = all_results_df["margin"].apply(
        lambda x: True if x > 0 else False
    )

    all_results_df["draw"] = all_results_df["margin"].apply(
        lambda x: True if x == 0 else False
    )

    all_results_df["loss"] = all_results_df["margin"].apply(
        lambda x: True if x < 0 else False
    )

    # adds result column
    all_results_df["points"] = all_results_df["margin"].apply(
        lambda x: 2 if x > 0 else 1 if x == 0 else 0
    )

    return all_results_df


def get_full_results_dataframe(round: int | None) -> pd.DataFrame:
    full_results_df = build_full_results_dataframe()
    if round:
        full_results_df = full_results_df[full_results_df["round"] <= round]
    return full_results_df


@st.cache_data(ttl=CACHE_TTL_SECONDS)
def get_leaderboard_dataframe(round: int) -> pd.DataFrame:
    reduced_df = build_full_results_dataframe()

    if round:
        reduced_df = reduced_df[reduced_df["round"] <= round]

    reduced_df = reduced_df[["email", "username", "points", "margin"]]
    reduced_df = (
        reduced_df.groupby(["email", "username"])
        .agg({"points": "sum", "margin": "sum", "email": "count"})
        .rename(columns={"email": "tips_count"})
    )
    reduced_df = reduced_df.sort_values(by=["points", "margin"], ascending=False)
    return reduced_df


def _game_results_from_games(games: list) -> list[GameResult]:
    """Build GameResult list from Game objects (for legacy spreadsheet support)."""
    results = []
    for game in games:
        if game.home_score is not None and game.away_score is not None:
            results.append(
                GameResult(
                    season=game.season,
                    round=game.round,
                    team=game.home_team,
                    opponent=game.away_team,
                    home=True,
                    score_for=game.home_score,
                    score_against=game.away_score,
                )
            )
            results.append(
                GameResult(
                    season=game.season,
                    round=game.round,
                    team=game.away_team,
                    opponent=game.home_team,
                    home=False,
                    score_for=game.away_score,
                    score_against=game.home_score,
                )
            )
    return results


@st.cache_data(ttl=CACHE_TTL_SECONDS)
def get_full_results_for_spreadsheet(spreadsheet_name: str) -> pd.DataFrame:
    """Full results for a spreadsheet - cached. Filter by round in the caller."""
    return _build_full_results_for_spreadsheet(spreadsheet_name)


def _build_full_results_for_spreadsheet(spreadsheet_name: str) -> pd.DataFrame:
    """Build full results dataframe from a specific spreadsheet."""
    tips = load_user_tips_from_sheets(spreadsheet_name)
    if not tips:
        return _empty_results_dataframe()

    games = load_games_from_sheets(spreadsheet_name)
    game_results = _game_results_from_games(games)
    game_results_df = pd.DataFrame(
        [
            {
                "season": r.season,
                "round": r.round,
                "team": r.team,
                "opponent": r.opponent,
                "home": r.home,
                "score_for": r.score_for,
                "score_against": r.score_against,
                "margin": r.margin,
            }
            for r in game_results
        ]
    )

    all_users_df = pd.DataFrame([u.model_dump() for u in all_users()])
    all_users_df = all_users_df.drop(columns=["username"])
    all_tips_df = pd.DataFrame([t.model_dump() for t in tips])

    all_results_df = all_tips_df.merge(all_users_df, on="email")
    all_results_df = all_results_df.merge(
        game_results_df, on=["season", "round", "team", "opponent", "home"]
    )
    all_results_df["points"] = all_results_df["margin"].apply(
        lambda x: 2 if x > 0 else 1 if x == 0 else 0
    )
    return all_results_df
