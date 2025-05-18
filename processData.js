// 處理TW.txt數據並轉換為data.json格式的腳本
// 使用方法：在瀏覽器控制台中運行此代碼，然後粘貼TW.txt內容，最後調用processDataAndGenerate()

let rawData = '';
let logMessages = [];

// 記錄日誌的函數
function log(message, isError = false) {
    const logMessage = `[${new Date().toISOString()}] ${message}`;
    logMessages.push(logMessage);
    if (isError) {
        console.error(logMessage);
    } else {
        console.log(logMessage);
    }
    
    // 限制日誌消息數量
    if (logMessages.length > 100) {
        logMessages.shift();
    }
    
    return logMessage;
}

// 獲取所有日誌
function getLogs() {
    return logMessages.join('\n');
}

// 這個函數用於粘貼TW.txt的內容
function pasteRawData(data) {
    try {
        rawData = data;
        const lines = rawData.split('\n').filter(line => line.trim().length > 0);
        log(`數據已加載，共${lines.length}行`);
        
        // 檢查數據格式
        if (lines.length < 10) {
            throw new Error('數據行數太少，可能不完整');
        }
        
        // 檢查數據是否包含必要的列
        const headerLine = lines.find(line => line.includes('縣市') && line.includes('區域') && line.includes('目標場數'));
        if (!headerLine) {
            log('警告：未找到標題行，數據格式可能不符合預期', true);
        }
        
        log('請調用 processDataAndGenerate() 生成JSON數據');
        return true;
    } catch (error) {
        log(`粘貼數據時出錯：${error.message}`, true);
        throw error;
    }
}

