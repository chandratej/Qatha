# Katha Story Versioning API

Storage-agnostic domain API. Clients never see Git, Firestore, blobs, or hashes.

Base: `/api/versions` (Bearer auth required)

## Domain concepts

| Term | Meaning |
|------|---------|
| Version | Immutable creative milestone |
| Checkpoint | Auto or manual snapshot |
| Restore | Creates a **new** version from an older one (history kept) |
| Timeline | Chronological list of versions |
| Draft / Published | Version types |

## Endpoints

### Create version
`POST /api/versions`

```json
{
  "story_id": "uuid",
  "chapter_id": "1",
  "version_type": "Manual | AutoCheckpoint | Publish | Draft",
  "version_name": "Before rewrite",
  "content": {
    "title": "Chapter 1",
    "scenes": [{ "id": "s1", "title": "Opening", "content": "<p>…</p>" }],
    "plainContent": "optional flat html",
    "contentDelta": {}
  },
  "force": false
}
```

### List versions
`GET /api/versions?story_id=&chapter_id=&limit=&offset=`

### Timeline
`GET /api/versions/timeline?story_id=&chapter_id=`

### Get one
`GET /api/versions/:versionId`

### Restore (immutable history)
`POST /api/versions/:versionId/restore`  
Body: `{ "version_name": "optional" }`  
Creates a **new** version with `status: Restored` and `restored_from_id`.

### Archive
`DELETE /api/versions/:versionId`  
Soft-archives (`status: Archived`).

## Future (501 in MVP1)

- `createBranch` / `mergeBranch` / `compareVersions`

## Architecture

```
Presentation (CMS UI)
        ↓
Application (VersionService)
        ↓
IVersionStorage  ← Memory | Document (Supabase table) | future Firestore/Git
```

## Sequence: Restore

1. Client calls `POST .../restore`
2. Service loads source version (immutable)
3. Service allocates next `version_number`
4. Service saves new snapshot with copied content + `Restored`
5. Client applies content to editor
6. Timeline now shows both original and restored entries

## Auto checkpoints

Configurable via env:

- `VERSION_MIN_INTERVAL_MS` (default 60000)
- `VERSION_SIGNIFICANT_EDIT_CHARS` (default 200)
- `VERSION_MAX_PER_CHAPTER` (default 100)

Triggers (product rules): story/chapter create, publish, draft save, manual save, interval.
