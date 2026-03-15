# API Changelog

All notable changes to the Ventura Backend Service API are documented here.

---

## [1.2.0] — 2026-03-15

### Added
- **`/dashboard/summary`** — New endpoint returning comprehensive business analytics: revenue, tax breakdown (Ghana VAT/NHIL/GETFund), order stats, customer counts, alerts (pending orders, out-of-stock products, overdue invoices), top performers, recent activity timeline, and cancellation analytics.
- **`/audit/entity/{entity}/{entityId}`** — Retrieve all audit logs for a specific entity record.
- **`/audit/user/{userId}`** — Retrieve all audit logs performed by or related to a user.
- **`/audit/actions`** — Retrieve all audit logs filtered by action type (`CREATE`, `UPDATE`, `DELETE`, `LOGIN`, etc.).
- **`/customers/import`** — Bulk import multiple customers for a business in a single request.
- New schemas: `AuditLog`, `DashboardSummary`, `ImportCustomersDto`, `ImportCustomerItemDto`, `UpdateCustomerDto`.

### Fixed
- **`Invoice` schema** — Added missing fields: `invoiceType` (`STANDARD` | `PROFORMA` | `RECEIPT`), `customerName`, `customerEmail`, `customerPhone`, `issueDate`, `paymentDate`.
- **`Order` schema** — Added missing customer snapshot fields: `customerName`, `customerEmail`, `customerPhone`.
- **`CreateInvoiceDto`** — Added optional `invoiceType` field (defaults to `STANDARD`).
- **`CreateAppointmentDto`** — Removed incorrect `userId` field; added optional `customerId`. Fixed `required` array.
- **`UpdateAppointmentDto`** — Removed incorrect `userId` from required fields; added optional `customerId`. Updated required fields to match DTO.
- **`/auth/resend-code`** — Request body field corrected from `email` to `id` (user ID from signup response).
- **`/auth/verify-code`** — Added required `shortToken` field to request body.
- **`/invoices/{id}/payment`** — `paymentDate` is now correctly marked as optional.

---

## [1.1.0] — 2026-01-10

### Added
- Invoice type support: `STANDARD`, `PROFORMA`, `RECEIPT` enum values in invoice endpoints.
- Customer snapshot fields (`customerName`, `customerEmail`, `customerPhone`) stored on orders and invoices at creation time for historical accuracy.
- Bulk customer import via `/customers/import`.
- Audit resource module with event-driven logging across all entity types.
- Dashboard analytics module.
- Email duplication check during customer creation and update within the same business.

---

## [1.0.0] — 2025-11-01

### Added
- Initial OpenAPI 3.0 documentation.
- **Authentication** — Google OAuth (web + mobile), email/password signin, signup, email verification, password reset, logout, token refresh.
- **Users** — Get user, update profile, change password, reset password, delete user.
- **Business** — Create, find (by owner or ID), update business.
- **Customers** — Create, find (single or paginated), update, delete customer.
- **Appointments** — Create, get by user, get by business, update, update Google event ID, delete appointment. Recurring appointment support.
- **Orders** — Create, list, search (with filters), get stats, get by customer, get by ID, update status.
- **Invoices** — Create, list, get by customer, get by ID, update payment info, update status. Ghana VAT (15%), NHIL (2.5%), GETFund (2.5%) tax calculations.
- **Resources** — Create/update/delete products and services, search, find by type.
- **Mailer** — Send email endpoint.
- **Assets** — Image upload to cloud storage (max 10 MB, JPEG/PNG/GIF/WebP).

---

## Enum Reference

### InvoiceType
| Value | Description |
|-------|-------------|
| `STANDARD` | Standard invoice (default) |
| `PROFORMA` | Proforma/quote invoice |
| `RECEIPT` | Receipt after payment |

### InvoiceStatus
| Value | Description |
|-------|-------------|
| `DRAFT` | Created but not sent |
| `SENT` | Sent to customer |
| `PAID` | Fully paid |
| `PARTIALLY_PAID` | Partially paid |
| `OVERDUE` | Past due date |
| `CANCELLED` | Cancelled |

### PaymentMethod
`CASH` · `MOBILE_MONEY` · `BANK_TRANSFER` · `CARD` · `CHEQUE`

### OrderStatus
`pending` · `completed` · `cancelled`

### AuditEntity
`USER` · `BUSINESS` · `APPOINTMENT` · `CUSTOMER` · `ORDER` · `ORDER_ITEM` · `INVOICE` · `PRODUCT` · `SERVICE` · `MAIL` · `RESOURCE` · `STORAGE` · `AUTH`

### AuditAction
`CREATE` · `READ` · `UPDATE` · `DELETE` · `LOGIN` · `LOGOUT` · `EXPORT` · `IMPORT` · `RESTORE` · `ARCHIVE` · `SEND` · `APPROVE` · `REJECT` · `CANCEL`
