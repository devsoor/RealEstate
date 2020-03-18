## Overview

Cloud functions use the serverless framework to create and deploy functions to aws.

## Installation

Install serverless

### `npm install -g serverless`

## Service

To create a new service, you can run: 

### `serverless create --template aws-nodejs --path my-service`

## Deploy the Service

To deploy the service, run: 

### `serverless deploy -v`

...or to deploy just a single function

### `serverless deploy function -f hello`

### Architecture
`mlsimport` service is a php-based service that updates listings from the MLS. It polls the MLS and updates the database.
When a new listing is updated, it also sends a message to an SNS Topic.
There is currently one SQS queue that is subscribed to the topic. More can be added. Eventually, we should have queues for tasks such as updating images, updating the ES, etc, which are done synchronously in a single lambda function.
The SQS queue that is subscribed is:
    `updateRentQueue`: Retreives and caches the current rent and comps from RealtyMole

mlsimport -> sends message to SNS Topic "Listing Updated" -> Sends message to "UpdateRentQueue" SQS -> calls Lambda function update_rent