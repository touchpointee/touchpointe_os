using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Touchpointe.Application.Common.Interfaces;
using Touchpointe.Application.DTOs;
using Touchpointe.Domain.Entities; // for enums if needed

namespace Touchpointe.API.Controllers
{
    [ApiController]
    [Route("api/{workspaceId}/crm")]
    [Authorize]
    public class CrmController : ControllerBase
    {
        private readonly ICrmService _crmService;

        public CrmController(ICrmService crmService)
        {
            _crmService = crmService;
        }

        private Guid GetUserId()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return idClaim != null ? Guid.Parse(idClaim) : Guid.Empty;
        }

        // --- Companies ---

        [HttpGet("companies")]
        public async Task<ActionResult<List<CompanyDto>>> GetCompanies(Guid workspaceId)
        {
            return Ok(await _crmService.GetCompaniesAsync(workspaceId));
        }

        [HttpPost("companies")]
        public async Task<ActionResult<CompanyDto>> CreateCompany(Guid workspaceId, CreateCompanyRequest request)
        {
            try
            {
                var result = await _crmService.CreateCompanyAsync(workspaceId, request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPut("companies/{companyId}")]
        public async Task<ActionResult<CompanyDto>> UpdateCompany(Guid workspaceId, Guid companyId, UpdateCompanyRequest request)
        {
            try
            {
                var result = await _crmService.UpdateCompanyAsync(workspaceId, companyId, request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpDelete("companies/{companyId}")]
        public async Task<ActionResult> DeleteCompany(Guid workspaceId, Guid companyId)
        {
            var success = await _crmService.DeleteCompanyAsync(workspaceId, companyId);
            if (!success) return NotFound();
            return NoContent();
        }

        // --- Contacts ---

        [HttpGet("contacts")]
        public async Task<ActionResult<List<ContactDto>>> GetContacts(Guid workspaceId)
        {
            return Ok(await _crmService.GetContactsAsync(workspaceId));
        }

        [HttpPost("contacts")]
        public async Task<ActionResult<ContactDto>> CreateContact(Guid workspaceId, CreateContactRequest request)
        {
            try
            {
                var result = await _crmService.CreateContactAsync(workspaceId, request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPut("contacts/{contactId}")]
        public async Task<ActionResult<ContactDto>> UpdateContact(Guid workspaceId, Guid contactId, UpdateContactRequest request)
        {
            try
            {
                var result = await _crmService.UpdateContactAsync(workspaceId, contactId, request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpDelete("contacts/{contactId}")]
        public async Task<ActionResult> DeleteContact(Guid workspaceId, Guid contactId)
        {
             var success = await _crmService.DeleteContactAsync(workspaceId, contactId);
            if (!success) return NotFound();
            return NoContent();
        }

        // --- Deals ---

        [HttpGet("deals")]
        public async Task<ActionResult<List<DealDto>>> GetDeals(Guid workspaceId)
        {
             return Ok(await _crmService.GetDealsAsync(workspaceId));
        }

        [HttpPost("deals")]
        public async Task<ActionResult<DealDto>> CreateDeal(Guid workspaceId, CreateDealRequest request)
        {
             try
            {
                var result = await _crmService.CreateDealAsync(workspaceId, GetUserId(), request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPut("deals/{dealId}")]
        public async Task<ActionResult<DealDto>> UpdateDeal(Guid workspaceId, Guid dealId, UpdateDealRequest request)
        {
             try
            {
                var result = await _crmService.UpdateDealAsync(workspaceId, GetUserId(), dealId, request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

         [HttpPut("deals/{dealId}/stage")]
        public async Task<ActionResult<DealDto>> UpdateDealStage(Guid workspaceId, Guid dealId, UpdateDealStageRequest request)
        {
             try
            {
                var result = await _crmService.UpdateDealStageAsync(workspaceId, GetUserId(), dealId, request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpDelete("deals/{dealId}")]
        public async Task<ActionResult> DeleteDeal(Guid workspaceId, Guid dealId)
        {
            var success = await _crmService.DeleteDealAsync(workspaceId, dealId);
            if (!success) return NotFound();
            return NoContent();
        }

        // --- Activities ---

        [HttpGet("activities")]
        public async Task<ActionResult<List<CrmActivityDto>>> GetActivities(Guid workspaceId, [FromQuery] Guid? entityId, [FromQuery] string? entityType)
        {
            return Ok(await _crmService.GetActivitiesAsync(workspaceId, entityId, entityType));
        }
    }
}
