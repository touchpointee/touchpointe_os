using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Touchpointe.Application.Common.Interfaces;
using Touchpointe.Application.DTOs;

namespace Touchpointe.API.Controllers
{
    [ApiController]
    [Route("api/workspaces/{workspaceId}/crm/leads")]
    [Authorize]
    public class LeadController : BaseController
    {
        private readonly ILeadService _leadService;

        public LeadController(ILeadService leadService)
        {
            _leadService = leadService;
        }

        [HttpGet]
        public async Task<ActionResult<List<LeadDto>>> GetLeads(
            Guid workspaceId, 
            [FromQuery] string? status = null,
            [FromQuery] string? source = null)
        {
            var leads = await _leadService.GetLeadsAsync(workspaceId, status, source);
            return Ok(leads);
        }

        [HttpGet("{leadId}")]
        public async Task<ActionResult<LeadDto>> GetLead(Guid workspaceId, Guid leadId)
        {
            var lead = await _leadService.GetLeadByIdAsync(workspaceId, leadId);
            if (lead == null) return NotFound();
            return Ok(lead);
        }

        [HttpPost]
        public async Task<ActionResult<LeadDto>> CreateLead(Guid workspaceId, CreateLeadRequest request)
        {
            try
            {
                var lead = await _leadService.CreateLeadAsync(workspaceId, GetUserId(), request);
                return Ok(lead);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPut("{leadId}")]
        public async Task<ActionResult<LeadDto>> UpdateLead(Guid workspaceId, Guid leadId, UpdateLeadRequest request)
        {
            try
            {
                var lead = await _leadService.UpdateLeadAsync(workspaceId, leadId, GetUserId(), request);
                return Ok(lead);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpDelete("{leadId}")]
        public async Task<ActionResult> DeleteLead(Guid workspaceId, Guid leadId)
        {
            var success = await _leadService.DeleteLeadAsync(workspaceId, leadId);
            if (!success) return NotFound();
            return NoContent();
        }

        [HttpPost("{leadId}/convert")]
        public async Task<ActionResult<ConvertLeadResponse>> ConvertLead(
            Guid workspaceId, 
            Guid leadId, 
            ConvertLeadRequest request)
        {
            try
            {
                var response = await _leadService.ConvertLeadAsync(workspaceId, leadId, GetUserId(), request);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("{leadId}/activities")]
        public async Task<ActionResult<List<LeadActivityDto>>> GetLeadActivities(Guid workspaceId, Guid leadId)
        {
            var activities = await _leadService.GetLeadActivitiesAsync(workspaceId, leadId);
            return Ok(activities);
        }

        // ========== DASHBOARD ==========

        [HttpGet("~/api/workspaces/{workspaceId}/crm/dashboard/summary")]
        public async Task<ActionResult<CrmDashboardSummary>> GetDashboardSummary(Guid workspaceId)
        {
            var summary = await _leadService.GetDashboardSummaryAsync(workspaceId);
            return Ok(summary);
        }

        [HttpGet("~/api/workspaces/{workspaceId}/crm/dashboard/leads-by-source")]
        public async Task<ActionResult<List<LeadsBySourceDto>>> GetLeadsBySource(Guid workspaceId)
        {
            var data = await _leadService.GetLeadsBySourceAsync(workspaceId);
            return Ok(data);
        }

        [HttpGet("~/api/workspaces/{workspaceId}/crm/dashboard/conversion-funnel")]
        public async Task<ActionResult<ConversionFunnelDto>> GetConversionFunnel(Guid workspaceId)
        {
            var data = await _leadService.GetConversionFunnelAsync(workspaceId);
            return Ok(data);
        }
    }
}
