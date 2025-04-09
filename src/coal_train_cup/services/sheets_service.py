import gspread
import pandas as pd
from typing import Any, Dict

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
    row_data: Dict[str, Any],
    spreadsheet_name: str,
    worksheet_name: str,
) -> None:
    if not worksheet_exists(spreadsheet_name, worksheet_name):
        create_worksheet(spreadsheet_name, worksheet_name)
        worksheet = get_worksheet(spreadsheet_name, worksheet_name)
        headers = list(row_data.keys())
        worksheet.append_row(headers)

    worksheet = get_worksheet(spreadsheet_name, worksheet_name)
    row_values = [row_data[header] for header in headers]
    worksheet.append_row(row_values)
