namespace AdminEmployeePortal.Services.Exports
{
    public interface IEmployeeExportService
    {
        Task<byte[]> ExportEmployeesToCsvAsync();
    }
}
