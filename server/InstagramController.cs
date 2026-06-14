// ASP.NET Core Web API — server.hstplanet.com projesine ekleyin.
// Route: https://server.hstplanet.com/api/instagram/...
// Program.cs: builder.Services.AddHttpClient(); + CORS (panel origin)

using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;

namespace HstPlanet.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InstagramController : ControllerBase
{
    private const string GraphVersion = "v25.0";
    private readonly IHttpClientFactory _httpClientFactory;

    public InstagramController(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    /// <summary>Token dogrula; Instagram User ID ve login tipini dondur.</summary>
    [HttpPost("context")]
    public async Task<ActionResult<InstagramApiResponse<InstagramContextDto>>> ResolveContext(
        [FromBody] InstagramContextRequest body,
        CancellationToken cancellationToken)
    {
        var accessToken = NormalizeToken(body.AccessToken);
        if (string.IsNullOrEmpty(accessToken))
        {
            return BadRequest(InstagramApiResponse<InstagramContextDto>.Fail("Access Token bos."));
        }

        var loginType = ResolveLoginType(accessToken, body.LoginType);
        var preferredUserId = (body.InstagramUserId ?? "").Trim();

        if (loginType == "instagram")
        {
            var me = await GraphGetAsync<GraphMeResponse>(
                "instagram",
                $"me?fields=id,user_id,username&access_token={Uri.EscapeDataString(accessToken)}",
                accessToken,
                cancellationToken);

            if (me.Error != null || string.IsNullOrEmpty(me.Data?.UserId))
            {
                return Ok(InstagramApiResponse<InstagramContextDto>.Fail(me.Error?.Message ?? "Instagram token dogrulanamadi."));
            }

            return Ok(InstagramApiResponse<InstagramContextDto>.Success(new InstagramContextDto
            {
                AccessToken = accessToken,
                InstagramUserId = string.IsNullOrEmpty(preferredUserId) ? me.Data!.UserId! : preferredUserId,
                LoginType = "instagram",
                Username = me.Data.Username ?? "",
            }));
        }

        if (string.IsNullOrEmpty(preferredUserId))
        {
            return BadRequest(InstagramApiResponse<InstagramContextDto>.Fail("Facebook Login icin Instagram User ID zorunlu."));
        }

        var account = await GraphGetAsync<GraphMeResponse>(
            "facebook",
            $"{preferredUserId}?fields=id,username&access_token={Uri.EscapeDataString(accessToken)}",
            accessToken,
            cancellationToken);

        if (account.Error != null || string.IsNullOrEmpty(account.Data?.Id))
        {
            return Ok(InstagramApiResponse<InstagramContextDto>.Fail(account.Error?.Message ?? "Facebook Graph token dogrulanamadi."));
        }

        return Ok(InstagramApiResponse<InstagramContextDto>.Success(new InstagramContextDto
        {
            AccessToken = accessToken,
            InstagramUserId = preferredUserId,
            LoginType = "facebook",
            Username = account.Data.Username ?? "",
        }));
    }

    /// <summary>image_url ile Instagram'a fotograf yayinla (2 adim: media + media_publish).</summary>
    [HttpPost("publish")]
    public async Task<ActionResult<InstagramApiResponse<InstagramPublishResultDto>>> Publish(
        [FromBody] InstagramPublishRequest body,
        CancellationToken cancellationToken)
    {
        var accessToken = NormalizeToken(body.AccessToken);
        var instagramUserId = (body.InstagramUserId ?? "").Trim();
        var imageUrl = (body.ImageUrl ?? "").Trim();
        var caption = (body.Caption ?? "").Trim();
        var loginType = ResolveLoginType(accessToken, body.LoginType);

        if (string.IsNullOrEmpty(accessToken))
        {
            return BadRequest(InstagramApiResponse<InstagramPublishResultDto>.Fail("Access Token bos."));
        }

        if (string.IsNullOrEmpty(instagramUserId))
        {
            return BadRequest(InstagramApiResponse<InstagramPublishResultDto>.Fail("Instagram User ID eksik."));
        }

        if (!imageUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(InstagramApiResponse<InstagramPublishResultDto>.Fail("image_url HTTPS olmali."));
        }

        if (imageUrl.Contains(".webp", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(InstagramApiResponse<InstagramPublishResultDto>.Fail("Instagram WebP desteklemez. Cloudinary URL f_jpg ile JPEG olmali."));
        }

        var createFields = new Dictionary<string, string> { ["image_url"] = imageUrl };
        if (!string.IsNullOrEmpty(caption))
        {
            createFields["caption"] = caption.Length > 2200 ? caption[..2200] : caption;
        }

        var create = await GraphPostAsync<GraphIdResponse>(
            loginType,
            $"{instagramUserId}/media",
            accessToken,
            createFields,
            cancellationToken);

        if (create.Error != null || string.IsNullOrEmpty(create.Data?.Id))
        {
            return Ok(InstagramApiResponse<InstagramPublishResultDto>.Fail(create.Error?.Message ?? "Medya konteyneri olusturulamadi."));
        }

        var creationId = create.Data!.Id!;
        await WaitForContainerAsync(loginType, creationId, accessToken, cancellationToken);

        var publish = await GraphPostAsync<GraphIdResponse>(
            loginType,
            $"{instagramUserId}/media_publish",
            accessToken,
            new Dictionary<string, string> { ["creation_id"] = creationId },
            cancellationToken);

        if (publish.Error != null || string.IsNullOrEmpty(publish.Data?.Id))
        {
            return Ok(InstagramApiResponse<InstagramPublishResultDto>.Fail(publish.Error?.Message ?? "Yayinlama basarisiz."));
        }

        return Ok(InstagramApiResponse<InstagramPublishResultDto>.Success(new InstagramPublishResultDto
        {
            MediaId = publish.Data!.Id!,
            CreationId = creationId,
        }));
    }

    private async Task WaitForContainerAsync(
        string loginType,
        string containerId,
        string accessToken,
        CancellationToken cancellationToken)
    {
        for (var i = 0; i < 5; i++)
        {
            var status = await GraphGetAsync<GraphStatusResponse>(
                loginType,
                $"{containerId}?fields=status_code&access_token={Uri.EscapeDataString(accessToken)}",
                accessToken,
                cancellationToken);

            var code = status.Data?.StatusCode ?? "";
            if (code == "FINISHED" || string.IsNullOrEmpty(code))
            {
                return;
            }

            if (code is "ERROR" or "EXPIRED")
            {
                throw new InvalidOperationException($"Medya konteyneri hazir degil ({code}).");
            }

            await Task.Delay(2000, cancellationToken);
        }
    }

    private async Task<GraphResult<T>> GraphGetAsync<T>(
        string loginType,
        string path,
        string accessToken,
        CancellationToken cancellationToken)
    {
        var client = _httpClientFactory.CreateClient();
        var url = $"{GraphBase(loginType)}/{path}";
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        using var response = await client.SendAsync(request, cancellationToken);
        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        return ParseGraphResponse<T>(json, response.IsSuccessStatusCode);
    }

    private async Task<GraphResult<T>> GraphPostAsync<T>(
        string loginType,
        string path,
        string accessToken,
        Dictionary<string, string> fields,
        CancellationToken cancellationToken)
    {
        var client = _httpClientFactory.CreateClient();
        var url = $"{GraphBase(loginType)}/{path}";
        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        if (loginType == "instagram")
        {
            var payload = fields.ToDictionary(k => k.Key, k => (object)k.Value);
            payload["access_token"] = accessToken;
            request.Content = new StringContent(
                JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json");
        }
        else
        {
            request.Content = new FormUrlEncodedContent(fields);
        }

        using var response = await client.SendAsync(request, cancellationToken);
        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        return ParseGraphResponse<T>(json, response.IsSuccessStatusCode);
    }

    private static GraphResult<T> ParseGraphResponse<T>(string json, bool httpOk)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.TryGetProperty("error", out var err))
            {
                var message = err.TryGetProperty("message", out var m) ? m.GetString() : "Graph API hatasi";
                return new GraphResult<T> { Error = new GraphError { Message = message ?? "Graph API hatasi" } };
            }

            var data = JsonSerializer.Deserialize<T>(json, JsonOptions);
            if (!httpOk && data == null)
            {
                return new GraphResult<T> { Error = new GraphError { Message = "Graph API hatasi" } };
            }

            return new GraphResult<T> { Data = data };
        }
        catch
        {
            return new GraphResult<T> { Error = new GraphError { Message = "Gecersiz Graph API yaniti" } };
        }
    }

