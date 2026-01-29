using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Touchpointe.Application.Common.Interfaces;
using Touchpointe.Application.DTOs;

namespace Touchpointe.API.Controllers
{
    [ApiController]
    [Route("api/workspaces/{workspaceId}/search")]
    [Authorize]
    public class SearchController : BaseController
    {
        private readonly ISearchService _searchService;

        public SearchController(ISearchService searchService)
        {
            _searchService = searchService;
        }

        [HttpGet]
        public async Task<ActionResult<List<SearchResultDto>>> Search(Guid workspaceId, [FromQuery] string q, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(q))
            {
                return Ok(new List<SearchResultDto>());
            }

            var results = await _searchService.SearchAsync(workspaceId, q, cancellationToken);
            return Ok(results);
        }
    }
}
