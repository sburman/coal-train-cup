import streamlit as st
from coal_train_cup.services.leaderboard_service import get_leaderboard_dataframe
from coal_train_cup.services.games_service import get_most_recent_closed_round


def page_leaderboard() -> None:
    """
    Page for viewing the leaderboard.
    """
    st.title("Leaderboard")

    # use all_game_results to get the max round
    max_round = get_most_recent_closed_round()
    print(f"Max round: {max_round}")
    available_rounds = range(1, max_round + 1)

    selected_round = st.pills(
        "Show leaderboard after:",
        options=available_rounds,
        default=available_rounds[-1] if available_rounds else None,
        selection_mode="single",
        format_func=lambda x: f"Round {x}" if x == 1 else f"{x}",
    )

    # filter the leaderboard_df for the selected round
    leaderboard_df = get_leaderboard_dataframe(selected_round)

    # Reset the index to convert MultiIndex to regular columns
    leaderboard_df = leaderboard_df.reset_index()
    leaderboard_df = leaderboard_df[["username", "points", "margin"]]
    leaderboard_df = leaderboard_df.rename(
        columns={
            "username": "Username",
            "points": "Coal Train Cup points",
            "margin": "Accumulated margin",
        }
    )

    # Create a new DataFrame with 1-based position index
    # Reset the default index and add a "Position" column starting from 1
    leaderboard_df = leaderboard_df.reset_index(drop=True)
    leaderboard_df.index = range(1, len(leaderboard_df) + 1)
    leaderboard_df.index.name = "Position"

    st.table(leaderboard_df)
