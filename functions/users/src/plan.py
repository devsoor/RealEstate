from datetime import datetime
from enum import Enum

class Plan:
    max_members = 1
    name = None

    def __init__(self, name:str, max_members:int):
        """Constructor"""
        if not name:
            raise ValueError("name is required")
        if not max_members:
            raise ValueError("max_members must be an int greater than 1")
        self.name = name
        self.max_members = max_members


