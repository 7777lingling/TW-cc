let map;
let markers = [];
let currentFilters = {
    year: 112,  // 預設顯示112年資料
    type: '全部',
    region: '全部'
};

// 初始化地圖
function initMap() {
    map = L.map('map').setView([23.5, 121], 8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // 設定地圖邊界
    const bounds = L.latLngBounds(
        L.latLng(21.5, 118),
        L.latLng(26.5, 122.5)
    );
    map.setMaxBounds(bounds);
    map.setMinZoom(7);
    map.setMaxZoom(12);
}

// 載入資料
async function loadData() {
    try {
        const response = await fetch(`/api/EarlyIntervention?year=${currentFilters.year}&type=${currentFilters.type}&region=${currentFilters.region}`);
        if (!response.ok) {
            throw new Error(`HTTP 錯誤：${response.status}`);
        }
        const data = await response.json();
        updateMarkers(data);
        updateTable(data);
        updateStats(data);
    } catch (error) {
        console.error('載入資料時發生錯誤:', error);
        alert('載入資料時發生錯誤，請稍後再試');
    }
}

// 更新地圖標記
function updateMarkers(data) {
    // 清除現有標記
    markers.forEach(marker => marker.remove());
    markers = [];

    data.forEach(item => {
        const marker = L.circleMarker([item.latitude, item.longitude], {
            radius: calculateRadius(item.targetCount),
            color: getColorByRate(item.completionRate),
            fillColor: getColorByRate(item.completionRate),
            fillOpacity: 0.7
        });

        marker.bindPopup(`
            <h4>${item.county}${item.district}</h4>
            <p>類型: ${item.type}</p>
            <p>目標場數: ${item.targetCount}</p>
            <p>完成場數: ${item.completedCount}</p>
            <p>完成率: ${(item.completionRate * 100).toFixed(1)}%</p>
            <p>地址: ${item.address || '無'}</p>
            <p>聯絡資訊: ${item.contactInfo || '無'}</p>
        `);

        marker.addTo(map);
        markers.push(marker);
    });
}

// 更新資料表格
function updateTable(data) {
    const tbody = document.querySelector('#dataTable tbody');
    tbody.innerHTML = '';

    data.sort((a, b) => a.county.localeCompare(b.county, 'zh-TW'))
        .forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.county}${item.district}</td>
                <td>${item.type}</td>
                <td>${item.targetCount}</td>
                <td>${item.completedCount}</td>
                <td>${(item.completionRate * 100).toFixed(1)}%</td>
            `;
            tbody.appendChild(row);
        });
}

// 更新統計資訊
function updateStats(data) {
    const stats = data.reduce((acc, curr) => {
        acc.totalTarget += curr.targetCount;
        acc.totalComplete += curr.completedCount;
        return acc;
    }, { totalTarget: 0, totalComplete: 0 });

    document.getElementById('totalTarget').textContent = stats.totalTarget;
    document.getElementById('totalComplete').textContent = stats.totalComplete;
    document.getElementById('completionRate').textContent = 
        stats.totalTarget > 0 
            ? `${((stats.totalComplete / stats.totalTarget) * 100).toFixed(1)}%` 
            : '0%';
}

// 根據完成率取得顏色
function getColorByRate(rate) {
    if (rate >= 0.9) return '#2ecc71';  // 綠色
    if (rate >= 0.7) return '#f1c40f';  // 黃色
    if (rate >= 0.5) return '#e67e22';  // 橙色
    return '#e74c3c';  // 紅色
}

// 計算標記大小
function calculateRadius(targetCount) {
    return Math.sqrt(targetCount) * 2 + 5;  // 最小半徑為5
}

// 初始化篩選器
async function initFilters() {
    try {
        // 年份選擇器
        const yearSelect = document.getElementById('yearSelect');
        const years = await (await fetch('/api/EarlyIntervention/years')).json();
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = `${year}年`;
            if (year === currentFilters.year) {
                option.selected = true;
            }
            yearSelect.appendChild(option);
        });

        // 類型選擇器
        const typeSelect = document.getElementById('typeSelect');
        const types = await (await fetch('/api/EarlyIntervention/types')).json();
        types.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            typeSelect.appendChild(option);
        });

        // 地區選擇器
        const regionSelect = document.getElementById('regionSelect');
        const regions = await (await fetch('/api/EarlyIntervention/regions')).json();
        regions.forEach(region => {
            const option = document.createElement('option');
            option.value = region;
            option.textContent = region;
            regionSelect.appendChild(option);
        });

        // 添加事件監聽器
        yearSelect.addEventListener('change', handleFilterChange);
        typeSelect.addEventListener('change', handleFilterChange);
        regionSelect.addEventListener('change', handleFilterChange);
    } catch (error) {
        console.error('初始化篩選器時發生錯誤:', error);
        alert('初始化篩選器時發生錯誤，請重新整理頁面');
    }
}

// 處理篩選器變化
function handleFilterChange() {
    currentFilters.year = parseInt(document.getElementById('yearSelect').value);
    currentFilters.type = document.getElementById('typeSelect').value;
    currentFilters.region = document.getElementById('regionSelect').value;
    loadData();
}

// 頁面載入完成後初始化
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    initFilters().then(() => loadData());
}); 