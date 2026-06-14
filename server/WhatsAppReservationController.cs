// ASP.NET Core Web API — server.hstplanet.com projesine ekleyin.
// Route: https://server.hstplanet.com/api/whatsapp/...
// Meta webhook bu controller'a gelir; is mantigi Node bot servisine iletilir (npm run whatsapp:bot).

using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;

namespace HstPlanet.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WhatsAppReservationController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public WhatsAppReservationController(IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    /// <summary>Meta webhook dogrulama (hub.verify_token).</summary>
    [HttpGet("webhook")]
    public IActionResult VerifyWebhook(
        [FromQuery(Name = "hub.mode")] string? mode,
        [FromQuery(Name = "hub.verify_token")] string? token,
        [FromQuery(Name = "hub.challenge")] string? challenge)
    {
        var expected = (_configuration["WhatsApp:VerifyToken"] ?? Environment.GetEnvironmentVariable("WHATSAPP_VERIFY_TOKEN") ?? "").Trim();
        if (mode == "subscribe" && !string.IsNullOrEmpty(expected) && token == expected && !string.IsNullOrEmpty(challenge))
        {
            return Content(challenge, "text/plain", Encoding.UTF8);
        }

        return Forbid();
    }

    /// <summary>Meta webhook olaylari — bot servisine iletir (varsayilan http://127.0.0.1:3920/webhook).</summary>
    [HttpPost("webhook")]
    public async Task<IActionResult> ReceiveWebhook(CancellationToken cancellationToken)
    {
        using var reader = new StreamReader(Request.Body, Encoding.UTF8);
        var body = await reader.ReadToEndAsync(cancellationToken);

        var botUrl = (_configuration["WhatsApp:BotWebhookUrl"] ?? "http://127.0.0.1:3920/webhook").Trim();
        var client = _httpClientFactory.CreateClient();
        using var content = new StringContent(body, Encoding.UTF8, "application/json");

        try
        {
            var response = await client.PostAsync(botUrl, content, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                return StatusCode(502, WhatsAppApiResponse<object>.Fail("Bot servisi yanit vermedi."));
            }
        }
        catch (Exception ex)
        {
            return StatusCode(502, WhatsAppApiResponse<object>.Fail($"Bot servisine ulasilamadi: {ex.Message}"));
        }

        return Ok("EVENT_RECEIVED");
    }

    /// <summary>Panel / test: mesaj isle (Node /process ile ayni sozlesme).</summary>
    [HttpPost("process")]
    public async Task<ActionResult<WhatsAppApiResponse<WhatsAppProcessResultDto>>> Process(
        [FromBody] WhatsAppProcessRequest body,
        CancellationToken cancellationToken)
    {
        var processUrl = (_configuration["WhatsApp:BotProcessUrl"] ?? "http://127.0.0.1:3920/process").Trim();
        var client = _httpClientFactory.CreateClient();

        var json = JsonSerializer.Serialize(body, JsonOptions);
        using var content = new StringContent(json, Encoding.UTF8, "application/json");

        try
        {
            var response = await client.PostAsync(processUrl, content, cancellationToken);
            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                return StatusCode(502, WhatsAppApiResponse<WhatsAppProcessResultDto>.Fail(responseBody));
            }

            var parsed = JsonSerializer.Deserialize<WhatsAppProcessResultDto>(responseBody, JsonOptions);
            if (parsed == null)
            {
                return Ok(WhatsAppApiResponse<WhatsAppProcessResultDto>.Fail("Bos yanit."));
            }

            return Ok(WhatsAppApiResponse<WhatsAppProcessResultDto>.Success(parsed));
        }
        catch (Exception ex)
        {
            return StatusCode(502, WhatsAppApiResponse<WhatsAppProcessResultDto>.Fail(ex.Message));
        }
    }

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };
}

public sealed class WhatsAppProcessRequest
{
    public string? BusinessUserId { get; set; }
    public string? ShopName { get; set; }
    public string? WaPhone { get; set; }
    public string? Text { get; set; }
    public string? Locale { get; set; }
}

public sealed class WhatsAppProcessResultDto
{
    [JsonPropertyName("ok")]
    public bool Ok { get; set; }

    [JsonPropertyName("replies")]
    public List<string> Replies { get; set; } = new();

    [JsonPropertyName("locale")]
    public string Locale { get; set; } = "tr";

    [JsonPropertyName("step")]
    public string Step { get; set; } = "idle";

    [JsonPropertyName("reservationCreated")]
    public bool? ReservationCreated { get; set; }
}

public sealed class WhatsAppApiResponse<T>
{
    [JsonPropertyName("ok")]
    public bool Ok { get; set; }

    [JsonPropertyName("message")]
    public string Message { get; set; } = "";

    [JsonPropertyName("data")]
    public T? Data { get; set; }

    public static WhatsAppApiResponse<T> Success(T data) =>
        new() { Ok = true, Data = data };

    public static WhatsAppApiResponse<T> Fail(string message) =>
        new() { Ok = false, Message = message };
}
