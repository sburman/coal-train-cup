import streamlit as st

from coal_train_cup.pages import (
    page_make_tip,
    page_view_user_tips,
    page_view_round_tips,
    page_leaderboard,
)

from coal_train_cup.services.data_store import (
    all_games,
    all_user_tips,
    all_users,
    all_game_results,
)

MAKE_TIP_PAGE = st.Page(page_make_tip, title="Make a tip", icon="✏️")  # ✏️
VIEW_USER_TIPS_PAGE = st.Page(page_view_user_tips, title="View user tips", icon="🗒️")
VIEW_ROUND_TIPS_PAGE = st.Page(page_view_round_tips, title="View round tips", icon="📊")
LEADERBOARD_PAGE = st.Page(page_leaderboard, title="Leaderboard", icon="🏆")


def page_home() -> None:
    st.title("Welcome to the Coal Train Cup!")
    st.markdown("_version: 1.15.1_")

    st.image("assets/brlogo.jpeg", width=300)

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
            MAKE_TIP_PAGE,
            VIEW_USER_TIPS_PAGE,
            VIEW_ROUND_TIPS_PAGE,
            LEADERBOARD_PAGE,
        ]
    }

    pg = st.navigation(pages)
    pg.run()


if __name__ == "__main__":
    main()
