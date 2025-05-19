// 簡易HTTP服務器，用於解決本地CORS問題
// 使用方法：安裝Node.js後，運行 node server.js

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const XLSX = require('xlsx'); // 需要安裝：npm install xlsx
const geocoder = require('./geocoder'); // 引入地理編碼模塊

// 配置端口
const PORT = 8088;

// Excel檔案路徑
const EXCEL_FILE_PATH = './Excel/20250518.xlsx';

// MIME類型映射
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.xls': 'application/vnd.ms-excel'
};

// 處理Excel數據
async function processExcelData(filePath) {
    try {
        // 讀取Excel文件
        const workbook = XLSX.readFile(filePath);
        
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
        
        // 檢查工作表命名
        console.log('Excel工作表列表:', workbook.SheetNames);
        
        // 如果只有一個工作表，手動添加113年數據結構
        if (workbook.SheetNames.length === 1) {
            console.log('警告: Excel只有一個工作表，將根據行內容區分112/113年數據');
        }
        
        // 遍歷所有工作表
        for (let i = 0; i < workbook.SheetNames.length; i++) {
            const sheetName = workbook.SheetNames[i];
            const worksheet = workbook.Sheets[sheetName];
            
            // 確定年份 - 預設第一個工作表是112年，其餘是113年
            let year = i === 0 ? '112' : '113';
            
            // 從工作表名稱嘗試檢測年份
            if (sheetName.includes('113') || sheetName.toLowerCase().includes('113年')) {
                year = '113';
                console.log(`工作表 ${sheetName} 根據名稱判斷為113年數據`);
            } else if (sheetName.includes('112') || sheetName.toLowerCase().includes('112年')) {
                year = '112';
                console.log(`工作表 ${sheetName} 根據名稱判斷為112年數據`);
            } else {
                // 如果工作表名稱中沒有年份資訊，嘗試從內容推斷
                console.log(`工作表 ${sheetName} 無法從名稱判斷年份，將嘗試從內容推斷`);
            }
            
            console.log(`處理工作表: ${sheetName}，判斷為${year}年數據`);
            
            // 轉換為JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            console.log(`工作表 ${sheetName} 解析成功，共${jsonData.length}行數據`);
            if (jsonData.length > 1) {
                console.log(`${sheetName} 第一行數據樣本:`, jsonData[1] || '無數據');
            }
            
            // 處理該工作表的數據
            const sheetData = await convertExcelDataToAppFormat(jsonData, year);
            
            // 合併數據到總結果中
            if (sheetData && sheetData[year]) {
                result[year].center = result[year].center.concat(sheetData[year].center || []);
                result[year].health = result[year].health.concat(sheetData[year].health || []);
            }
        }
        
        // 統計數據
        console.log(`112年中心數據: ${result['112'].center.length} 條`);
        console.log(`112年衛生局數據: ${result['112'].health.length} 條`);
        console.log(`113年中心數據: ${result['113'].center.length} 條`);
        console.log(`113年衛生局數據: ${result['113'].health.length} 條`);
        
        // 檢查113年數據是否為空
        if (result['113'].center.length === 0 && result['113'].health.length === 0) {
            console.log('警告: 113年數據為空，可能是Excel中沒有113年數據或無法識別');
        }
        
        return result;
    } catch (error) {
        console.error(`Excel處理錯誤: ${error.message}`);
        throw error;
    }
}

