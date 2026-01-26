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

        public MinioService(IConfiguration configuration)
        {
            _endpoint = configuration["MinioSettings:Endpoint"];
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

                        // Set public policy
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
                }
                catch (Exception)
                {
                    // Ignore errors during bucket check/creation (e.g. Access Denied)
                    // and try to upload anyway. The bucket might already exist 
                    // and we just don't have permission to check/create.
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
                // For now, let's assume we want a public URL if the bucket policy allows, 
                // or we can generate a presigned URL. 
                // Given the requirement to "store dp" and typically DPs are public or long-lived, 
                // let's try to construct a direct URL if possible, or a presigned one.
                // However, constructing a direct URL depends on the setup. 
                // Let's use PresignedGetObjectAsync for now to be safe, or just return the object path 
                // and let the frontend/controller decide how to serve it? 
                // Usually Profile Pictures are public. 
                
                // Let's return a constructed URL based on endpoint.
                var protocol = _useSSL ? "https" : "http";
                // Note: This assumes the endpoint is reachable from the browser (public).
                // If running in docker, might be different.
                 return $"{protocol}://{_endpoint}/{bucketName}/{objectName}";
            }
            catch (Exception ex)
            {
                throw new Exception($"MinIO Upload Failed: {ex.Message}", ex);
            }
        }

        public async Task<string> GetFileUrlAsync(string bucketName, string objectName)
        {
             // Check if object exists
             var statObjectArgs = new StatObjectArgs()
                 .WithBucket(bucketName)
                 .WithObject(objectName);
             await _minioClient.StatObjectAsync(statObjectArgs);

             var protocol = _useSSL ? "https" : "http";
             return $"{protocol}://{_endpoint}/{bucketName}/{objectName}";
        }

    }
}
