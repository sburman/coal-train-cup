import streamlit as st
from coal_train_cup.services.shield_tipping_service import (
    make_shield_tip,
    submit_shield_tip,
)
from coal_train_cup.services.data_store import all_players_in_round
import pandas as pd
from coal_train_cup.services.sheets_service import worksheet_to_dataframe
from coal_train_cup.models import UserShieldTip

@st.cache_data(ttl=60 * 60 * 24)
def __last_round_winners(round: int) -> list[UserShieldTip]:
    df: pd.DataFrame = worksheet_to_dataframe("Coal Train Cup App 2025", f"Winners - Shield Round {round}")
    
    # Convert DataFrame rows to UserShieldTip objects
    winners = []
    for _, row in df.iterrows():
        winner = UserShieldTip(
            email=row['email'],
            season=int(row['season']),
            round=int(row['round']),
            team=row['team'],
            tryscorer=row['tryscorer'],
            tipped_at=pd.to_datetime(row['tipped_at'])
        )
        winners.append(winner)
    
    return winners


def page_siliva_shield() -> None:
    """
    Page for viewing the Siliva Shield.
    """

    THIS_WEEK = 29

    st.title("🛡️ Siliva Shield")
    st.header("Finals Week 2")

    st.markdown("""
        Rules:
        - Submit 1 team that you think will win this weekend
        - Submit 1 player as a tryscorer for this weekend
        
        *IMPORTANT*
        - You can't repeat a team or tryscorer selection throught the entire finals... choose wisely!
    """)
    st.markdown("---")

    available_teams = [
        # "Melbourne Storm",
        "Canterbury-Bankstown Bulldogs",
        "Penrith Panthers",
        "Cronulla-Sutherland Sharks",
        "Canberra Raiders",
        # "Brisbane Broncos",
    ]

    all_players = all_players_in_round(THIS_WEEK)
    last_round_winners = __last_round_winners(THIS_WEEK - 1)

    email = st.text_input("Enter your email address")
    last_weeks_selection = None

    if email:
        user_last_round_winners = [winner for winner in last_round_winners if winner.email == email]
        if not user_last_round_winners:
            st.error("Sorry, it looks like you were not a winner in the last round. Only previous round winners can continue in the Siliva Shield.")
            st.stop()
    
        last_weeks_selection = user_last_round_winners[0]
        st.success(f"🎉 Congratulations! You were a winner last round tipping {last_weeks_selection.team} and {last_weeks_selection.tryscorer}.")
        st.info(f"Remember, you can't repeat a team or tryscorer selection so those options are not available to you this week.")

        available_teams = [team for team in available_teams if team != last_weeks_selection.team]
        all_players = [player for player in all_players if player != last_weeks_selection.tryscorer]

        selected_team = st.selectbox("Select a team", available_teams, index=None)

        tryscorer = st.selectbox(
            "Select a tryscorer",
            all_players,
            index=None,
            placeholder="Type player name to search...",
            help="Start typing a player's name to filter the list",
        )

        if st.button("Submit"):
            if not email:
                st.error("Please enter your email address")
                st.stop()
            if not selected_team:
                st.error("Please select a team")
                st.stop()
            if not tryscorer:
                st.error("Please enter a tryscorer")
                st.stop()

            try:
                st.info(
                    "Congratulations, you clicked the button. Now wait. You will see a confirmation message when the tip is finalised..."
                )
                user_tip = make_shield_tip(email, selected_team, tryscorer, THIS_WEEK)
                submit_shield_tip(user_tip)
                st.success("✅ Siliva Shield tip submitted.")
            except Exception as e:
                st.error(f"❌ Could not submit tip: {e}")
