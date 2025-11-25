using AdminEmployeePortal.Data;
using Microsoft.EntityFrameworkCore;
using System.Text;

namespace AdminEmployeePortal.Services.Exports
{
    public class EmployeeExportService : IEmployeeExportService
    {
        private readonly ApplicationDbContext dbContext;
        public EmployeeExportService(ApplicationDbContext dbContext)
        {
            this.dbContext = dbContext;
        }

        public async Task<byte[]> ExportEmployeesToCsvAsync()
        {
            var employees = await dbContext.Employees.ToListAsync();

            var sb = new StringBuilder();
            sb.AppendLine("Id,Name,Email,Phone,Salary,imagePath");

            foreach (var e in employees)
            {
                sb.AppendLine($"{e.Id},{Escape(e.Name)},{Escape(e.Email)},{Escape(e.Phone)},{e.Salary},{Escape(e.ImagePath)}");
            }

            return Encoding.UTF8.GetBytes( sb.ToString() );
        }

        private static string Escape(string? input)
        {
            if (string.IsNullOrEmpty(input))
                return "";

            if (input.Contains(",") || input.Contains("\""))
            {
                input = input.Replace("\"", "\"\"");
                return $"\"{input}\"";
            }

            return input;
        }
    }
}
