import streamlit as st
import pandas as pd
import altair as alt
from coal_train_cup.models import User
from coal_train_cup.services.data_store import all_users, all_teams
from coal_train_cup.services.leaderboard_service import (
    get_full_results_dataframe,
    get_leaderboard_dataframe,
)
from coal_train_cup.services.games_service import get_most_recent_closed_round
from coal_train_cup.pages.section_admin import section_admin


def page_view_user_tips() -> None:
    st.title("View user tips")

    max_round = get_most_recent_closed_round()

    results_df = get_full_results_dataframe(max_round)
    users = all_users()
    teams = all_teams()

    user: User | None = None
    email = st.text_input("Enter your email address")
    if not email:
        st.stop()

    user = next((u for u in users if u.email == email), None)

    if not user:
        st.warning(f"No user found with email: {email}")
        st.stop()

    user_display_df = results_df[results_df["email"] == user.email]
    user_display_df = user_display_df[
        ["round", "team", "home", "opponent", "points", "margin"]
    ]
    # Convert boolean home values to "H" for home (True) and "A" for away (False)
    user_display_df["home"] = user_display_df["home"].map({True: "Home", False: "Away"})
    user_display_df = user_display_df.sort_values(by="round", ascending=True)
    user_display_df = user_display_df.set_index("round")
    user_display_df = user_display_df.rename(
        columns={
            "team": "Team",
            "home": "Venue",
            "opponent": "vs Opponent",
            "points": "Points",
            "margin": "Margin",
        }
    )
    user_display_df.index.name = "Round"

    # Get count of home tips
    home_tips_count = user_display_df[
        (user_display_df["Venue"] == "Home") & (user_display_df.index != 9)
    ].shape[0]
    st.metric(label="Home tips used", value=f"{home_tips_count} / 13")

    # Get count of away tips
    away_tips_count = user_display_df[
        (user_display_df["Venue"] == "Away") & (user_display_df.index != 9)
    ].shape[0]
    st.metric(label="Away tips used", value=f"{away_tips_count} / 13")

    # --- Leaderboard position chart ---
    positions = []
    rounds = list(range(1, max_round + 1))
    for rnd in rounds:
        leaderboard_df = get_leaderboard_dataframe(rnd).reset_index()
        leaderboard_df["Position"] = leaderboard_df.index + 1
        user_row = leaderboard_df[leaderboard_df["email"] == user.email]
        if not user_row.empty:
            positions.append(int(user_row["Position"].iloc[0]))
        else:
            positions.append(None)
    st.subheader("Your leaderboard position by round")
    pos_df = pd.DataFrame({"Round": rounds, "Position": positions})
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
            tooltip=["Round", "Position"],
        )
        .properties(height=400)
    )
    st.altair_chart(chart, use_container_width=True)
    st.caption("Lower is better (1 = top)")

    # Create team summary table with all teams
    t = pd.Series(teams, name="Team")
    team_summary = user_display_df.groupby("Team").size().reindex(t, fill_value=0)
    team_summary = team_summary.reset_index()
    team_summary.columns = ["Team", "Number of Tips"]
    team_summary = team_summary.sort_values(
        ["Number of Tips", "Team"], ascending=[False, True]
    )
    team_summary = team_summary.set_index("Team")

    st.subheader("Tips used by team")
    st.table(team_summary)

    st.header(":ledger: Tipping History")

    st.table(user_display_df)

    # # use st.metric to display the result total and margin total
    # st.metric(label="Coal Train Cup points", value=result_total)
    # st.metric(label="Accumulated margin", value=margin_total)

    if user.email == "steven.burman@gmail.com":
        section_admin()
