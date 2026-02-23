from datetime import datetime, timezone
from coal_train_cup.models import UserShieldTip
from coal_train_cup.constants import CURRENT_SEASON, SPREADSHEET_NAME
from coal_train_cup.services.sheets_service import append_shield_row_to_worksheet


def make_shield_tip(
    email: str, team: str, tryscorer: str, round: int, match_total: int | None = None, season: int = CURRENT_SEASON
) -> UserShieldTip:
    tipped_at_time = datetime.now(timezone.utc)

    return UserShieldTip(
        email=email,
        season=season,
        round=round,
        team=team,
        tryscorer=tryscorer,
        match_total=match_total,
        tipped_at=tipped_at_time,
    )


def submit_shield_tip(tip: UserShieldTip) -> None:
    # Create worksheet name based on season and round
    worksheet_name = f"Shield Round {tip.round}"

    # Submit to Google Sheet
    append_shield_row_to_worksheet(
        tip=tip,
        spreadsheet_name=SPREADSHEET_NAME,
        worksheet_name=worksheet_name,
    )