// 主處理函數
function processDataAndGenerate() {
    try {
        if (!rawData) {
            throw new Error('請先調用pasteRawData(data)加載數據');
        }

        log('開始處理數據...');
        const lines = rawData.split('\n').filter(line => line.trim().length > 0);
        
        // 初始化數據結構
        const result = {
            '112': {
                'center': [],
                'health': []
            },
            '113': {
                'center': [],
                'health': []
            }
        };
        
        // 當前年度
        let currentYear = '112';
        let processed112Count = 0;
        let processed113Count = 0;
        let skippedLines = 0;
        
        // 經緯度參考數據
        const geoData = {
            // 新北市
            '新北市_金山區': { lat: 25.2219, lng: 121.6357 },
            '新北市_石碇區': { lat: 24.9459, lng: 121.6477 },
            '新北市_坪林區': { lat: 24.9377, lng: 121.7115 },
            '新北市_平溪區': { lat: 25.0257, lng: 121.7384 },
            '新北市_雙溪區': { lat: 24.9503, lng: 121.8659 },
            '新北市_烏來區': { lat: 24.8665, lng: 121.5504 },
            '新北市_瑞芳區': { lat: 25.1089, lng: 121.8237 },
            '新北市_三峽區': { lat: 24.9342, lng: 121.3690 },
            '新北市_八里區': { lat: 25.1480, lng: 121.4153 },
            '新北市_石門區': { lat: 25.2904, lng: 121.5682 },
            '新北市_貢寮區': { lat: 25.0220, lng: 121.9453 },
            '新北市_鶯歌區': { lat: 24.9547, lng: 121.3466 },
            '新北市_三芝區': { lat: 25.2580, lng: 121.5015 },
            '新北市_泰山區': { lat: 25.0589, lng: 121.4304 },
            '新北市_五股區': { lat: 25.0962, lng: 121.4338 },
            '新北市_樹林區': { lat: 24.9880, lng: 121.4202 },
            
            // 台中市
            '台中市_和平區': { lat: 24.2747, lng: 121.1360 },
            '臺中市_和平區': { lat: 24.2747, lng: 121.1360 },
            '台中市_石岡區': { lat: 24.2749, lng: 120.7803 },
            '臺中市_石岡區': { lat: 24.2749, lng: 120.7803 },
            '台中市_東勢區': { lat: 24.2586, lng: 120.8278 },
            '臺中市_東勢區': { lat: 24.2586, lng: 120.8278 },
            '台中市_神岡區': { lat: 24.2567, lng: 120.6661 },
            '臺中市_神岡區': { lat: 24.2567, lng: 120.6661 },
            '台中市_新社區': { lat: 24.2341, lng: 120.8095 },
            '臺中市_新社區': { lat: 24.2341, lng: 120.8095 },
            '台中市_霧峰區': { lat: 24.0583, lng: 120.7000 },
            '臺中市_霧峰區': { lat: 24.0583, lng: 120.7000 },
            '台中市_后里區': { lat: 24.3095, lng: 120.7146 },
            '臺中市_后里區': { lat: 24.3095, lng: 120.7146 },
            '台中市_大肚區': { lat: 24.1537, lng: 120.5419 },
            '臺中市_大肚區': { lat: 24.1537, lng: 120.5419 },
            '台中市_大雅區': { lat: 24.2291, lng: 120.6477 },
            '臺中市_大雅區': { lat: 24.2291, lng: 120.6477 },
            '台中市_西區': { lat: 24.1416, lng: 120.6647 },
            '臺中市_西區': { lat: 24.1416, lng: 120.6647 },
            '台中市_大里區': { lat: 24.0989, lng: 120.6778 },
            '臺中市_大里區': { lat: 24.0989, lng: 120.6778 },
            '台中市_烏日區': { lat: 24.0641, lng: 120.6214 },
            '臺中市_烏日區': { lat: 24.0641, lng: 120.6214 },
            '台中市_太平區': { lat: 24.1265, lng: 120.7137 },
            '臺中市_太平區': { lat: 24.1265, lng: 120.7137 },
            '台中市_外埔區': { lat: 24.3323, lng: 120.6536 },
            '臺中市_外埔區': { lat: 24.3323, lng: 120.6536 },
            
            // 基隆市
            '基隆市_七堵區': { lat: 25.0934, lng: 121.7131 },
            '基隆市_中正區': { lat: 25.0437, lng: 121.7837 },
            
            // 桃園市
            '桃園市_復興區': { lat: 24.7284, lng: 121.3522 },
            '桃園市_龜山區': { lat: 25.0191, lng: 121.3570 },
            
            // 台南市
            '台南市_龍崎區': { lat: 22.9655, lng: 120.3600 },
            '臺南市_龍崎區': { lat: 22.9655, lng: 120.3600 },
            '台南市_楠西區': { lat: 23.1735, lng: 120.4836 },
            '臺南市_楠西區': { lat: 23.1735, lng: 120.4836 },
            '台南市_南化區': { lat: 23.1153, lng: 120.5440 },
            '臺南市_南化區': { lat: 23.1153, lng: 120.5440 },
            '台南市_學甲區': { lat: 23.2323, lng: 120.1808 },
            '臺南市_學甲區': { lat: 23.2323, lng: 120.1808 },
            '台南市_東山區': { lat: 23.2761, lng: 120.4040 },
            '臺南市_東山區': { lat: 23.2761, lng: 120.4040 },
            '台南市_左鎮區': { lat: 23.0257, lng: 120.4129 },
            '臺南市_左鎮區': { lat: 23.0257, lng: 120.4129 },
            '台南市_安南區': { lat: 23.0486, lng: 120.1698 },
            '臺南市_安南區': { lat: 23.0486, lng: 120.1698 },
            '台南市_麻豆區': { lat: 23.1816, lng: 120.2448 },
            '臺南市_麻豆區': { lat: 23.1816, lng: 120.2448 },
            '台南市_新化區': { lat: 23.0382, lng: 120.3456 },
            '臺南市_新化區': { lat: 23.0382, lng: 120.3456 },
            '台南市_新市區': { lat: 23.0786, lng: 120.2929 },
            '臺南市_新市區': { lat: 23.0786, lng: 120.2929 },
            '台南市_下營區': { lat: 23.2349, lng: 120.1935 },
            '臺南市_下營區': { lat: 23.2349, lng: 120.1935 },
            '台南市_玉井區': { lat: 23.1144, lng: 120.4538 },
            '臺南市_玉井區': { lat: 23.1144, lng: 120.4538 },
            
            // 高雄市
            '高雄市_那瑪夏區': { lat: 23.2750, lng: 120.6932 },
            '高雄市_桃源區': { lat: 23.1591, lng: 120.8522 },
            '高雄市_甲仙區': { lat: 23.0847, lng: 120.5837 },
            '高雄市_六龜區': { lat: 22.9983, lng: 120.6330 },
            '高雄市_田寮區': { lat: 22.8594, lng: 120.3597 },
            '高雄市_旗津區': { lat: 22.6163, lng: 120.2671 },
            '高雄市_林園區': { lat: 22.5057, lng: 120.3893 },
            '高雄市_彌陀區': { lat: 22.7819, lng: 120.2394 },
            '高雄市_阿蓮區': { lat: 22.8697, lng: 120.3172 },
            '高雄市_茄萣區': { lat: 22.8866, lng: 120.1826 },
            '高雄市_美濃區': { lat: 22.9009, lng: 120.5419 },
            '高雄市_岡山區': { lat: 22.7956, lng: 120.2982 },
            
            // 澎湖縣
            '澎湖縣_七美嶼': { lat: 23.2013, lng: 119.4299 },
            '澎湖縣_七美鄉': { lat: 23.2013, lng: 119.4299 },
            
            // 其他常見坐標
            '宜蘭縣_大同鄉': { lat: 24.6752, lng: 121.6039 },
            '宜蘭縣_南澳鄉': { lat: 24.4654, lng: 121.6513 },
            '新竹市_香山區': { lat: 24.7826, lng: 120.9144 },
            '新竹市_南寮地區': { lat: 24.8443, lng: 120.9272 },
            '新竹縣_尖石鄉': { lat: 24.5942, lng: 121.2819 },
            '新竹縣_五峰鄉': { lat: 24.5778, lng: 121.1402 },
            '新竹縣_關西鎮': { lat: 24.7866, lng: 121.1768 },
            '苗栗縣_泰安鄉': { lat: 24.4166, lng: 120.9878 },
            '苗栗縣_南庄鄉': { lat: 24.5665, lng: 121.0155 },
            '苗栗縣_通霄鎮': { lat: 24.4891, lng: 120.6784 },
            '苗栗縣_苑裡鎮': { lat: 24.4114, lng: 120.6489 },
            '彰化縣_二林鎮': { lat: 23.9060, lng: 120.3741 },
            '彰化縣_芬園鄉': { lat: 24.0083, lng: 120.6290 },
            '彰化縣_金沙鄉': { lat: 24.0390, lng: 120.4170 }, // 近似坐標
            '彰化縣_南彰': { lat: 24.0555, lng: 120.5244 }, // 近似坐標
            '南投縣_信義鄉': { lat: 23.6995, lng: 120.8552 },
            '南投縣_仁愛鄉': { lat: 24.0249, lng: 121.1441 },
            '南投縣_草屯鎮': { lat: 23.9772, lng: 120.6804 },
            '南投縣_中寮鄉': { lat: 23.9072, lng: 120.7845 },
            '南投縣_名間鄉': { lat: 23.8507, lng: 120.6781 },
            '南投縣_集集鎮': { lat: 23.8262, lng: 120.7835 },
            '南投縣_魚池鄉': { lat: 23.8965, lng: 120.9351 },
            '南投縣_水里鄉': { lat: 23.8120, lng: 120.8495 },
            '雲林縣_臺西鄉': { lat: 23.6975, lng: 120.1966 },
            '雲林縣_北港鎮': { lat: 23.5781, lng: 120.3057 },
            '雲林縣_元長鄉': { lat: 23.6495, lng: 120.3175 },
            '雲林縣_麥寮鄉': { lat: 23.7972, lng: 120.2505 },
            '雲林縣_褒忠鄉': { lat: 23.6950, lng: 120.3093 },
            '雲林縣_水林鄉': { lat: 23.5693, lng: 120.2456 },
            '嘉義縣_阿里山鄉': { lat: 23.4679, lng: 120.7320 },
            '嘉義縣_大埔鄉': { lat: 23.2915, lng: 120.5935 },
            '嘉義縣_番路鄉': { lat: 23.4271, lng: 120.5866 },
            '嘉義縣_梅山鄉': { lat: 23.5573, lng: 120.6378 },
            '嘉義縣_朴子市': { lat: 23.4536, lng: 120.2526 },
            '嘉義縣_太保市': { lat: 23.4778, lng: 120.3350 },
            '屏東縣_瑪家鄉': { lat: 22.6690, lng: 120.6645 },
            '屏東縣_泰武鄉': { lat: 22.5918, lng: 120.6850 },
            '屏東縣_來義鄉': { lat: 22.5103, lng: 120.6864 },
            '屏東縣_三地門鄉': { lat: 22.7809, lng: 120.6535 },
            '屏東縣_春日鄉': { lat: 22.3967, lng: 120.6275 },
            '屏東縣_獅子鄉': { lat: 22.2255, lng: 120.7174 },
            '屏東縣_琉球鄉': { lat: 22.3423, lng: 120.3760 },
            '屏東縣_牡丹鄉': { lat: 22.1528, lng: 120.8187 },
            '屏東縣_霧台鄉': { lat: 22.7597, lng: 120.8005 },
            '屏東縣_滿州鄉': { lat: 22.0320, lng: 120.8381 },
            '屏東縣_滿洲鄉': { lat: 22.0320, lng: 120.8381 },
            '臺東縣_太麻里鄉': { lat: 22.5989, lng: 120.9789 },
            '臺東縣_大武鄉': { lat: 22.3816, lng: 120.9003 },
            '臺東縣_延平鄉': { lat: 22.9026, lng: 121.0835 },
            '臺東縣_海端鄉': { lat: 23.1028, lng: 121.1761 },
            '臺東縣_成功鎮': { lat: 23.1262, lng: 121.3789 },
            '臺東縣_東河鄉': { lat: 22.9837, lng: 121.2525 },
            '臺東縣_綠島鄉': { lat: 22.6609, lng: 121.4903 },
            '臺東縣_蘭嶼鄉': { lat: 22.0578, lng: 121.5502 },
            '臺東縣_長濱鄉': { lat: 23.3333, lng: 121.4523 },
            '臺東縣_池上鄉': { lat: 23.1247, lng: 121.2186 },
            '臺東縣_鹿野鄉': { lat: 22.9504, lng: 121.1360 },
            '臺東縣_關山鎮': { lat: 23.0374, lng: 121.1767 },
            '臺東縣_金峰鄉': { lat: 22.5800, lng: 120.9376 },
            '臺東縣_達仁鄉': { lat: 22.3933, lng: 120.8719 },
            '花蓮縣_秀林鄉': { lat: 24.1368, lng: 121.4810 },
            '花蓮縣_萬榮鄉': { lat: 23.7217, lng: 121.3087 },
            '花蓮縣_卓溪鄉': { lat: 23.3499, lng: 121.1702 },
            '花蓮縣_壽豐鄉': { lat: 23.8457, lng: 121.5107 },
            '花蓮縣_鳳林鎮': { lat: 23.7453, lng: 121.4473 },
            '花蓮縣_光復鄉': { lat: 23.6465, lng: 121.4234 },
            '花蓮縣_豐濱鄉': { lat: 23.5769, lng: 121.4834 },
            '花蓮縣_瑞穗鄉': { lat: 23.5024, lng: 121.3969 },
            '花蓮縣_玉里鎮': { lat: 23.3335, lng: 121.3118 },
            '花蓮縣_新城鄉': { lat: 24.0587, lng: 121.6132 },
            '花蓮縣_富里鄉': { lat: 23.1977, lng: 121.2500 },
            // 增加更多地點的經緯度...
        };
        
        // 處理每一行數據
        lines.forEach((line, index) => {
            try {
                // 檢查行是否包含113年的標記
                if (line.includes('113年') || line.includes('113 年')) {
                    currentYear = '113';
                    log(`切換到113年數據，行號: ${index + 1}`);
                    return;
                }
                
                // 跳過標題行
                if (line.includes('縣市') || line.includes('年度') || line.trim().length < 10) {
                    skippedLines++;
                    return;
                }
                
                // 分割行數據
                const parts = line.split(/\t/).filter(part => part.trim());
                if (parts.length < 8) {
                    log(`行 ${index + 1} 數據欄位不足 (${parts.length}/8): ${line.substring(0, 30)}...`, true);
                    skippedLines++;
                    return;
                }
                
                const city = parts[0].trim().replace(/\uFFFD/g, '');
                const district = parts[1].trim().replace(/\uFFFD/g, '');
                const type = parts[2].trim();
                const org = parts[3].trim();
                
                // 解析數字，確保數據有效
                const target = parseInt(parts[4].trim()) || 0;
                const complete = parseInt(parts[5].trim()) || 0;
                const eval = parseInt(parts[6].trim()) || 0;
                const confirmed = parseInt(parts[7].trim()) || 0;
                
                // 獲取經緯度
                const geoKey = `${city}_${district.split('/')[0]}`;
                let geo = geoData[geoKey];
                
                // 如果找不到精確地點，嘗試模糊匹配
                if (!geo) {
                    // 嘗試匹配相同縣市的其他區域
                    const citySameKeys = Object.keys(geoData).filter(key => key.startsWith(city + '_'));
                    if (citySameKeys.length > 0) {
                        // 使用同一縣市的第一個區域的座標
                        geo = geoData[citySameKeys[0]];
                        log(`警告: 找不到 ${geoKey} 的精確座標，使用 ${citySameKeys[0]} 的座標替代`, true);
                    } else {
                        // 如果連縣市都找不到，使用默認位置
                        geo = { lat: 23.5, lng: 121.0 }; // 默認位置為台灣中心
                        log(`警告: 找不到 ${city} 的任何座標，使用台灣中心點座標`, true);
                    }
                }
                
                // 創建數據項
                const dataItem = {
                    city,
                    district,
                    type,
                    org,
                    target,
                    complete,
                    eval,
                    confirmed,
                    lat: geo.lat,
                    lng: geo.lng
                };
                
                // 根據org決定放入哪個數組
                if (org.includes('聯評中心') || org.includes('早療中心')) {
                    result[currentYear].center.push(dataItem);
                    if (currentYear === '112') processed112Count++;
                    else processed113Count++;
                } else if (org.includes('衛生局')) {
                    result[currentYear].health.push(dataItem);
                    if (currentYear === '112') processed112Count++;
                    else processed113Count++;
                } else {
                    log(`警告: 行 ${index + 1} 組織類型不明確: "${org}"，跳過此數據`, true);
                    skippedLines++;
                }
            } catch (error) {
                log(`處理行 ${index + 1} 時出錯: ${error.message}`, true);
                skippedLines++;
            }
        });
        
        // 總結處理結果
        const total112 = result['112'].center.length + result['112'].health.length;
        const total113 = result['113'].center.length + result['113'].health.length;
        const totalItems = total112 + total113;
        
        log(`數據處理完成。總共處理了 ${processed112Count + processed113Count} 條有效數據，跳過了 ${skippedLines} 行。`);
        log(`112年: ${total112}條 (中心: ${result['112'].center.length}, 衛生局: ${result['112'].health.length})`);
        log(`113年: ${total113}條 (中心: ${result['113'].center.length}, 衛生局: ${result['113'].health.length})`);
        
        if (totalItems < 100) {
            log('警告: 總數據項少於預期，建議檢查原始數據格式是否正確', true);
        }
        
        // 輸出結果
        console.log(JSON.stringify(result, null, 2));
        log('數據處理完成。請複製上面的JSON數據並保存到data.json文件中。');
        
        return result;
    } catch (error) {
        log(`處理數據時出錯: ${error.message}`, true);
        throw error;
    }
}

// 輔助函數：生成一個默認的坐標數據
function generateCoordinates() {
    // 台灣島中心點
    const centerLat = 23.5;
    const centerLng = 121.0;
    
    // 隨機生成以中心點為基礎的坐標
    return {
        lat: centerLat + (Math.random() - 0.5) * 2,
        lng: centerLng + (Math.random() - 0.5) * 1.5
    };
}

// 下載處理後的JSON數據
function downloadJSON(data) {
    try {
        if (!data) {
            data = processDataAndGenerate();
        }
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'data.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        log('數據已下載為 data.json 文件');
        return true;
    } catch (error) {
        log(`下載JSON時出錯: ${error.message}`, true);
        throw error;
    }
} 