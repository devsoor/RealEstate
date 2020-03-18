<?php

namespace RealPeek;

use Raines\Serverless\Context;
use Raines\Serverless\Handler;
use Exception;

class CullListingsHandler implements Handler
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

            $mls = new MLSImport($event, $context->getLogger(), $rp_config);
            $prop_type = $event['PropertyType'];

            $mls->delete_expired_listings($prop_type);
            return [
                'statusCode' => 200,
                'body' => 'CullListings function executed successfully!',
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