import pandas as pd
import os
from coal_train_cup.models import UserTip
from coal_train_cup.services.sheets_service import (
    dataframe_to_worksheet,
    worksheet_to_dataframe,
    worksheet_exists,
    create_worksheet,
    get_worksheet_names,
)
from coal_train_cup.constants import SPREADSHEET_NAME


def get_local_archive_path(sheet_name: str, spreadsheet_name: str | None = None) -> str:
    sheet = spreadsheet_name or SPREADSHEET_NAME
    return os.path.join(os.getcwd(), "archive", sheet, f"{sheet_name}.json")


def local_archive_exists(sheet_name: str, spreadsheet_name: str | None = None) -> tuple[bool, str]:
    path = get_local_archive_path(sheet_name, spreadsheet_name)
    return os.path.exists(path), path


def locally_archive_tips_for_round(round_number: int) -> None:
    sheet_name = f"Round {round_number}"

    # get the worksheet
    worksheet_df = worksheet_to_dataframe(SPREADSHEET_NAME, sheet_name)

    file_path = get_local_archive_path(sheet_name)
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    worksheet_df.to_json(file_path, orient="records")


def save_user_tips_to_sheets(user_tips: list[UserTip]) -> None:
    # group by round as each round is saved to a unique sheet
    user_tips_by_round = {}
    for user_tip in user_tips:
        if user_tip.round not in user_tips_by_round:
            user_tips_by_round[user_tip.round] = []
        user_tips_by_round[user_tip.round].append(user_tip)

    for round, round_user_tips in user_tips_by_round.items():
        # Convert UserTips to dicts and handle datetime serialization
        tips_data = []
        for tip in round_user_tips:
            tip_dict = tip.model_dump()
            tip_dict["tipped_at"] = tip_dict["tipped_at"].isoformat()
            tips_data.append(tip_dict)

        df = pd.DataFrame(tips_data)
        sheet_name = f"Round {round}"
        if not worksheet_exists(SPREADSHEET_NAME, sheet_name):
            create_worksheet(SPREADSHEET_NAME, sheet_name)

        dataframe_to_worksheet(df, SPREADSHEET_NAME, sheet_name)
        print(
            f"Saved {len(round_user_tips)} user tips to Google Sheets for round {round}"
        )


def load_user_tips_from_sheets(spreadsheet_name: str | None = None) -> list[UserTip]:
    sheet = spreadsheet_name or SPREADSHEET_NAME
    # get all worksheet names
    worksheet_names = get_worksheet_names(sheet)
    round_worksheets = [
        worksheet for worksheet in worksheet_names if worksheet.startswith("Round ")
    ]

    print("Round worksheets:")
    print(round_worksheets)

    user_tips = []
    for sheet_name in round_worksheets:
        exists, path = local_archive_exists(sheet_name, spreadsheet_name)
        if exists:
            print(f"Loading user tips from local archive: {path}")
            df = pd.read_json(path)
            for _, row in df.iterrows():
                user_tips.append(UserTip(**row.to_dict()))
        elif worksheet_exists(sheet, sheet_name):
            print(f"Loading user tips from Google Sheets: {sheet_name}")
            df = worksheet_to_dataframe(sheet, sheet_name)
            for _, row in df.iterrows():
                user_tips.append(UserTip(**row.to_dict()))

    print(f"Loaded {len(user_tips)} user tips from combined sources")
    return user_tips
