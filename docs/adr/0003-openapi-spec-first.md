# Spec-first OpenAPI in a neutral api/ directory

The OpenAPI contract lives in `api/openapi.yaml`, owned by neither the backend nor the frontend. The backend generates its controller interfaces from the spec using openapi-generator; the Angular frontend generates its TypeScript HTTP client from the same spec. Neither side can accidentally drift the contract — changes to the API require an explicit change to the spec first.

This is intentionally more upfront work than code-first (where springdoc-openapi generates the spec from annotations), but it keeps the contract honest and prevents the spec from becoming a documentation afterthought.
