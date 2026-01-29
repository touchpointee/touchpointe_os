using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Touchpointe.Application.DTOs;

namespace Touchpointe.Application.Common.Interfaces
{
    public interface ISearchService
    {
        Task<List<SearchResultDto>> SearchAsync(Guid workspaceId, string query, CancellationToken cancellationToken = default);
    }
}
