import streamlit as st
import pandas as pd
from coal_train_cup.services.data_store import all_user_tips
from coal_train_cup.services.games_service import (
    RoundStatus,
    get_all_rounds_status,
    get_game_results_for_round,
)
import plotly.express as px


def page_view_round_tips() -> None:
    """
    Page for viewing round tips.
    """
    st.title("View round tips")

    # select box to choose a round, use all games to get the rounds
    tips = all_user_tips()
    round_statuses = get_all_rounds_status()
    available_rounds = [
        round
        for round, status in round_statuses.items()
        if status == RoundStatus.CLOSED
    ]

    selected_round = st.pills(
        "Show round tip summary for:",
        options=available_rounds,
        default=available_rounds[-1] if available_rounds else None,
        selection_mode="single",
        format_func=lambda x: f"Round {x}" if x == 1 else f"{x}",
    )

    if selected_round:
        # filter the tips for the selected round
        round_tips = [tip for tip in tips if tip.round == selected_round]
        round_results = get_game_results_for_round(selected_round)

        # Convert tips to a DataFrame
        tips_df = pd.DataFrame([{"team": tip.team} for tip in round_tips])

        if tips_df.empty:
            st.write("No tips for this round")
        else:
            # Group by team and count
            team_stats = tips_df.groupby("team").size().reset_index(name="count")
            team_stats = team_stats.sort_values("count", ascending=False)

            full_team_list_for_round = list(
                set([result.team for result in round_results])
            )
            # Add missing teams with 0 count
            missing_teams = set(full_team_list_for_round) - set(team_stats["team"])
            missing_teams_df = pd.DataFrame(
                {"team": list(missing_teams), "count": [0] * len(missing_teams)}
            )
            team_stats = pd.concat([team_stats, missing_teams_df], ignore_index=True)
            team_stats = team_stats.sort_values("count", ascending=False)

            # use round_result to zip win/loss/draw for each team
            round_results_df = pd.DataFrame(
                [
                    {
                        "team": result.team,
                        "result": "Won"
                        if result.margin > 0
                        else "Lost"
                        if result.margin < 0
                        else "Draw",
                    }
                    for result in round_results
                ]
            )

            # Merge team_stats with round_results to get the result for each team
            team_stats = team_stats.merge(round_results_df, on="team", how="left")

            # Create color map based on results
            # Won: Green (#2ecc71)
            # Lost: Red (#e74c3c)
            # Draw: Yellow (#f1c40f)
            color_map = {"Won": "#2ecc71", "Lost": "#e74c3c", "Draw": "#f1c40f"}
            team_stats["color"] = team_stats["result"].map(color_map)

            # Calculate total winning and losing tips
            tips_with_results = tips_df.merge(round_results_df, on="team", how="left")
            result_counts = tips_with_results["result"].value_counts()

            # Create pie chart
            fig_pie = px.pie(
                values=result_counts.values,
                names=result_counts.index,
                color=result_counts.index,
                color_discrete_map=color_map,
                title="Distribution of Winning vs Losing Tips",
            )
            st.plotly_chart(fig_pie)

            # Create bar chart
            # Sort by result (winners first) and then by count
            team_stats = team_stats.sort_values(
                ["result", "count"], ascending=[True, True]
            )
            fig = px.bar(
                team_stats,
                x="count",
                y="team",
                orientation="h",
                color="result",
                color_discrete_map=color_map,
                title="Team Tips",
            )
            st.plotly_chart(fig)
