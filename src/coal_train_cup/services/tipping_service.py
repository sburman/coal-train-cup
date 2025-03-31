from datetime import datetime, timezone
from coal_train_cup.models import User, UserTip, Tip
from coal_train_cup.services.games_service import games_for_round


def available_tips(round: int, season: int = 2025) -> dict[str, Tip]:
    """
    Returns a list of available tips for the given round.
    """
    tips = {}
    for game in games_for_round(round, season):
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


def make_tip(user: User, tip: Tip, tipped_at: datetime = datetime.now(timezone.utc)) -> UserTip:
    return UserTip(
        email=user.email,
        season=1,
        round=tip.round,
        team=tip.team,
        opponent=tip.opponent,
        home=tip.home,
        tipped_at=tipped_at,
    )
