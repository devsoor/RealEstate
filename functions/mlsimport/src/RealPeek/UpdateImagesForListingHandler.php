<?php

namespace RealPeek;

use Raines\Serverless\Context;
use Raines\Serverless\Handler;
use Exception;

class UpdateImagesForListingHandler implements Handler
{

    /**
    * Updates images for a single listing
    */
    public function handle(array $event, Context $context)
    {
        $logger = $context->getLogger();
    
        $listing = $event['listing'];
        $ptype = $event['PropertyType'];

        $logger->info('Starting update for type ' . $ptype . ' listing ' . $listing);
        $images_path = 's3://realpeekimages/images/';

        try {
            $rp_config = $event['rp_config'];
            unset($event['rp_config']);

            $images = new ImageProcessor($logger, $rp_config);
            $images->get_images_for_listing($ptype, $listing, $images_path);

            return [
                'statusCode' => 200,
                'body' => 'UpdateImagesForListing function executed successfully!'
            ];
        }
        catch(Exception $e) {
            $logger->error($e->getMessage());
            $logger->error($e->getTraceAsString());
            return [
                'statusCode' => 500,
                'body' => $e.getMessage()
            ];
        }
    }
}