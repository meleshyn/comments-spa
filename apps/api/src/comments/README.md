# Comments API Endpoints

## High-Performance Endpoints for Infinite Scroll & Lazy Loading

### 1. GET `/comments` - Root Comments with Pagination

**Purpose**: Fetch paginated root-level comments optimized for infinite scroll.

**Query Parameters**:

- `limit` (optional): Number of comments to fetch (1-100, default: 25)
- `cursor` (optional): UUID of the last comment from previous page
- `sortBy` (optional): `userName`, `email`, or `createdAt` (default: `createdAt`)
- `sortOrder` (optional): `asc` or `desc` (default: `desc`)

**Example Requests**:

```bash
# Get first 25 root comments
GET /comments

# Get next page using cursor
GET /comments?cursor=550e8400-e29b-41d4-a716-446655440000&limit=25

# Sort by username ascending
GET /comments?sortBy=userName&sortOrder=asc&limit=10
```

**Response Format**:

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "userName": "john_doe",
      "email": "john@example.com",
      "homePage": "https://johndoe.com",
      "text": "This is a root comment with <strong>formatting</strong>.",
      "parentId": null,
      "createdAt": "2025-09-18T10:00:00.000Z",
      "repliesCount": 5
    }
  ],
  "nextCursor": "550e8400-e29b-41d4-a716-446655440001"
}
```

### 2. GET `/comments/:id/replies` - Nested Replies

**Purpose**: Fetch direct replies to a specific comment for lazy loading.

**Path Parameters**:

- `id`: UUID of the parent comment

**Query Parameters**:

- `limit` (optional): Number of replies to fetch (1-100, default: 25)
- `cursor` (optional): UUID of the last reply from previous page

**Example Requests**:

```bash
# Get first 25 replies to a comment
GET /comments/550e8400-e29b-41d4-a716-446655440000/replies

# Get next page of replies
GET /comments/550e8400-e29b-41d4-a716-446655440000/replies?cursor=550e8400-e29b-41d4-a716-446655440010&limit=10
```

**Response Format**:

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "userName": "jane_smith",
      "email": "jane@example.com",
      "homePage": null,
      "text": "This is a reply to the root comment.",
      "parentId": "550e8400-e29b-41d4-a716-446655440000",
      "createdAt": "2025-09-18T10:05:00.000Z",
      "repliesCount": 2
    }
  ],
  "nextCursor": "550e8400-e29b-41d4-a716-446655440011"
}
```

## Performance Features

### ✅ **N+1 Query Prevention**

- `repliesCount` is calculated efficiently using SQL subqueries
- Single database query per request, regardless of comment count
- No separate queries for counting replies

### ✅ **Cursor-Based Pagination**

- Consistent performance regardless of page depth
- Handles real-time data changes gracefully
- More efficient than offset-based pagination

### ✅ **Optimized for Frontend**

- Perfect for infinite scroll implementation
- Supports lazy loading of nested threads
- Consistent response format for component reuse

### ✅ **Flexible Sorting**

- Multiple sort options for root comments
- Efficient cursor handling for all sort fields
- Chronological ordering for replies (newest first)
