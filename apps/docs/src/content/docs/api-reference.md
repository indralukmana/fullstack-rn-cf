---
title: API reference
description: Scaffold HTTP surface
---

| Method | Path          | Notes                            |
| ------ | ------------- | -------------------------------- |
| GET    | `/health`     | Liveness                         |
| GET    | `/api/me`     | Current user or `{ user: null }` |
| \*     | `/api/auth/*` | Better Auth handler              |
| GET    | `/doc`        | OpenAPI JSON                     |
| GET    | `/scalar`     | Scalar UI                        |
