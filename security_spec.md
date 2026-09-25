# Security Specification & Threat Model

## 1. Data Invariants
- **Auth Integrity:** Any user profile write to `/users/{userId}` must match `request.auth.uid == userId`.
- **Product & Inventory Integrity:** Only authorized roles (`owner` or `staff`) can create, update, or delete products, bales, categories, and suppliers.
- **Order Security:** Shoppers can read their own orders or public catalogue; owners and staff can update order status; orders must have valid positive amounts.
- **Financial Vault:** Only store `owner` role can access or write to `expenseAccounts`, `expenses`, and cash flow `transactions`.
- **ID Injection Guard:** All path variables must pass `isValidId()` (regex matching alphanumeric, underscores, hyphens) with size bounds.

## 2. Dirty Dozen Payloads
1. **Unauthenticated User Profile Hijack:** Anonymous write to `/users/victim_user` with altered role -> `PERMISSION_DENIED`
2. **Customer Overwriting Products:** Customer role attempting to delete or overwrite product price to 0 -> `PERMISSION_DENIED`
3. **Staff Altering Owner Financial Records:** Staff role attempting write to `/expenses` or `/transactions` -> `PERMISSION_DENIED`
4. **Order Amount Negative Manipulation:** Order created with `totalAmount: -9999` -> `PERMISSION_DENIED`
5. **Malicious Long ID Injection:** Document ID over 128 characters or containing illegal path characters -> `PERMISSION_DENIED`
6. **Customer Reading Other Customer Private Orders:** Customer accessing `/orders/{orderId}` where `customerId != request.auth.uid` -> `PERMISSION_DENIED`
7. **Bale Quantity Tampering:** Bale created with negative piece count or negative totalPrice -> `PERMISSION_DENIED`
8. **Unrestricted Batch Shadow Fields Injection:** Payload with unregistered internal keys like `__proto__` -> `PERMISSION_DENIED`
9. **Fake Inflow Creation:** Unauthenticated client attempting to add fake revenue inflow transactions -> `PERMISSION_DENIED`
10. **Expense Account Exfiltration:** Public read on financial budgets without owner authorization -> `PERMISSION_DENIED`
11. **Supplier Directory Deletion:** Customer attempting to purge supplier directory -> `PERMISSION_DENIED`
12. **Status Escalation Hack:** Non-staff altering order status directly to `completed` without fulfillment -> `PERMISSION_DENIED`

## 3. Test Runner Design
Validation tests assert that all 12 attack vectors are rejected by Firestore ABAC rules and result in `PERMISSION_DENIED`.
