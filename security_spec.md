# REFILL+ Firestore Security Specification

## 1. Data Invariants
1. **Strict Ownership & PII Isolation**: A customer can only read, create, update, or delete their own `/users/{userId}`, `/cart_items/{cartItemId}`, `/addresses/{addressId}`, `/orders/{orderId}`, `/orders/{orderId}/order_items/{itemId}`, and `/payments/{paymentId}` records where `userId == request.auth.uid`.
2. **Privilege Escalation Prevention**: Users registering or updating `/users/{userId}` are strictly forbidden from self-assigning `role: "admin"` (`incoming().role == 'customer'` on create; `role` is immutable by non-admins on update). Only verified admins in `/admins/{uid}` or the bootstrapped admin email (`aprajita.0251mba469@dgu.ac.in` with `email_verified == true`) hold administrative privileges.
3. **Catalog & Settings Integrity**: `/products/{productId}` and `/settings/{settingId}` are publicly readable for storefront browsing, but writable exclusively by verified admins.
4. **Order State & Payment Protection**: Customers can create orders in `Order Placed` status and can only cancel their own order when it has not yet reached `Out for Delivery` or `Delivered`. Customers cannot mark their own `paymentStatus` as `paid_verified` or mutate `totalAmount`, `status` (except `Cancelled` from early stages), or `orderNumber`.
5. **Master Gate on Subcollections**: `/orders/{orderId}/order_items/{itemId}` verifies parent `/orders/{orderId}` ownership (`get(...).data.userId == request.auth.uid`) or `existsAfter` during atomic batch creation.
6. **Temporal Integrity & Size Bounds**: Every string field is length-bounded, every document ID passes `isValidId()`, and `createdAt`/`updatedAt` timestamps must equal `request.time`.

## 2. The "Dirty Dozen" Attack Payloads (All Must Return PERMISSION_DENIED)
1. **Self-Admin Registration**: Creating `/users/{uid}` with `role: "admin"`.
2. **Role Escalation Update**: Updating `/users/{uid}` changing `role` from `"customer"` to `"admin"`.
3. **Cross-User Order Read/List**: User A attempting to `get` or `list` `/orders` belonging to User B.
4. **Shadow Field Injection**: Creating a `/cart_items/{id}` document with an extra ghost key `discountOverride: 999`.
5. **Client-Spoofed Payment Confirmation**: Customer creating an `/orders/{id}` or `/payments/{id}` with `paymentStatus: "paid_verified"` without admin verification.
6. **Unauthorized Product Price Tampering**: Non-admin attempting to `update` `/products/handwash` to set `price500ml: 1`.
7. **Unverified Email Spoof**: Request with `email: "aprajita.0251mba469@dgu.ac.in"` and `email_verified: false` attempting admin write.
8. **Path ID Poisoning**: Creating a document with ID exceeding 128 characters or containing spaces/slashes (`"bad id!@#"`).
9. **Terminal Order Mutation**: Customer attempting to update an order whose existing `status` is `"Delivered"` back to `"Cancelled"`.
10. **Immortal Timestamp Tampering**: Client attempting to backdate `createdAt` or `updatedAt` to a past client timestamp instead of `request.time`.
11. **Orphaned Order Item Write**: Writing `/orders/nonexistent_order/order_items/item1` where parent order does not exist or belongs to another user.
12. **Blanket User List Scraping**: Non-admin customer attempting to `list` `/users` collection to harvest student phone numbers and emails.
