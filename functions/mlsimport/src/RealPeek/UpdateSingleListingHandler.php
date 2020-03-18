<?php

namespace RealPeek;

use Raines\Serverless\Context;
use Raines\Serverless\Handler;
use Exception;

class UpdateSingleListingHandler implements Handler
{
    /**
     * {@inheritdoc}
     */
    public function handle(array $event, Context $context)
    {
        $logger = $context->getLogger();
        try {
            $rp_config = $event['rp_config'];
            unset($event['rp_config']);

            $logger->info('Got event', $event);
            $images_path = 's3://realpeekimages/images/';

            $mls = new MLSImport($event, $context->getLogger(), $rp_config);

            $listingXml = $event['listing'];
            $prop_type = $event['PropertyType'];
            $mlsParameters = $event['MlsParameters'];

            $mls->process_listing($listingXml, $prop_type, $mlsParameters, $images_path);
            return [
                'statusCode' => 200,
                'body' => 'UpdateListings function executed successfully!',
            ];
        } catch(Exception $e) {
            $logger->error($e->getMessage());
            $logger->error($e->getTraceAsString());
            return [
                'statusCode' => 500,
                'body' => $e->getMessage()
            ];
        }
    }
}