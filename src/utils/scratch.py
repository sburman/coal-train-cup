from datetime import datetime
from coal_train_cup.services.games_service import get_all_rounds_status

if __name__ == "__main__":
    for round, status in get_all_rounds_status().items():
        print(f"{round}: {status}")

    # same again but with a different time
    print("---")
    at = "2025-04-25T11:00:00+00:00"
    for round, status in get_all_rounds_status(
        at_time=datetime.fromisoformat(at)
    ).items():
        print(f"{round}: {status}")
