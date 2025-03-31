import streamlit as st

from coal_train_cup.pages import (
    page_make_tip,
    page_view_user_tips,
    page_view_round_tips,
    page_leaderboard,
)

from coal_train_cup.models import User
from coal_train_cup.services.data_store import all_games, all_tips, save_tip

import pandas as pd

import gspread

MAKE_TIP_PAGE = st.Page(page_make_tip, title="Make a tip", icon="✏️")
VIEW_USER_TIPS_PAGE = st.Page(page_view_user_tips, title="View user tips", icon="🗒️")
VIEW_ROUND_TIPS_PAGE = st.Page(page_view_round_tips, title="View round tips", icon="👀")
LEADERBOARD_PAGE = st.Page(page_leaderboard, title="Leaderboard", icon="🏆")


def _seed_data() -> None:
    pass


def page_home() -> None:
    """
    Home page of the application.
    """

    _seed_data()

    st.title("Welcome to the Coal Train Cup!")

    st.write("Total tips made: ", len(all_tips()))
    st.write("Total games: ", len(all_games()))

    config = st.secrets["connections"]["gsheets"].to_dict()
    gc = gspread.service_account_from_dict(config)
    spreadsheet = gc.open("tips")
    st.write()

    dataframe = pd.DataFrame(spreadsheet.get_worksheet_by_id(0).get_all_records())
    
    # # Create User objects and add PIN column
    # pins = []
    # for i, row in dataframe.iterrows():
    #     # Create User object with email and name as username
    #     user = User(email=row["email"], username=row["name"])
    #     # Add PIN to list
    #     pins.append(user.p_i_n)

    # # Add PIN column to dataframe
    # dataframe["pin"] = pins

    st.dataframe(dataframe)


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
