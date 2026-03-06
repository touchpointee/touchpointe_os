using System;
using System.Net;
using System.Net.Mail;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Touchpointe.Application.Common.Interfaces;

namespace Touchpointe.Infrastructure.Services
{
    public class SmtpEmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public SmtpEmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task SendWorkspaceInvitationEmailAsync(
            string toEmail,
            string workspaceName,
            string inviterName,
            string acceptUrl,
            DateTime expiresAtUtc,
            CancellationToken cancellationToken = default)
        {
            var smtpHost = GetConfig("SMTP_HOST", "Smtp:Host");
            var smtpPortValue = GetConfig("SMTP_PORT", "Smtp:Port");
            var smtpUsername = GetConfig("SMTP_USERNAME", "Smtp:Username");
            var smtpPassword = GetConfig("SMTP_PASSWORD", "Smtp:Password");
            var fromEmail = GetConfig("SMTP_FROM_EMAIL", "Smtp:FromEmail");
            var fromName = GetConfig("SMTP_FROM_NAME", "Smtp:FromName") ?? "Touchpointe";
            var enableSslValue = GetConfig("SMTP_ENABLE_SSL", "Smtp:EnableSsl");

            if (string.IsNullOrWhiteSpace(smtpHost))
                throw new InvalidOperationException("SMTP host is not configured. Set SMTP_HOST or Smtp:Host.");
            if (string.IsNullOrWhiteSpace(fromEmail))
                throw new InvalidOperationException("SMTP from email is not configured. Set SMTP_FROM_EMAIL or Smtp:FromEmail.");

            var smtpPort = 587;
            if (!string.IsNullOrWhiteSpace(smtpPortValue) && int.TryParse(smtpPortValue, out var parsedPort))
            {
                smtpPort = parsedPort;
            }

            var enableSsl = true;
            if (!string.IsNullOrWhiteSpace(enableSslValue) && bool.TryParse(enableSslValue, out var parsedEnableSsl))
            {
                enableSsl = parsedEnableSsl;
            }

            using var client = new SmtpClient(smtpHost, smtpPort)
            {
                EnableSsl = enableSsl,
                DeliveryMethod = SmtpDeliveryMethod.Network,
                UseDefaultCredentials = false
            };

            if (!string.IsNullOrWhiteSpace(smtpUsername))
            {
                client.Credentials = new NetworkCredential(smtpUsername, smtpPassword ?? string.Empty);
            }

            var subject = $"You've been invited to join {workspaceName}";
            var plainTextBody =
                $"Hi,{Environment.NewLine}{Environment.NewLine}" +
                $"{inviterName} invited you to join workspace \"{workspaceName}\" on Touchpointe.{Environment.NewLine}" +
                $"Accept invitation: {acceptUrl}{Environment.NewLine}" +
                $"This invitation expires on {expiresAtUtc:yyyy-MM-dd HH:mm} UTC.{Environment.NewLine}{Environment.NewLine}" +
                $"If you were not expecting this email, you can ignore it.";

            var htmlBody =
                "<p>Hi,</p>" +
                $"<p><strong>{WebUtility.HtmlEncode(inviterName)}</strong> invited you to join workspace <strong>{WebUtility.HtmlEncode(workspaceName)}</strong> on Touchpointe.</p>" +
                $"<p><a href=\"{WebUtility.HtmlEncode(acceptUrl)}\">Accept workspace invitation</a></p>" +
                $"<p>This invitation expires on {expiresAtUtc:yyyy-MM-dd HH:mm} UTC.</p>" +
                "<p>If you were not expecting this email, you can ignore it.</p>";

            using var message = new MailMessage
            {
                From = new MailAddress(fromEmail, fromName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };

            message.To.Add(toEmail);
            message.AlternateViews.Add(AlternateView.CreateAlternateViewFromString(plainTextBody, null, "text/plain"));

            cancellationToken.ThrowIfCancellationRequested();
            await client.SendMailAsync(message, cancellationToken);
        }

        private string? GetConfig(string envKey, string configKey)
        {
            var envValue = Environment.GetEnvironmentVariable(envKey);
            return !string.IsNullOrWhiteSpace(envValue) ? envValue : _configuration[configKey];
        }
    }
}
