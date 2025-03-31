import streamlit as st
from streamlit_gsheets import GSheetsConnection


def connection() -> None:
    url = "https://docs.google.com/spreadsheets/d/1LzGlP2n0oQEJZGl-pMeWW0VklbRtLoHUDiAUDB1tnV4/edit?usp=sharing"

    # Create a connection object.
    conn = st.connection("gsheets", type=GSheetsConnection)

    print(conn)
    sheet = conn.read(spreadsheet=url, sheet="migration", use_cols="A:D")
    print(sheet)


if __name__ == "__main__":
    connection()
