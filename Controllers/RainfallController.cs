using Microsoft.AspNetCore.Mvc;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace rain.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RainfallController : ControllerBase
    {
        private readonly IHttpClientFactory _clientFactory;
        private const string WRA_TOKEN_URL = "https://iot.wra.gov.tw/Oauth2/token";
        private const string WRA_RAINFALL_API = "https://iot.wra.gov.tw/api/v2/rain/stations";
        private const string WRA_API_ID = "DVD/nkhAYrN4+jaj/mIK4+SdJFDYFVZcVCgIFql3flg=";
        private const string WRA_API_SECRET = "TLCrnfYGWT/LsO1ksmocnhnjQLkCi6DcdmK+D5PtWbc=";

        public RainfallController(IHttpClientFactory clientFactory)
        {
            _clientFactory = clientFactory;
        }

        [HttpGet("token")]
        public async Task<IActionResult> GetToken()
        {
            try
            {
                var client = _clientFactory.CreateClient();
                var formData = new FormUrlEncodedContent(new[]
                {
                    new KeyValuePair<string, string>("grant_type", "client_credentials"),
                    new KeyValuePair<string, string>("client_id", WRA_API_ID),
                    new KeyValuePair<string, string>("client_secret", WRA_API_SECRET),
                });

                var response = await client.PostAsync(WRA_TOKEN_URL, formData);
                if (!response.IsSuccessStatusCode)
                {
                    return StatusCode((int)response.StatusCode, "Failed to get token");
                }

                var result = await response.Content.ReadAsStringAsync();
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpGet("data")]
        public async Task<IActionResult> GetRainfallData([FromQuery] string token)
        {
            try
            {
                var client = _clientFactory.CreateClient();
                client.DefaultRequestHeaders.Add("Authorization", $"Bearer {token}");
                
                var response = await client.GetAsync(WRA_RAINFALL_API);
                if (!response.IsSuccessStatusCode)
                {
                    return StatusCode((int)response.StatusCode, "Failed to get rainfall data");
                }

                var result = await response.Content.ReadAsStringAsync();
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }
    }
} 