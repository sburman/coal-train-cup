import gspread
import pandas as pd
from typing import Any
from coal_train_cup.models import UserTip
from coal_train_cup.services.secrets import get_secrets


def get_service_account() -> Any:
    secrets = get_secrets()
    config = secrets["connections"]["gsheets"]
    return gspread.service_account_from_dict(config)


def get_spreadsheet(name: str) -> gspread.Spreadsheet:
    return get_service_account().open(name)


def get_worksheet(spreadsheet_name: str, worksheet_name: str) -> gspread.Worksheet:
    return get_spreadsheet(spreadsheet_name).worksheet(worksheet_name)


def worksheet_to_dataframe(spreadsheet_name: str, worksheet_name: str) -> pd.DataFrame:
    worksheet = get_worksheet(spreadsheet_name, worksheet_name)
    return pd.DataFrame(worksheet.get_all_records())


def dataframe_to_worksheet(
    dataframe: pd.DataFrame, spreadsheet_name: str, worksheet_name: str
) -> None:
    worksheet = get_worksheet(spreadsheet_name, worksheet_name)
    worksheet.update([dataframe.columns.tolist()] + dataframe.values.tolist())


def worksheet_exists(spreadsheet_name: str, worksheet_name: str) -> bool:
    try:
        worksheet = get_worksheet(spreadsheet_name, worksheet_name)
        return worksheet.title == worksheet_name
    except gspread.exceptions.WorksheetNotFound:
        return False


def create_worksheet(spreadsheet_name: str, worksheet_name: str) -> None:
    spreadsheet = get_spreadsheet(spreadsheet_name)
    spreadsheet.add_worksheet(title=worksheet_name, rows=500, cols=20)


def get_worksheet_names(spreadsheet_name: str) -> list[str]:
    spreadsheet = get_spreadsheet(spreadsheet_name)
    return [worksheet.title for worksheet in spreadsheet.worksheets()]


def append_row_to_worksheet(
    tip: UserTip,
    spreadsheet_name: str,
    worksheet_name: str,
) -> None:
    row_data = {
        "email": tip.email,
        "username": tip.username,
        "season": tip.season,
        "round": tip.round,
        "team": tip.team,
        "opponent": tip.opponent,
        "home": tip.home,
        "tipped_at": tip.tipped_at.isoformat(),
    }

    headers = list(row_data.keys())
    row_values = [row_data[header] for header in headers]

    if not worksheet_exists(spreadsheet_name, worksheet_name):
        create_worksheet(spreadsheet_name, worksheet_name)
        worksheet = get_worksheet(spreadsheet_name, worksheet_name)
        worksheet.append_row(headers)

    worksheet = get_worksheet(spreadsheet_name, worksheet_name)
    worksheet.append_row(row_values)


def delete_user_tips(
    tips: list[UserTip],
) -> None:
    if not tips:
        raise ValueError("No tips to delete")

    # Check all tips are for same round
    first_round = tips[0].round
    if not all(tip.round == first_round for tip in tips):
        raise ValueError("All tips must be from the same round")

    worksheet = get_worksheet("Coal Train Cup App 2025", f"Round {first_round}")
    record_list = worksheet.get_all_records()

    print("record count", len(record_list))

    indexes = []
    for tip in tips:
        print("==============")
        print("")
        print(tip)
        print("")
        for i, record in enumerate(record_list):
            if (
                record["email"] == tip.email
                and record["season"] == tip.season
                and record["round"] == tip.round
                and record["team"] == tip.team
                and record["opponent"] == tip.opponent
                and record["tipped_at"] == tip.tipped_at.isoformat()
            ):
                print("Deleting at index", i + 2)
                print("")
                print(record)
                print("")
                indexes.append(i + 2)  # +2 for header + 1-based indexing

    if not indexes:
        raise ValueError("No tips matched for deletion")

    reversed_indexes = sorted(indexes, reverse=True)
    for index in reversed_indexes:
        print(f"Deleting row {index}")
        worksheet.delete_rows(index)
