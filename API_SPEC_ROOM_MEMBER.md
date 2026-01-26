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
  
  *사용자를 찾을 수 없는 경우:*
  ```json
  {
    "detail": "User with email 'member@example.com' not found"
  }
  ```
  
  *룸을 찾을 수 없는 경우:*
  ```json
  {
    "detail": "Room with id 'room_123' not found"
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

- **422 Validation Error**: 요청 데이터 유효성 검사 실패
  ```json
  {
    "detail": [
      {
        "loc": ["body", "email"],
        "msg": "value is not a valid email address",
        "type": "value_error.email"
      }
    ]
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

4. **개발 환경 프록시 설정**: 
   - 프론트엔드 개발 서버(Vite)에서 `/rooms` 경로를 백엔드로 프록시하도록 설정되어 있어야 합니다.
   - `vite.config.ts`에 다음 설정 필요:
     ```typescript
     server: {
       proxy: {
         '/rooms': {
           target: 'http://localhost:8000',  // 백엔드 서버 주소
           changeOrigin: true,
         },
       }
     }
     ```
   - 이 설정이 없으면 `/rooms` API 요청이 프론트엔드 서버로 가서 404 에러가 발생합니다.

---

## Troubleshooting

### 404 에러가 발생하는 경우

**증상**: `POST /rooms/{room_id}/members` 호출 시 404 에러 발생

**원인 파악**:
1. 응답 본문의 `detail` 필드를 확인하여 정확한 원인 파악
   - `"User with email '...' not found"` → 해당 이메일의 사용자가 시스템에 등록되지 않음
   - `"Room with id '...' not found"` → 룸 ID가 잘못되었거나 삭제됨

**해결 방법**:
- **사용자가 없는 경우**: 
  - 입력한 이메일이 정확한지 확인
  - 해당 사용자가 먼저 회원가입을 완료했는지 확인
  - 백엔드 DB에서 해당 이메일의 사용자 존재 여부 확인

- **룸이 없는 경우**:
  - `GET /rooms/{room_id}`를 먼저 호출하여 룸이 존재하는지 확인
  - 룸 ID가 URL 인코딩되었는지 확인

### 디버깅 체크리스트

1. ✅ Authorization 헤더에 유효한 Bearer 토큰이 포함되어 있는지 확인
2. ✅ 이메일 형식이 올바른지 확인 (RFC 5322 표준)
3. ✅ 룸 ID가 올바른 UUID 형식인지 확인
4. ✅ 백엔드 로그에서 상세한 에러 메시지 확인
5. ✅ 네트워크 탭에서 요청/응답 전체 내용 확인

### 프론트엔드 에러 처리 예제

```typescript
try {
  const result = await roomApi.addMember(roomId, email);
  // 성공 처리
} catch (error: any) {
  if (error.response?.status === 404) {
    const detail = error.response?.data?.detail || '';
    if (detail.includes('User')) {
      toast.error('해당 이메일의 사용자를 찾을 수 없습니다.');
    } else if (detail.includes('Room')) {
      toast.error('룸을 찾을 수 없습니다.');
    } else {
      toast.error('사용자 또는 룸을 찾을 수 없습니다.');
    }
  } else if (error.response?.status === 409) {
    toast.error('이미 룸에 존재하는 멤버입니다.');
  } else {
    toast.error('멤버 추가에 실패했습니다.');
  }
}
```
