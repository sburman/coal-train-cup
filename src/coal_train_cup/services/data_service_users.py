import pandas as pd

from coal_train_cup.models import User
from coal_train_cup.constants import SPREADSHEET_NAME
from coal_train_cup.services.sheets_service import (
    dataframe_to_worksheet,
    worksheet_to_dataframe,
)


def save_users_to_sheets(users: list[User]) -> None:
    users_data = []
    for user in users:
        users_data.append(user.model_dump())

    df = pd.DataFrame(users_data)

    dataframe_to_worksheet(df, SPREADSHEET_NAME, "Users")
    print(f"Saved {len(users)} users to Google Sheets")


def load_users_from_sheets() -> list[User]:
    df = worksheet_to_dataframe(SPREADSHEET_NAME, "Users")

    # Convert pin column to string type before creating User objects
    if "pin" in df.columns:
        df["pin"] = df["pin"].astype(str)

    users = []
    for _, row in df.iterrows():
        users.append(User(**row.to_dict()))

    print(f"Loaded {len(users)} users from Google Sheets")
    return users
