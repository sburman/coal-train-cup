from dataclasses import dataclass

import streamlit as st
from coal_train_cup.services.data_store import all_games
from coal_train_cup.models import Game


def games_for_round(round: int, season: int = 2025) -> list[Game]:
    """
    Returns a list of games for the given round.
    """
    games = []
    for game in all_games():
        if game.round == round and game.season == season:
            games.append(game)
    return games


@dataclass
class GameResult:
    season: int
    round: int
    team: str
    opponent: str
    home: bool
    score_for: int
    score_against: int

    @property
    def margin(self) -> int:
        return self.score_for - self.score_against


@st.cache_data
def all_game_results() -> list[GameResult]:
    results = []
    for game in all_games():
        if game.home_score and game.away_score:
            home_result = GameResult(
                season=game.season,
                round=game.round,
                team=game.home_team,
                opponent=game.away_team,
                home=True,
                score_for=game.home_score,
                score_against=game.away_score,
            )
            away_result = GameResult(
                season=game.season,
                round=game.round,
                team=game.away_team,
                opponent=game.home_team,
                home=False,
                score_for=game.away_score,
                score_against=game.home_score,
            )
            results.append(home_result)
            results.append(away_result)
    return results
