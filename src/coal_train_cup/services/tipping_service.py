from enum import StrEnum
from datetime import datetime, timezone, timedelta
from coal_train_cup.services.data_store import all_games
from coal_train_cup.models import User, UserTip, Tip
from coal_train_cup.services.data_store import all_user_tips
from coal_train_cup.services.games_service import get_games_for_round
from coal_train_cup.services.sheets_service import append_row_to_worksheet


# enum for round status
class RoundStatus(StrEnum):
    UPCOMING = "upcoming"
    IN_PROGRESS = "in_progress"
    CLOSED = "closed"


def get_all_rounds_status(
    season: int = 2025, at_time: datetime = datetime.now(timezone.utc)
) -> dict[int, RoundStatus]:
    """
    Returns a dictionary of all rounds and their statuses for the given season.
    """
    games = all_games()
    all_rounds = set(game.round for game in games)
    result = {}
    for round in all_rounds:
        games_in_round = [game for game in games if game.round == round]
        if any(game.kickoff > at_time for game in games_in_round):
            result[round] = RoundStatus.UPCOMING
        elif any(
            game.kickoff <= at_time and game.kickoff + timedelta(hours=3) > at_time
            for game in games_in_round
        ):
            result[round] = RoundStatus.IN_PROGRESS
        else:
            result[round] = RoundStatus.CLOSED

    return result


def get_current_tipping_round(season: int = 2025) -> int:
    current_round_statuses = get_all_rounds_status(season)
    max_closed_round = max(
        round
        for round, status in current_round_statuses.items()
        if status == RoundStatus.CLOSED
    )
    if not max_closed_round:
        return 1
    else:
        return max_closed_round + 1


if __name__ == "__main__":
    print(get_all_rounds_status())


def available_tips_for_round(round: int, season: int = 2025) -> dict[str, Tip]:
    """
    Returns a list of available tips for the given round.
    """
    tips = {}
    for game in get_games_for_round(round, season):

        if game.round == round and game.season == season:

            tips[game.home_team] = Tip(
                season=season,
                round=round,
                team=game.home_team,
                opponent=game.away_team,
                home=True,
                available_until=game.kickoff,
            )
            tips[game.away_team] = Tip(
                season=season,
                round=round,
                team=game.away_team,
                opponent=game.home_team,
                home=False,
                available_until=game.kickoff,
            )

    return tips


def get_tips_for_user(user: User) -> list[UserTip]:
    return [tip for tip in all_user_tips() if tip.email == user.email]


def make_tip(user: User, tip: Tip, tipped_at_time: datetime | None = None) -> UserTip:
    # Ensure both times are in UTC
    if tipped_at_time is None:
        tipped_at_time = datetime.now(timezone.utc)

    if tipped_at_time.tzinfo != timezone.utc:
        raise ValueError("Tipped at must be in UTC")

    if tip.available_until.tzinfo != timezone.utc:
        raise ValueError("Available until must be in UTC")

    # Add 10 min grace period to available_until time
    grace_period = timedelta(minutes=10)
    if tip.available_until + grace_period < tipped_at_time:
        raise ValueError("Can't make tip for a game that has already kicked off")

    return UserTip(
        email=user.email,
        username=user.username,
        season=tip.season,
        round=tip.round,
        team=tip.team,
        opponent=tip.opponent,
        home=tip.home,
        tipped_at=tipped_at_time,
    )


def submit_tip(tip: UserTip) -> None:
    tip_data = {
        "email": tip.email,
        "username": tip.username,
        "season": tip.season,
        "round": tip.round,
        "team": tip.team,
        "opponent": tip.opponent,
        "home": tip.home,
        "tipped_at": tip.tipped_at.isoformat(),
    }

    # Create worksheet name based on season and round
    worksheet_name = f"Round {tip.round}"

    # Submit to Google Sheet
    append_row_to_worksheet(
        row_data=tip_data,
        spreadsheet_name="Coal Train Cup App 2025",
        worksheet_name=worksheet_name,
    )
