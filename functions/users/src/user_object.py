from datetime import datetime
import uuid

class UserObject:
    
    @classmethod
    def from_dict(cls, adict):
        user_object = cls()
        user_object.set_attributes_from_dict(adict)
        return user_object

    def set_attributes_from_dict(self, *adict, **kwargs):
        #Populates attributes of self with all values from dictionaries and keywords
        # Example usage options:
        #   set_attributes_from_dict({"name": "abc"})
        #
        #   set_attributes_from_dict(name="abc")
        #
        #   userobject_template = {"role": "agent"}
        #   set_attributes_from_dict(userobject_template, name="abc")

        default_id = str(uuid.uuid4())
        default_id = default_id.replace("-","")
        # default_name = "Test item " + default_id

        self.id = default_id  # should be overwritten by id passed in when below for loop runs
        # self.name = default_name  # should be overwritten by id passed in when below for loop runs

        for dictionary in adict:
            for key in dictionary:
                setattr(self, key, dictionary[key])  #eg self.owner = adict["owner"]
        
        for key in kwargs:
            setattr(self, key, kwargs[key])
