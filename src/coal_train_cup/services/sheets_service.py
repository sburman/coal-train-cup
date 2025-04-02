import gspread
import pandas as pd
from typing import Any

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
