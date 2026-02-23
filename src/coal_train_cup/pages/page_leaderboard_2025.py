import streamlit as st
from coal_train_cup.services.leaderboard_service import get_full_results_for_spreadsheet
from coal_train_cup.constants import LEGACY_SPREADSHEET_2025


def page_leaderboard_2025() -> None:
    """
    Page for viewing the 2025 season leaderboard (archived).
    """
    st.title("2025 Leaderboard")
    st.caption("Archived final standings from the 2025 season.")

    # 2025 had 27 regular rounds
    max_round = 27
    available_rounds = list(range(1, max_round + 1))

    selected_round = st.pills(
        "Show leaderboard after:",
        options=available_rounds,
        default=max_round,
        selection_mode="single",
        format_func=lambda x: f"Round {x}",
    )

    # Load full 2025 data once (cached); filter by round in-page for instant round switches
    full_results_df = get_full_results_for_spreadsheet(LEGACY_SPREADSHEET_2025)
    if full_results_df.empty:
        st.info("No 2025 data available. Tips may need to be loaded from archive.")
        return

    reduced_df = full_results_df[full_results_df["round"] <= selected_round]
    reduced_df = reduced_df[["email", "username", "points", "margin"]]
    leaderboard_df = (
        reduced_df.groupby(["email", "username"])
        .agg({"points": "sum", "margin": "sum", "email": "count"})
        .rename(columns={"email": "tips_count"})
    )
    leaderboard_df = leaderboard_df.sort_values(by=["points", "margin"], ascending=False)

    if leaderboard_df.empty:
        st.info("No data for the selected round.")
        return

    # Reset the index to convert MultiIndex to regular columns
    leaderboard_df = leaderboard_df.reset_index()
    leaderboard_df = leaderboard_df[["username", "tips_count", "points", "margin"]]
    leaderboard_df = leaderboard_df.rename(
        columns={
            "username": "Username",
            "tips_count": "Tips made",
            "points": "Coal Train Cup points",
            "margin": "Accumulated margin",
        }
    )

    leaderboard_df = leaderboard_df.reset_index(drop=True)
    leaderboard_df.index = range(1, len(leaderboard_df) + 1)
    leaderboard_df.index.name = "Position"

    st.table(leaderboard_df)
