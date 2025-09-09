from datetime import datetime, timezone
from coal_train_cup.models import UserShieldTip
from coal_train_cup.services.sheets_service import append_shield_row_to_worksheet


def make_shield_tip(
    email: str, team: str, tryscorer: str, round: int, season: int = 2025
) -> UserShieldTip:
    tipped_at_time = datetime.now(timezone.utc)

    return UserShieldTip(
        email=email,
        season=season,
        round=round,
        team=team,
        tryscorer=tryscorer,
        tipped_at=tipped_at_time,
    )


def submit_shield_tip(tip: UserShieldTip) -> None:
    # Create worksheet name based on season and round
    worksheet_name = f"Shield Round {tip.round}"

    # Submit to Google Sheet
    append_shield_row_to_worksheet(
        tip=tip,
        spreadsheet_name="Coal Train Cup App 2025",
        worksheet_name=worksheet_name,
    )
