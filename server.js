// 簡易HTTP服務器，用於解決本地CORS問題
// 使用方法：安裝Node.js後，運行 node server.js

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// 配置端口
const PORT = 8080;

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
    '.txt': 'text/plain'
};

// 創建HTTP服務器
const server = http.createServer((req, res) => {
    console.log(`接收請求: ${req.method} ${req.url}`);
    
    // 解析URL
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;
    
    // 處理根路徑請求
    if (pathname === '/') {
        pathname = '/index.html';
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
    console.log(`按 Ctrl+C 停止服務器`);
}); 