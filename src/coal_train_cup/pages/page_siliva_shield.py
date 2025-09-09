import streamlit as st
from coal_train_cup.services.shield_tipping_service import (
    make_shield_tip,
    submit_shield_tip,
)


def page_siliva_shield() -> None:
    """
    Page for viewing the Siliva Shield.
    """

    THIS_WEEK = 28

    st.title("🛡️ Siliva Shield")
    st.header("Finals Week 1")

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

    email = st.text_input("Enter your email address")

    selected_team = st.selectbox("Select a team", available_teams, index=None)

    tryscorer = st.text_input("Enter a tryscorer")

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
