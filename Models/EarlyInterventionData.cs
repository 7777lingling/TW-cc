using System;

namespace rain.Models
{
    public class EarlyInterventionData
    {
        public int Year { get; set; }  // 年份（112/113）
        public string County { get; set; }  // 縣市
        public string District { get; set; }  // 區域
        public string Type { get; set; }  // 指定/自選
        public string Organization { get; set; }  // 機構類型（聯評中心/衛生局）
        public int TargetCount { get; set; }  // 目標場數
        public int CompletedCount { get; set; }  // 完成場數
        public int EvaluationCount { get; set; }  // 評估數
        public int DiagnosedCount { get; set; }  // 確診及疑似遲緩數
        public double CompletionRate { get; set; }  // 完成率
        public double Latitude { get; set; }  // 緯度
        public double Longitude { get; set; }  // 經度
        public string Address { get; set; }  // 地址
        public string ContactInfo { get; set; }  // 聯絡資訊
    }
} 