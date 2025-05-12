from datetime import datetime
from typing import Any
import requests
from coal_train_cup.models import Game

from coal_train_cup.services.secrets import get_secrets


def __load_fixtures_from_nrl_api(
    competition_id: int, season: int, round: int
) -> tuple[str, dict[str, Any]]:
    secrets = get_secrets()
    nrl_auth = secrets["connections"]["nrl"]["auth"]

    service_headers = {
        "Authorization": nrl_auth,
        "Content-Type": "application/json, charset=UTF-8",
    }

    url = f"http://rugbyleague-api.stats.com/api/NRL/competitions/roundFixtures/{competition_id}/{season}/{round}.json"
    r = requests.get(url, headers=service_headers, timeout=30)
    if r.status_code != 200:
        print(r.text)
        raise ValueError()

    fixture_list = r.json()
    fixture_list = fixture_list["roundFixtures"][0]["gameFixtures"]

    return fixture_list


def __map_nrl_api_fixture_to_game(
    fixture: dict[str, Any], season: int, round_number: int
) -> Game:
    """
    Maps a fixture to a single Game object with home and away teams, venue, and scores.
    """
    # Parse the kickoff time
    kickoff_utc = datetime.fromisoformat(fixture["startTimeUTC"].replace("Z", "+00:00"))

    # Get both teams
    home_team = None
    away_team = None

    for team_data in fixture["teams"]:
        if team_data.get("isHomeTeam", False):
            home_team = team_data
        else:
            away_team = team_data

    if not home_team or not away_team:
        raise ValueError(
            f"Could not identify home and away teams in fixture: {fixture['gameId']}"
        )

    # Extract venue information - concatenate venueName and city with a comma
    venue_name = fixture.get("venueName", "Unknown Venue")
    city = fixture.get("city", "Unknown City")
    venue = f"{venue_name}, {city}"

    # Extract scores if available
    state = fixture.get("gameStateName", "")
    score_default = 0 if state == "Final" else None
    home_score = home_team.get("teamFinalScore", score_default)
    away_score = away_team.get("teamFinalScore", score_default)

    # Create a single Game object with home and away teams, venue, and scores
    game = Game(
        season=season,
        round=round_number,
        kickoff=kickoff_utc,
        home_team=home_team["teamName"],
        away_team=away_team["teamName"],
        venue=venue,
        home_score=home_score,
        away_score=away_score,
    )

    return game


def get_latest_draw_from_nrl_api(existing: list[Game], rounds_to_update: list[int] = []) -> list[Game]:
    """
    Scrape an online resource to create a list of Game objects.
    """
    season = 2025
    season_games = existing
    lookup_rounds = rounds_to_update if rounds_to_update else range(1, 28)  # all rounds default
    for round_number in lookup_rounds:
        print(f"Loading round {round_number} from NRL API")
        fixtures = __load_fixtures_from_nrl_api(111, season, round_number)
        # clear out any existing games for this round
        season_games = [game for game in season_games if game.round != round_number]
        for fixture in fixtures:
            game = __map_nrl_api_fixture_to_game(fixture, season, round_number)
            season_games.append(game)

    # sort the games by kickoff time
    season_games.sort(key=lambda x: x.kickoff)
    return season_games
