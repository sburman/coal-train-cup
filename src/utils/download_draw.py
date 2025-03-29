from datetime import datetime
from typing import Any, List
import requests
from coal_train_cup.models import Game
import csv
import json
from pathlib import Path

SERVICE_HEADERS = {
    "Authorization": "Basic U291dGhTeWRuZXk6UjRiYmlUMGhT",
    "Content-Type": "application/json, charset=UTF-8",
}

def load_fixtures(competition_id: int, season: int, round: int) -> tuple[str, dict[str, Any]]:
    url = f"http://rugbyleague-api.stats.com/api/NRL/competitions/roundFixtures/{competition_id}/{season}/{round}.json"
    r = requests.get(url, headers=SERVICE_HEADERS, timeout=30)
    if r.status_code != 200:
        print(r.text)
        raise ValueError()

    fixture_list = r.json()
    fixture_list = fixture_list["roundFixtures"][0]["gameFixtures"]

    return fixture_list

def map_fixture_to_game(fixture: dict[str, Any], season: int, round_number: int) -> Game:
    """
    Maps a fixture to a single Game object with home and away teams, venue, and scores.
    """
    # Parse the kickoff time
    kickoff_utc = datetime.fromisoformat(fixture['startTimeUTC'].replace('Z', '+00:00'))
    
    # Get both teams
    home_team = None
    away_team = None
    
    for team_data in fixture['teams']:
        if team_data.get('isHomeTeam', False):
            home_team = team_data
        else:
            away_team = team_data
    
    if not home_team or not away_team:
        raise ValueError(f"Could not identify home and away teams in fixture: {fixture['gameId']}")
    
    # Extract venue information - concatenate venueName and city with a comma
    venue_name = fixture.get('venueName', 'Unknown Venue')
    city = fixture.get('city', 'Unknown City')
    venue = f"{venue_name}, {city}"
    
    # Extract scores if available
    home_score = home_team.get('teamFinalScore', None)
    away_score = away_team.get('teamFinalScore', None)
    
    # Create a single Game object with home and away teams, venue, and scores
    game = Game(
        season=season,
        round=round_number,
        kickoff=kickoff_utc,
        home_team=home_team['teamName'],
        away_team=away_team['teamName'],
        venue=venue,
        home_score=home_score,
        away_score=away_score
    )
    
    return game

def update_draw_by_scraping_online_resource() -> list[Game]:
    """
    Scrape an online resource to create a list of Game objects.
    """
    season = 2025
    season_games = []
    for round_number in range(1, 28):
        fixtures = load_fixtures(111, season, round_number)
        
        for fixture in fixtures:
            game = map_fixture_to_game(fixture, season, round_number)
            season_games.append(game)

    return season_games

def serialize_games(games: List[Game], filename: str) -> None:
    """
    Serialize a list of Game objects to a JSON file.
    
    Args:
        games: List of Game objects to serialize
        filename: Path to save the serialized games
    """
    # Convert Game objects to dictionaries, handling datetime serialization
    games_data = []
    for game in games:
        game_dict = game.model_dump()
        # Convert datetime to ISO format string for JSON serialization
        game_dict['kickoff'] = game_dict['kickoff'].isoformat()
        games_data.append(game_dict)
    
    # Write to file
    with open(filename, 'w') as f:
        json.dump(games_data, f, indent=2)
    
    print(f"Saved {len(games)} games to {filename}")

def deserialize_games(filename: str) -> List[Game]:
    """
    Deserialize games from a JSON file back to Game objects.
    
    Args:
        filename: Path to the serialized games file
        
    Returns:
        List of Game objects
    """
    if not Path(filename).exists():
        print(f"File {filename} not found")
        return []
    
    # Read from file
    with open(filename, 'r') as f:
        games_data = json.load(f)
    
    # Convert dictionaries back to Game objects
    games = []
    for game_dict in games_data:
        # Convert ISO format string back to datetime
        game_dict['kickoff'] = datetime.fromisoformat(game_dict['kickoff'])
        games.append(Game(**game_dict))
    
    print(f"Loaded {len(games)} games from {filename}")
    return games

if __name__ == "__main__":
    all_games = update_draw_by_scraping_online_resource()
    
    # Serialize games to file
    serialize_games(all_games, "games_2025.json")
    
    # Example of deserializing
    loaded_games = deserialize_games("games_2025.json")
    
    # Print some information to verify
    for game in loaded_games[:5]:
        print(f"Round {game.round}: {game.home_team} vs {game.away_team} at {game.venue}")
        if game.winning_team:
            print(f"  Winner: {game.winning_team}")
        else:
            print(f"  Scheduled: {game.kickoff}")

    total_rounds = len(set(game.round for game in all_games))
    print (f"Total rounds: {total_rounds}")
    print (f"Total games scraped: {len(all_games)}")