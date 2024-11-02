// bitFlyer APIのエンドポイントURL
const BITFLYER_API_URL_TICKER = 'https://api.bitflyer.com/v1/getticker';
const BITFLYER_API_URL_BALANCE = 'https://api.bitflyer.com/v1/me/getbalance';
const BITFLYER_API_URL_ORDER = 'https://api.bitflyer.com/v1/me/sendchildorder';

// APIキーとシークレットを設定
const API_KEY = 'XXXXXXXXXXXXXXXX';
const API_SECRET = 'XXXXXXXXXXXXXXXX';

// bitFlyer APIでの認証リクエストヘッダーの作成
function createAuthorizationHeader(path, method = 'GET') {
  const timestamp = Date.now().toString();
  const text = timestamp + method + path;
  const signature = Utilities.computeHmacSha256Signature(text, API_SECRET);
  const encodedSignature = Utilities.base64Encode(signature);

  return {
    'ACCESS-KEY': API_KEY,
    'ACCESS-TIMESTAMP': timestamp,
    'ACCESS-SIGN': encodedSignature,
    'Content-Type': 'application/json'
  };
}

// ビットコインの価格と資産情報をスプレッドシートに記録し、仮の売買を記録
function recordBitcoinData() {
  // 1. ビットコインの最新価格を取得
  const responseTicker = UrlFetchApp.fetch(BITFLYER_API_URL_TICKER);
  const dataTicker = JSON.parse(responseTicker.getContentText());
  const bitcoinPrice = dataTicker.ltp;

  // 2. 資産情報を取得
  const headers = createAuthorizationHeader('/v1/me/getbalance');
  const options = {
    method: 'GET',
    headers: headers,
    muteHttpExceptions: true
  };
  const responseBalance = UrlFetchApp.fetch(BITFLYER_API_URL_BALANCE, options);
  const balances = JSON.parse(responseBalance.getContentText());

  // ビットコインと日本円の資産額を取得
  let bitcoinBalance = 0;
  let jpyBalance = 0;
  balances.forEach(balance => {
    if (balance.currency_code === 'BTC') {
      bitcoinBalance = balance.amount;
    } else if (balance.currency_code === 'JPY') {
      jpyBalance = balance.amount;
    }
  });

  // 合計資産額を計算（日本円換算）
  const totalAssetJPY = jpyBalance + (bitcoinBalance * bitcoinPrice);

  // 仮の売買注文条件と注文量
  const orderAmount = 0.001;
  let orderType = ''; // 注文種別（'買い'または'売り'）
  let executedAmount = 0; // 実際に注文した量（仮）

  // 3. 売買判断ロジック
  if (bitcoinPrice <= 10500000 && jpyBalance >= bitcoinPrice * orderAmount) {
    // ビットコイン価格が1050万円以下で買い条件を満たす場合
    orderType = '買い';
    executedAmount = orderAmount;

    // 仮注文処理（テスト用、実際の注文は行わない）
    const buyOrder = {
      product_code: 'BTC_JPY',
      child_order_type: 'MARKET',
      side: 'BUY',
      size: orderAmount
    };
    // UrlFetchApp.fetch(BITFLYER_API_URL_ORDER, {method: 'POST', headers: headers, payload: JSON.stringify(buyOrder)});
  } else if (bitcoinPrice >= 11000000 && bitcoinBalance >= orderAmount) {
    // ビットコイン価格が1100万円以上で売り条件を満たす場合
    orderType = '売り';
    executedAmount = orderAmount;

    // 仮注文処理（テスト用、実際の注文は行わない）
    const sellOrder = {
      product_code: 'BTC_JPY',
      child_order_type: 'MARKET',
      side: 'SELL',
      size: orderAmount
    };
    // UrlFetchApp.fetch(BITFLYER_API_URL_ORDER, {method: 'POST', headers: headers, payload: JSON.stringify(sellOrder)});
  }

  // 4. 実行日時とデータをスプレッドシートに記録
  const date = new Date();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Bitcoin Prices');
  sheet.appendRow([date, bitcoinPrice, bitcoinBalance, jpyBalance, totalAssetJPY, orderType, executedAmount]);
}
