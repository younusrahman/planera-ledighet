using Microsoft.EntityFrameworkCore;
using planera_ledighet.api;
using planera_ledighet.api.Services;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddScoped<IDatabaseMaintenanceService, DatabaseMaintenanceService>();
builder.Services.AddScoped<IDatabaseCloser, DatabaseCloser>();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=planera.db"));
builder.Services.AddCors(options => { options.AddPolicy("AllowFrontend", policy => { policy.WithOrigins("http://localhost:5173").AllowAnyHeader().AllowAnyMethod(); }); });
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Run migrations automatically
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseCors("AllowFrontend");
app.UseAuthorization();
app.MapControllers();

app.Run();