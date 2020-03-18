<?php

namespace RealPeek;

use Raines\Serverless\Context;
use Raines\Serverless\Handler;
use Exception;

class UpdateOfficesHandler implements Handler
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
            $logger->info("Starting Update Offices");
            $logger->notice('Got event', $event);

            $mls = new MLSImport($event, $context->getLogger(), $rp_config);
            $mls->update_office_data();
            return [
                'statusCode' => 200,
                'body' => 'UpdateOffices function executed successfully!',
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