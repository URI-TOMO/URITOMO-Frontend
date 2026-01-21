import asyncio
import logging
from dotenv import load_dotenv

# LiveKitのSDKとOpenAIプラグインのインポート
from livekit import agents, rtc
from livekit.agents import JobContext, WorkerOptions, stt, cli
from livekit.plugins import openai

# 環境変数の読み込み (.env)
load_dotenv()
# ログレベルの設定
logging.basicConfig(level=logging.INFO)

async def entrypoint(ctx: JobContext):
    # 1. 自動購読をONにして接続
    # auto_subscribe=AUDIO_ONLY にすることで、明示的にsubscribe操作をしなくても
    # 誰かが話し始めたら自動的に音声データを受け取る設定にしています。
    await ctx.connect(auto_subscribe=agents.AutoSubscribe.AUDIO_ONLY)
    
    print(f"\n>>> ✅ Room '{ctx.room.name}' に接続しました！")
    print(">>> 🎤 音声を待機中... 話しかけてみてください (Ctrl+Cで終了)\n")

    # STT（音声認識）エンジンの初期化
    stt_provider = openai.STT()

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

            # タスクAとBを同時に実行（並行処理）
            # 片方が送信し、もう片方が受信を行う「全二重通信」のような動き
            await asyncio.gather(send_audio(), receive_text())

        # 上記の処理をバックグラウンドタスクとして実行開始
        asyncio.create_task(process_audio())

    # 2. イベント検知：【あとから】参加者が来て音声トラックが追加された時
    @ctx.room.on("track_subscribed")
    def on_track_subscribed(track: rtc.Track, publication: rtc.TrackPublication, participant: rtc.RemoteParticipant):
        # トラックの種類が「音声(AUDIO)」の場合のみ処理を開始
        if track.kind == rtc.TrackKind.KIND_AUDIO:
            start_transcription(track, participant)

    # 3. 初期チェック：【最初から】部屋にいる人の音声対応
    # ボットが入室した時点で、既にマイクをONにしている人がいた場合の処理
    for participant in ctx.room.remote_participants.values():
        for publication in participant.track_publications.values():
            # トラックが存在し、かつ音声トラックであれば処理開始
            if publication.track and publication.track.kind == rtc.TrackKind.KIND_AUDIO:
                print(f">>> 📡 既存の音声を検出: {participant.identity}")
                start_transcription(publication.track, participant)

if __name__ == "__main__":
    # アプリケーションの起動
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            agent_name="Uritomo-Transcriber" # エージェントの名前
        )
    )