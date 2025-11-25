using AdminEmployeePortal.Data;
using AdminEmployeePortal.Models;
using AdminEmployeePortal.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using AdminEmployeePortal.Services.Exports;

namespace AdminEmployeePortal.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class EmployeesController : ControllerBase
    {
        private readonly ApplicationDbContext dbContext;
        private readonly IEmployeeExportService exportService;

        public EmployeesController(ApplicationDbContext dbContext,
                                    IEmployeeExportService exportService)
        {
            this.dbContext = dbContext;
            this.exportService = exportService;
        }


        [HttpGet]
        public IActionResult GetAllEmployees()
        {
            var allEmployees = dbContext.Employees.ToList();
            return Ok(allEmployees);
        }
        [HttpGet]
        [Route("{id:guid}")]
        public IActionResult GetEmployeeById(Guid id)
        {
            var employee = dbContext.Employees.Find(id);

            if (employee == null)
            {
                return NotFound();
            }

            return Ok(employee);
        }

        [HttpGet("search")]
        public IActionResult SearchEmployee(string name, int? minSalary, string sortOrder)
        {
            var query = dbContext.Employees.AsQueryable();

            if (!string.IsNullOrEmpty(name))
            {
                query = query.Where(emp => emp.Name.ToLower().Contains(name.ToLower()));
            }

            if (minSalary.HasValue)
            {
                query = query.Where(emp => emp.Salary >= minSalary.Value);
            }

            if(sortOrder=="asc")
            {
                query = query.OrderBy(emp => emp.Salary);
            }
            else if(sortOrder=="desc")
            {
                query = query.OrderByDescending(emp => emp.Salary);
            }

            var results = query.ToList();
            return Ok(results);
        }



        [HttpPost]
        public IActionResult AddEmployee(AddEmployeeDto addEmployeeDto)
        {
            var employeeEntity = new Employee()
            {
                Name = addEmployeeDto.Name,
                Email = addEmployeeDto.Email,
                Phone = addEmployeeDto.Phone,
                Salary = addEmployeeDto.Salary
            };
            dbContext.Employees.Add(employeeEntity);
            dbContext.SaveChanges();

            return Ok(employeeEntity);
        }

        [HttpPut]
        [Route("{id:guid}")]
        public IActionResult UpdateEmployee(Guid id, UpdateEmployeeDto updateEmployeeDto)
        {
            var employee = dbContext.Employees.Find(id);
            if (employee == null)
            {
                return NotFound();
            }
            employee.Name = updateEmployeeDto.Name;
            employee.Email = updateEmployeeDto.Email;
            employee.Phone = updateEmployeeDto.Phone;
            employee.Salary = updateEmployeeDto.Salary;
            dbContext.SaveChanges();

            return Ok(employee);
        }

        [HttpDelete]
        [Route("{id:guid}")]
        public IActionResult DeleteEmployee(Guid id)
        {
            var employee = dbContext.Employees.Find(id);
            if (employee == null)
            {
                return NotFound();
            }
            dbContext.Employees.Remove(employee);
            dbContext.SaveChanges();

            return Ok();
        }

        [HttpPost("{id}/upload-image")]
        public async Task<IActionResult> UploadImage(Guid id, IFormFile image)
        {
            var employee = await dbContext.Employees.FindAsync(id);
            if (employee==null)
            {
                return NotFound();
            }

            if(image==null || image.Length==0)
            {
                return BadRequest("No image provided");
            }

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };
            var extension = Path.GetExtension(image.FileName).ToLower();
            if(!allowedExtensions.Contains(extension))
            {
                return BadRequest("Only jpg and png files allowed");
            }
            //5mb max
            if(image.Length > 5 * 1024 * 1024)
            {
                return BadRequest("Must be less than 5 Mb");
            }

            if(!string.IsNullOrEmpty(employee.ImagePath))
            {
                var oldImagePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", employee.ImagePath.TrimStart('/'));
                if(System.IO.File.Exists(oldImagePath))
                {
                    System.IO.File.Delete(oldImagePath);
                }
            }

            var fileName = $"{Guid.NewGuid()}-{extension}";
            var folderPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "employees");
            var filePath = Path.Combine(folderPath, fileName);

            Directory.CreateDirectory(folderPath);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await image.CopyToAsync(stream);
            }

            employee.ImagePath = $"/images/employees/{fileName}";
            await dbContext.SaveChangesAsync();

            return Ok(new {imagePath = employee.ImagePath});
        }

        [HttpGet("export")]
        public async Task<IActionResult> ExportEmployees()
        {
            var fileBytes = await exportService.ExportEmployeesToCsvAsync();
            return File(fileBytes, "text/csv", $"employees_{DateTime.UtcNow:yyyyMMdd}.csv");
        }
    }
}
