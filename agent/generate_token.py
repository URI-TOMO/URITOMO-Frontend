import os
from livekit import api
from dotenv import load_dotenv

load_dotenv()

# .envからキーを読み込む
API_KEY = os.getenv("LIVEKIT_API_KEY")
API_SECRET = os.getenv("LIVEKIT_API_SECRET")

if not API_KEY or not API_SECRET:
    print("エラー: .envファイルに LIVEKIT_API_KEY と LIVEKIT_API_SECRET が設定されていません")
    exit()

# 最強の権限を持つトークンを作成
token = api.AccessToken(API_KEY, API_SECRET) \
    .with_identity("google-userdaisuke") \
    .with_name("Google User") \
    .with_grants(api.VideoGrants(
        room_join=True,
        room="1",
        can_publish=True,        # 送信OK
        can_subscribe=True,      # 受信OK
        can_publish_data=True,   # チャットOK
    ))

print("\n↓↓↓ この下の長い文字列をコピーしてください ↓↓↓\n")
print(token.to_jwt())
print("\n↑↑↑ ここまで ↑↑↑\n")