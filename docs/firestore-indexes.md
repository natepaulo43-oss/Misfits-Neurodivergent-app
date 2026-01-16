# Firestore Index Requirements

## Required Composite Indexes

### Sessions Collection

For mentor availability checking and session queries:

```
Collection: sessions
Fields:
  - mentorId (Ascending)
  - requestedStart (Ascending)
```

This index supports queries like:
```typescript
query(
  sessionsCollection,
  where('mentorId', '==', mentorId),
  orderBy('requestedStart', 'asc')
)
```

### Users Collection

Already indexed by default:
- `role` (for fetching mentors)
- `pendingRole` (for admin mentor applications)

## How to Add Indexes

### Option 1: Firebase Console
1. Go to Firebase Console → Firestore Database → Indexes
2. Click "Create Index"
3. Add the fields listed above
4. Set query scope to "Collection"

### Option 2: firestore.indexes.json
Create a `firestore.indexes.json` file in your project root:

```json
{
  "indexes": [
    {
      "collectionGroup": "sessions",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "mentorId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "requestedStart",
          "order": "ASCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Then deploy with:
```bash
firebase deploy --only firestore:indexes
```

## Performance Notes

- The matching system fetches all approved mentors once per session
- Availability checks are batched in parallel for all mentors
- Local matching computation is O(n) where n = number of mentors
- Results are memoized per student session (no repeated computation on same data)

## Query Optimization

Current approach:
1. Fetch all mentors with `role === 'mentor'` (single query)
2. Filter client-side for `mentorProfile` existence
3. Batch check availability for all mentors in parallel
4. Compute matches locally (deterministic, no API calls)

This approach minimizes Firestore reads and avoids N+1 query problems.
