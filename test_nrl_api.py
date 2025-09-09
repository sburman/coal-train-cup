#!/usr/bin/env python3
from coal_train_cup.services.nrl_api_service import get_list_of_player_names_in_round


if __name__ == "__main__":
    # Test all endpoints to find player data
    player_names = get_list_of_player_names_in_round(111, 2025, 28)
    print(player_names)
