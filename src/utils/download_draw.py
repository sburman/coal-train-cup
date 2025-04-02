from coal_train_cup.services.nrl_api_service import get_latest_draw_from_nrl_api
from coal_train_cup.services.games_service import (
    save_games_to_sheets,
    load_games_from_sheets,
)


if __name__ == "__main__":
    games = get_latest_draw_from_nrl_api()
    save_games_to_sheets(games)
    loaded_games = load_games_from_sheets()

    # Print some information to verify
    for game in loaded_games[:5]:
        print(
            f"Round {game.round}: {game.home_team} vs {game.away_team} at {game.venue}"
        )
        if game.winning_team:
            print(f"  Winner: {game.winning_team}")
        else:
            print(f"  Scheduled: {game.kickoff}")

    for game in loaded_games[-5:]:
        print(
            f"Round {game.round}: {game.home_team} vs {game.away_team} at {game.venue}"
        )
        if game.winning_team:
            print(f"  Winner: {game.winning_team}")
        else:
            print(f"  Scheduled: {game.kickoff}")

    total_rounds = len(set(game.round for game in loaded_games))
    print(f"Total rounds: {total_rounds}")
    print(f"Total games scraped: {len(loaded_games)}")
