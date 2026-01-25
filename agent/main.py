import asyncio
import logging
import json
import os
import websockets
from dotenv import load_dotenv

# LiveKitのSDKとOpenAIプラグインのインポート
from livekit import agents, rtc
from livekit.agents import JobContext, WorkerOptions, stt, cli
from livekit.plugins import openai

# 環境変数の読み込み (.env)
load_dotenv()
# ログレベルの設定
logging.basicConfig(level=logging.INFO)

# バックエンドのWebSocket URL
# ブラウザと同じパス構成にする (ws://localhost:8000/meeting/...)
BACKEND_WS_URL = os.getenv("BACKEND_WS_URL", "ws://localhost:8000/meeting")

async def entrypoint(ctx: JobContext):
    # 1. 自動購読をONにして接続
    await ctx.connect(auto_subscribe=agents.AutoSubscribe.AUDIO_ONLY)
    
    print(f"\n>>> ✅ Room '{ctx.room.name}' に接続しました！")
    print(">>> 🎤 音声を待機中... 話しかけてみてください (Ctrl+Cで終了)\n")

    # STT（音声認識）エンジンの初期化
    stt_provider = openai.STT()

    # バックエンドへのWebSocket接続を管理
    # Room名 = Session IDと仮定して接続するが、
    # LiveKitの部屋名(数値)とバックエンドのSessionID(ls_...)が異なる場合に対応するため
    # 環境変数 TARGET_SESSION_ID で上書き可能にする
    env_session_id = os.getenv("TARGET_SESSION_ID")
    if env_session_id:
        session_id = env_session_id
        print(f">>> 🔄 Session ID Overridden by env: {session_id} (Room Name was: {ctx.room.name})")
    else:
        session_id = ctx.room.name

    
    # トークン生成 (バックエンドの認証用)
    import jwt
    import datetime
    
    # 【重要】キーをハードコードして確実に一致させる
    secret_key = "uritomo-super-secret-key-change-this-in-production-12345"
    
    # エージェント用のID
    agent_user_id = "agent_transcriber"
    
    payload = {
        "sub": agent_user_id,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    }
    
    token = jwt.encode(payload, secret_key, algorithm="HS256")
    
    # URLパスの確認:
    # ブラウザ: ws://localhost:8000/meeting/... (ログより)
    # エージェント: ws://localhost:8000/api/v1/meeting/... 
    # もしバックエンドが /api/v1/meeting/... で待っているなら合っているはずだが、
    # 念のため、ブラウザで成功しているパスに合わせてみるか、
    # .envのBACKEND_WS_URLの設定を確認する。
    # ここでは、デフォルトの /api/v1/meeting を信じるが、tokenを確実に渡す。
    
    ws_uri = f"{BACKEND_WS_URL}/{session_id}?token={token}"
    
    backend_ws = None
    try:
        print(f">>> 🔌 バックエンド({ws_uri})に接続中...")
        # extra_headersは不要だが、念のためUser-Agentなどを指定可能
        backend_ws = await websockets.connect(ws_uri)
        # 接続開始メッセージを送る
        await backend_ws.send(json.dumps({
            "type": "chat", 
            "text": "--- Transcriber Bot Connected (Authenticated) ---",
            "lang": "en"
        }))
        print(">>> ✅ バックエンドに接続しました！")
    except Exception as e:
        print(f">>> ⚠️ バックエンド接続エラー: {e}")
        print(">>> (ローカル表示のみで動作します)")

    # --- ヘルパー関数: トラック（音声）ごとに文字起こし処理を起動する ---
    def start_transcription(track: rtc.Track, participant: rtc.RemoteParticipant):
        print(f"\n>>> 🎯 音声を検知しました！: {participant.identity}")
        
        # LiveKitからの音声受信ストリームを作成
        audio_stream = rtc.AudioStream(track)
        # OpenAIへの送信ストリームを作成
        stt_stream = stt_provider.stream()

        # 音声処理のメインループ（非同期関数）
        async def process_audio():
            
            # タスクA: 音声データをOpenAIに送り続ける
            async def send_audio():
                # audio_streamから音声データの塊（イベント）を順次取得
                async for event in audio_stream:
                    # 【重要】eventの中にある実際の音声フレーム(.frame)を取り出してSTTへ送る
                    stt_stream.push_frame(event.frame)
                # ストリームが終わったら入力終了を通知
                stt_stream.end_input()

            # タスクB: OpenAIからの認識結果を受け取り続ける
            async def receive_text():
                async for event in stt_stream:
                    # 確定した文章（FINAL_TRANSCRIPT）だけを表示
                    if event.type == stt.SpeechEventType.FINAL_TRANSCRIPT:
                        text = event.alternatives[0].text
                        # ターミナルに見やすく表示
                        print(f"📝 {participant.identity}: {text}")

                        # バックエンドに送信
                        if backend_ws:
                            try:
                                # 1. チャットとして送信
                                await backend_ws.send(json.dumps({
                                    "type": "chat",
                                    "text": f"🎤 {text}",
                                    "lang": "ja"
                                }))
                                
                                # 2. エージェント側で翻訳して送信 (バックエンドの翻訳機能に頼らない)
                                # 簡易翻訳ロジック
                                translated_text = f"[Translating...] {text}"
                                target_lang = "en" # 仮
                                
                                api_key = os.getenv("OPENAI_API_KEY")
                                if api_key:
                                    try:
                                        from openai import AsyncOpenAI
                                        client = AsyncOpenAI(api_key=api_key)
                                        # 簡易プロンプト
                                        resp = await client.chat.completions.create(
                                            model="gpt-4o",
                                            messages=[
                                                {"role": "system", "content": "You are a fast translator. Translate to English (or Japanese if input is English). Output ONLY the translated text."},
                                                {"role": "user", "content": text}
                                            ]
                                        )
                                        translated_text = resp.choices[0].message.content.strip()
                                    except Exception as ai_err:
                                        print(f"Agent Translation Error: {ai_err}")
                                        translated_text = f"[Error] {text}"
                                else:
                                    # キーがない場合のモック
                                    translated_text = f"Translated: {text}"

                                # 翻訳メッセージとして送信 (WebSocket)
                                payload_json = json.dumps({
                                    "type": "translation",
                                    "data": {
                                        "original_text": text,
                                        "translated_text": translated_text,
                                        "source_lang": "ja",
                                        "target_lang": "en",
                                        "explanation": ""
                                    }
                                })
                                await backend_ws.send(payload_json)
                                print(f"📝 Trans: {translated_text}")
                                
                                # Fallback: LiveKit Data Channel経由でも送信 (Direct)
                                # これによりWS接続トラブルがあってもフロントエンドに届く
                                try:
                                    await ctx.room.local_participant.publish_data(
                                        payload=payload_json,
                                        reliable=True
                                    )
                                    print(">>> 📡 Sent via LiveKit Data Channel")
                                except Exception as lk_err:
                                    print(f"LiveKit Data Send Error: {lk_err}")

                            except Exception as send_err:
                                print(f"送信エラー: {send_err}")

            # タスクAとBを同時に実行（並行処理）
            await asyncio.gather(send_audio(), receive_text())

        # 上記の処理をバックグラウンドタスクとして実行開始
        asyncio.create_task(process_audio())

    # 2. イベント検知：【あとから】参加者が来て音声トラックが追加された時
    @ctx.room.on("track_subscribed")
    def on_track_subscribed(track: rtc.Track, publication: rtc.TrackPublication, participant: rtc.RemoteParticipant):
        print(f">>> [Event] Track Subscribed: {participant.identity} kind={track.kind}")
        # トラックの種類が「音声(AUDIO)」の場合のみ処理を開始
        if track.kind == rtc.TrackKind.KIND_AUDIO:
            start_transcription(track, participant)

    @ctx.room.on("track_published")
    def on_track_published(publication: rtc.TrackPublication, participant: rtc.RemoteParticipant):
        print(f">>> [Event] Track Published: {participant.identity} kind={publication.kind}")
        if publication.kind == rtc.TrackKind.KIND_AUDIO:
            print(f">>> 🔊 音声トラックが公開されました。購読を試みます: {participant.identity}")
            publication.set_subscribed(True)

    @ctx.room.on("participant_connected")
    def on_participant_connected(participant: rtc.RemoteParticipant):
        print(f">>> [Event] Participant Connected: {participant.identity}")

    # 3. 初期チェック：【最初から】部屋にいる人の音声対応
    print(f">>> 👥 現在の参加者数: {len(ctx.room.remote_participants)}")
    for participant in ctx.room.remote_participants.values():
        print(f"   - Participant: {participant.identity}")
        for publication in participant.track_publications.values():
            print(f"     - Track: {publication.sid} kind={publication.kind} subscribed={publication.subscribed}")
            # トラックが存在し、かつ音声トラックであれば処理開始
            if publication.kind == rtc.TrackKind.KIND_AUDIO:
                if not publication.subscribed:
                    print(f">>> 🔊 未購読の音声トラックを発見。購読します: {participant.identity}")
                    publication.set_subscribed(True)
                
                if publication.track:
                    print(f">>> 📡 既存の音声を検出: {participant.identity}")
                    start_transcription(publication.track, participant)
                else:
                    print(f">>> ⚠️ 音声トラックはありますが、trackオブジェクトがNoneです (まだロード中かも)")

    # Jobが終了しないように待機
    # dispatchされた場合でも、誰かがいなくなるまで、あるいは手動終了まで動き続ける
    print(">>> 🔄 エージェントは待機モードに入ります...")
    await asyncio.Event().wait()

if __name__ == "__main__":
    # アプリケーションの起動
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            agent_name="Uritomo-Transcriber" # エージェントの名前
        )
    )