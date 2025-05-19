import streamlit as st
from datetime import datetime, timezone, timedelta
from coal_train_cup.services.data_store import (
    all_users,
)
from coal_train_cup.services.leaderboard_service import get_full_results_dataframe
from coal_train_cup.services.tipping_service import (
    available_tips_for_round,
    get_current_tipping_round,
    make_tip,
    submit_tip,
)


def page_make_tip() -> None:
    """
    Page for making a tip.
    """
    st.title("✏️ Make a Tip")

    current_round = get_current_tipping_round()
    st.header(f"Current round: {current_round}")

    email = st.text_input("Enter your email address")

    if email:
        # Check if user exists
        users = all_users()
        user = next(
            (user for user in users if user.email.lower() == email.lower()), None
        )

        if not user:
            st.warning(f"No user found with email: {email}")
            st.stop()

        # get tip from previous round
        previous_round = current_round - 1
        if previous_round < 1:
            st.warning("No previous round found")
            st.stop()

        user_results = get_full_results_dataframe(previous_round)
        user_results = user_results[user_results["email"] == user.email]

        previous_round_tip = None
        if not user_results.empty:
            filtered_tips = user_results[user_results["round"] == previous_round]
            if not filtered_tips.empty:
                previous_round_tip = filtered_tips.iloc[0]

        unavailable_tips: dict[str, str] = {}
        current_round_tips = available_tips_for_round(current_round)

        if previous_round_tip is not None:
            if previous_round_tip["round"] != previous_round:
                st.warning("Previous round tip selection has failed")
                st.stop()

            st.write(
                f"In round {previous_round_tip['round']} you tipped: {previous_round_tip.team} ({'home' if previous_round_tip.home else 'away'}) vs {previous_round_tip.opponent}."
            )

            margin = previous_round_tip.margin
            if margin > 0:
                st.write(f"✅ They won by {margin} points.")
            elif margin < 0:
                st.write(f"❌ They lost by {abs(margin)} points.")
            else:
                st.write("It was a draw.")

            unavailable_tips = {previous_round_tip.team: "Last round tip"}

            for tip in current_round_tips.values():
                if tip.opponent == previous_round_tip.opponent:
                    unavailable_tips[tip.team] = (
                        f"Playing last round tip's opponent {previous_round_tip.opponent}"
                    )

        else:
            st.write("No previous round tip found")

        # Filter out tips that are not available
        current_round_tips = {
            k: v
            for k, v in current_round_tips.items()
            if k not in unavailable_tips.keys()
        }

        # Filter out tips that have already kicked off
        grace_period = timedelta(minutes=5)
        current_round_tips = {
            k: v
            for k, v in current_round_tips.items()
            if (v.available_until + grace_period) > datetime.now(timezone.utc)
        }

        if not current_round_tips:
            st.warning("No tips available for this round. Round is closed.")
            st.stop()

        if unavailable_tips:
            unavailable_text = "This week you can't select:\n" + "\n".join(
                [f"- {team} [{reason}]" for team, reason in unavailable_tips.items()]
            )
            st.info(unavailable_text)

        tip_team = st.radio(
            f"Select a tip for round {current_round}",
            list(current_round_tips.keys()),
            format_func=lambda x: f"**{x} ({'H' if current_round_tips[x].home else 'A'})** vs {current_round_tips[x].opponent}",
        )

        tip = current_round_tips[tip_team]

        if st.button("Submit tip"):
            try:
                st.info(
                    "Congratulations, you clicked the button. Now wait. You will see a confirmation message when the tip is finalised..."
                )
                user_tip = make_tip(user, tip)
                submit_tip(user_tip)
                st.success("✅ Tip submitted. Billy Slater sucks... pass it on.")
            except Exception as e:
                st.error(f"❌ Could not submit tip: {e}")
