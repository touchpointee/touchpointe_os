using Touchpointe.Application.Common.Interfaces;
using Touchpointe.Application.Common.Authentication;
using Touchpointe.Application.Auth.Commands.Register;
using Touchpointe.Application.Auth.Commands.Login;
using Touchpointe.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Touchpointe.Application.Services.Authentication
{
    public class AuthenticationService : IAuthenticationService
    {
        private readonly IJwtTokenGenerator _jwtTokenGenerator;
        private readonly IApplicationDbContext _context;
        private readonly IPasswordHasher _passwordHasher;

        public AuthenticationService(IJwtTokenGenerator jwtTokenGenerator, IApplicationDbContext context, IPasswordHasher passwordHasher)
        {
            _jwtTokenGenerator = jwtTokenGenerator;
            _context = context;
            _passwordHasher = passwordHasher;
        }

        public async Task<AuthenticationResult> Register(RegisterCommand command)
        {
            // 1. Validate Uniqueness
            if (await _context.Users.AnyAsync(u => u.Email == command.Email))
            {
                throw new Exception("User with this email already exists.");
            }
            if (await _context.Users.AnyAsync(u => u.Username == command.Username))
            {
                 throw new Exception("User with this username already exists."); 
            }

            // 2. Create User
            var user = new User
            {
                FullName = command.FullName,
                Email = command.Email,
                Username = command.Username,
                PasswordHash = _passwordHasher.HashPassword(command.Password)
            };

            _context.Users.Add(user);

            // 3. Bootstrap Workspace Logic
            var workspace = new Workspace
            {
                Name = $"{command.FullName}'s Workspace",
                Slug = command.Username, // Simple slug strategy for now
                Owner = user, // Ef Core will handle ID link
                OwnerId = user.Id
            };
            _context.Workspaces.Add(workspace);

            var member = new WorkspaceMember
            {
                User = user,
                Workspace = workspace,
                Role = WorkspaceRole.OWNER
            };
            _context.WorkspaceMembers.Add(member);

            // 4. Default Hierarchy
            var space = new Space
            {
                Name = "General",
                Workspace = workspace,
                Icon = "LayoutGrid" // Lucide icon name
            };
            _context.Spaces.Add(space);

            var list = new TaskList
            {
                Name = "Inbox",
                Workspace = workspace,
                Space = space
            };
            _context.TaskLists.Add(list);

            var channel = new Channel
            {
                Name = "general",
                Workspace = workspace,
                IsPrivate = false,
                Description = "General discussion"
            };
            _context.Channels.Add(channel);

            await _context.SaveChangesAsync(CancellationToken.None);

            // 5. Generate Token
            var token = _jwtTokenGenerator.GenerateToken(user);

            return new AuthenticationResult(
                user.Id,
                user.FullName,
                user.Email,
                token);
        }

        public async Task<AuthenticationResult> Login(LoginCommand command)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == command.Email);

            if (user is null)
            {
                throw new Exception("Invalid credentials.");
            }

            if (!_passwordHasher.VerifyPassword(command.Password, user.PasswordHash))
            {
                throw new Exception("Invalid credentials.");
            }

            var token = _jwtTokenGenerator.GenerateToken(user);

            return new AuthenticationResult(
                user.Id,
                user.FullName,
                user.Email,
                token);
        }
    }
}
