using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Reflection.Emit;

namespace planera_ledighet.api
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<AbsenceType> AbsenceTypes { get; set; }
        public DbSet<Group> Groups { get; set; }
        public DbSet<Resource> Resources { get; set; }
        public DbSet<LeaveItem> LeaveItems { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<LeaveItem>()
                .HasOne(li => li.Resource)
                .WithMany(r => r.LeaveItems)
                .HasForeignKey(li => li.ResourceId);

            modelBuilder.Entity<LeaveItem>()
                .HasOne(li => li.AbsenceType)
                .WithMany(a => a.LeaveItems)
                .HasForeignKey(li => li.AbsenceTypeId);

            modelBuilder.Entity<Resource>()
                .HasOne(r => r.Group)
                .WithMany(g => g.Resources)
                .HasForeignKey(r => r.GroupId);
        }
    }
}
