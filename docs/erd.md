# Database Schema (Conceptual ERD)

## Entities

- `Client`
- `Project`
- `Item`
- `Booking`
- `Transaction`
- `Payment`
- `Deposit`
- `Staff`
- `Loyalty`

## Relationships

- One `Client` -> many `Project`
- One `Client` -> many `Booking`
- One `Client` -> many `Transaction`
- One `Client` -> many `Payment`
- One `Client` -> many `Deposit`
- One `Transaction` -> many transaction line items (`items[]`)

## Suggested Key Fields

### Client
- `id` (PK)
- `name`
- `mobile`
- `email`
- `address`
- `loyaltyPoints`

### Project
- `id` (PK)
- `clientId` (FK -> Client.id)
- `name`
- `location`
- `status`

### Item
- `id` (PK)
- `name`
- `rentalType`
- `rate`
- `stock`

### Transaction
- `id` (PK)
- `clientId` (FK -> Client.id)
- `type` (`IN`/`OUT`)
- `invoiceNo`
- `date`
- `grandTotal`
- `items[]`

### Payment
- `id` (PK)
- `clientId` (FK -> Client.id)
- `receiptNo`
- `amount`
- `mode`
- `date`

### Deposit
- `id` (PK)
- `clientId` (FK -> Client.id)
- `amount`
- `status`
- `date`

