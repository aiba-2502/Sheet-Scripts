function recordBitcoinPrice() {
    // bitFlyerのAPI URL
    const url = "https://api.bitflyer.com/v1/ticker?product_code=BTC_JPY";
    
    // APIリクエストを送信
    const response = UrlFetchApp.fetch(url);
    const data = JSON.parse(response.getContentText());
    
    // 現在のビットコイン価格を取得
    const price = data.ltp;  // ltpは最新取引価格（Last Traded Price）
  
    // スプレッドシートにアクセス
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
    // 実行日時とビットコイン価格をスプレッドシートに記録
    const now = new Date();
    sheet.appendRow([now, price]);
  }