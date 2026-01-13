# Order Search and Statistics API

## Overview

Added advanced search and analytics features to the order management system, following the same patterns used in the resource search implementation.

## New Endpoints

### 1. Search Orders

**Endpoint:** `GET /orders/search`

**Query Parameters:**

- `businessId` (required): UUID of the business
- `q` (required): Search query - searches order numbers and customer names
- `filters` (optional): 'on' or 'off' to enable/disable additional filters
- `startDate` (optional, requires filters='on'): ISO date string for date range start
- `endDate` (optional, requires filters='on'): ISO date string for date range end
- `minTotal` (optional, requires filters='on'): Minimum order total amount
- `maxTotal` (optional, requires filters='on'): Maximum order total amount
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Items per page (default: 10)

**Example Request:**

```
GET /orders/search?businessId=123e4567-e89b-12d3-a456-426614174000&q=ORD-&filters=on&minTotal=100&maxTotal=1000&page=1&limit=20
```

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "orderNumber": "ORD-12345678",
      "status": "COMPLETED",
      "totalAmount": "250.00",
      "createdAt": "2024-01-15T10:30:00Z",
      "customer": {
        "id": "uuid",
        "name": "John Doe"
      },
      "items": [
        {
          "id": "uuid",
          "itemType": "PRODUCT",
          "name": "Widget",
          "price": "50.00",
          "quantity": 5,
          "subTotal": "250.00"
        }
      ]
    }
  ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

**Features:**

- Full-text search on order numbers (case-insensitive)
- Customer name search (case-insensitive)
- Date range filtering
- Amount range filtering
- Pagination support
- Includes customer and order items in response

---

### 2. Get Order Statistics

**Endpoint:** `GET /orders/stats`

**Query Parameters:**

- `businessId` (required): UUID of the business
- `startDate` (optional): ISO date string for analysis period start
- `endDate` (optional): ISO date string for analysis period end

**Example Request:**

```
GET /orders/stats?businessId=123e4567-e89b-12d3-a456-426614174000&startDate=2024-01-01&endDate=2024-01-31
```

**Response:**

```json
{
  "totalRevenue": 15420.5,
  "orderCountByStatus": {
    "PENDING": 5,
    "COMPLETED": 42,
    "CANCELLED": 3
  },
  "avgOrderValue": 367.15,
  "topItems": [
    {
      "name": "Premium Widget",
      "type": "PRODUCT",
      "orderCount": 25,
      "revenue": 5000.0
    },
    {
      "name": "Installation Service",
      "type": "SERVICE",
      "orderCount": 18,
      "revenue": 3600.0
    }
  ]
}
```

**Metrics Provided:**

- **totalRevenue**: Sum of all order totals in the period
- **orderCountByStatus**: Breakdown of orders by status (PENDING, COMPLETED, CANCELLED)
- **avgOrderValue**: Average order amount
- **topItems**: Top 10 products/services by revenue
  - Includes order count and total revenue per item
  - Shows both products and services

---

## Implementation Details

### DTOs Created

1. **SearchOrdersQueryDto** ([search-orders-query.dto.ts](../src/order/dto/search-orders-query.dto.ts))
   - Uses `@ValidateIf` for conditional validation
   - Filters only validated when `filters='on'`
   - Type transformations for numeric query params

2. **GetOrderStatsQueryDto** ([get-order-stats-query.dto.ts](../src/order/dto/get-order-stats-query.dto.ts))
   - Simple date range parameters
   - All filters optional for business-wide stats

### Service Methods

**searchOrders** ([order.service.ts](../src/order/order.service.ts))

- Uses TypeORM QueryBuilder for complex queries
- ILIKE operator for case-insensitive search
- Joins customer table for name search
- Left joins on order items, products, and services
- Supports pagination

**getOrderStats** ([order.service.ts](../src/order/order.service.ts))

- Parallel execution with `Promise.all` for performance
- Aggregate queries for totals and averages
- Group by for status breakdown
- Top items sorted by revenue
- Type-safe raw query result handling

### Route Ordering

Routes are ordered from most specific to least specific to avoid conflicts:

1. `POST /orders` - Create order
2. `GET /orders/search` - Search orders
3. `GET /orders/stats` - Get statistics
4. `GET /orders/customer/:customerId` - Customer orders
5. `GET /orders` - List all orders (with filters)
6. `GET /orders/:id` - Get specific order
7. `PATCH /orders/:id/status` - Update status

## Pattern Consistency

This implementation follows the exact same patterns as the resource search:

- Conditional validation with `@ValidateIf`
- Filters toggle ('on'/'off')
- Type transformations for query params
- Pagination support
- QueryBuilder for complex searches
- Promise.all for parallel queries

## Next Steps

To use these endpoints:

1. Run the pending migrations: `pnpm migration:run`
2. Test the search endpoint with various filters
3. Verify stats calculation with sample data
4. Consider adding:
   - Export functionality for search results
   - More granular date grouping (daily/weekly/monthly)
   - Customer lifetime value metrics
   - Product category analysis
