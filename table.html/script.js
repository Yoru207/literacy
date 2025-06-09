// OpenWeatherMapのAPIキーをここに記述してください
// !!! このAPIキーは公開しないように注意してください !!!
const API_KEY = 'e73039cbf4f5d3f04f511d8d7d4c1632'; // あなたのAPIキーに置き換える
const CITY_NAME = 'Chiba'; // 千葉県の英語表記
const LANG = 'ja'; // 日本語表示
const UNITS = 'metric'; // 摂氏表示

// 千葉県の座標（APIによっては都市名より座標指定の方が正確な場合があります）
// OpenWeatherMapのOne Call APIでは都市名で検索後、座標を使用します
// 今回はForecast APIを使うので都市名でOKです
// 緯度: 35.6048 東経: 140.1235 (千葉市中央区役所付近)
// localStorageから既存のカウントを読み込む。なければ0
let apiCallCount = parseInt(localStorage.getItem('openWeatherApiCallCount')) || 0;

async function getWeatherData() {
    apiCallCount++; // API呼び出しのたびにカウントを増やす
    localStorage.setItem('openWeatherApiCallCount', apiCallCount); // localStorageに保存
    console.log(`API呼び出し回数: ${apiCallCount}回`); // コンソールに表示

    // (API呼び出しのコードは同じ)

    // HTMLにカウンターを表示する場所を作ることもできます
    // document.getElementById('apiCallCounter').textContent = apiCallCount;

    try {
        // OpenWeatherMapの5日間の予報API（3時間ごとのデータ）
        const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${CITY_NAME}&appid=${API_KEY}&lang=${LANG}&units=${UNITS}`);
        const data = await response.json();

        if (data.cod !== "200") {
            console.error("APIエラー:", data.message);
            alert("天気データの取得に失敗しました。APIキーまたは都市名を確認してください。");
            return;
        }

        console.log(data); // 取得したデータをコンソールで確認

        // 今日の天気データ（最も近い3時間ごとのデータ）
        const todayData = data.list[0];
        document.getElementById('todayWeather').innerHTML = `
            <img src="http://openweathermap.org/img/wn/${todayData.weather[0].icon}@2x.png" alt="${todayData.weather[0].description}" class="weather-icon">
            <br>${todayData.weather[0].description}
        `;
        document.getElementById('todayTemp').textContent = `${Math.round(todayData.main.temp_max)}°C / ${Math.round(todayData.main.temp_min)}°C`;
        // 降水確率は'pop' (probability of precipitation) で取得できるが、Forecast APIでは3時間ごとのデータなので、
        // 1日の降水確率を出すには工夫が必要。ここでは今日の最初のデータを使うか、より詳細なOne Call APIを利用する方が良い。
        // 簡単のために最初のデータの降水確率を表示。
        document.getElementById('todayRainProb').textContent = `${Math.round(todayData.pop * 100)}%`;


        // 明日の天気データ（今日の24時間後くらいにあたるデータを探す）
        // listの中から日付が変わるタイミングのデータを探します
        let tomorrowData = null;
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0); // 明日の0時0分0秒に設定

        for (const item of data.list) {
            const itemDate = new Date(item.dt * 1000); // Unixタイムスタンプをミリ秒に変換
            if (itemDate.getDate() === tomorrow.getDate() && itemDate.getMonth() === tomorrow.getMonth() && itemDate.getFullYear() === tomorrow.getFullYear()) {
                // 明日の最初のデータ（多くは明日の0時、3時など）を取得
                tomorrowData = item;
                break;
            }
        }

        if (tomorrowData) {
            document.getElementById('tomorrowWeather').innerHTML = `
                <img src="http://openweathermap.org/img/wn/${tomorrowData.weather[0].icon}@2x.png" alt="${tomorrowData.weather[0].description}" class="weather-icon">
                <br>${tomorrowData.weather[0].description}
            `;
            document.getElementById('tomorrowTemp').textContent = `${Math.round(tomorrowData.main.temp_max)}°C / ${Math.round(tomorrowData.main.temp_min)}°C`;
            document.getElementById('tomorrowRainProb').textContent = `${Math.round(tomorrowData.pop * 100)}%`;
        } else {
            document.getElementById('tomorrowWeather').textContent = 'データなし';
            document.getElementById('tomorrowTemp').textContent = 'データなし';
            document.getElementById('tomorrowRainProb').textContent = 'データなし';
        }


    } catch (error) {
        console.error("天気データの取得中にエラーが発生しました:", error);
        alert("天気データの取得中にエラーが発生しました。ネットワーク接続を確認してください。");
    }
}

// ページロード時に天気データを取得
getWeatherData();

// データを定期的に更新する場合（例: 1時間ごと）
// setInterval(getWeatherData, 3600000); // 1時間 = 3600000ミリ秒