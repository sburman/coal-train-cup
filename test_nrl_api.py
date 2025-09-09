#!/usr/bin/env python3
"""
Test script for the get_list_of_player_names_in_round function.
This will test the function with competition 111, season 2025, round 28.
"""

import json
from coal_train_cup.services.nrl_api_service import get_list_of_player_names_in_round


def debug_all_endpoints_for_players():
    """Test all three endpoints to find player names."""
    
    import requests
    from coal_train_cup.services.secrets import get_secrets
    
    competition_id = 111
    season = 2025
    round_number = 28
    
    print("TESTING ALL ENDPOINTS FOR PLAYER DATA - ROUND 28")
    print("=" * 70)
    
    try:
        # Get authentication
        secrets = get_secrets()
        nrl_auth = secrets["connections"]["nrl"]["auth"]
        service_headers = {
            "Authorization": nrl_auth,
            "Content-Type": "application/json, charset=UTF-8",
        }
        
        # Get fixtures first
        print("Loading fixtures...")
        fixtures_url = f"http://rugbyleague-api.stats.com/api/NRL/competitions/roundFixtures/{competition_id}/{season}/{round_number}.json"
        r = requests.get(fixtures_url, headers=service_headers, timeout=30)
        
        if r.status_code != 200:
            print(f"Fixtures API failed: {r.status_code}")
            print(r.text)
            return
            
        fixture_data = r.json()
        fixtures = fixture_data["roundFixtures"][0]["gameFixtures"]
        print(f"Found {len(fixtures)} fixtures")
        
        if fixtures:
            # Get the first match ID
            game_id = fixtures[0]["gameId"]
            print(f"Testing with first game ID: {game_id}")
            print("-" * 70)
            
            # Test all three endpoints
            endpoints = [
                ("livexy", f"http://rugbyleague-api.stats.com/api/NRL/livexy/{game_id}.json"),
                ("matchStatsAndEvents", f"http://rugbyleague-api.stats.com/api/NRL/matchStatsAndEvents/{game_id}.json"),
                ("matchSnapshot", f"http://rugbyleague-api.stats.com/api/NRL/matchSnapshot/{game_id}.json")
            ]
            
            for endpoint_name, url in endpoints:
                print(f"\nTESTING ENDPOINT: {endpoint_name}")
                print(f"URL: {url}")
                print("-" * 50)
                
                try:
                    response = requests.get(url, headers=service_headers, timeout=30)
                    
                    if response.status_code != 200:
                        print(f"❌ {endpoint_name} failed: {response.status_code}")
                        print(f"Error: {response.text}")
                        continue
                    
                    data = response.json()
                    print(f"✅ {endpoint_name} success!")
                    print(f"Top-level keys: {list(data.keys())}")
                    
                    # Look for player-related data
                    player_found = False
                    player_data = []
                    
                    def find_players_recursive(obj, path=""):
                        nonlocal player_found, player_data
                        if isinstance(obj, dict):
                            for key, value in obj.items():
                                current_path = f"{path}.{key}" if path else key
                                if "player" in key.lower():
                                    player_found = True
                                    player_data.append(f"Found player key: {current_path} = {type(value)}")
                                    if isinstance(value, list) and value and isinstance(value[0], dict):
                                        if "playerName" in value[0] or "name" in value[0]:
                                            player_data.append(f"  Sample player: {value[0]}")
                                find_players_recursive(value, current_path)
                        elif isinstance(obj, list):
                            for i, item in enumerate(obj):
                                find_players_recursive(item, f"{path}[{i}]")
                    
                    find_players_recursive(data)
                    
                    if player_found:
                        print("🎯 PLAYER DATA FOUND!")
                        for info in player_data:
                            print(f"  {info}")
                    else:
                        print("❌ No player data found in this endpoint")
                    
                    # Show a sample of the data structure
                    data_str = json.dumps(data, indent=2, default=str)
                    if len(data_str) > 3000:
                        print(f"\nSample data (first 3000 chars):")
                        print(data_str[:3000] + "...")
                    else:
                        print(f"\nFull data:")
                        print(data_str)
                        
                except Exception as e:
                    print(f"❌ Error testing {endpoint_name}: {e}")
                
                print("\n" + "="*70)
                
        else:
            print("No fixtures found for the given parameters")
            
    except Exception as e:
        print(f"Debug error: {e}")
        import traceback
        traceback.print_exc()


def test_get_list_of_player_names_in_round():
    """Test the get_list_of_player_names_in_round function."""
    
    # Test parameters as requested
    competition_id = 111
    season = 2025
    round_number = 28
    
    print(f"Testing get_list_of_player_names_in_round function")
    print(f"Competition ID: {competition_id}")
    print(f"Season: {season}")
    print(f"Round: {round_number}")
    print("-" * 80)
    
    try:
        # Call the function
        print("Calling get_list_of_player_names_in_round...")
        player_names = get_list_of_player_names_in_round(competition_id, season, round_number)
        
        print(f"Function completed successfully!")
        print(f"Total number of players found: {len(player_names)}")
        print("-" * 80)
        
        # Display the results
        print("PLAYER NAMES:")
        print("=" * 50)
        
        if player_names:
            # Sort the names for better readability
            sorted_names = sorted(player_names)
            
            for i, name in enumerate(sorted_names, 1):
                print(f"{i:3d}. {name}")
                
            print("=" * 50)
            print(f"Summary: Found {len(player_names)} player names")
            
            # Check for duplicates
            unique_names = set(player_names)
            if len(unique_names) != len(player_names):
                duplicates = len(player_names) - len(unique_names)
                print(f"Note: {duplicates} duplicate names found")
                print(f"Unique players: {len(unique_names)}")
        else:
            print("No player names found!")
            
    except Exception as e:
        print(f"Error occurred: {e}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        print("Full traceback:")
        traceback.print_exc()


def test_with_different_parameters():
    """Test the function with different parameters for comparison."""
    
    test_cases = [
        (111, 2025, 1),   # Round 1
        (111, 2025, 10),  # Round 10
        (111, 2025, 27),  # Round 27 (one before our main test)
    ]
    
    print("\n\nTESTING WITH DIFFERENT PARAMETERS")
    print("=" * 60)
    
    for comp_id, season, round_num in test_cases:
        print(f"\nTesting Competition {comp_id}, Season {season}, Round {round_num}:")
        try:
            players = get_list_of_player_names_in_round(comp_id, season, round_num)
            print(f"  ✓ Success: Found {len(players)} players")
        except Exception as e:
            print(f"  ✗ Error: {e}")


if __name__ == "__main__":
    # Test all endpoints to find player data
    debug_all_endpoints_for_players()
    
    print("\n" + "=" * 80)
    print("ORIGINAL FUNCTION TEST (will likely fail until we fix the implementation)")
    print("=" * 80)
    
    # Main test with the requested parameters
    test_get_list_of_player_names_in_round()
    
    # Optional: Test with other parameters for comparison
    print("\n" + "=" * 80)
    print("Would you like to test with other parameters? Uncomment the line below:")
    print("# test_with_different_parameters()")
