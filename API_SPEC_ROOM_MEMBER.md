# Room Member Management API Specification

프론트엔드에서 룸 멤버 관리 기능을 위해 사용하는 REST API 명세입니다.

---

## 1. 룸 상세 정보 조회

### Endpoint
```
GET /rooms/{room_id}
```

### Request
**Path Parameters:**
- `room_id` (string, required): 조회할 룸의 고유 ID

**Headers:**
```
Authorization: Bearer {access_token}
```

### Response

**Success Response (200 OK):**
```json
{
  "id": "room_123",
  "name": "디자인 프로젝트 팀",
  "members": [
    {
      "id": "user_1",
      "name": "홍길동",
      "status": "online",
      "locale": "kr"
    },
    {
      "id": "user_2",
      "name": "김철수",
      "status": "offline",
      "locale": "ja"
    },
    {
      "id": "user_3",
      "name": "John Smith",
      "status": "online",
      "locale": "en"
    }
  ],
  "participant_count": 3
}
```

**Error Responses:**
- `401 Unauthorized`: 인증 토큰이 유효하지 않음
- `404 Not Found`: 존재하지 않는 룸 ID

---

## 2. 룸에 멤버 추가

### Endpoint
```
POST /rooms/{room_id}/members
```

### Request

**Path Parameters:**
- `room_id` (string, required): 멤버를 추가할 룸의 고유 ID

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body (JSON):**
```json
{
  "email": "member@example.com"
}
```

### Response

**Success Response (201 Created):**
```json
{
  "id": "user-uuid-123",
  "name": "홍길동",
  "locale": "kr"
}
```

**Error Responses:**

- **404 Not Found**: 이메일에 해당하는 사용자가 존재하지 않거나, 존재하지 않는 룸 ID
  ```json
  {
    "detail": "User with email 'member@example.com' not found"
  }
  ```

- **409 Conflict**: 이미 룸에 존재하는 멤버
  ```json
  {
    "detail": "User is already a member of this room"
  }
  ```

- **403 Forbidden**: 멤버를 추가할 권한이 없음 (방장이 아닌 경우 등)
  ```json
  {
    "detail": "You do not have permission to add members to this room"
  }
  ```

- **401 Unauthorized**: 인증 토큰이 유효하지 않음
  ```json
  {
    "detail": "Invalid or expired token"
  }
  ```

---

## Field Descriptions

### RoomMember Object
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | 사용자 고유 ID (UUID) |
| `name` | string | Yes | 사용자 이름 |
| `status` | string | Yes | 온라인 상태 (`"online"` 또는 `"offline"`) |
| `locale` | string | No | 사용자 언어/지역 코드 (예: `"kr"`, `"ja"`, `"en"`) |

### RoomDetail Object
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | 룸 고유 ID |
| `name` | string | Yes | 룸 이름 |
| `members` | RoomMember[] | Yes | 룸에 속한 멤버 목록 |
| `participant_count` | number | Yes | 총 멤버 수 |

---

## Notes

1. **로케일(locale) 필드**: 프론트엔드에서는 이 값을 기반으로 국기 아이콘을 표시합니다.
   - `"kr"` 또는 `"ko"` → 🇰🇷 한국
   - `"ja"` 또는 `"jp"` → 🇯🇵 일본
   - `"en"` 또는 `"us"` → 🇺🇸 미국
   - 기타/없음 → 🌐 글로벌

2. **멤버 추가 흐름**:
   - 사용자가 이메일 입력
   - 프론트엔드에서 이메일 유효성 검사 (형식 체크)
   - API 호출
   - 성공 시 멤버 목록에 즉시 반영

3. **에러 처리**: 프론트엔드에서는 HTTP 상태 코드를 기반으로 적절한 에러 메시지를 사용자에게 표시합니다.
