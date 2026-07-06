using Microsoft.EntityFrameworkCore;
using NookBook.API.Data;
using NookBook.API.Models;
using NookBook.API.Repositories.Abstractions;

namespace NookBook.API.Repositories;

public class BlockHistoryRepository : Repository<BlockHistory>, IBlockHistoryRepository
{
    public BlockHistoryRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<bool> IsEntityBlockedAsync(string entityType, int entityId)
    {
        var latestStatus = await GetLatestBlockStatusAsync(entityType, entityId);
        return latestStatus != null && latestStatus.IsBlocked;
    }

    public async Task<BlockHistory?> GetLatestBlockStatusAsync(string entityType, int entityId)
    {
        return await _dbSet
            .Where(bh => bh.EntityType == entityType && bh.EntityId == entityId)
            .OrderByDescending(bh => bh.ChangedAt)
            .FirstOrDefaultAsync();
    }

    public async Task<IEnumerable<BlockHistory>> GetEntityHistoryAsync(string entityType, int entityId)
    {
        return await _dbSet
            .Where(bh => bh.EntityType == entityType && bh.EntityId == entityId)
            .OrderByDescending(bh => bh.ChangedAt)
            .ToListAsync();
    }

    public async Task SetEntityBlockStatusAsync(
        string entityType,
        int entityId,
        bool isBlocked,
        string? reason,
        int changedByUserId)
    {
        var latest = await GetLatestBlockStatusAsync(entityType, entityId);
        if (latest != null)
        {
            latest.IsBlocked = isBlocked;
            if (isBlocked)
            {
                latest.Reason = reason ?? string.Empty;
            }
            latest.ChangedByUserId = changedByUserId;
            latest.ChangedAt = DateTime.UtcNow;
            _dbSet.Update(latest);
            return;
        }

        if (isBlocked)
        {
            await AddAsync(new BlockHistory
            {
                EntityType = entityType,
                EntityId = entityId,
                IsBlocked = true,
                Reason = reason ?? string.Empty,
                ChangedByUserId = changedByUserId,
                ChangedAt = DateTime.UtcNow
            });
        }
    }
}
