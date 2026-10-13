import json
from decimal import Decimal
from unittest.mock import patch
from django.test import TestCase, override_settings, RequestFactory
from rest_framework.test import APITestCase, APIRequestFactory
from django.contrib.auth.models import User, Permission
from rest_framework import status
from .middleware import RequestMetricsMiddleware
from .models import Category, Product, ProductVarient, Review
from .tasks import check_low_stock

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

    def test_request_ids_different(self):
        response1 = self.client.get('/api/product/')
        response2 = self.client.get('/api/category/')
        self.assertNotEqual(response1['X-Request-ID'], response2['X-Request-ID'])

    def test_logs_reraise_exception(self):
        request = RequestFactory().get('/api/product/')
        def failing_view(request):
            raise ValueError('Test Exception')
        middleware = RequestMetricsMiddleware(failing_view)
        with self.assertLogs('request_metrics', level='ERROR'):
            with self.assertRaises(ValueError):
                middleware(request)



class StoreFeatures(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name='Electronics', slug='electronics')
        self.product = Product.objects.create(category=self.category, name='test product', description='for test purpose', price=Decimal(1000.00), stock=10)
        self.user = User.objects.create_user(username='testuser', password='test1234')
        self.other_user = User.objects.create_user(username='otheruser', password='other1234')

    def grant_permission(self, user, codename):
        permission = Permission.objects.get(content_type__app_label='store', codename=codename)
        user.user_permissions.add(permission)



