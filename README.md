# Progressions Backend

## Public API

### Collections Endpoints
#
Retrieves all public collections.
---
`GET /api/v1/collections/`

Response body:
```json
{
    "collections": [

        {
             "_id": string,
            "title": string,
            "downvotes": number,
            "upvotes": number,
            "user": string,
            "entry_type": < "collection" or "progression" >,
            "entries": [
                {
                    "_id": string,
                    "title": string,
                    "downvotes": number,
                    "upvotes": number,
                    "user": string,
                    "parent_collection_id": string,
                    "entry_type": < "collection" or "progression" >,
                    "entries": [
                        {
                            "_id": string,
                            "title": string,
                            "downvotes": number,
                            "upvotes": number,
                            "user": string,
                            "song": NOT IMPLEMENTED,
                            "artist": NOT IMPLEMENTED,
                            "root": 9,
                            "mode": < "major" or "minor" >,
                            "parent_collection_id": string,
                        },
                        {
                            "_id": string,
                            "title": string,
                            "downvotes": number,
                            "upvotes": number,
                            "user": string,
                            "song": NOT IMPLEMENTED,
                            "artist": NOT IMPLEMENTED,
                            "root": 9,
                            "mode": < "major" or "minor" >,
                            "parent_collection_id": string,
                        }
                    ]
                }
            ]
        .
        .
        .
    ]
}
```

Deletes a user's collection if logged in
-
`DELETE /api/v1/collections/:id`

Creates an entry in the specified collection
-
`POST /api/v1/collections/:id`
