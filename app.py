import streamlit as st

from coal_train_cup.pages import (
    page_make_tip,
    page_view_user_tips,
    page_view_round_tips,
    page_leaderboard,
    page_siliva_shield,
)

from coal_train_cup.services.data_store import (
    all_games,
    all_user_tips,
    all_users,
    all_game_results,
)

MAKE_TIP_PAGE = st.Page(page_make_tip, title="Make a tip", icon="✏️")  # ✏️
VIEW_USER_TIPS_PAGE = st.Page(page_view_user_tips, title="2025 tips by user", icon="🗒️")
VIEW_ROUND_TIPS_PAGE = st.Page(
    page_view_round_tips, title="2025 tips by round", icon="📊"
)
LEADERBOARD_PAGE = st.Page(page_leaderboard, title="2025 Final Leaderboard", icon="🏆")
SILIVA_SHIELD_PAGE = st.Page(page_siliva_shield, title="Siliva Shield", icon="🛡️")


def page_home() -> None:
    st.image("assets/brlogo.jpeg", width=300)

    st.markdown("---")
    st.markdown("Congrats to the 2025 Coal Train Cup winner!")
    st.header("🏆 Paul Mac")
    st.markdown("---")

    st.header("🛡️ 2025 Siliva Shield")
    st.markdown("Make your tip [here](/page_siliva_shield)")
    st.markdown("---")

    st.header("Coal Train Cup weekly competition rules")
    st.markdown(
        """
        - Return to this site weekly to submit one tip per round
        - If you choose to submit again, your previous tip will be replaced
        - You can't tip _for_ the same team in consecutive rounds
        - You can't tip _against_ the same team in consecutive rounds
        """
    )

    st.header("End of season compliance")
    st.markdown(
        """
        After 27 rounds, you must have:
        - tipped 13 home teams and 13 away teams (magic round counts as neutral)
        - tipped every team at least once
        - tipped no single team more than 3 times
        """
    )

    st.markdown("---")
    st.markdown(
        f"<h3 style='color: white;'>Total users: <span style='color: #00E5B4;'>{len(all_users())}</span></h3>",
        unsafe_allow_html=True,
    )
    st.markdown(
        f"<h3 style='color: white;'>Total tips made: <span style='color: #00E5B4;'>{len(all_user_tips())}</span></h3>",
        unsafe_allow_html=True,
    )
    st.markdown("---")
    st.markdown(
        f"<h3 style='color: white;'>Total games: <span style='color: #00E5B4;'>{len(all_games())}</span></h3>",
        unsafe_allow_html=True,
    )
    st.markdown(
        f"<h3 style='color: white;'>Total resulted games: <span style='color: #00E5B4;'>{int(len(all_game_results()) / 2)}</span></h3>",
        unsafe_allow_html=True,
    )
    st.markdown("---")

    st.caption("_version: 2025.28.3_")


HOME_PAGE = st.Page(page_home, title="Home", icon="🚂", default=True)


def main():
    st.set_page_config(
        page_title="Coal Train Cup",
        page_icon="🚂",
        layout="wide",
        initial_sidebar_state="expanded",
    )

    pages = {
        "Coal Train Cup": [
            HOME_PAGE,
            # MAKE_TIP_PAGE,
            LEADERBOARD_PAGE,
            VIEW_USER_TIPS_PAGE,
            VIEW_ROUND_TIPS_PAGE,
            SILIVA_SHIELD_PAGE,
        ]
    }

    pg = st.navigation(pages)
    pg.run()


if __name__ == "__main__":
    main()
