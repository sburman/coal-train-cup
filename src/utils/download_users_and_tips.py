import pandas as pd
import gspread
import toml
import json

from coal_train_cup.models import User, UserTip
from coal_train_cup.services.tipping_service import available_tips, make_tip


def build_user_and_tips() -> tuple[list[User], list[UserTip]]:
    secrets_path = (
        "/home/steve/Documents/github/rl/coal-train-cup/.streamlit/secrets.toml"
    )
    with open(secrets_path, "r") as file:
        secrets = toml.load(file)

    config = secrets["connections"]["gsheets"]

    gc = gspread.service_account_from_dict(config)
    spreadsheet = gc.open("tips")

    dataframe = pd.DataFrame(spreadsheet.get_worksheet_by_id(0).get_all_records())

    all_users = []
    all_user_tips = []

    available_round_1 = available_tips(round=1)
    available_round_2 = available_tips(round=2)
    available_round_3 = available_tips(round=3)

    for index, row in dataframe.iterrows():
        user = User(email=row["email"], username=row["name"])
        all_users.append(user)

        # round 1
        selected_tip = available_round_1.get(row["round 1"])
        if selected_tip:
            all_user_tips.append(
                make_tip(user, selected_tip, tipped_at=selected_tip.available_until)
            )

        # round 2
        selected_tip = available_round_2.get(row["round 2"])
        if selected_tip:
            all_user_tips.append(
                make_tip(user, selected_tip, tipped_at=selected_tip.available_until)
            )

        # round 3
        selected_tip = available_round_3.get(row["round 3"])
        if selected_tip:
            all_user_tips.append(
                make_tip(user, selected_tip, tipped_at=selected_tip.available_until)
            )

    return all_users, all_user_tips


def serialize_users(users: list[User]) -> None:
    filename = "data/users_2025.json"
    user_data = []
    for user in users:
        user_dict = user.model_dump()
        user_data.append(user_dict)

    # Write to file
    with open(filename, "w") as f:
        json.dump(user_data, f, indent=2)

    print(f"Saved {len(users)} users to {filename}")


def serialize_user_tips(user_tips: list[UserTip]) -> None:
    filename = "data/user_tips_2025.json"
    user_tips_data = []
    for user_tip in user_tips:
        user_tip_dict = user_tip.model_dump()
        user_tip_dict["tipped_at"] = user_tip_dict["tipped_at"].isoformat()
        user_tips_data.append(user_tip_dict)

    # Write to file
    with open(filename, "w") as f:
        json.dump(user_tips_data, f, indent=2)

    print(f"Saved {len(user_tips_data)} user tips to {filename}")


if __name__ == "__main__":
    users, tips = build_user_and_tips()
    print(f"Total users: {len(users)}")
    print(f"Total tips: {len(tips)}")

    serialize_users(users)
    serialize_user_tips(tips)
