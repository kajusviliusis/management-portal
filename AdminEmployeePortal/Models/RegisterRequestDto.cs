using Microsoft.Identity.Client;

namespace AdminEmployeePortal.Models
{
    public class RegisterRequestDto
    {
        public string Username { get; set; }
        public string Password { get; set; }
    }
}
