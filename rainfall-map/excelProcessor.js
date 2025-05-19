// Excel數據處理腳本
// 使用SheetJS (xlsx) 來讀取Excel文件

// 引入SheetJS庫 (需要在HTML中添加相應的script標籤)
// 以下代碼假設已經在HTML中添加了SheetJS庫

// 用於直接讀取Excel文件的函數
async function readDefaultExcelFile() {
    try {
        const response = await fetch('./Excel/20250518.xlsx');
        if (!response.ok) {
            throw new Error(`無法載入Excel文件：${response.status} ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // 獲取第一個工作表
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // 轉換為JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        log(`Excel文件解析成功，共${jsonData.length}行數據`);
        return jsonData;
    } catch (error) {
        log(`讀取默認Excel文件時出錯: ${error.message}`, true);
        throw error;
    }
}

// 用於記錄日誌的輔助函數
function log(message, isError = false) {
    console[isError ? 'error' : 'log'](message);
    // 如果存在錯誤日誌元素，則更新它
    const errorLog = document.getElementById('error-log');
    if (errorLog && isError) {
        errorLog.style.display = 'block';
        errorLog.innerHTML += `<p>${message}</p>`;
    }
}

// 用於解析Excel文件的函數
async function parseExcelFile(file) {
    return new Promise((resolve, reject) => {
        try {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    // 讀取Excel二進制數據
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    // 獲取第一個工作表
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    
                    // 轉換為JSON
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    
                    log(`Excel文件解析成功，共${jsonData.length}行數據`);
                    resolve(jsonData);
                } catch (error) {
                    log(`Excel解析錯誤: ${error.message}`, true);
                    reject(error);
                }
            };
            
            reader.onerror = function(error) {
                log(`讀取文件錯誤: ${error}`, true);
                reject(error);
            };
            
            // 開始讀取文件
            reader.readAsArrayBuffer(file);
        } catch (error) {
            log(`Excel處理錯誤: ${error.message}`, true);
            reject(error);
        }
    });
}

// 根據縣市自動生成位置
function generateLocation(city, district) {
    // 台灣主要縣市的大致中心點
    const cityCoords = {
        "台北市": { lat: 25.0330, lng: 121.5654 },
        "臺北市": { lat: 25.0330, lng: 121.5654 },
        "新北市": { lat: 25.0000, lng: 121.4651 },
        "桃園市": { lat: 24.9936, lng: 121.3010 },
        "台中市": { lat: 24.1477, lng: 120.6736 },
        "臺中市": { lat: 24.1477, lng: 120.6736 },
        "台南市": { lat: 22.9999, lng: 120.2268 },
        "臺南市": { lat: 22.9999, lng: 120.2268 },
        "高雄市": { lat: 22.6273, lng: 120.3014 },
        "基隆市": { lat: 25.1276, lng: 121.7392 },
        "新竹市": { lat: 24.8138, lng: 120.9675 },
        "新竹縣": { lat: 24.8390, lng: 121.0177 },
        "苗栗縣": { lat: 24.5600, lng: 120.8200 },
        "彰化縣": { lat: 24.0800, lng: 120.5400 },
        "南投縣": { lat: 23.9157, lng: 120.6750 },
        "雲林縣": { lat: 23.7100, lng: 120.4310 },
        "嘉義市": { lat: 23.4800, lng: 120.4491 },
        "嘉義縣": { lat: 23.4518, lng: 120.2555 },
        "屏東縣": { lat: 22.5520, lng: 120.5487 },
        "宜蘭縣": { lat: 24.7021, lng: 121.7377 },
        "花蓮縣": { lat: 23.9871, lng: 121.6011 },
        "台東縣": { lat: 22.7583, lng: 121.1444 },
        "臺東縣": { lat: 22.7583, lng: 121.1444 },
        "澎湖縣": { lat: 23.5711, lng: 119.5792 },
        "金門縣": { lat: 24.4493, lng: 118.3767 },
        "連江縣": { lat: 26.1505, lng: 119.9499 }
    };

    // 如果找到城市，使用其座標作為基準點
    if (cityCoords[city]) {
        // 在基準點周圍隨機生成一個位置（範圍約2-3公里）
        const latOffset = (Math.random() - 0.5) * 0.02;
        const lngOffset = (Math.random() - 0.5) * 0.02;
        
        return {
            lat: cityCoords[city].lat + latOffset,
            lng: cityCoords[city].lng + lngOffset
        };
    }
    
    // 如果找不到城市，使用台灣中心點
    return {
        lat: 23.5734 + (Math.random() - 0.5) * 0.02,
        lng: 120.9739 + (Math.random() - 0.5) * 0.02
    };
}

// 載入地理位置資訊
async function loadLocations() {
    // 不再需要載入外部資料
    return {};
}

// 將Excel數據轉換為應用程序需要的格式
async function convertExcelDataToAppFormat(excelData) {
    try {
        log('開始將Excel數據轉換為應用程序格式...');
        
        // 初始化結果結構
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
        
        // 查找標題行
        let headerRowIndex = -1;
        for (let i = 0; i < excelData.length; i++) {
            const row = excelData[i];
            if (row && Array.isArray(row) && row.some(cell => 
                cell && typeof cell === 'string' && (
                    cell.includes('縣市') || 
                    cell.includes('區域') || 
                    cell.includes('目標場數')
                )
            )) {
                headerRowIndex = i;
                break;
            }
        }
        
        if (headerRowIndex === -1) {
            throw new Error('無法在Excel中找到標題行');
        }
        
        const headerRow = excelData[headerRowIndex];
        
        // 找出每個列對應的索引
        const columns = {
            year: -1,
            city: -1,
            district: -1,
            type: -1,
            targetCount: -1,
            completedCount: -1,
            evaluationCount: -1,
            diagnosedCount: -1,
            designated: -1
        };
        
        headerRow.forEach((header, index) => {
            if (!header) return;
            
            const headerStr = String(header).trim();
            
            if (headerStr.includes('年') || headerStr.includes('年度')) {
                columns.year = index;
            } else if (headerStr.includes('縣市') || headerStr === '縣市') {
                columns.city = index;
            } else if (headerStr.includes('區域') || headerStr === '區' || headerStr === '區域') {
                columns.district = index;
            } else if (headerStr.includes('類型') || headerStr.includes('中心類型')) {
                columns.type = index;
            } else if (headerStr.includes('目標場數')) {
                columns.targetCount = index;
            } else if (headerStr.includes('完成場數')) {
                columns.completedCount = index;
            } else if (headerStr.includes('評估數')) {
                columns.evaluationCount = index;
            } else if (headerStr.includes('確診數')) {
                columns.diagnosedCount = index;
            } else if (headerStr.includes('指定') || headerStr.includes('自選') || 
                      headerStr.includes('地區類型')) {
                columns.designated = index;
            }
        });
        
        // 檢查是否找到必要的列
        const requiredColumns = ['city', 'district', 'targetCount', 'completedCount'];
        const missingColumns = requiredColumns.filter(col => columns[col] === -1);
        
        if (missingColumns.length > 0) {
            throw new Error(`Excel中缺少必要列: ${missingColumns.join(', ')}`);
        }
        
        // 處理每一行數據
        for (let i = headerRowIndex + 1; i < excelData.length; i++) {
            const row = excelData[i];
            if (!row || !Array.isArray(row) || row.length === 0) continue;
            
            // 獲取數據
            const city = row[columns.city] ? String(row[columns.city]).trim() : '';
            const district = row[columns.district] ? String(row[columns.district]).trim() : '';
            
            if (!city || !district) continue;
            
            // 確定年度 (如果沒有明確年度列，則使用112作為默認值)
            let year = '112';
            if (columns.year !== -1 && row[columns.year]) {
                const yearValue = String(row[columns.year]).trim();
                if (yearValue.includes('113')) {
                    year = '113';
                }
            }
            
            // 確定類型 (center或health)
            let type = 'center'; // 默認為中心類型
            if (columns.type !== -1 && row[columns.type]) {
                const typeValue = String(row[columns.type]).trim();
                if (typeValue.includes('衛生局') || typeValue.includes('health')) {
                    type = 'health';
                }
            }
            
            // 判斷是否為指定地區
            let isDesignated = false;
            if (columns.designated !== -1 && row[columns.designated]) {
                const designatedValue = String(row[columns.designated]).trim();
                isDesignated = designatedValue.includes('指定');
                log(`第${i + 1}行直接從Excel讀取指定/自選: ${designatedValue} -> ${isDesignated ? '指定' : '自選'}`);
            } else {
                // 如果沒有指定列，則使用目標場數 > 5 的規則
                isDesignated = (parseInt(row[columns.targetCount]) || 0) > 5;
                log(`第${i + 1}行使用目標場數判斷指定/自選: ${isDesignated ? '指定' : '自選'}`);
            }
            
            // 生成地理位置
            const location = generateLocation(city, district);
            
            // 創建數據項
            const dataItem = {
                city: city,
                district: district,
                targetCount: parseInt(row[columns.targetCount]) || 0,
                completedCount: parseInt(row[columns.completedCount]) || 0,
                evaluationCount: columns.evaluationCount !== -1 ? (parseInt(row[columns.evaluationCount]) || 0) : 0,
                diagnosedCount: columns.diagnosedCount !== -1 ? (parseInt(row[columns.diagnosedCount]) || 0) : 0,
                isDesignated: isDesignated,
                type: type === 'center' ? '聯評中心' : '衛生局',
                lat: location.lat + (type === 'center' ? 0.0005 : -0.0005),
                lng: location.lng + (type === 'center' ? 0.0005 : -0.0005)
            };
            
            // 添加到對應的數據結構
            result[year][type].push(dataItem);
        }
        
        // 統計處理了多少條數據
        let totalCount = 0;
        Object.keys(result).forEach(year => {
            Object.keys(result[year]).forEach(type => {
                totalCount += result[year][type].length;
            });
        });
        
        log(`Excel數據處理完成，共處理了${totalCount}條記錄`);
        return result;
    } catch (error) {
        log(`轉換Excel數據時出錯: ${error.message}`, true);
        throw error;
    }
}

// 處理上傳的Excel文件並生成JSON數據
async function processExcelFile(file) {
    try {
        log('開始處理Excel文件...');
        
        // 解析Excel文件
        const excelData = await parseExcelFile(file);
        
        // 轉換為應用程序格式
        const processedData = await convertExcelDataToAppFormat(excelData);
        
        // 返回處理後的數據
        return processedData;
    } catch (error) {
        log(`處理Excel文件時出錯: ${error.message}`, true);
        throw error;
    }
}

// 初始化數據處理
async function initializeData() {
    try {
        log('開始初始化數據...');
        const excelData = await readDefaultExcelFile();
        const processedData = await convertExcelDataToAppFormat(excelData);
        return processedData;
    } catch (error) {
        log(`初始化數據時出錯: ${error.message}`, true);
        throw error;
    }
} 