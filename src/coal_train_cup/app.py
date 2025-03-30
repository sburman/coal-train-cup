import streamlit as st

def page_make_tip() -> None:
    """
    Page for making a tip.
    """
    st.title("Make a Tip")
    st.write("This is where you can make your tip.")

def page_view_user_tips() -> None:
    """
    Page for viewing tips.
    """
    st.title("View user tips")
    st.write("This is where you can view user tips.")

def page_view_round_tips() -> None:
    """
    Page for viewing round tips.
    """
    st.title("View round tips")
    st.write("This is where you can view round tips.")

def page_leaderboard() -> None:
    """
    Page for viewing the leaderboard.
    """
    st.title("Leaderboard")
    st.write("This is where you can view the leaderboard.")

MAKE_TIP_PAGE = st.Page(page_make_tip, title="Make a tip", icon="✏️")
VIEW_USER_TIPS_PAGE = st.Page(page_view_user_tips, title="View user tips", icon="🗒️")
VIEW_ROUND_TIPS_PAGE = st.Page(page_view_round_tips, title="View round tips", icon="👀")
LEADERBOARD_PAGE = st.Page(page_leaderboard, title="Leaderboard", icon="🏆")

def page_home() -> None:
    """
    Home page of the application.
    """
    st.title("Welcome to the Coal Train Cup!")
        


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