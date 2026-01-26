
# LiveKit Integration Guide (Korean)

이 프로젝트는 LiveKit을 사용하여 실시간 화상 회의 기능을 구현하고 있으며, 회의 시작 시 백엔드와 세션 정보를 동기화하는 로직이 포함되어 있습니다.

## 1. 개요
사용자가 '회의 참가' 버튼을 누르면:
1. 클라이언트가 LiveKit Room에 접속합니다.
2. 접속이 완료되면(`connected` 상태), LiveKit 서버로부터 `Session ID` (SID)를 획득합니다.
3. 획득한 `Room ID`와 `Session ID`를 사용하여 백엔드 API (`POST /meeting/{room_id}/live-sessions/{session_id}`)를 호출합니다.
4. 이 과정을 통해 백엔드는 현재 활성화된 라이브 세션을 인지하고, 이후 번역/전사 등의 서비스를 연동할 준비를 합니다.

## 2. 상세 구현 방식

### A. API 클라이언트 (`src/app/api/meeting.ts`)
백엔드와의 통신을 위한 API 메서드가 정의되어 있습니다.

```typescript
export const meetingApi = {
  startLiveSession: async (roomId: string, sessionId: string) => {
    return apiClient.post(\`/meeting/\${roomId}/live-sessions/\${sessionId}\`);
  },
};
```

### B. 회의 화면 로직 (`src/app/pages/ActiveMeeting.tsx`)
LiveKit 훅(`useRoomContext`)을 사용하여 룸 상태를 감지하고, 접속 완료 시 API를 호출합니다.

```typescript
// ActiveMeetingContent 컴포넌트 내부
const room = useRoomContext();

useEffect(() => {
  // Room 객체가 있고, 연결 상태가 'connected'일 때만 실행
  if (room && room.state === 'connected' && meetingId) {
    const sessionId = room.sid; // LiveKit Session ID 추출
    
    // 백엔드 API 호출
    meetingApi.startLiveSession(meetingId, sessionId)
      .then(response => {
        console.log('✅ Live Session started:', response);
        // 성공 시 알림 또는 추가 로직
      })
      .catch(error => {
        console.error('❌ Failed to start live session:', error);
      });
  }
}, [room, room?.state, meetingId]);
```

### C. 로깅 (PowerShell 출력)
`src/app/api/client.ts`의 Axios Interceptor에서 모든 요청/응답 데이터를 Electron의 Main Process로 전송하여, 터미널(PowerShell)에서 확인할 수 있도록 설정되어 있습니다.

- **Request Log**: URL, Headers, Body 등 포함
- **Response Log**: Status Code, Response Data 등 포함

이 로그는 디버깅 및 백엔드 연동 확인 용도로 사용됩니다.
