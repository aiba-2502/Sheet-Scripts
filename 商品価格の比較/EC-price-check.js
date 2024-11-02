function scrapeAndComparePrices() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.clear(); // シートをクリア
    // ヘッダー行の設定
    const headers = ["商品名", "商品URL", "Qoo10の価格", "JAN", "楽天価格", "利益"];
    sheet.getRange("A1:F1").setValues([headers]);
  
    const qoo10Url = 'https://www.qoo10.jp/shop/yamada-denki'; // Qoo10 店舗ページのURL
    const qoo10Html = UrlFetchApp.fetch(qoo10Url).getContentText();
    const $ = Cheerio.load(qoo10Html);
    const rakutenAppId = '1003491522350830410'; // 楽天アプリID
  
    // 商品データの取得と書き込み、最初の3件のみ
    $('.item').slice(0, 3).each(function (i, elem) {
      const itemUrl = $(elem).find('a.thmb').attr('href');
      const itemName = $(elem).find('a.tt').text().trim();
      const itemPriceQoo10 = parseInt($(elem).find('.prc strong').text().replace(/円/g, '').replace(/,/g, '').trim());
      
      // 商品詳細ページからJANコードを取得
      const detailHtml = UrlFetchApp.fetch(itemUrl).getContentText();
      const detailPage = Cheerio.load(detailHtml);
      const janCode = detailPage('#tr_pan_industry td[itemprop="mpn"]').text().trim();
      
      // 楽天商品検索APIを実行
      const rakutenUrl = `https://app.rakuten.co.jp/services/api/IchibaItem/Search/20170706?format=json&applicationId=${rakutenAppId}&keyword=${encodeURIComponent(janCode)}&sort=%2BitemPrice`;
      const rakutenResponse = UrlFetchApp.fetch(rakutenUrl);
      const rakutenData = JSON.parse(rakutenResponse.getContentText());
      const itemPriceRakuten = rakutenData.Items.length > 0 ? rakutenData.Items[0].Item.itemPrice : 'データなし';
  
      // 利益計算
      const profit = itemPriceRakuten !== 'データなし' ? itemPriceRakuten - itemPriceQoo10 : '計算不可';
  
      const rowIndex = i + 2; // 1行目はヘッダー用
      sheet.getRange(rowIndex, 1).setValue(itemName);
      sheet.getRange(rowIndex, 2).setValue(itemUrl);
      sheet.getRange(rowIndex, 3).setValue(itemPriceQoo10);
      sheet.getRange(rowIndex, 4).setValue(janCode);
      sheet.getRange(rowIndex, 5).setValue(itemPriceRakuten);
      sheet.getRange(rowIndex, 6).setValue(profit);
    });
  }
  