import asyncio
import os
from dotenv import load_dotenv
from livekit import api

# .envを読み込み
load_dotenv()

async def main():
    # 1. APIクライアントの作成
    lkapi = api.LiveKitAPI(
        os.getenv('LIVEKIT_URL'),
        os.getenv('LIVEKIT_API_KEY'),
        os.getenv('LIVEKIT_API_SECRET'),
    )

    # ==============================
    # ▼ 設定：ここを今の状況に合わせてください ▼
    # ==============================
    ROOM_NAME = "1"               # Electronアプリで今入っている部屋名
    AGENT_NAME = "Uritomo-Transcriber" # main.py の agent_name
    # ==============================

    print(f"🚀 エージェント '{AGENT_NAME}' を部屋 '{ROOM_NAME}' に招待しています...")

    try:
        # 2. リクエスト情報の作成
        # 最新版ではこのように「リクエストオブジェクト」を作って渡します
        request = api.CreateAgentDispatchRequest(
            room=ROOM_NAME,
            agent_name=AGENT_NAME
        )
        
        # 3. 招待状（Dispatch）を送る
        # × lkapi.agent -> ○ lkapi.agent_dispatch
        await lkapi.agent_dispatch.create_dispatch(request)
        
        print("✅ 招待に成功しました！ main.py の黒い画面を見てください。")
        
    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")
    finally:
        await lkapi.aclose()

if __name__ == "__main__":
    asyncio.run(main())