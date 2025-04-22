import streamlit as st
from dataclasses import dataclass
from coal_train_cup.services.data_store import (
    all_users,
    all_user_tips,
    all_game_results,
)
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


@st.cache_data(ttl=CACHE_TTL_SECONDS)
def build_full_results_dataframe() -> pd.DataFrame:
    all_users_df = pd.DataFrame([user.model_dump() for user in all_users()])

    all_user_tips_df = pd.DataFrame([tip.model_dump() for tip in all_user_tips()])
    # drop username column as it complicates the merge
    all_users_df = all_users_df.drop(columns=["username"])

    game_results = all_game_results()
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
    reduced_df = reduced_df.groupby(["email", "username"]).agg(
        {
            "points": "sum",
            "margin": "sum",
        }
    )
    reduced_df = reduced_df.sort_values(by=["points", "margin"], ascending=False)
    return reduced_df
