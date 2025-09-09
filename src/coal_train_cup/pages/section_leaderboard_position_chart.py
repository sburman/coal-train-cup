import streamlit as st
import pandas as pd
import altair as alt
from coal_train_cup.services.leaderboard_service import get_leaderboard_dataframe

# Centralized color map for result types
RESULT_COLOR_MAP = {
    "Win": "#00e6c3",  # Teal (matches pie chart for Win)
    "Loss": "#ff6f6f",  # Red (matches pie chart for Loss)
    "Draw": "#b388ff",  # Purple (matches pie chart for Draw)
    "": "#b388ff",  # Default for missing/empty
}


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
            # Ensure margin is always an int or None, never an empty string
            if pd.isna(margin):
                margins.append(None)
            else:
                try:
                    margins.append(int(margin))
                except Exception:
                    margins.append(None)
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
            margins.append(None)
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
    pos_df["Color"] = [RESULT_COLOR_MAP.get(r, "#b388ff") for r in results]

    # Draw the main line in theme color, and overlay colored points for result
    base = alt.Chart(pos_df)
    line = base.mark_line(color=RESULT_COLOR_MAP["Draw"]).encode(
        x=alt.X("Round:O", axis=alt.Axis(title="Round", labelAngle=0, tickMinStep=1)),
        y=alt.Y(
            "Position:Q",
            sort="descending",
            axis=alt.Axis(title="Position", format="d", tickMinStep=1),
            scale=alt.Scale(reverse=True),
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
    points = base.mark_point(filled=True, size=100).encode(
        x=alt.X("Round:O"),
        y=alt.Y("Position:Q"),
        color=alt.Color(
            "Result:N",
            scale=alt.Scale(
                domain=list(RESULT_COLOR_MAP.keys()),
                range=list(RESULT_COLOR_MAP.values()),
            ),
            legend=None,
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
    chart = (line + points).properties(height=400)
    st.altair_chart(chart, use_container_width=True)
