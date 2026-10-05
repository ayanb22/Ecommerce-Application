from django.test import TestCase

class RequestMetricsMiddlewareTest(TestCase):
    def test_response_request_header(self):
        response = self.client.get('/api/product/')
        self.assertIn('X-Request-ID', response)
        self.assertIn('X-Response-Time-Ms', response)

    def test_generates_request_id(self):
        response = self.client.get('/api/category/')
        request_id = response['X-Request-ID']
        self.assertTrue(request_id)

    def test_accept_valid_request(self):
        custom_id = 'my-test-request-123'
        response = self.client.get('/api/product/', HTTP_X_REQUEST_ID=custom_id)
        self.assertEqual(response['X-Request-ID'], custom_id)

    def test_reject_invalid_client_id(self):
        invalid_id = 'my test request 123'
        response = self.client.get('/api/cart/', HTTP_X_REQUEST_ID=invalid_id)
        self.assertNotEqual(response['X-Request-ID'], invalid_id)
