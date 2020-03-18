<?php

namespace RealPeek;

use Raines\Serverless\Context;
use Raines\Serverless\Handler;
use Exception;

class UpdateImagesHandler implements Handler
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

            $logger->notice('Got event', $event);


            //$mls_path = '/tmp/mlsdata/nwmls/' . $ptype . '/';
            //$images_path = $mls_path . 'images/';
            $images_path = 's3://realpeekimages/images/';

            $images = new ImageProcessor($context->getLogger(), $rp_config);
            $images->start_images($event, $images_path);
            
            $logger->info('done processing images');
            return [
                'statusCode' => 200,
                'body' => 'UpdateImages function executed successfully!',
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