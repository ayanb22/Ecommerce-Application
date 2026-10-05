import uuid
import time
import logging

logger = logging.getLogger('request_metrics')

class RequestMetricsMiddleware:
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        incoming_id = request.headers.get('X-Request-ID')
        if incoming_id and len(incoming_id) <= 100 and not any(c.isspace() for c in incoming_id):
            request.request_id = incoming_id
        else:
            request.request_id = str(uuid.uuid4())

        start_timer = time.monotonic()

        try:
            response = self.get_response(request)
        except Exception:
            logger.exception(
                "Request Failed",
                extra={
                    "request_id" : request.request_id
                }
            )
            raise

        end_timer = time.monotonic()
        elapsed_time = end_timer - start_timer
        elapsed_time_ms = elapsed_time * 1000
        
        response['X-Request-ID'] = request.request_id
        response['X-Response-Time-Ms'] = str(elapsed_time_ms)

        logger.info(
            "Request Completed",
            extra={
                "request_id" : request.request_id,
                "method" : request.method,
                "path" : request.path,
                "status" : response.status_code,
                "time_elapsed_ms" : elapsed_time_ms
            }
        )

        return response

        
        
        
    