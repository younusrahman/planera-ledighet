using Microsoft.EntityFrameworkCore;

namespace planera_ledighet.api
{
    public interface IDatabaseCloser
    {
        void CloseConnections();
    }

    public class DatabaseCloser : IDatabaseCloser
    {
        private readonly AppDbContext _context;

        public DatabaseCloser(AppDbContext context)
        {
            _context = context;
        }

        public void CloseConnections()
        {
            _context.Database.CloseConnection();
        }
    }

}
