<?php

namespace RealPeek;

use Raines\Serverless\Context;
use Raines\Serverless\Handler;
use Exception;

class InitialMlsLoadHandler implements Handler
{
    /**
     * {@inheritdoc}
     */
    public function handle(array $event, Context $context)
    {
        $logger = $context->getLogger();
        try {
            $logger->info('Got event', $event);

            $rp_config = $event['rp_config'];
            $prop_type = $event['PropertyType'];
            
            //$intervalDays = $event['intervalDays'];

            unset($event['rp_config']);
            $mls = new MLSImport($event, $context->getLogger(), $rp_config);
            $intervalDays = 7;

            $mls->initial_import($prop_type, $event, $intervalDays);
            return [
                'statusCode' => 200,
                'body' => 'Initial Import function executed successfully!',
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