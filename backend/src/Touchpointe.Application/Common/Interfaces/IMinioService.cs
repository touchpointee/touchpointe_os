namespace Touchpointe.Application.Common.Interfaces
{
    public interface IMinioService
    {
        Task<string> UploadFileAsync(Stream stream, string contentType, string bucketName, string objectName);
        Task<string> GetFileUrlAsync(string bucketName, string objectName);
    }
}
