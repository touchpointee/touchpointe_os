using Microsoft.Extensions.Configuration;
using Minio;
using Minio.DataModel.Args;
using Touchpointe.Application.Common.Interfaces;

namespace Touchpointe.Infrastructure.Services
{
    public class MinioService : IMinioService
    {
        private readonly IMinioClient _minioClient;
        private readonly bool _useSSL;
        private readonly string _endpoint;
        private readonly string _publicEndpoint;

        public MinioService(IConfiguration configuration)
        {
            _endpoint = configuration["MinioSettings:Endpoint"];
            _publicEndpoint = configuration["MinioSettings:PublicEndpoint"];
            var accessKey = configuration["MinioSettings:AccessKey"];
            var secretKey = configuration["MinioSettings:SecretKey"];
            _useSSL = configuration.GetValue<bool>("MinioSettings:UseSSL", true);

            _minioClient = new MinioClient()
                .WithEndpoint(_endpoint)
                .WithCredentials(accessKey, secretKey)
                .WithSSL(_useSSL)
                .Build();
        }

        public async Task<string> UploadFileAsync(Stream stream, string contentType, string bucketName, string objectName)
        {
            try
            {
                // Ensure bucket exists (best effort)
                try
                {
                    var beArgs = new BucketExistsArgs().WithBucket(bucketName);
                    bool found = await _minioClient.BucketExistsAsync(beArgs);
                    if (!found)
                    {
                        var mbArgs = new MakeBucketArgs().WithBucket(bucketName);
                        await _minioClient.MakeBucketAsync(mbArgs);
                    }

                    // Ensure public policy is set (even if bucket exists)
                    try 
                    {
                        var policy = $@"{{
                            ""Version"": ""2012-10-17"",
                            ""Statement"": [
                                {{
                                    ""Effect"": ""Allow"",
                                    ""Principal"": {{""AWS"": [""*""]}},
                                    ""Action"": [""s3:GetObject""],
                                    ""Resource"": [""arn:aws:s3:::{bucketName}/*""]
                                }}
                            ]
                        }}";
                        
                        var setPolicyArgs = new SetPolicyArgs()
                            .WithBucket(bucketName)
                            .WithPolicy(policy);
                        await _minioClient.SetPolicyAsync(setPolicyArgs);
                    }
                    catch (Exception)
                    {
                         // Suppress policy errors (e.g. if already set or no permission)
                    }
                }
                catch (Exception)
                {
                    // Ignore errors during bucket check/creation (e.g. Access Denied)
                }

                // Upload file
                var putObjectArgs = new PutObjectArgs()
                    .WithBucket(bucketName)
                    .WithObject(objectName)
                    .WithStreamData(stream)
                    .WithObjectSize(stream.Length)
                    .WithContentType(contentType);

                await _minioClient.PutObjectAsync(putObjectArgs);

                // Return URL (presigned or public)
                var protocol = _useSSL ? "https" : "http";
                var host = !string.IsNullOrEmpty(_publicEndpoint) ? _publicEndpoint : _endpoint;
                return $"{protocol}://{host}/{bucketName}/{objectName}";
            }
            catch (Exception ex)
            {
                throw new Exception($"MinIO Upload Failed: {ex.Message}", ex);
            }
        }

        public async Task<string> GetFileUrlAsync(string bucketName, string objectName)
        {
             // Check if object exists
             try
             {
                 var statObjectArgs = new StatObjectArgs()
                     .WithBucket(bucketName)
                     .WithObject(objectName);
                 await _minioClient.StatObjectAsync(statObjectArgs);

                 var protocol = _useSSL ? "https" : "http";
                 var host = !string.IsNullOrEmpty(_publicEndpoint) ? _publicEndpoint : _endpoint;
                 return $"{protocol}://{host}/{bucketName}/{objectName}";
             }
             catch (Minio.Exceptions.ObjectNotFoundException)
             {
                 return null; // Or a default "file not found" URL
             }
             catch (Exception)
             {
                 // Log other errors if possible
                 return null;
             }
        }

    }
}
