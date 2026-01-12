using Microsoft.AspNetCore.Mvc;

namespace Touchpointe.Api.Controllers;

[ApiController]
[Route("api/debug")]
public class DebugController : ControllerBase
{
    private readonly IConfiguration _configuration;

    public DebugController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    [HttpGet("cors")]
    public IActionResult GetCorsConfig()
    {
        // Replicate logic from Program.cs EXACTLY
        var frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL") 
                       ?? Environment.GetEnvironmentVariable("APP_FRONTEND_URL");
                       
        var origins = !string.IsNullOrEmpty(frontendUrl)
            ? frontendUrl.Split(',', StringSplitOptions.RemoveEmptyEntries)
                         .Select(o => o.Trim().TrimEnd('/'))
                         .ToArray()
            : Array.Empty<string>();

        return Ok(new
        {
            Message = "CORS Debug Info",
            FrontendUrlEnvVar = frontendUrl,
            ParsedOrigins = origins,
            Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Unknown",
            AllEnvKeys = _configuration.AsEnumerable().Select(k => k.Key).OrderBy(k => k).ToList(),
            RawSystemKeys = Environment.GetEnvironmentVariables().Keys.Cast<string>().OrderBy(k => k).ToList()
        });
    }
}
