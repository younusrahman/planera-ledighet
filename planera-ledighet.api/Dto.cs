using System.ComponentModel.DataAnnotations;

namespace planera_ledighet.api
{
    public class DtoAbsenceCategory
    {
        public string? Id { get; set; }
        public string Label { get; set; }
        public string Color { get; set; }
    }


    public class DtoTeam
    {
        public string Id { get; set; }
        public string Name { get; set; }
    }

    public class DtoEmployee
    {
        public string? Id { get; set; }
        public string Name { get; set; }
        public string TeamId { get; set; }
    }



    public class DtoAbsence
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }

        public int DurationDays { get; set; }
        public string Color { get; set; } = string.Empty;
        public string EmployeeId { get; set; } = string.Empty;
        public string AbsenceCategoryId { get; set; } = string.Empty;
        public AbsenceStatus Status { get; set; }
        public string? RejectionReason { get; set; }
    }

    public class DbDeleteStatus
    {
        public bool DbDeleted { get; set; }
        public bool ShmDeleted { get; set; }
        public bool WalDeleted { get; set; }
        public string Message { get; set; } = "";
    }
    public class DbOperationStatus
    {
        public bool Success { get; set; }
        public string Message { get; set; } = "";
        public string? BackupFile { get; set; }
    }

    public class AbsencePerTeamDto
    {
        public string TeamName { get; set; }
        public int Count { get; set; }
    }

    public class AbsencePerCategoryDto
    {
        public string Label { get; set; }
        public string Color { get; set; }
        public int Count { get; set; }
    }

    public class AbsencePerTeamCategoryDto
    {
        public string TeamName { get; set; }
        public List<AbsencePerCategoryDto> Categories { get; set; }
    }

    public class HolidayAbsenceDto
    {
        public string Holiday { get; set; }
        public int Count { get; set; }
    }

    public class SemesterAbsenceDto
    {
        public string Semester { get; set; }
        public int Count { get; set; }
    }

    public class QuarterAbsenceDto
    {
        public string Quarter { get; set; }
        public int Count { get; set; }
    }

    public class MonthAbsenceDto
    {
        public string Month { get; set; }
        public int Count { get; set; }
    }

    public class OverlapAbsenceDto
    {
        public DateTime Date { get; set; }
        public int Count { get; set; }
    }

    public class TeamAvailabilityDto
    {
        public string TeamName { get; set; }
        public int Available { get; set; }
        public int Absent { get; set; }
    }

    public class EmployeeRankingDto
    {
        public string EmployeeName { get; set; }
        public int DaysAbsent { get; set; }
    }
    public class ChangeAbsenceStatusDto
    {
        public string Id { get; set; }
        public AbsenceStatus Status { get; set; }
        public string? RejectionReason { get; set; }
    }

}
