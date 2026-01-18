namespace Touchpointe.Application.DTOs
{
    public record ListStatusDto(
        Guid Id,
        Guid ListId,
        string Name,
        string Color,
        string Category,
        int Order
    );

    public record UpdateListStatusRequest(
        string? Name,
        string? Color
    );

    public record CreateListStatusRequest(
        string Name,
        string Color,
        string Category
    );
}
