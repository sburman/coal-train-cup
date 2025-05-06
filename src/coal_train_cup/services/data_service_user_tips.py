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

WORKSHEET_NAME = "Coal Train Cup App 2025"


def get_local_archive_path(sheet_name: str) -> str:
    return os.path.join(os.getcwd(), "archive", WORKSHEET_NAME, f"{sheet_name}.json")


def local_archive_exists(sheet_name: str) -> tuple[bool, str]:
    path = get_local_archive_path(sheet_name)
    return os.path.exists(path), path


def locally_archive_tips_for_round(round_number: int) -> None:
    sheet_name = f"Round {round_number}"

    # get the worksheet
    worksheet_df = worksheet_to_dataframe(WORKSHEET_NAME, sheet_name)

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
        if not worksheet_exists("Coal Train Cup App 2025", sheet_name):
            create_worksheet("Coal Train Cup App 2025", sheet_name)

        dataframe_to_worksheet(df, "Coal Train Cup App 2025", sheet_name)
        print(
            f"Saved {len(round_user_tips)} user tips to Google Sheets for round {round}"
        )


def load_user_tips_from_sheets() -> list[UserTip]:
    # get all worksheet names
    worksheet_names = get_worksheet_names("Coal Train Cup App 2025")
    round_worksheets = [
        worksheet for worksheet in worksheet_names if worksheet.startswith("Round ")
    ]

    print("Round worksheets:")
    print(round_worksheets)

    user_tips = []
    for sheet_name in round_worksheets:
        exists, path = local_archive_exists(sheet_name)
        if exists:
            print(f"Loading user tips from local archive: {path}")
            df = pd.read_json(path)
            for _, row in df.iterrows():
                user_tips.append(UserTip(**row.to_dict()))
        elif worksheet_exists("Coal Train Cup App 2025", sheet_name):
            print(f"Loading user tips from Google Sheets: {sheet_name}")
            df = worksheet_to_dataframe("Coal Train Cup App 2025", sheet_name)
            for _, row in df.iterrows():
                user_tips.append(UserTip(**row.to_dict()))

    print(f"Loaded {len(user_tips)} user tips from Google Sheets")
    return user_tips