// 將Excel數據轉換為應用程序需要的格式
async function convertExcelDataToAppFormat(excelData, specificYear = null) {
    try {
        console.log('開始將Excel數據轉換為應用程序格式...');
        
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
        
        // 追踪所有處理的數據 (新增)
        const processedData = {
            total: 0,
            designated: 0,
            designatedList: [],
            missingCityOrDistrict: 0,
            missingCityOrDistrictList: []
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
        
        // 顯示標題行內容 (新增)
        console.log('找到標題行:', headerRow);
        
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
            designated: -1,  // 新增指定/自選地區列
            lat: -1, // 新增經緯度欄位
            lng: -1
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
                console.log(`找到指定/自選地區列，索引為: ${index}, 標題為: ${headerStr}`);
            } else if (headerStr.includes('緯度') || headerStr === 'lat') {
                columns.lat = index;
                console.log(`找到緯度列，索引為: ${index}`);
            } else if (headerStr.includes('經度') || headerStr === 'lng') {
                columns.lng = index;
                console.log(`找到經度列，索引為: ${index}`);
            }
        });
        
        // 顯示列索引 (新增)
        console.log('列索引映射:', columns);
        
        // 檢查是否找到必要的列
        const requiredColumns = ['city', 'district', 'targetCount', 'completedCount'];
        const missingColumns = requiredColumns.filter(col => columns[col] === -1);
        
        if (missingColumns.length > 0) {
            throw new Error(`Excel中缺少必要列: ${missingColumns.join(', ')}`);
        }
        
        // 預處理地址以進行地理編碼
        console.log('開始預處理地址進行地理編碼...');
        const addressesToGeocode = [];
        
        // 第一遍掃描，收集所有需要地理編碼的地址
        for (let i = headerRowIndex + 1; i < excelData.length; i++) {
            const row = excelData[i];
            if (!row || !Array.isArray(row) || row.length === 0) continue;
            
            // 獲取地址
            const city = row[columns.city] ? String(row[columns.city]).trim() : '';
            const district = row[columns.district] ? String(row[columns.district]).trim() : '';
            
            if (!city || !district) continue;
            
            // 檢查是否已有經緯度
            let hasCoordinates = false;
            if (columns.lat !== -1 && columns.lng !== -1) {
                hasCoordinates = row[columns.lat] && row[columns.lng];
            }
            
            // 如果沒有經緯度，添加到需要編碼的地址列表
            if (!hasCoordinates) {
                addressesToGeocode.push({
                    city,
                    district,
                    id: `${i}` // 使用行號作為ID
                });
            }
        }
        
        console.log(`共有 ${addressesToGeocode.length} 個地址需要地理編碼`);
        
        // 進行批量地理編碼
        const geocodeResults = {};
        if (addressesToGeocode.length > 0) {
            console.log('開始批量地理編碼...');
            const results = await geocoder.batchGeocode(addressesToGeocode);
            Object.assign(geocodeResults, results);
            console.log(`地理編碼完成，共處理 ${Object.keys(results).length} 個地址`);
        }
        
        // 處理每一行數據
        for (let i = headerRowIndex + 1; i < excelData.length; i++) {
            const row = excelData[i];
            if (!row || !Array.isArray(row) || row.length === 0) continue;
            
            processedData.total++; // 總處理記錄數 (新增)
            
            // 獲取數據
            const city = row[columns.city] ? String(row[columns.city]).trim() : '';
            const district = row[columns.district] ? String(row[columns.district]).trim() : '';
            
            // 獲取數值型數據並確保為數字類型
            const targetCount = parseInt(row[columns.targetCount]) || 0;
            const completedCount = parseInt(row[columns.completedCount]) || 0;
            const evaluationCount = columns.evaluationCount !== -1 ? parseInt(row[columns.evaluationCount]) || 0 : 0;
            const diagnosedCount = columns.diagnosedCount !== -1 ? parseInt(row[columns.diagnosedCount]) || 0 : 0;
            
            // 處理缺少縣市或區域的情況 (新增)
            if (!city || !district) {
                processedData.missingCityOrDistrict++;
                processedData.missingCityOrDistrictList.push({
                    row: i + 1,
                    data: row
                });
                console.log(`警告: 第${i + 1}行缺少縣市或區域資料`);
                continue;
            }
            
            // 確定年度 (如果沒有明確年度列，則使用傳入的specificYear或112作為默認值)
            let year = specificYear || '112';
            if (columns.year !== -1 && row[columns.year]) {
                const yearValue = String(row[columns.year]).trim();
                if (yearValue.includes('113')) {
                    year = '113';
                }
            } else {
                // 嘗試從列名中檢測年份
                const rowString = JSON.stringify(row);
                if (rowString.includes('113') || rowString.includes('民國113')) {
                    year = '113';
                    console.log(`根據行內容判斷年份為 113 年: ${rowString.substring(0, 50)}...`);
                }
            }
            
            // 如果指定了年份，強制使用指定的年份
            if (specificYear) {
                year = specificYear;
            }
            
            // 確定類型 (center或health)
            let type = 'center'; // 默認為中心類型
            if (columns.type !== -1 && row[columns.type]) {
                const typeValue = String(row[columns.type]).trim();
                if (typeValue.includes('衛生局') || typeValue.includes('health') || typeValue.toLowerCase().includes('健康') || typeValue === '衛生') {
                    type = 'health';
                    console.log(`第${i + 1}行判斷為衛生局數據: ${typeValue}`);
                } else {
                    console.log(`第${i + 1}行判斷為中心數據: ${typeValue}`);
                }
            } else {
                // 如果Excel沒有明確的類型列，嘗試從其他列推斷
                const rowStr = JSON.stringify(row).toLowerCase();
                if (rowStr.includes('衛生局') || rowStr.includes('衛生') || rowStr.includes('health') || rowStr.includes('健康')) {
                    type = 'health';
                    console.log(`第${i + 1}行從行內容推斷為衛生局數據`);
                }
            }
            
            // 手動檢查：如果有任何特定列包含"衛生"關鍵字
            if (row[3] && String(row[3]).includes('衛生')) {
                type = 'health';
                console.log(`第${i + 1}行根據第4列(${row[3]})設置為衛生局數據`);
            }
            
            // 判斷是否為指定地區 - 直接從Excel欄位讀取（如果存在）
            let isDesignated = false;
            if (columns.designated !== -1 && row[columns.designated]) {
                const designatedValue = String(row[columns.designated]).trim();
                isDesignated = designatedValue.includes('指定');
                console.log(`第${i + 1}行直接從Excel讀取指定/自選: ${designatedValue} -> ${isDesignated ? '指定' : '自選'}`);
            } else {
                // 如果Excel中沒有指定欄位或值為空，則使用原有的判斷邏輯
                isDesignated = determineIfDesignated(city, district, targetCount);
                console.log(`第${i + 1}行使用計算邏輯判斷指定/自選: ${isDesignated ? '指定' : '自選'}`);
            }
            
            if (isDesignated) {
                processedData.designated++;
                processedData.designatedList.push({
                    city,
                    district,
                    targetCount,
                    year,
                    type
                });
            }
            
            // 獲取經緯度 - 優先使用Excel中的值，其次使用地理編碼結果
            let lat, lng;
            
            // 檢查Excel中是否有經緯度
            if (columns.lat !== -1 && columns.lng !== -1 && row[columns.lat] && row[columns.lng]) {
                lat = parseFloat(row[columns.lat]);
                lng = parseFloat(row[columns.lng]);
                console.log(`第${i + 1}行使用Excel中的經緯度: [${lat}, ${lng}]`);
            } 
            // 使用地理編碼結果
            else if (geocodeResults[`${i}`]) {
                lat = geocodeResults[`${i}`].lat;
                lng = geocodeResults[`${i}`].lng;
                console.log(`第${i + 1}行使用地理編碼結果: [${lat}, ${lng}]`);
            }
            
            // 創建數據項
            const dataItem = {
                city: city,
                district: district,
                target: targetCount,  // 前端期望的字段名
                complete: completedCount,  // 前端期望的字段名
                eval: evaluationCount,  // 前端期望的字段名
                confirmed: diagnosedCount,  // 前端期望的字段名
                type: type === 'center' ? '聯合評估中心' : '衛生局',  // 顯示名稱
                org: `${city}${district}${type === 'center' ? '聯合評估中心' : '衛生局'}`,  // 組織名稱
                lat: lat + (type === 'center' ? 0.001 : -0.001), // 聯合評估中心向北偏移，衛生局向南偏移
                lng: lng + (type === 'center' ? 0.001 : -0.001), // 聯合評估中心向東偏移，衛生局向西偏移
                isDesignated: isDesignated
            };
            
            // 確保所有必要的數據欄位都有值
            if (!dataItem.lat || !dataItem.lng) {
                console.log(`警告: 第${i + 1}行缺少經緯度數據，將被跳過`);
                continue;
            }
            
            // 確保數值型數據為數字類型
            console.log('數據項處理:', {
                行號: i + 1,
                城市: city,
                區域: district,
                是否指定區域: isDesignated ? '是' : '否',
                類型: type,
                經緯度: `[${lat}, ${lng}]`
            });
            
            // 將數據添加到對應的數據結構
            result[year][type].push(dataItem);
        }
        
        // 統計處理了多少條數據
        let totalCount = 0;
        let designatedCount = 0;
        
        Object.keys(result).forEach(year => {
            Object.keys(result[year]).forEach(type => {
                const items = result[year][type];
                totalCount += items.length;
                designatedCount += items.filter(item => item.isDesignated).length;
            });
        });
        
        // 顯示處理統計 (新增)
        console.log('===== 資料處理統計 =====');
        console.log(`總讀取記錄數: ${processedData.total}`);
        console.log(`缺少縣市或區域的記錄數: ${processedData.missingCityOrDistrict}`);
        console.log(`指定區域數量: ${processedData.designated}`);
        console.log(`實際加入到資料中的記錄總數: ${totalCount}`);
        console.log(`最終資料中的指定區域數量: ${designatedCount}`);
        
        // 顯示指定區域清單 (新增)
        console.log('===== 指定區域清單 =====');
        processedData.designatedList.forEach((item, index) => {
            console.log(`${index + 1}. ${item.city}${item.district} (${item.year}年, ${item.type === 'center' ? '中心' : '衛生局'}, 目標場數: ${item.targetCount})`);
        });
        
        console.log(`Excel數據處理完成，共處理了${totalCount}條記錄，其中${designatedCount}條為指定區域`);
        return result;
    } catch (error) {
        console.error(`轉換Excel數據時出錯: ${error.message}`);
        throw error;
    }
}

