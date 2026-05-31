// TTL index: GridFS files expire after 28 days
db.getCollection("fs.files").createIndex(
    { uploadDate: 1 },
    { expireAfterSeconds: 2419200 }
);