    private static string GraphBase(string loginType) =>
        loginType == "instagram"
            ? $"https://graph.instagram.com/{GraphVersion}"
            : $"https://graph.facebook.com/{GraphVersion}";

    private static string ResolveLoginType(string accessToken, string? overrideType)
    {
        if (accessToken.StartsWith("IGAA", StringComparison.Ordinal))
        {
            return "instagram";
        }

        var env = (overrideType ?? "").Trim().ToLowerInvariant();
        return env is "instagram" or "facebook" ? env : "facebook";
    }

    private static string NormalizeToken(string? raw)
    {
        var token = (raw ?? "").Trim();
        while (token.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            token = token[7..].Trim();
        }

        return token;
    }

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    private sealed class GraphResult<T>
    {
        public T? Data { get; init; }
        public GraphError? Error { get; init; }
    }

    private sealed class GraphError
    {
        public string Message { get; init; } = "";
    }

    private sealed class GraphIdResponse
    {
        [JsonPropertyName("id")]
        public string? Id { get; set; }
    }

    private sealed class GraphMeResponse
    {
        [JsonPropertyName("id")]
        public string? Id { get; set; }

        [JsonPropertyName("user_id")]
        public string? UserId { get; set; }

        [JsonPropertyName("username")]
        public string? Username { get; set; }
    }

    private sealed class GraphStatusResponse
    {
        [JsonPropertyName("status_code")]
        public string? StatusCode { get; set; }
    }
}

public sealed class InstagramContextRequest
{
    public string? AccessToken { get; set; }
    public string? InstagramUserId { get; set; }
    public string? LoginType { get; set; }
}

public sealed class InstagramPublishRequest
{
    public string? AccessToken { get; set; }
    public string? InstagramUserId { get; set; }
    public string? ImageUrl { get; set; }
    public string? Caption { get; set; }
    public string? LoginType { get; set; }
}

public sealed class InstagramContextDto
{
    public string AccessToken { get; set; } = "";
    public string InstagramUserId { get; set; } = "";
    public string LoginType { get; set; } = "";
    public string Username { get; set; } = "";
}

public sealed class InstagramPublishResultDto
{
    public string MediaId { get; set; } = "";
    public string CreationId { get; set; } = "";
}

public sealed class InstagramApiResponse<T>
{
    [JsonPropertyName("ok")]
    public bool Ok { get; set; }

    [JsonPropertyName("message")]
    public string Message { get; set; } = "";

    [JsonPropertyName("data")]
    public T? Data { get; set; }

    public static InstagramApiResponse<T> Success(T data) =>
        new() { Ok = true, Data = data };

    public static InstagramApiResponse<T> Fail(string message) =>
        new() { Ok = false, Message = message };
}
