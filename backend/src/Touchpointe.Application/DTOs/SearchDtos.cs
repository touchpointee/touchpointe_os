using System;

namespace Touchpointe.Application.DTOs
{
    public class SearchResultDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public string Subtitle { get; set; }
        public string Type { get; set; } // Task, Lead, Contact, Company, Deal, Channel
        public string Url { get; set; }
    }
}
