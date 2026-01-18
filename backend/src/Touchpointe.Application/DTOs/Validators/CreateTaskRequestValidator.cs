using FluentValidation;
using Touchpointe.Application.DTOs;

namespace Touchpointe.Application.DTOs.Validators
{
    public class CreateTaskRequestValidator : AbstractValidator<CreateTaskRequest>
    {
        public CreateTaskRequestValidator()
        {
            RuleFor(v => v.ListId)
                .NotEmpty().WithMessage("List ID is required.");

            RuleFor(v => v.Title)
                .NotEmpty().WithMessage("Title is required.")
                .MaximumLength(200).WithMessage("Title must not exceed 200 characters.");

            RuleFor(v => v.Priority)
                .IsInEnum().When(v => v.Priority.HasValue)
                .WithMessage("Invalid Priority value.");
        }
    }
}
