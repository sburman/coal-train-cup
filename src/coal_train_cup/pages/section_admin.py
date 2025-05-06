import streamlit as st
from coal_train_cup.services.data_store import all_user_tips, all_games
from coal_train_cup.services.cleanup_service import (
    display_remaining_duplicates,
    cleanup_duplicates,
)
from coal_train_cup.services.tipping_service import get_all_rounds_status, RoundStatus
from coal_train_cup.services.data_service_user_tips import (
    locally_archive_tips_for_round,
)


def section_admin() -> None:
    st.markdown("---")
    st.header("Admin")

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

    st.subheader("Archive Round")
    round_number = st.number_input("Round number to archive", min_value=1, step=1)
    if st.button("Archive round locally"):
        # Check if round is valid and closed
        round_statuses = get_all_rounds_status()
        if round_number not in round_statuses:
            st.error(f"Round {round_number} is not a valid round")
            st.stop()

        if round_statuses[round_number] != RoundStatus.CLOSED:
            st.error(f"Round {round_number} is not closed yet")
            st.stop()

        st.write(f"Archiving round {round_number} locally...")
        locally_archive_tips_for_round(round_number)
        st.success(f"Round {round_number} archived successfully!")
