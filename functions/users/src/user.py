from datetime import datetime
from user_object import UserObject
import traceback
from enum import Enum
import uuid
import boto3

class Role(Enum):
    SYS_ADMIN = 1
    SITE_ADMIN = 2
    SITE_MEMBER = 3
    USER = 4

class User(UserObject):
    tenant_id = None
    username = None
    email = None
    temp_password = None
    role = None
    user_pool_id = None

    def __init__(self, tenant_id, user_pool_id, email, role, temp_password):
        if tenant_id is None:
            raise TypeError('tenant_id is required')
        if email is None:
            raise TypeError('email is required')

        self.tenant_id = tenant_id
        self.user_pool_id = user_pool_id
        self.username = email.lower()
        self.email = email.lower()
        self.role = role
        self.temp_password = temp_password

