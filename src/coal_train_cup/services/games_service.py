from enum import StrEnum
from datetime import datetime, timezone
from coal_train_cup.services.data_store import all_games, all_game_results
from coal_train_cup.models import Game, GameResult
from coal_train_cup.constants import CURRENT_SEASON


class RoundStatus(StrEnum):
    UPCOMING = "upcoming"
    IN_PROGRESS = "in_progress"
    CLOSED = "closed"


def get_games_for_round(round: int, season: int = CURRENT_SEASON) -> list[Game]:
    """
    Returns a list of games for the given round.
    """
    games = []
    for game in all_games():
        if game.round == round and game.season == season:
            games.append(game)
    return games


def get_game_results_for_round(round: int, season: int = CURRENT_SEASON) -> list[GameResult]:
    """
    Returns a list of games for the given round.
    """
    games = []
    for game in all_game_results():
        if game.round == round and game.season == season:
            games.append(game)
    return games


def get_all_rounds_status_from_games(
    games: list[Game], at_time: datetime = datetime.now(timezone.utc)
) -> dict[int, RoundStatus]:
    all_rounds = set(game.round for game in games)
    result = {}
    for round in all_rounds:
        games_in_round = [game for game in games if game.round == round]
        if all(game.kickoff <= at_time for game in games_in_round):
            result[round] = RoundStatus.CLOSED
        elif any(game.kickoff <= at_time for game in games_in_round):
            result[round] = RoundStatus.IN_PROGRESS
        else:
            result[round] = RoundStatus.UPCOMING

    return result


def get_all_rounds_status(
    at_time: datetime = datetime.now(timezone.utc),
) -> dict[int, RoundStatus]:
    """
    Returns a dictionary of all rounds and their statuses for the given season.
    """
    games = all_games()
    return get_all_rounds_status_from_games(games, at_time)


def get_most_recent_closed_round() -> int:
    """
    Returns the most recent closed round for the given season.
    """
    round_statuses = get_all_rounds_status()
    closed_rounds = [
        round
        for round, status in round_statuses.items()
        if status == RoundStatus.CLOSED
    ]
    return max(closed_rounds) if closed_rounds else 0
