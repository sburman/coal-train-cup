import pandas as pd
import gspread

from coal_train_cup.models import User, UserTip
from coal_train_cup.services.tipping_service import available_tips_for_round, make_tip
from coal_train_cup.services.data_service_user_tips import (
    save_user_tips_to_sheets,
    load_user_tips_from_sheets,
)

from coal_train_cup.services.secrets import get_secrets
from coal_train_cup.services.data_service_users import (
    save_users_to_sheets,
    load_users_from_sheets,
)


def build_user_and_tips_from_migrations_workbook() -> tuple[list[User], list[UserTip]]:
    secrets = get_secrets()

    config = secrets["connections"]["gsheets"]

    gc = gspread.service_account_from_dict(config)
    spreadsheet = gc.open("tips")

    dataframe = pd.DataFrame(spreadsheet.get_worksheet_by_id(0).get_all_records())

    all_users = []
    all_user_tips = []

    available_round_1 = available_tips_for_round(round=1)
    available_round_2 = available_tips_for_round(round=2)
    available_round_3 = available_tips_for_round(round=3)
    available_round_4 = available_tips_for_round(round=4)
    available_round_5 = available_tips_for_round(round=5)

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

        # round 4
        selected_tip = available_round_4.get(row["round 4"])
        if selected_tip:
            all_user_tips.append(
                make_tip(user, selected_tip, tipped_at=selected_tip.available_until)
            )

        # round 5
        selected_tip = available_round_5.get(row["round 5"])
        if selected_tip:
            all_user_tips.append(
                make_tip(user, selected_tip, tipped_at=selected_tip.available_until)
            )
    return all_users, all_user_tips


if __name__ == "__main__":
    users, tips = build_user_and_tips_from_migrations_workbook()

    print(f"Total users: {len(users)}")
    print(f"Total tips: {len(tips)}")

    save_users_to_sheets(users)

    loaded_users = load_users_from_sheets()
    print(f"Loaded {len(loaded_users)} users")

    assert len(loaded_users) == len(users)

    save_user_tips_to_sheets(tips)

    loaded_user_tips = load_user_tips_from_sheets()

    assert len(loaded_user_tips) == len(tips)
    assert max([tip.round for tip in loaded_user_tips]) == max(
        [tip.round for tip in tips]
    )

    print(
        f"Loaded {len(loaded_user_tips)} user tips across {max([tip.round for tip in loaded_user_tips])} rounds"
    )
