def make_user_tip(
    user_id: int,
    round_id: int,
    tip: str,
    tip_time: str,
) -> dict:
    return {
        "user_id": user_id,
        "round_id": round_id,
        "tip": tip,
        "tip_time": tip_time,
    }


def get_user_tips(user_id: int) -> list[dict]:
    """
    Get all tips made by a user.

    Args:
        user_id (int): The ID of the user.

    Returns:
        list[dict]: A list of dictionaries containing the user's tips.
    """
    # This is a placeholder implementation. Replace with actual database query.
    return [
        {
            "user_id": user_id,
            "round_id": 1,
            "tip": "Team A",
            "tip_time": "2023-10-01T12:00:00Z",
        },
        {
            "user_id": user_id,
            "round_id": 2,
            "tip": "Team B",
            "tip_time": "2023-10-08T12:00:00Z",
        },
    ]
