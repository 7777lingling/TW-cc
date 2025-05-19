using Microsoft.AspNetCore.Mvc;
using rain.Models;
using System.Collections.Generic;

namespace rain.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EarlyInterventionController : ControllerBase
    {
        private readonly ILogger<EarlyInterventionController> _logger;
        private static readonly Dictionary<int, List<EarlyInterventionData>> _data;

        static EarlyInterventionController()
        {
            _data = new Dictionary<int, List<EarlyInterventionData>>
            {
                {
                    112, new List<EarlyInterventionData>
                    {
                        // 新北市資料
                        new EarlyInterventionData { Year = 112, County = "新北市", District = "金山區", Type = "自選", Organization = "聯評中心", TargetCount = 3, CompletedCount = 3, EvaluationCount = 18, DiagnosedCount = 18, CompletionRate = 1.0, Latitude = 25.2219, Longitude = 121.6357 },
                        new EarlyInterventionData { Year = 112, County = "新北市", District = "石碇區", Type = "指定", Organization = "聯評中心", TargetCount = 2, CompletedCount = 1, EvaluationCount = 4, DiagnosedCount = 2, CompletionRate = 0.5, Latitude = 24.9459, Longitude = 121.6477 },
                        new EarlyInterventionData { Year = 112, County = "新北市", District = "石碇區", Type = "指定", Organization = "衛生局", TargetCount = 1, CompletedCount = 0, EvaluationCount = 0, DiagnosedCount = 0, CompletionRate = 0.0, Latitude = 24.9459, Longitude = 121.6477 },
                        new EarlyInterventionData { Year = 112, County = "新北市", District = "坪林區", Type = "指定", TargetCount = 1, CompletedCount = 0, CompletionRate = 0.0, Latitude = 24.9377, Longitude = 121.7115 },
                        new EarlyInterventionData { Year = 112, County = "新北市", District = "平溪區", Type = "指定", TargetCount = 1, CompletedCount = 0, CompletionRate = 0.0, Latitude = 25.0257, Longitude = 121.7384 },
                        new EarlyInterventionData { Year = 112, County = "新北市", District = "雙溪區", Type = "指定", TargetCount = 2, CompletedCount = 0, CompletionRate = 0.0, Latitude = 24.9503, Longitude = 121.8659 },
                        new EarlyInterventionData { Year = 112, County = "新北市", District = "烏來區", Type = "指定", TargetCount = 2, CompletedCount = 1, CompletionRate = 0.5, Latitude = 24.8665, Longitude = 121.5504 },
                        new EarlyInterventionData { Year = 112, County = "新北市", District = "瑞芳區", Type = "自選", TargetCount = 2, CompletedCount = 1, CompletionRate = 0.5, Latitude = 25.1089, Longitude = 121.8237 },
                        new EarlyInterventionData { Year = 112, County = "新北市", District = "三峽區", Type = "自選", TargetCount = 1, CompletedCount = 0, CompletionRate = 0.0, Latitude = 24.9342, Longitude = 121.3690 },
                        new EarlyInterventionData { Year = 112, County = "新北市", District = "八里區", Type = "自選", TargetCount = 1, CompletedCount = 1, CompletionRate = 1.0, Latitude = 25.1480, Longitude = 121.4153 },
                        new EarlyInterventionData { Year = 112, County = "新北市", District = "石門區", Type = "自選", TargetCount = 2, CompletedCount = 2, CompletionRate = 1.0, Latitude = 25.2904, Longitude = 121.5682 },
                        new EarlyInterventionData { Year = 112, County = "新北市", District = "貢寮區", Type = "自選", TargetCount = 4, CompletedCount = 2, CompletionRate = 0.5, Latitude = 25.0220, Longitude = 121.9453 },
                        new EarlyInterventionData { Year = 112, County = "新北市", District = "鶯歌區", Type = "自選", TargetCount = 1, CompletedCount = 1, CompletionRate = 1.0, Latitude = 24.9547, Longitude = 121.3466 },
                        new EarlyInterventionData { Year = 112, County = "新北市", District = "三芝區", Type = "自選", TargetCount = 1, CompletedCount = 6, CompletionRate = 6.0, Latitude = 25.2580, Longitude = 121.5015 },
                        new EarlyInterventionData { Year = 112, County = "新北市", District = "泰山區", Type = "自選", TargetCount = 2, CompletedCount = 2, CompletionRate = 1.0, Latitude = 25.0589, Longitude = 121.4304 },
                        new EarlyInterventionData { Year = 112, County = "新北市", District = "五股區", Type = "自選", TargetCount = 2, CompletedCount = 0, CompletionRate = 0.0, Latitude = 25.0962, Longitude = 121.4338 },
                        new EarlyInterventionData { Year = 112, County = "新北市", District = "樹林區", Type = "自選", TargetCount = 0, CompletedCount = 1, CompletionRate = 0.0, Latitude = 24.9880, Longitude = 121.4202 },

                        // 臺中市資料
                        new EarlyInterventionData { Year = 112, County = "臺中市", District = "和平區", Type = "指定", TargetCount = 7, CompletedCount = 9, CompletionRate = 1.29, Latitude = 24.2747, Longitude = 121.1360 },
                        new EarlyInterventionData { Year = 112, County = "臺中市", District = "石岡區", Type = "自選", TargetCount = 1, CompletedCount = 1, CompletionRate = 1.0, Latitude = 24.2749, Longitude = 120.7803 },
                        new EarlyInterventionData { Year = 112, County = "臺中市", District = "東勢區", Type = "自選", TargetCount = 5, CompletedCount = 7, CompletionRate = 1.4, Latitude = 24.2586, Longitude = 120.8278 },
                        new EarlyInterventionData { Year = 112, County = "臺中市", District = "神岡區", Type = "自選", TargetCount = 1, CompletedCount = 1, CompletionRate = 1.0, Latitude = 24.2567, Longitude = 120.6661 },
                        new EarlyInterventionData { Year = 112, County = "臺中市", District = "新社區", Type = "自選", TargetCount = 2, CompletedCount = 2, CompletionRate = 1.0, Latitude = 24.2341, Longitude = 120.8095 },
                        new EarlyInterventionData { Year = 112, County = "臺中市", District = "霧峰區", Type = "自選", TargetCount = 3, CompletedCount = 3, CompletionRate = 1.0, Latitude = 24.0583, Longitude = 120.7000 },
                        new EarlyInterventionData { Year = 112, County = "臺中市", District = "后里區", Type = "自選", TargetCount = 2, CompletedCount = 2, CompletionRate = 1.0, Latitude = 24.3095, Longitude = 120.7146 },
                        new EarlyInterventionData { Year = 112, County = "臺中市", District = "大肚區", Type = "自選", TargetCount = 3, CompletedCount = 3, CompletionRate = 1.0, Latitude = 24.1537, Longitude = 120.5419 },
                        new EarlyInterventionData { Year = 112, County = "臺中市", District = "大雅區", Type = "自選", TargetCount = 1, CompletedCount = 1, CompletionRate = 1.0, Latitude = 24.2291, Longitude = 120.6477 },
                        new EarlyInterventionData { Year = 112, County = "臺中市", District = "西區", Type = "自選", TargetCount = 3, CompletedCount = 3, CompletionRate = 1.0, Latitude = 24.1416, Longitude = 120.6647 },
                        new EarlyInterventionData { Year = 112, County = "臺中市", District = "大里區", Type = "自選", TargetCount = 2, CompletedCount = 2, CompletionRate = 1.0, Latitude = 24.0989, Longitude = 120.6778 },
                        new EarlyInterventionData { Year = 112, County = "臺中市", District = "烏日區", Type = "自選", TargetCount = 1, CompletedCount = 1, CompletionRate = 1.0, Latitude = 24.0641, Longitude = 120.6214 },
                        new EarlyInterventionData { Year = 112, County = "臺中市", District = "太平區", Type = "自選", TargetCount = 2, CompletedCount = 2, CompletionRate = 1.0, Latitude = 24.1265, Longitude = 120.7137 },

                        // 基隆市資料
                        new EarlyInterventionData { Year = 112, County = "基隆市", District = "七堵區", Type = "自選", TargetCount = 1, CompletedCount = 1, CompletionRate = 1.0, Latitude = 25.0934, Longitude = 121.7131 },
                        new EarlyInterventionData { Year = 112, County = "基隆市", District = "瑞芳區", Type = "自選", TargetCount = 1, CompletedCount = 1, CompletionRate = 1.0, Latitude = 25.1089, Longitude = 121.8237 },

                        // 桃園市資料
                        new EarlyInterventionData { Year = 112, County = "桃園市", District = "復興區", Type = "指定", TargetCount = 4, CompletedCount = 5, CompletionRate = 1.25, Latitude = 24.7284, Longitude = 121.3522 }
                    }
                },
                {
                    113, new List<EarlyInterventionData>
                    {
                        // 113年資料
                        new EarlyInterventionData { Year = 113, County = "澎湖縣", District = "七美嶼", Type = "自選", Organization = "聯評中心", TargetCount = 0, CompletedCount = 2, EvaluationCount = 8, DiagnosedCount = 8, CompletionRate = 2.0, Latitude = 23.2013, Longitude = 119.4299 },
                        new EarlyInterventionData { Year = 113, County = "新北市", District = "金山區", Type = "自選", TargetCount = 0, CompletedCount = 0, CompletionRate = 0.0, Latitude = 25.2219, Longitude = 121.6357 },
                        new EarlyInterventionData { Year = 113, County = "新北市", District = "石碇區", Type = "指定", TargetCount = 2, CompletedCount = 1, CompletionRate = 0.5, Latitude = 24.9459, Longitude = 121.6477 },
                        new EarlyInterventionData { Year = 113, County = "新北市", District = "平溪區", Type = "指定", TargetCount = 1, CompletedCount = 0, CompletionRate = 0.0, Latitude = 25.0257, Longitude = 121.7384 },
                        new EarlyInterventionData { Year = 113, County = "新北市", District = "雙溪區", Type = "指定", TargetCount = 1, CompletedCount = 1, CompletionRate = 1.0, Latitude = 24.9503, Longitude = 121.8659 },
                        new EarlyInterventionData { Year = 113, County = "新北市", District = "烏來區", Type = "指定", TargetCount = 2, CompletedCount = 1, CompletionRate = 0.5, Latitude = 24.8665, Longitude = 121.5504 }
                    }
                }
            };
        }

        public EarlyInterventionController(ILogger<EarlyInterventionController> logger)
        {
            _logger = logger;
        }

        [HttpGet]
        public ActionResult<IEnumerable<EarlyInterventionData>> Get(int? year = null, string type = null, string organization = null)
        {
            try
            {
                var filteredData = _data[year ?? 113].AsEnumerable();

                if (!string.IsNullOrEmpty(type))
                {
                    filteredData = filteredData.Where(d => d.Type == type);
                }

                if (!string.IsNullOrEmpty(organization))
                {
                    filteredData = filteredData.Where(d => d.Organization == organization);
                }

                return Ok(filteredData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "獲取早期療育資料時發生錯誤");
                return StatusCode(500, "內部伺服器錯誤");
            }
        }

        [HttpGet("years")]
        public ActionResult<IEnumerable<int>> GetAvailableYears()
        {
            return Ok(new[] { 112, 113 });
        }

        [HttpGet("types")]
        public ActionResult<IEnumerable<string>> GetTypes()
        {
            return Ok(new[] { "指定", "自選" });
        }

        [HttpGet("organizations")]
        public ActionResult<IEnumerable<string>> GetOrganizations()
        {
            return Ok(new[] { "聯評中心", "衛生局" });
        }
    }
} 