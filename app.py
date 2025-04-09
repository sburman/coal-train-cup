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


def _seed_data() -> None:
    pass


def page_home() -> None:
    """
    Home page of the application.
    """

    _seed_data()

    st.title("Welcome to the Coal Train Cup!")

    st.markdown("---")
    st.write("Total users: ", len(all_users()))
    st.write("Total tips made: ", len(all_user_tips()))
    st.markdown("---")
    st.write("Total games: ", len(all_games(False)))
    st.write("Total resulted games: ", int(len(all_game_results()) / 2))
    st.markdown("---")


HOME_PAGE = st.Page(page_home, title="Home", icon="🚂", default=True)


def main():
    st.set_page_config(
        page_title="Coal Train Cup",
        page_icon="🚂",
        layout="wide",
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
