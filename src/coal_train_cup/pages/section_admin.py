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

    st.subheader("3 Tips Per Team Rule Violations")

    # Group tips by user and team to find violations
    user_team_counts = {}
    for tip in t:
        user_key = tip.email
        team = tip.team

        if user_key not in user_team_counts:
            user_team_counts[user_key] = {}

        if team not in user_team_counts[user_key]:
            user_team_counts[user_key][team] = 0

        user_team_counts[user_key][team] += 1

    # Find violations (more than 3 tips for the same team)
    violations = []
    for user_email, team_counts in user_team_counts.items():
        for team, count in team_counts.items():
            if count > 3:
                violations.append({"user": user_email, "team": team, "count": count})

    if violations:
        st.error(f"Found {len(violations)} violations of the 3 tips per team rule:")
        for violation in violations:
            st.write(
                f"- {violation['user']} tipped {violation['team']} {violation['count']} times"
            )
    else:
        st.success("No violations of the 3 tips per team rule found!")

    st.subheader("Home/Away Team Limit Violations (13 each, excluding Round 9)")

    # Group tips by user and count home/away (excluding round 9)
    user_venue_counts = {}
    for tip in t:
        # Skip round 9 tips
        if tip.round == 9:
            continue

        user_key = tip.email

        if user_key not in user_venue_counts:
            user_venue_counts[user_key] = {"home": 0, "away": 0}

        if tip.home:
            user_venue_counts[user_key]["home"] += 1
        else:
            user_venue_counts[user_key]["away"] += 1

    # Find violations (more than 13 home or 13 away tips)
    venue_violations = []
    for user_email, venue_counts in user_venue_counts.items():
        if venue_counts["home"] > 13:
            venue_violations.append(
                {"user": user_email, "type": "home", "count": venue_counts["home"]}
            )
        if venue_counts["away"] > 13:
            venue_violations.append(
                {"user": user_email, "type": "away", "count": venue_counts["away"]}
            )

    if venue_violations:
        st.error(
            f"Found {len(venue_violations)} violations of the home/away team limit:"
        )
        for violation in venue_violations:
            st.write(
                f"- {violation['user']} has {violation['count']} {violation['type']} tips (max 13)"
            )
    else:
        st.success("No violations of the home/away team limit found!")
