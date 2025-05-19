/**
 * 地理編碼模塊 - 使用OpenStreetMap Nominatim API
 * 用於將台灣地址轉換為經緯度坐標
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const addressCache = require('./address-cache'); // 引入地址對照表

// 緩存文件
const CACHE_FILE = path.join(__dirname, 'geocode_cache.json');

// 載入緩存或創建新緩存
let geocodeCache = {};
try {
    if (fs.existsSync(CACHE_FILE)) {
        geocodeCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
        console.log(`已載入地理編碼緩存，共 ${Object.keys(geocodeCache).length} 條記錄`);
    } else {
        console.log('地理編碼緩存不存在，將創建新緩存');
    }
} catch (error) {
    console.error(`載入緩存失敗: ${error.message}`);
}

// 保存緩存至文件
function saveCache() {
    try {
        fs.writeFileSync(CACHE_FILE, JSON.stringify(geocodeCache, null, 2));
        console.log(`已保存地理編碼緩存，共 ${Object.keys(geocodeCache).length} 條記錄`);
    } catch (error) {
        console.error(`保存緩存失敗: ${error.message}`);
    }
}

// 延時函數 - 避免API請求過於頻繁
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 查詢地址經緯度
async function geocodeAddress(city, district) {
    if (!city || !district) {
        console.warn('地理編碼失敗: 城市或區域為空');
        return defaultLocation();
    }
    
    const cacheKey = `${city}_${district}`;
    
    // 先檢查緩存
    if (geocodeCache[cacheKey]) {
        console.log(`使用緩存的地理編碼: ${city}${district} => [${geocodeCache[cacheKey].lat}, ${geocodeCache[cacheKey].lng}]`);
        return geocodeCache[cacheKey];
    }
    
    // 嘗試從地址對照表獲取坐標
    console.log(`嘗試從地址對照表獲取: ${city}${district}`);
    const coordinates = addressCache.getCoordinates(city, district);
    
    if (coordinates) {
        console.log(`從地址對照表找到坐標: ${city}${district} => [${coordinates.lat}, ${coordinates.lng}]`);
        
        // 將結果保存到緩存
        geocodeCache[cacheKey] = coordinates;
        saveCache();
        
        return coordinates;
    }
    
    // 如果對照表中沒有，則使用API查詢
    try {
        const address = `${district}, ${city}, Taiwan`;
        console.log(`從地址對照表未找到，使用API查詢地址: ${address}`);
        
        // 發送API請求
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
            {
                headers: {
                    'User-Agent': 'TaiwanEarlyInterventionMap/1.0'
                }
            }
        );
        
        // 解析響應
        const data = await response.json();
        
        if (data && data.length > 0) {
            const result = {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
            
            console.log(`API地理編碼成功: ${city}${district} => [${result.lat}, ${result.lng}]`);
            
            // 保存到緩存
            geocodeCache[cacheKey] = result;
            saveCache();
            
            // 延時1秒，避免API調用過於頻繁
            await delay(1000);
            
            return result;
        } else {
            console.warn(`API地理編碼無結果: ${address}`);
        }
    } catch (error) {
        console.error(`API地理編碼錯誤: ${error.message}`);
    }
    
    // 如果API查詢失敗，則使用縣市中心點
    const defaultLoc = defaultLocation(city);
    console.warn(`所有地理編碼嘗試失敗，使用預設位置: ${city}${district} => [${defaultLoc.lat}, ${defaultLoc.lng}]`);
    return defaultLoc;
}

// 預設位置（台灣中心點）- 現在使用地址對照表
function defaultLocation(city) {
    if (city && addressCache.CITY_CENTERS[city]) {
        const cityCoords = addressCache.CITY_CENTERS[city];
        return {
            lat: cityCoords.lat + (Math.random() * 0.02 - 0.01),
            lng: cityCoords.lng + (Math.random() * 0.02 - 0.01)
        };
    }
    
    // 預設台灣中心
    return {
        lat: 23.5 + (Math.random() * 0.5 - 0.25),
        lng: 121.0 + (Math.random() * 0.5 - 0.25)
    };
}

// 批量處理多個地址
async function batchGeocode(addresses) {
    const results = {};
    
    for (const { city, district, id } of addresses) {
        const key = id || `${city}_${district}`;
        results[key] = await geocodeAddress(city, district);
    }
    
    return results;
}

// 導出模塊功能
module.exports = {
    geocodeAddress,
    batchGeocode,
    getCachedAddresses: () => Object.keys(geocodeCache),
    getCacheSize: () => Object.keys(geocodeCache).length
}; 