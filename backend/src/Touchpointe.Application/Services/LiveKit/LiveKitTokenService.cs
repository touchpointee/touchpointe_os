using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Touchpointe.Application.Services.LiveKit
{
    public interface ILiveKitTokenService
    {
        string GenerateToken(string roomName, string participantIdentity, string? participantName, bool isAdmin);
    }

    public class LiveKitTokenService : ILiveKitTokenService
    {
        private readonly string _apiKey;
        private readonly string _apiSecret;

        public LiveKitTokenService(IConfiguration configuration)
        {
            _apiKey = configuration["LiveKit:ApiKey"] ?? throw new ArgumentNullException("LiveKit:ApiKey");
            _apiSecret = configuration["LiveKit:ApiSecret"] ?? throw new ArgumentNullException("LiveKit:ApiSecret");
        }

        public string GenerateToken(string roomName, string participantIdentity, string? participantName, bool isAdmin)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_apiSecret));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var now = DateTime.UtcNow;
            var exp = now.AddHours(2); // Strict expiry as requested

            // LiveKit specific claims
            // https://docs.livekit.io/server/access-tokens/
            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, participantIdentity),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim("iss", _apiKey),
                new Claim("nbf", new DateTimeOffset(now).ToUnixTimeSeconds().ToString()),
                new Claim("exp", new DateTimeOffset(exp).ToUnixTimeSeconds().ToString()),
                
                // Video Grants
                new Claim("video", System.Text.Json.JsonSerializer.Serialize(new 
                {
                    room = roomName,
                    roomJoin = true,
                    canPublish = true,
                    canSubscribe = true,
                    canPublishData = true,
                    roomAdmin = isAdmin
                }))
            };

            if (!string.IsNullOrEmpty(participantName))
            {
                claims.Add(new Claim("name", participantName));
            }

            // Manually creating the token handler because LiveKit expects specific JSON structure for 'video' claim
            // Standard JwtSecurityTokenHandler might serialize the object differently if not careful.
            // But let's try standard first with the serialized JSON string.
            // Actually, for "video" claim, it needs to be a JSON object, not a stringified JSON.
            // Standard .NET JWT libraries will serialize the string as a string.
            // We need to pass a dictionary/object to the payload.
            
            // To be safe and avoid external dependency issues, we can construct the payload dictionary manually.
            
            var payload = new Dictionary<string, object>
            {
                { "iss", _apiKey },
                { "sub", participantIdentity },
                { "jti", Guid.NewGuid().ToString() },
                { "nbf", new DateTimeOffset(now).ToUnixTimeSeconds() },
                { "exp", new DateTimeOffset(exp).ToUnixTimeSeconds() },
                { "video", new Dictionary<string, object>
                    {
                        { "room", roomName },
                        { "roomJoin", true },
                        { "canPublish", true },
                        { "canSubscribe", true },
                        { "canPublishData", true },
                        { "roomAdmin", isAdmin }
                    }
                }
            };
            
            if (!string.IsNullOrEmpty(participantName))
            {
                payload.Add("name", participantName);
            }

            var tokenHandler = new JwtSecurityTokenHandler();
            // We can't easily use CreateToken with a custom dictionary payload using standard Microsoft.IdentityModel.Tokens 
            // unless we use TokenDescriptor with AdditionalHeaderClaims? No, Payload.
            
            // Simpler approach: Use the standard descriptor but set the claim type to a JSON type? 
            // Actually, LiveKit SDK for .NET exists but we haven't installed it.
            // Let's assume we can add the package `LiveKit.Server.Sdk.DotNet` if needed, 
            // OR use a custom JWT helper.
            
            // Let's start with a basic JWT implementation that hopefully serializes correctly.
            // If the "video" claim is sent as a JSON string, LiveKit might accept it if it parses it.
            // BUT standard is a nested JSON object.
            
            // Let's use `JwtHeader` and `JwtPayload` directly.
            
            var header = new JwtHeader(credentials);
            var jwtPayload = new JwtPayload();
            foreach (var kvp in payload)
            {
                jwtPayload.Add(kvp.Key, kvp.Value);
            }

            var token = new JwtSecurityToken(header, jwtPayload);
            return tokenHandler.WriteToken(token);
        }
    }
}
