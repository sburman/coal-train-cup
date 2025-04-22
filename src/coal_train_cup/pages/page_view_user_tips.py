import streamlit as st
from coal_train_cup.models import User
from coal_train_cup.services.data_store import all_users, all_user_tips, all_games
from coal_train_cup.services.leaderboard_service import (
    get_full_results_dataframe,
)
from coal_train_cup.services.games_service import get_most_recent_closed_round
from coal_train_cup.services.cleanup_service import (
    display_remaining_duplicates,
    cleanup_duplicates,
)


def page_view_user_tips() -> None:
    st.title("View user tips")

    max_round = get_most_recent_closed_round()

    results_df = get_full_results_dataframe(max_round)
    users = all_users()

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

    result_total = user_display_df["Points"].sum()
    margin_total = user_display_df["Margin"].sum()

    # use st.metric to display the result total and margin total
    st.metric(label="Coal Train Cup points", value=result_total)
    st.metric(label="Accumulated margin", value=margin_total)

    st.table(user_display_df)

    if user.email == "steven.burman@gmail.com":
        if st.button("Clear Cache"):
            st.cache_data.clear()
            st.success("Cache cleared!")

        st.write("Invalid tips summary:")
        t = all_user_tips()

        # find invalid where tipped at is after the game kicked off
        games = all_games()
        invalid_tips = []
        for tip in t:
            # Find matching game
            game = next(
                (
                    g
                    for g in games
                    if g.season == tip.season
                    and g.round == tip.round
                    and ((g.home_team == tip.team) or (g.away_team == tip.team))
                ),
                None,
            )
            if game and tip.tipped_at > game.kickoff:
                invalid_tips.append(tip)

        st.subheader("Late tips?")
        st.write(invalid_tips)

        display_remaining_duplicates(t)

        if st.button("Cleanup obvious duplicates"):
            cleanup_duplicates(t)
            st.cache_data.clear()
            st.write("Obvious duplicates cleaned up. Cache forced clean.")
