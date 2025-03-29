from datetime import datetime, timezone
from pydantic import BaseModel, EmailStr, field_validator, computed_field
from typing import Optional

class User(BaseModel):
    email: EmailStr
    username: str


class UserTip(BaseModel):
    email: EmailStr
    season: int
    round: int
    team: str
    opponent: str
    home: bool


class Game(BaseModel):
    season: int
    round: int
    kickoff: datetime
    home_team: str
    away_team: str
    venue: str
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    
    @field_validator('kickoff')
    @classmethod
    def ensure_kickoff_utc(cls, v: datetime) -> datetime:
        # If datetime has no timezone, assume UTC
        if v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        
        # If datetime has timezone but it's not UTC, convert to UTC
        offset = v.utcoffset()
        if v.tzinfo != timezone.utc and offset is not None and offset.total_seconds() != 0:
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
    
