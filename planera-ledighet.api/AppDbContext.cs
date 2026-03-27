using Microsoft.EntityFrameworkCore;

namespace planera_ledighet.api
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<AbsenceCategory> AbsenceCategorys { get; set; }
        public DbSet<Team> Teams { get; set; }
        public DbSet<Employee> Employees { get; set; }
        public DbSet<Absence> Absences { get; set; }
        public DbSet<UiConfig> UiConfigs { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Absence>()
                .HasOne(a => a.Employee)
                .WithMany(e => e.Absences)
                .HasForeignKey(a => a.EmployeeId);

            modelBuilder.Entity<Absence>()
                .HasOne(a => a.AbsenceCategory)
                .WithMany(c => c.Absences)
                .HasForeignKey(a => a.AbsenceCategoryId);

            modelBuilder.Entity<Employee>()
                .HasOne(e => e.Team)
                .WithMany(t => t.Employees)
                .HasForeignKey(e => e.TeamId);
        }
    }
}
