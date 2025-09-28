from coal_train_cup.services.nrl_api_service import __load_fixtures_from_nrl_api, __get_match_snapshot
from coal_train_cup.services.sheets_service import (
    dataframe_to_worksheet,
    worksheet_to_dataframe,
)
import pandas as pd

def get_round_team_winners(round: int, season: int = 2025) -> list[str]:
    fixtures = __load_fixtures_from_nrl_api(111, season, round)
    game_ids = [fixture["gameId"] for fixture in fixtures]
    winners = []
    for game_id in game_ids:
        snapshot = __get_match_snapshot(game_id)
        home_score = snapshot["gameStats"]["teams"]["teamsMatch"][0].get("teamFinalScore", 0)
        away_score = snapshot["gameStats"]["teams"]["teamsMatch"][1].get("teamFinalScore", 0)
        winner = snapshot["gameStats"]["teams"]["teamsMatch"][0]["teamName"] if home_score > away_score else snapshot["gameStats"]["teams"]["teamsMatch"][1]["teamName"]
        winners.append(winner)

    return winners

def get_round_try_scorers(round: int, season: int = 2025) -> list[str]:
    fixtures = __load_fixtures_from_nrl_api(111, season, round)
    game_ids = [fixture["gameId"] for fixture in fixtures]
    try_scorers = []
    for game_id in game_ids:
        snapshot = __get_match_snapshot(game_id)
        home_team_data = snapshot["gameStats"]["teams"]["teamsMatch"][0]
        away_team_data = snapshot["gameStats"]["teams"]["teamsMatch"][1]
        home_players = home_team_data["teamLineup"]["teamPlayer"]
        away_players = away_team_data["teamLineup"]["teamPlayer"]
        players = home_players + away_players

        for player in players:
            tries = int(player["playerStats"]["tries"])
            if tries > 0:
                # print(player["playerName"], tries)
                try_scorers.append(player["playerName"])

    return try_scorers

if __name__ == "__main__":

    round = 30

    print("==========================")
    print("")
    print("SILIVA SCORING FOR ROUND ", round)
    print("")
    print("==========================")
    team_winners = get_round_team_winners(round)
    print(team_winners)
    print("==========================")
    try_scorers = get_round_try_scorers(round)
    print(try_scorers)
    print("==========================")

    df: pd.DataFrame = worksheet_to_dataframe("Coal Train Cup App 2025", f"Shield Round {round}")
    print(df.shape)

    # Filter DataFrame to keep only rows where team is in team_winners
    df_filtered = df[df['team'].isin(team_winners)]
    print(f"Shape after filtering: {df_filtered.shape}")

    # Filter DataFrame to keep only rows where tryscorer is in try_scorers
    df_filtered = df_filtered[df_filtered['tryscorer'].isin(try_scorers)]
    print(f"Shape after filtering: {df_filtered.shape}")

    # Remove duplicates based on email/season/round/team/tryscorer combination
    df_filtered = df_filtered.drop_duplicates(subset=['email', 'season', 'round', 'team', 'tryscorer'], keep='last')
    print(f"Shape after removing duplicates: {df_filtered.shape}")

    # Check for duplicate emails and raise exception if found
    email_counts = df_filtered['email'].value_counts()
    duplicate_emails = email_counts[email_counts > 1]
    if len(duplicate_emails) > 0:
        raise Exception(f"Found duplicate emails: {duplicate_emails.to_dict()}")

    workbook_name = "Coal Train Cup App 2025"
    winners_sheet_name = f"Winners - Shield Round {round}"

    # print a blank dataframe to the winners sheet to clear it
    dataframe_to_worksheet(pd.DataFrame(), workbook_name, winners_sheet_name)

    dataframe_to_worksheet(df_filtered, workbook_name, winners_sheet_name)
    print(f"Saved {df_filtered.shape[0]} winners to Google Sheets")

    #####################################



    