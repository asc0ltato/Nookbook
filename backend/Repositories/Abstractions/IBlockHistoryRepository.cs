using NookBook.API.Models;

namespace NookBook.API.Repositories.Abstractions;

public interface IBlockHistoryRepository : IRepository<BlockHistory>
{
    Task<bool> IsEntityBlockedAsync(string entityType, int entityId);
    Task<BlockHistory?> GetLatestBlockStatusAsync(string entityType, int entityId);
    Task<IEnumerable<BlockHistory>> GetEntityHistoryAsync(string entityType, int entityId);
    Task SetEntityBlockStatusAsync(string entityType, int entityId, bool isBlocked, string? reason, int changedByUserId);
}
