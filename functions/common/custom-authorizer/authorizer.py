import json
import os

class Authorizer:

    def getTenant(self, payload):
        return True

    def generatePolicy(self, payload, effect, resource):
        '''
        Help function to generate an IAM policy
        '''
        tenant = self.getTenant(payload)
        if not tenant:
            raise Exception("Unknown tenant")
        authResponse = {}

        authResponse["principalId"] = payload.sub
        if effect and resource:
            authResponse["policyDocument"] = {
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "execute-api:Invoke",
                    "Effect": effect,
                    "Resource": resource
                }]
            }

        # extract tenant id from iss
        payload.tenant = tenant

        authResponse.context = { 
            'payload': json.dumps(payload, default=str) 
        }

        return authResponse

