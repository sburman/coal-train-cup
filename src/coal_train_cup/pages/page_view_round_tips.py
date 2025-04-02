import streamlit as st
import pandas as pd
from coal_train_cup.services.data_store import all_games, all_user_tips


def page_view_round_tips() -> None:
    """
    Page for viewing round tips.
    """
    st.title("View round tips")

    # select box to choose a round, use all games to get the rounds
    tips = all_user_tips()
    games = all_games()
    rounds = sorted(set([game.round for game in games]))
    selected_round = st.selectbox(
        "Select a round", rounds, format_func=lambda x: f"Round {x}"
    )

    if selected_round:
        # filter the tips for the selected round
        round_tips = [tip for tip in tips if tip.round == selected_round]

        # Convert tips to a DataFrame
        tips_df = pd.DataFrame([{"team": tip.team} for tip in round_tips])

        if tips_df.empty:
            st.write("No tips for this round")
        else:
            # Group by team and count
            team_stats = tips_df.groupby("team").size().reset_index(name="count")
            team_stats = team_stats.sort_values("count", ascending=False)

            # Reset index to hide it in the display
            team_stats = team_stats.reset_index(drop=True)

            # create bar chart of the team counts
            st.bar_chart(team_stats, x="team", y="count", horizontal=True)
