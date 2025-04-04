from enum import StrEnum
from datetime import datetime, timezone, timedelta
from coal_train_cup.services.data_store import all_games
from coal_train_cup.models import User, UserTip, Tip
from coal_train_cup.services.data_store import all_user_tips
from coal_train_cup.services.games_service import get_games_for_round


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
    games = all_games(season)
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


def make_tip(
    user: User, tip: Tip, tipped_at: datetime = datetime.now(timezone.utc)
) -> UserTip:
    return UserTip(
        email=user.email,
        username=user.username,
        season=tip.season,
        round=tip.round,
        team=tip.team,
        opponent=tip.opponent,
        home=tip.home,
        tipped_at=tipped_at,
    )