class ProductManagementTest(StoreFeatures):
    def setUp(self):
        super().setUp()
        self.url = f'/api/product/{self.product.pk}/management/'

    def test_user_with_permission(self):
        self.grant_permission(self.user, 'change_product')
        self.client.force_authenticate(user=self.user)

        response = self.client.patch(self.url, {'name': 'updated product'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.product.refresh_from_db()
        self.assertEqual(self.product.name, 'updated product')

    def test_user_without_permission(self):
        self.client.force_authenticate(user=self.other_user)

        response = self.client.patch(self.url, {'name':'updated product'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.product.refresh_from_db()
        self.assertEqual(self.product.name, 'test product')

    def test_anonymous_user(self):
        response = self.client.patch(self.url, {'name':'updated product'}, format='json')
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
        self.product.refresh_from_db()
        self.assertEqual(self.product.name, 'test product')

    def test_missing_product(self):
        self.grant_permission(self.user, 'change_product')
        self.client.force_authenticate(user=self.user)

        response = self.client.patch('/api/product/999999/management/', {'name':'updated product'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

class ProductReviewTest(StoreFeatures):
    def setUp(self):
        super().setUp()
        self.list_url = f'/api/products/{self.product.pk}/review/'

    def review_payload(self, **overrides):
        payload = {
            'title' : 'Great Product',
            'review' : 'Works as expected',
            'rating' : 5
        }
        payload.update(overrides)
        return payload

    def test_authenticated_user(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.list_url, self.review_payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        review = Review.objects.get()
        self.assertEqual(self.user, review.user)
        self.assertEqual(self.product, review.product)

    def test_anonymous_user(self):
        response = self.client.post(self.list_url, self.review_payload(), format='json')
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
        self.assertEqual(Review.objects.count(), 0)

    def test_invalid_rating(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.list_url, self.review_payload(rating=6), format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Review.objects.count(), 0)

    def test_user_cannot_review_same_product_twice(self):
        Review.objects.create(product=self.product, user=self.user, title='first review', review='great product', rating=4)
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.list_url, self.review_payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Review.objects.count(), 1)

    def test_owner_can_edit_review(self):
        review = Review.objects.create(product=self.product, user=self.user, title='original review', review='great product', rating=4)
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(f'/api/review/{review.pk}/',{'title':'edited title'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        review.refresh_from_db()
        self.assertEqual(review.title, 'edited title')

    def test_another_user_cannot_edit_review(self):
        review = Review.objects.create(product=self.product, user=self.user, title='original review', review='great product', rating=4)
        self.client.force_authenticate(user=self.other_user)
        response = self.client.patch(f'/api/review/{review.pk}/',{'title':'unauthorized edit'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        review.refresh_from_db()
        self.assertEqual(review.title, 'original review')

    def test_nonexistent_product_review(self):
        response = self.client.get(f'/api/products/9999/review/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

class LowStockTest(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name='Test Category', slug='test-category')
        self.product = Product.objects.create(category=self.category, name='Test product', price=Decimal(100.00), stock=3)

    def test_low_stock_alert(self):
        result = check_low_stock.run(self.product.pk)
        self.assertEqual(result['status'], 'low_stock_alert')
        self.assertEqual(result['product_id'], self.product.pk)
        self.assertEqual(result['stock'], 3)

        self.product.refresh_from_db()
        self.assertTrue(self.product.low_stock_alert_sent)

    def test_already_alerted_product(self):
        Product.objects.filter(pk=self.product.pk).update(low_stock_alert_sent=True)
        result = check_low_stock.run(self.product.pk)
        self.assertEqual(result['status'], 'skipped')
        self.assertEqual(result['message'], 'Low Stock alert already sent')

    def test_after_stock_recovery(self):
        Product.objects.filter(pk=self.product.pk).update(low_stock_alert_sent=True, stock=10)
        result = check_low_stock.run(self.product.pk)
        self.assertEqual(result['status'], 'stock_normal')
        self.product.refresh_from_db()
        self.assertFalse(self.product.low_stock_alert_sent)

    def test_alert_can_trigger_after_recovery(self):
        Product.objects.filter(pk=self.product.pk).update(low_stock_alert_sent=True, stock=10)
        check_low_stock.run(self.product.pk)
        Product.objects.filter(pk=self.product.pk).update(stock=2)
        result = check_low_stock.run(self.product.pk)
        self.assertEqual(result['status'], 'low_stock_alert')
        self.product.refresh_from_db()
        self.assertTrue(self.product.low_stock_alert_sent)

    def test_nonexistent_product(self):
        result = check_low_stock.run(999)
        self.assertEqual(result['status'], 'Skipped')
        self.assertEqual(result['message'], 'Product does not exist')

    @patch('store.signals.check_low_stock.delay_on_commit')
    def test_new_product_schedules_stock_check_task(self, mock_task):
        product = Product.objects.create(category=self.category, name='product', price=Decimal(300.00), stock=25)
        mock_task.assert_called_once_with(product.pk)

class ProductVarientTest(StoreFeatures):
    def setUp(self):
        super().setUp()
        self.varient_url = f'/api/product/{self.product.pk}/varient/'

    def varient_payload(self, **overrides):
        payload = {
            'product':self.product.pk, 
            'sku':'PHONE-BLACK-128',
            'attributes':{
                'color':'black',
                'storage':'128GB'
            },
            'price': '1200.00',
            'stock': 5,
            'active':True
        }

        payload.update(overrides)
        return payload

    def create_varient(self, **overrides):
        attributes = overrides.pop('attributes',{'color':'black', 'storage':'128GB'})
        payload = self.varient_payload(attributes=attributes, **overrides)
        combination_key = json.dumps(dict(sorted(attributes.items())), separators=(',', ':'))
        return ProductVarient.objects.create(
            product=self.product,
            sku=payload['sku'],
            attributes=attributes,
            combination_key=combination_key,
            price=Decimal(payload['price']),
            stock=payload['stock'],
            active=payload['active']
        )

    def authorized_varient_write(self):
        self.grant_permission(self.user, 'change_productvarient')
        self.client.force_authenticate(user=self.user)

    def test_authorized_user_can_create_varient(self):
        self.authorized_varient_write()
        response = self.client.post(self.varient_url, self.varient_payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(ProductVarient.objects.filter(product=self.product, sku='phone-black-128').exists())

    def test_duplicate_sku_rejected(self):
        self.create_varient(sku='phone-black-128')
        self.authorized_varient_write()
        response = self.client.post(self.varient_url, self.varient_payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_duplicate_attribute_rejected_even_order_reversed(self):
        self.create_varient(sku='phone-black-128', attributes={'color':'black', 'storage':'128GB'})
        self.authorized_varient_write()
        response = self.client.post(self.varient_url, self.varient_payload(sku='phone-black-128', attributes={'storage':'128GB','color':'black'}), format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_attributes(self):
        self.authorized_varient_write()
        invalid_varient = (
            ('empty-attributes', {}),
            ('unsupported-attribute', {'material': 'leather'}),
            ('empty-value', {'color': ' '}),
        )

        for sku, attributes in invalid_varient:
            with self.subTest(attributes=attributes):
                response = self.client.post(self.varient_url, self.varient_payload(sku=sku, attributes=attributes), format='json')
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_without_permission(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.varient_url, self.varient_payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_sku_filter_case_insensitive(self):
        self.create_varient(sku='filter-match')
        self.create_varient(sku='filter-other', attributes={'color':'white'})
        response = self.client.get(self.varient_url,{'sku':'FILTER-MATCH'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'],1)
        self.assertEqual(response.data['results'][0]['sku'], 'filter-match')

    def test_varient_can_be_retrieved(self):
        varient = self.create_varient()
        response = self.client.get(f'/api/varient/{varient.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], varient.pk)

class HealthEndPointTest(APITestCase):
    def test_liveness_returns_200(self):
        response = self.client.get(f'/api/health/live/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {'status':'ok'})

    def test_readiness_returns_200_when_database_is_available(self):
        response=self.client.get(f'/api/health/ready/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {'status':'ready'})



