#!/usr/bin/env python3
from coal_train_cup.constants import CURRENT_SEASON
from coal_train_cup.services.nrl_api_service import get_list_of_player_names_in_round


if __name__ == "__main__":
    # Test all endpoints to find player data (use round 1 for start of season)
    player_names = get_list_of_player_names_in_round(111, CURRENT_SEASON, 1)
    print(player_names)
