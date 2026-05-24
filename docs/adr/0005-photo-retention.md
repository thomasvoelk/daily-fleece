# Photos auto-expire after 4 weeks via MongoDB TTL index

Quiz photos (two per daily session) are stored in MongoDB GridFS with a TTL index that deletes them automatically after 28 days. We do not want to store photos indefinitely — the storage cost and data sprawl are not justified for what is essentially a fun daily activity artifact.

Four weeks was chosen as a balance between having enough history to look back at recent sessions and keeping storage clean. The TTL can be adjusted without a code change (it is a MongoDB index configuration).
