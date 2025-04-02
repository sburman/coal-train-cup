from datetime import datetime, timezone
from pydantic import BaseModel, EmailStr, field_validator, Field
from typing import Optional
import hashlib
from dataclasses import dataclass
from coal_train_cup.services.secrets import get_secrets


def _generate_pin(email: EmailStr) -> str:
    """
    Returns a 4-digit PIN derived from the user's email.
    This is a one-way hash that can be consistently generated from the email.
    """
    secrets = get_secrets()
    salt = secrets["salt"]["value"]

    if not isinstance(salt, str):
        raise ValueError("Salt must be a string")

    # Get lowercase email and combine with salt
    email_lower = str(email).lower()
    salted_input = email_lower + salt

    # Create a SHA-256 hash
    hash_obj = hashlib.sha256(salted_input.encode())
    hash_hex = hash_obj.hexdigest()

    # Convert to integer and limit to 4 digits (0-9999)
    hash_int = int(hash_hex, 16) % 10000

    return str(hash_int).zfill(4) + "69"


class User(BaseModel):
    email: EmailStr
    username: str
    pin: str = Field(default_factory=_generate_pin)


class UserTip(BaseModel):
    email: EmailStr
    username: str
    season: int
    round: int
    team: str
    opponent: str
    home: bool
    tipped_at: datetime = datetime.now(timezone.utc)


class Tip(BaseModel):
    season: int
    round: int
    team: str
    opponent: str
    home: bool
    available_until: datetime


class Game(BaseModel):
    season: int
    round: int
    kickoff: datetime
    home_team: str
    away_team: str
    venue: str
    home_score: Optional[int] = None
    away_score: Optional[int] = None

    @field_validator("kickoff")
    @classmethod
    def ensure_kickoff_utc(cls, v: datetime) -> datetime:
        # If datetime has no timezone, assume UTC
        if v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)

        # If datetime has timezone but it's not UTC, convert to UTC
        offset = v.utcoffset()
        if (
            v.tzinfo != timezone.utc
            and offset is not None
            and offset.total_seconds() != 0
        ):
            return v.astimezone(timezone.utc)

        return v

    @property
    def winning_team(self) -> Optional[str]:
        """
        Returns the name of the winning team, 'Draw' if it's a tie,
        or None if the scores aren't available.
        """
        if self.home_score is None or self.away_score is None:
            return None

        if self.home_score > self.away_score:
            return self.home_team
        elif self.away_score > self.home_score:
            return self.away_team
        else:
            return "Draw"


@dataclass
class GameResult:
    season: int
    round: int
    team: str
    opponent: str
    home: bool
    score_for: int
    score_against: int

    @property
    def margin(self) -> int:
        return self.score_for - self.score_against
