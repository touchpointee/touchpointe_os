using System;
using System.Threading;
using System.Threading.Tasks;

namespace Touchpointe.Application.Common.Interfaces
{
    public interface IEmailService
    {
        Task SendWorkspaceInvitationEmailAsync(
            string toEmail,
            string workspaceName,
            string inviterName,
            string acceptUrl,
            DateTime expiresAtUtc,
            CancellationToken cancellationToken = default);
    }
}
