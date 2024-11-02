import requests
from bs4 import BeautifulSoup
import time
import gspread
from oauth2client.service_account import ServiceAccountCredentials

# Google Sheets APIの設定
scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive.file", "https://www.googleapis.com/auth/drive"]
creds = ServiceAccountCredentials.from_json_keyfile_name('credentials.json', scope)
client = gspread.authorize(creds)

# スプレッドシートの指定
spreadsheet = client.create("Manga List")  # 新規作成
worksheet = spreadsheet.get_worksheet(0)

# ヘッダー行を設定
worksheet.append_row(["Title", "Author", "Volume", "Detail URL"])

# スクレイピング結果を格納するリスト
manga_list = []

# IDの範囲を指定
for manga_id in range(1, 51):
    # URLの指定
    url = f"https://manba.co.jp/keyword_tags/{manga_id}/boards"
    
    try:
        # リクエストを送信してHTMLを取得
        response = requests.get(url)
        response.raise_for_status()
        
        # BeautifulSoupで解析
        soup = BeautifulSoup(response.text, 'html.parser')

        # 各漫画の情報を取得
        for item in soup.select('.css-selector-for-each-manga'):  # 各漫画の要素のCSSセレクタを指定してください
            title = item.select_one('.css-selector-for-title').get_text(strip=True)  # タイトルのCSSセレクタ
            author = item.select_one('.css-selector-for-author').get_text(strip=True)  # 著者のCSSセレクタ
            volume = item.select_one('.css-selector-for-volume').get_text(strip=True)  # 巻数のCSSセレクタ
            detail_url = item.select_one('.css-selector-for-detail-url')['href']  # 詳細URLのCSSセレクタ
            
            manga_list.append([title, author, volume, detail_url])
        
        print(f"ID {manga_id} のデータを取得しました")
    
    except requests.RequestException as e:
        print(f"ID {manga_id} のページにアクセスできませんでした: {e}")

    # リクエストの間隔を1秒空ける
    time.sleep(1)

# スプレッドシートにデータを追加
for manga in manga_list:
    worksheet.append_row(manga)

print("データをGoogleスプレッドシートに出力しました")
