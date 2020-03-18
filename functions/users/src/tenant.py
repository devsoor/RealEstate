from datetime import datetime
from user_object import UserObject
from user import User, Role
from enum import Enum
from plan import Plan
from exceptions import BillingPlanError
import uuid
import boto3

s3bucket = 'realpeek-sites'
s3path = F'https://s3-us-west-2.amazonaws.com/{s3bucket}/public/'

editable_fields = ["agent_name", "agent_title", "agent_email", "agent_phone", "office_name", "office_email", "show_landing_page",
    "office_address_street", "office_address_city", "office_address_state", "office_address_zip", "logo_caption" ]

class SiteStatus(Enum):
    ENABLED = 0
    DISABLED = 1

class RegistrationStatus(Enum):
    NEW = 1
    CREATING_RESOURCES = 2
    WAITING_FOR_PROFILE = 3
    ACTIVE = 4

class ProfileStatus(Enum):
    COMPLETE = 1
    INCOMPLETE = 2

class Tenant(UserObject):
    tenant_id = None
    tenant_type = None # agent or team

    max_members = 1
    num_members = 0

    site_name = None
    show_landing_page = None
    agent_name = None
    agent_title = None
    agent_email = None
    agent_phone = None
    agent_photo = None

    office_name = None
    office_email = None
    office_address_street = None
    office_address_city = None
    office_address_state = None
    office_address_zip = None
    office_address = None
    logo_url = None
    logo_caption = None

    user_pool_id = None
    appclient_id = None
    identity_pool_id = None

    registration_status = None
    profile_status = None

    def __init__(self, dictionary):
        """Constructor"""
        for key in dictionary:
            setattr(self, key, dictionary[key])

    @classmethod
    def from_dict(cls, adict):
        if not adict.get("site_name"):
            raise ValueError("Site Name is required")

        newid = str(uuid.uuid4()).replace("-", "")

        agent_photo_url = adict.get("agent_photo")
        if agent_photo_url:
            adict["agent_photo"] = s3path + newid + "/" + agent_photo_url
        logo_url = adict.get("logo_url")
        if logo_url:
            adict["logo_url"] = s3path + newid + "/" + logo_url

        adict["office_address"] = "{street}\n{city}, {state} {zip}".format(
            street=adict.get("office_address_street"), 
            city=adict.get("office_address_city"),
            state=adict.get("office_address_state"),
            zip=adict.get("office_address_zip"))

        tenant = Tenant(adict)
        tenant.tenant_id = newid
        tenant.tenant_type = "agent"
        try:
            max_members = 1
            max_members = int(adict.get("max_members", 1))
        finally:
            tenant.update_max_members(max_members)

        return tenant

    def get_profile_status(self):
        if (self.site_name and 
            self.agent_name and
            self.agent_title and
            self.agent_email and
            self.agent_phone and
            self.agent_photo and
            self.office_name and
            self.office_email and
            self.office_address_street and
            self.office_address_city and
            self.office_address_state and
            self.office_address_zip and
            self.office_address and
            self.logo_url):
            return ProfileStatus.COMPLETE
        else:
            return ProfileStatus.INCOMPLETE

    def set_status(self, new_status:RegistrationStatus):
        self.registration_status = new_status.name

    def update_from_dict(self, adict):
        for field in editable_fields:
            setattr(self, field, adict.get(field, getattr(self, field)))

        # image_path = F"{s3path}{self.tenant_id}/"
        image_path = s3path + self.tenant_id +"/"
        if "agent_photo" in adict:
            full_photo_url = image_path + adict.get("agent_photo")
            self.agent_photo = full_photo_url
        if "logo_url" in adict:
            full_logo_url = image_path + adict.get("logo_url")
            self.logo_url = full_logo_url

        self.office_address = "{street}\n{city}, {state} {zip}".format(
            street=self.office_address_street, 
            city=self.office_address_city,
            state=self.office_address_state,
            zip=self.office_address_zip)

        if self.get_profile_status() == ProfileStatus.COMPLETE:
            self.set_status(RegistrationStatus.ACTIVE)
        else:
            self.set_status(RegistrationStatus.WAITING_FOR_PROFILE)


    def update_site_name(self, new_site_name):
        self.site_name = new_site_name
    
    def update_max_members(self, max_members:int):
        if not max_members:
            raise ValueError("max_members must be an int greater than 0")
        
        if self.num_members > max_members:
            raise BillingPlanError(f"You can't decrease the number of max members until you delete some current members.")

        self.max_members = max_members

    def create_user(self, user_data, role):
        if role not in [Role.USER]:
            raise ValueError('Invalid role for user')

        user = User(self.tenant_id, self.user_pool_id, user_data.get('email'), role, user_data.get('temp_password'))
        return user

    def create_member(self, user_data, role):
        if role not in [Role.SITE_ADMIN, Role.SITE_MEMBER]:
            raise ValueError('Invalid role for member')

        if self.num_members + 1 > self.max_members:
            raise BillingPlanError(f"Maximum allowed members exceeded. ({self.max_members} allowed)")

        self.num_members += 1
        print('creating member: num_members = ' + str(self.num_members))
        user = User(self.tenant_id, self.user_pool_id, user_data.get('email'), role, user_data.get('temp_password'))
        return user

    def delete_member(self, user:User):
        self.num_members -= 1
        