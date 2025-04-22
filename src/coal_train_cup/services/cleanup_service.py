import streamlit as st
import pandas as pd
from coal_train_cup.services.data_store import all_games
from coal_train_cup.models import UserTip
import pytz
from coal_train_cup.services.sheets_service import delete_user_tip_row


def display_remaining_duplicates(t: list[UserTip]) -> None:
    # find duplicates by grouping by round and email and if size > 1
    t_df = pd.DataFrame([t.model_dump() for t in t])
    duplicates = t_df.groupby(["round", "email"]).size().reset_index(name="count")
    duplicates = duplicates[duplicates["count"] > 1]
    st.subheader("Duplicate tips?")
    if len(duplicates) > 0:
        duplicates_display = t_df[
            t_df.duplicated(subset=["round", "email"], keep=False)
        ]
        duplicates_display = duplicates_display.sort_values(by="email")
        # Convert UTC to Sydney time
        duplicates_display["tipped_at_sydney_time"] = pd.to_datetime(
            duplicates_display["tipped_at"]
        ).dt.tz_convert("Australia/Sydney")
        # Find matching games and add kickoff time
        games = all_games()
        duplicates_display["kickoff_time"] = duplicates_display.apply(
            lambda row: next(
                (
                    g.kickoff.astimezone(pytz.timezone("Australia/Sydney"))
                    for g in games
                    if g.season == row["season"]
                    and g.round == row["round"]
                    and (g.home_team == row["team"] or g.away_team == row["team"])
                ),
                None,
            ),
            axis=1,
        )
        duplicates_display = duplicates_display.drop(columns=["tipped_at"])

        st.write(duplicates_display)
    else:
        st.write("No duplicates found")


def cleanup_duplicates(t: list[UserTip]) -> None:
    # Convert tips to DataFrame
    t_df = pd.DataFrame([t.model_dump() for t in t])

    # Sort by tipped_at to ensure we keep the latest tip
    t_df = t_df.sort_values(by="tipped_at")

    # Group by the key fields and mark all but the last entry as candidates for deletion
    candidates = t_df[
        t_df.duplicated(
            subset=["email", "season", "round", "team", "opponent"], keep="last"
        )
    ]

    if len(candidates) > 0:
        st.write("Candidates for deletion:")
        st.write(candidates)

        # Convert candidates DataFrame back to UserTip objects
        candidates_to_delete = [UserTip(**row) for _, row in candidates.iterrows()]

        for tip in candidates_to_delete[:1]:  # test with 1 tip only
            st.write(tip)
            delete_user_tip_row(
                spreadsheet_name="Coal Train Cup App 2025",
                worksheet_name=f"Round {tip.round}",
                tip=tip,
            )
            st.write(f"Deleted tip for {tip.email} in round {tip.round}")
    else:
        st.write("No duplicate tips found to clean up")
