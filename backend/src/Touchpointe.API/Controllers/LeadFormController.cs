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
    [Route("api/workspaces/{workspaceId}/crm/forms")]
    [Authorize]
    public class LeadFormController : BaseController
    {
        private readonly ILeadService _leadService;

        public LeadFormController(ILeadService leadService)
        {
            _leadService = leadService;
        }

        [HttpGet]
        public async Task<ActionResult<List<LeadFormDto>>> GetForms(Guid workspaceId)
        {
            var forms = await _leadService.GetFormsAsync(workspaceId);
            return Ok(forms);
        }

        [HttpGet("{formId}")]
        public async Task<ActionResult<LeadFormDto>> GetForm(Guid workspaceId, Guid formId)
        {
            var form = await _leadService.GetFormByIdAsync(workspaceId, formId);
            if (form == null) return NotFound();
            return Ok(form);
        }

        [HttpPost]
        public async Task<ActionResult<LeadFormDto>> CreateForm(Guid workspaceId, CreateLeadFormRequest request)
        {
            try
            {
                var form = await _leadService.CreateFormAsync(workspaceId, GetUserId(), request);
                return Ok(form);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPut("{formId}")]
        public async Task<ActionResult<LeadFormDto>> UpdateForm(Guid workspaceId, Guid formId, UpdateLeadFormRequest request)
        {
            try
            {
                var form = await _leadService.UpdateFormAsync(workspaceId, formId, request);
                return Ok(form);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpDelete("{formId}")]
        public async Task<ActionResult> DeleteForm(Guid workspaceId, Guid formId)
        {
            var success = await _leadService.DeleteFormAsync(workspaceId, formId);
            if (!success) return NotFound();
            return NoContent();
        }

        [HttpGet("{formId}/embed")]
        public async Task<ActionResult> GetEmbedCode(Guid workspaceId, Guid formId, [FromQuery] string? baseUrl = null)
        {
            var form = await _leadService.GetFormByIdAsync(workspaceId, formId);
            if (form == null) return NotFound();

            var apiBaseUrl = baseUrl ?? $"{Request.Scheme}://{Request.Host}";
            
            var embedCode = $@"<!-- TouchPointe Lead Form -->
<div id=""touchpointe-form-{form.Token}""></div>
<script>
(function() {{
    var formToken = '{form.Token}';
    var apiUrl = '{apiBaseUrl}/api/public/forms/' + formToken + '/submit';
    var container = document.getElementById('touchpointe-form-' + formToken);
    
    container.innerHTML = `
        <form id=""tp-form-${{formToken}}"" style=""max-width:400px;font-family:system-ui,-apple-system,sans-serif;"">
            <div style=""margin-bottom:12px;"">
                <input type=""text"" name=""firstName"" placeholder=""First Name"" required 
                    style=""width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;"" />
            </div>
            <div style=""margin-bottom:12px;"">
                <input type=""text"" name=""lastName"" placeholder=""Last Name"" required 
                    style=""width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;"" />
            </div>
            <div style=""margin-bottom:12px;"">
                <input type=""email"" name=""email"" placeholder=""Email"" required 
                    style=""width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;"" />
            </div>
            <div style=""margin-bottom:12px;"">
                <input type=""tel"" name=""phone"" placeholder=""Phone"" 
                    style=""width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;"" />
            </div>
            <button type=""submit"" 
                style=""width:100%;padding:12px;background:#6366f1;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:500;"">
                Submit
            </button>
        </form>
    `;
    
    document.getElementById('tp-form-' + formToken).addEventListener('submit', async function(e) {{
        e.preventDefault();
        var formData = new FormData(e.target);
        var params = new URLSearchParams(window.location.search);
        
        try {{
            var response = await fetch(apiUrl, {{
                method: 'POST',
                headers: {{ 'Content-Type': 'application/json' }},
                body: JSON.stringify({{
                    firstName: formData.get('firstName'),
                    lastName: formData.get('lastName'),
                    email: formData.get('email'),
                    phone: formData.get('phone'),
                    utmSource: params.get('utm_source'),
                    utmMedium: params.get('utm_medium'),
                    utmCampaign: params.get('utm_campaign')
                }})
            }});
            
            if (response.ok) {{
                container.innerHTML = '<p style=""color:#22c55e;font-weight:500;"">{form.SuccessMessage}</p>';
            }} else {{
                alert('Submission failed. Please try again.');
            }}
        }} catch (err) {{
            alert('Submission failed. Please try again.');
        }}
    }});
}})();
</script>";

            return Ok(new { embedCode, formUrl = $"{apiBaseUrl}/api/public/forms/{form.Token}/submit" });
        }
    }

    // ========== PUBLIC FORM SUBMISSION (NO AUTH) ==========

    [ApiController]
    [Route("api/public/forms")]
    public class PublicFormController : ControllerBase
    {
        private readonly ILeadService _leadService;

        public PublicFormController(ILeadService leadService)
        {
            _leadService = leadService;
        }

        [HttpPost("{token}/submit")]
        [AllowAnonymous]
        public async Task<ActionResult> SubmitForm(string token, PublicFormSubmitRequest request)
        {
            try
            {
                var lead = await _leadService.SubmitFormAsync(token, request);
                return Ok(new { success = true, message = "Thank you for your submission!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }
        }

        [HttpGet("{token}")]
        [AllowAnonymous]
        public async Task<ActionResult> GetFormInfo(string token)
        {
            var form = await _leadService.GetFormByTokenAsync(token);
            if (form == null) return NotFound(new { error = "Form not found" });
            
            return Ok(new { 
                name = form.Name, 
                fieldsConfig = form.FieldsConfig,
                successMessage = form.SuccessMessage 
            });
        }
    }
}
