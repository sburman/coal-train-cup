import streamlit as st
import pandas as pd
import altair as alt
from coal_train_cup.services.leaderboard_service import get_leaderboard_dataframe


def leaderboard_position_chart(user, user_display_df, max_round):
    positions = []
    teams_tipped = []
    opponents = []
    results = []
    margins = []
    venues = []
    rounds = list(range(1, max_round + 1))
    for rnd in rounds:
        leaderboard_df = get_leaderboard_dataframe(rnd).reset_index()
        leaderboard_df["Position"] = leaderboard_df.index + 1
        user_row = leaderboard_df[leaderboard_df["email"] == user.email]
        if not user_row.empty:
            positions.append(int(user_row["Position"].iloc[0]))
        else:
            positions.append(None)
        # Get team tipped, opponent, result, margin, and venue for this round
        tip_row = user_display_df.loc[user_display_df.index == rnd]
        if not tip_row.empty:
            teams_tipped.append(tip_row["Team"].iloc[0])
            opponents.append(tip_row["vs Opponent"].iloc[0])
            margin = tip_row["Margin"].iloc[0]
            margins.append(margin)
            venues.append(tip_row["Venue"].iloc[0])
            if margin > 0:
                results.append("Win")
            elif margin == 0:
                results.append("Draw")
            else:
                results.append("Loss")
        else:
            teams_tipped.append("")
            opponents.append("")
            results.append("")
            margins.append("")
            venues.append("")
    st.subheader("Leaderboard position by round")
    pos_df = pd.DataFrame(
        {
            "Round": rounds,
            "Position": positions,
            "Team": teams_tipped,
            "Opponent": opponents,
            "Venue": venues,
            "Result": results,
            "Margin": margins,
        }
    )
    chart = (
        alt.Chart(pos_df)
        .mark_line(point=True)
        .encode(
            x=alt.X(
                "Round:O", axis=alt.Axis(title="Round", labelAngle=0, tickMinStep=1)
            ),
            y=alt.Y(
                "Position:Q",
                sort="descending",  # Flip so 1 is at the top
                axis=alt.Axis(title="Position", format="d", tickMinStep=1),
                scale=alt.Scale(reverse=True),  # This ensures 1 is at the top
            ),
            tooltip=[
                "Round",
                "Position",
                "Team",
                "Opponent",
                "Venue",
                "Result",
                "Margin",
            ],
        )
        .properties(height=400)
    )
    st.altair_chart(chart, use_container_width=True)
    st.caption("Lower is better (1 = top)")