// 判斷是否為指定地區的函數（可以根據實際需求調整判斷邏輯）
function determineIfDesignated(city, district, targetCount) {
    // 基於目標場數的判斷邏輯，如果目標場數大於5則視為指定地區
    if (targetCount > 5) {
        return true;
    }
    
    // 特定縣市/區域的判斷邏輯（可根據實際情況修改）
    const designatedAreas = [
        // 台北市的部分區域
        '臺北市_大安區', '臺北市_信義區', '臺北市_中正區',
        '台北市_大安區', '台北市_信義區', '台北市_中正區',
        
        // 新北市的部分區域
        '新北市_板橋區', '新北市_中和區', '新北市_三重區',
        
        // 台中市的部分區域
        '臺中市_西屯區', '臺中市_北區', '臺中市_南區',
        '台中市_西屯區', '台中市_北區', '台中市_南區',
        
        // 高雄市的部分區域
        '高雄市_前鎮區', '高雄市_鳳山區', '高雄市_三民區'
    ];
    
    // 檢查是否在指定區域列表中
    if (designatedAreas.includes(`${city}_${district}`)) {
        return true;
    }
    
    return false;
}

// 創建HTTP服務器
const server = http.createServer((req, res) => {
    console.log(`接收請求: ${req.method} ${req.url}`);
    
    // 解析URL
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;  // 改用 let 聲明
    
    // API端點：直接獲取Excel數據
    if (pathname === '/api/excel-data') {
        try {
            // 使用異步函數處理Excel數據
            processExcelData(path.join(__dirname, EXCEL_FILE_PATH))
                .then(excelData => {
                    // 調試輸出
                    console.log('返回的數據示例:', {
                        '112年中心第1項': excelData['112'].center[0] || 'No data',
                        '112年衛生局第1項': excelData['112'].health[0] || 'No data'
                    });
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(excelData));
                })
                .catch(error => {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: error.message }));
                });
            return;
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
            return;
        }
    }
    
    // 處理根路徑請求
    if (pathname === '/') {
        pathname = '/index.html';
    }
    
    // 添加對資料檢查頁面的支持
    if (pathname === '/check' || pathname === '/check/') {
        pathname = '/data-check.html';
    }
    
    // 獲取文件路徑
    const filePath = path.join(__dirname, pathname);
    
    // 檢查文件是否存在
    fs.exists(filePath, (exists) => {
        if (!exists) {
            // 返回404錯誤
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            console.log(`文件不存在: ${filePath}`);
            return;
        }
        
        // 獲取文件擴展名
        const ext = path.extname(filePath);
        
        // 設置Content-Type
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        
        // 讀取文件
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('500 Internal Server Error');
                console.error(`讀取文件出錯: ${err.message}`);
                return;
            }
            
            // 返回文件內容
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    });
});

// 啟動服務器
server.listen(PORT, () => {
    console.log(`服務器運行於 http://localhost:${PORT}/`);
    console.log(`請在瀏覽器中訪問上面的地址以查看早期療育資訊地圖`);
    console.log(`Excel數據自動從 ${EXCEL_FILE_PATH} 讀取`);
    console.log(`按 Ctrl+C 停止服務器`);
}); 