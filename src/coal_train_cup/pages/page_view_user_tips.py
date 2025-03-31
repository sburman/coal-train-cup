import streamlit as st
from coal_train_cup.services.data_store import all_users
from coal_train_cup.services.leaderboard_service import (
    get_full_results_dataframe,
)


def page_view_user_tips() -> None:
    st.title("View user tips")

    results_df = get_full_results_dataframe()
    users = all_users()

    # select box to select a user by name
    selected_username = st.selectbox("Select a user", [user.username for user in users])

    user = next((user for user in users if user.username == selected_username), None)

    if user:
        user_display_df = results_df[results_df["email"] == user.email]
        user_display_df = user_display_df[
            ["round", "team", "home", "opponent", "result", "margin"]
        ]
        # Convert boolean home values to "H" for home (True) and "A" for away (False)
        user_display_df["home"] = user_display_df["home"].map(
            {True: "Home", False: "Away"}
        )
        user_display_df = user_display_df.sort_values(by="round", ascending=True)
        user_display_df = user_display_df.set_index("round")
        user_display_df = user_display_df.rename(
            columns={
                "team": "Team",
                "home": "Venue",
                "opponent": "vs Opponent",
                "result": "Result",
                "margin": "Margin",
            }
        )
        user_display_df.index.name = "Round"

        result_total = user_display_df["Result"].sum()
        margin_total = user_display_df["Margin"].sum()

        # use st.metric to display the result total and margin total
        st.metric(label="Coal Train Cup points", value=result_total)
        st.metric(label="Accumulated margin", value=margin_total)

        st.table(user_display_df)
