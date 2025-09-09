import streamlit as st
from coal_train_cup.services.shield_tipping_service import (
    make_shield_tip,
    submit_shield_tip,
)
from coal_train_cup.services.data_store import all_players_in_round


def page_siliva_shield() -> None:
    """
    Page for viewing the Siliva Shield.
    """

    THIS_WEEK = 28

    st.title("🛡️ Siliva Shield")
    st.header("Finals Week 1")

    st.markdown("""
        Rules:
        - Submit 1 team that you think will win this weekend
        - Submit 1 player as a tryscorer for this weekend
        
        *IMPORTANT*
        - You can't repeat a team or tryscorer selection throught the entire finals... choose wisely!
    """)
    st.markdown("---")

    available_teams = [
        "Melbourne Storm",
        "Canterbury-Bankstown Bulldogs",
        "New Zealand Warriors",
        "Penrith Panthers",
        "Cronulla-Sutherland Sharks",
        "Sydney Roosters",
        "Canberra Raiders",
        "Brisbane Broncos",
    ]

    all_players = all_players_in_round(THIS_WEEK)

    email = st.text_input("Enter your email address")

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
