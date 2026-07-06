using NookBook.API.DTOs;
using NookBook.API.Models;
using NookBook.API.Repositories.Abstractions;
using NookBook.API.Services.Abstractions;

namespace NookBook.API.Services;

public class RoomService : IRoomService
{
    private static readonly BookingStatusEnum[] BlockingBookingStatuses = [BookingStatusEnum.Pending, BookingStatusEnum.Confirmed, BookingStatusEnum.CheckedIn];
    private const string DefaultRoomImage = "/assets/rooms/block.jpg";

    private readonly IRoomRepository _roomRepository;
    private readonly IHotelRepository _hotelRepository;
    private readonly IUnitOfWork _unitOfWork;

    public RoomService(
        IRoomRepository roomRepository,
        IHotelRepository hotelRepository,
        IUnitOfWork unitOfWork)
    {
        _roomRepository = roomRepository;
        _hotelRepository = hotelRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<IEnumerable<RoomDto>>> GetRoomsByHotelAsync(int hotelId)
    {
        try
        {
            var rooms = (await _roomRepository.GetRoomsByHotelAsync(hotelId)).ToList();
            var (latestRoomBlocks, lastBlockReasons) = BuildRoomBlockMaps(await _unitOfWork.BlockHistory.GetAllAsync());
            var roomDtos = rooms.Select(r => MapToDto(r, latestRoomBlocks, lastBlockReasons));
            return ApiResponse<IEnumerable<RoomDto>>.SuccessResponse(roomDtos, "Rooms retrieved successfully");
        }
        catch (Exception ex)
        {
            return ApiResponse<IEnumerable<RoomDto>>.ErrorResponse($"Error retrieving rooms: {ex.Message}");
        }
    }

    public async Task<ApiResponse<RoomDto>> GetRoomByIdAsync(int id)
    {
        try
        {
            var room = await _roomRepository.GetByIdAsync(id);
            if (room == null)
            {
                return ApiResponse<RoomDto>.ErrorResponse("Room not found");
            }
            var histories = (await _unitOfWork.BlockHistory.GetAllAsync()).Where(bh => bh.EntityType == "Room" && bh.EntityId == id);
            var (latestRoomBlocks, lastBlockReasons) = BuildRoomBlockMaps(histories);
            return ApiResponse<RoomDto>.SuccessResponse(MapToDto(room, latestRoomBlocks, lastBlockReasons), "Room retrieved successfully");
        }
        catch (Exception ex)
        {
            return ApiResponse<RoomDto>.ErrorResponse($"Error retrieving room: {ex.Message}");
        }
    }

    public async Task<ApiResponse<RoomDto>> CreateRoomAsync(CreateRoomDto createDto)
    {
        try
        {
            var hotel = await _hotelRepository.GetByIdAsync(createDto.HotelId);
            if (hotel == null)
            {
                return ApiResponse<RoomDto>.ErrorResponse("Hotel not found");
            }

            var existingRooms = await _roomRepository.GetRoomsByHotelAsync(createDto.HotelId);
            var roomNumber = string.IsNullOrWhiteSpace(createDto.RoomNumber) ? (createDto.Name ?? string.Empty) : createDto.RoomNumber;
            if (existingRooms.Any(r => r.RoomNumber.Equals(roomNumber, StringComparison.OrdinalIgnoreCase)))
            {
                return ApiResponse<RoomDto>.ErrorResponse($"Номер с номером комнаты '{roomNumber}' уже существует в этом отеле");
            }

            var images = NormalizeRoomImages(createDto.Images, createDto.Image);

            var room = new Room
            {
                RoomTypeId = createDto.RoomTypeId,
                RoomNumber = string.IsNullOrWhiteSpace(createDto.RoomNumber) ? (createDto.Name ?? string.Empty) : createDto.RoomNumber,
                Price = createDto.Price.HasValue && createDto.Price.Value > 0 ? createDto.Price.Value : 0,
                MealType = createDto.MealType.HasValue ? (MealType)createDto.MealType.Value : MealType.SelfCatering,
                HotelId = createDto.HotelId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _roomRepository.AddAsync(room);
            await _unitOfWork.SaveChangesAsync();

            await ReplaceRoomTypeImagesAsync(room.RoomTypeId, images);

            await UpsertRoomTypeDetailsAsync(room.Id, createDto.Description, createDto.MaxGuests, createDto.BedCount, createDto.Size);

            if (createDto.AmenityTypeIds != null && createDto.AmenityTypeIds.Any())
            {
                foreach (var amenityTypeId in createDto.AmenityTypeIds)
                {
                    room.RoomAmenities.Add(new RoomAmenity
                    {
                        RoomId = room.Id,
                        RoomAmenityTypeId = amenityTypeId
                    });
                }
                await _unitOfWork.SaveChangesAsync();
            }

            var createdRoom = await _roomRepository.GetByIdAsync(room.Id);
            if (createdRoom == null)
            {
                return ApiResponse<RoomDto>.ErrorResponse("Ошибка при создании номера: номер не найден после создания");
            }

            return ApiResponse<RoomDto>.SuccessResponse(MapToDto(createdRoom), "Room created successfully");        }
        catch (Exception ex)
        {
            return ApiResponse<RoomDto>.ErrorResponse($"Error creating room: {ex.Message}");
        }
    }

    public async Task<ApiResponse<RoomDto>> UpdateRoomAsync(int id, UpdateRoomDto updateDto)
    {
        try
        {
            var room = await _roomRepository.GetByIdAsync(id);
            if (room == null)
            {
                return ApiResponse<RoomDto>.ErrorResponse("Room not found");
            }

            var nextRoomNumber = updateDto.RoomNumber ?? updateDto.Name;
            if (nextRoomNumber != null && !room.RoomNumber.Equals(nextRoomNumber, StringComparison.OrdinalIgnoreCase))
            {
                var existingRooms = await _roomRepository.GetRoomsByHotelAsync(room.HotelId);
                if (existingRooms.Any(r => r.Id != id && r.RoomNumber.Equals(nextRoomNumber, StringComparison.OrdinalIgnoreCase)))
                {
                    return ApiResponse<RoomDto>.ErrorResponse($"Номер с номером комнаты '{nextRoomNumber}' уже существует в этом отеле");
                }
            }

            if (updateDto.RoomTypeId.HasValue) room.RoomTypeId = updateDto.RoomTypeId.Value;
            if (nextRoomNumber != null) room.RoomNumber = nextRoomNumber;
            if (updateDto.Price.HasValue && updateDto.Price.Value > 0) room.Price = updateDto.Price.Value;
            if (updateDto.MealType.HasValue) room.MealType = (MealType)updateDto.MealType.Value;
            room.UpdatedAt = DateTime.UtcNow;

            if (updateDto.Images != null || updateDto.Image != null)
            {
                var images = NormalizeRoomImages(updateDto.Images, updateDto.Image);
                await ReplaceRoomTypeImagesAsync(room.RoomTypeId, images);
            }

            await UpsertRoomTypeDetailsAsync(room.Id, updateDto.Description, updateDto.MaxGuests, updateDto.BedCount, updateDto.Size);

            if (updateDto.AmenityTypeIds != null)
            {
                var existingAmenities = room.RoomAmenities.ToList();
                foreach (var amenity in existingAmenities)
                {
                    room.RoomAmenities.Remove(amenity);
                }
                await _unitOfWork.SaveChangesAsync();

                foreach (var amenityTypeId in updateDto.AmenityTypeIds)
                {
                    room.RoomAmenities.Add(new RoomAmenity
                    {
                        RoomId = room.Id,
                        RoomAmenityTypeId = amenityTypeId
                    });
                }
            }

            _roomRepository.Update(room);
            await _unitOfWork.SaveChangesAsync();

            var updatedRoom = await _roomRepository.GetByIdAsync(room.Id) ?? room;
            return ApiResponse<RoomDto>.SuccessResponse(MapToDto(updatedRoom), "Room updated successfully");
        }
        catch (Exception ex)
        {
            return ApiResponse<RoomDto>.ErrorResponse($"Error updating room: {ex.Message}");
        }
    }

    public async Task<ApiResponse<bool>> DeleteRoomAsync(int id)
    {
        try
        {
            var room = await _roomRepository.GetByIdAsync(id);
            if (room == null)
            {
                return ApiResponse<bool>.ErrorResponse("Room not found");
            }

            var allBookings = await _unitOfWork.Bookings.GetAllAsync();
            var activeBookings = allBookings
                .Where(b => b.RoomId == id)
                .Where(b =>
                {
                    var latestStatus = b.BookingStatuses
                        .OrderByDescending(bs => bs.CreatedAt)
                        .FirstOrDefault()?.Status;
                    return latestStatus.HasValue && BlockingBookingStatuses.Contains(latestStatus.Value);
                })
                .ToList();
            
            if (activeBookings.Any())
            {
                return ApiResponse<bool>.ErrorResponse(
                    $"Невозможно удалить номер. Есть {activeBookings.Count} активных бронирований. Сначала завершите или отмените все бронирования.");
            }

            _roomRepository.Remove(room);
            await _unitOfWork.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResponse(true, "Room deleted successfully");
        }
        catch (Exception ex)
        {
            return ApiResponse<bool>.ErrorResponse($"Error deleting room: {ex.Message}");
        }
    }

    public async Task<ApiResponse<IEnumerable<RoomDto>>> GetAvailableRoomsAsync(int hotelId, DateTime checkIn, DateTime checkOut, int? guests = null)
    {
        try
        {
            var rooms = await _roomRepository.GetAvailableRoomsAsync(hotelId, checkIn, checkOut, guests);
            var (latestRoomBlocks, lastBlockReasons) = BuildRoomBlockMaps(await _unitOfWork.BlockHistory.GetAllAsync());
            var roomDtos = rooms.Select(r => MapToDto(r, latestRoomBlocks, lastBlockReasons));
            return ApiResponse<IEnumerable<RoomDto>>.SuccessResponse(roomDtos, "Available rooms retrieved successfully");
        }
        catch (Exception ex)
        {
            return ApiResponse<IEnumerable<RoomDto>>.ErrorResponse($"Error retrieving available rooms: {ex.Message}");
        }
    }

    public async Task<ApiResponse<IEnumerable<RoomTypeGroupDto>>> GetRoomTypeGroupsAsync(int hotelId, DateTime? checkIn = null, DateTime? checkOut = null, int? guests = null)
    {
        try
        {
            var hotel = await _hotelRepository.GetByIdAsync(hotelId);
            if (hotel == null)
            {
                return ApiResponse<IEnumerable<RoomTypeGroupDto>>.ErrorResponse("Отель не найден");
            }

            var rooms = (await _roomRepository.GetRoomsByHotelAsync(hotelId)).ToList();
            var (latestRoomBlocks, lastBlockReasons) = BuildRoomBlockMaps(await _unitOfWork.BlockHistory.GetAllAsync());
            
            var roomTypeGroups = rooms
                .GroupBy(r => r.RoomTypeId)
                .Select(g => new
                {
                    RoomTypeId = g.Key,
                    RoomTypeName = g.First().RoomType?.Name ?? "",
                    Description = g.First().RoomType?.Description ?? string.Empty,
                    MinPrice = g.Min(r => r.Price),
                    MaxGuests = g.First().RoomType?.MaxGuests ?? 0,
                    BedCount = g.First().RoomType?.BedCount ?? 0,
                    Size = g.First().RoomType?.Size ?? 0,
                    Images = GetRoomTypeImageUrls(g.First().RoomType),
                    Rooms = g.ToList()
                })
                .ToList();

            var result = new List<RoomTypeGroupDto>();

            foreach (var group in roomTypeGroups)
            {
                if (guests.HasValue && group.MaxGuests < guests.Value)
                {
                    continue;
                }

                bool IsRoomAvailable(Room r)
                {
                    if (latestRoomBlocks.TryGetValue(r.Id, out var bh) && bh.IsBlocked)
                    {
                        return false;
                    }
                    if (checkIn.HasValue && checkOut.HasValue)
                    {
                        var checkInDate = DateTime.SpecifyKind(checkIn.Value, DateTimeKind.Utc);
                        var checkOutDate = DateTime.SpecifyKind(checkOut.Value, DateTimeKind.Utc);
                        return !IsRoomBookedForDates(r, checkInDate, checkOutDate);
                    }
                    return true;
                }

                var availableCount = group.Rooms.Count(IsRoomAvailable);

                var amenities = group.Rooms.FirstOrDefault()?.RoomAmenities
                    ?.Where(ra => ra.RoomAmenityType != null)
                    .Select(ra => ra.RoomAmenityType!.Name)
                    .ToList() ?? new List<string>();

                var mealOptions = group.Rooms
                    .GroupBy(r => r.MealType)
                    .Select(mealGroup =>
                    {
                        var availableInMeal = mealGroup.Where(IsRoomAvailable).OrderBy(r => r.Price).ToList();
                        var pick = availableInMeal.FirstOrDefault() ?? mealGroup.OrderBy(r => r.Price).First();
                        return new RoomMealOptionDto
                        {
                            MealType = (int)mealGroup.Key,
                            MealLabel = GetMealLabel(mealGroup.Key),
                            AvailableCount = availableInMeal.Count,
                            Price = pick.Price,
                            RoomId = pick.Id
                        };
                    })
                    .OrderBy(m => m.MealType)
                    .ToList();

                result.Add(new RoomTypeGroupDto
                {
                    RoomTypeId = group.RoomTypeId,
                    RoomTypeName = group.RoomTypeName,
                    Description = group.Description,
                    MinPrice = group.MinPrice,
                    MaxGuests = group.MaxGuests,
                    BedCount = group.BedCount,
                    Size = group.Size,
                    ImageUrl = group.Images.FirstOrDefault() ?? DefaultRoomImage,
                    Images = group.Images.Any() ? group.Images : new List<string> { DefaultRoomImage },
                    AvailableCount = availableCount,
                    Amenities = amenities,
                    MealOptions = mealOptions
                });
            }

            result = result
                .OrderBy(r => r.AvailableCount <= 0)
                .ThenBy(r => r.MinPrice)
                .ToList();

            return ApiResponse<IEnumerable<RoomTypeGroupDto>>.SuccessResponse(result, "Типы номеров получены успешно");
        }
        catch (Exception ex)
        {
            return ApiResponse<IEnumerable<RoomTypeGroupDto>>.ErrorResponse($"Ошибка при получении типов номеров: {ex.Message}");
        }
    }

    private static string GetMealLabel(MealType mealType) => mealType switch
    {
        MealType.Breakfast => "завтрак включен",
        MealType.HalfBoard => "завтрак и ужин включены",
        _ => "с собственной кухней"
    };

    public async Task<ApiResponse<bool>> BlockRoomAsync(int id, string reason)
    {
        try
        {
            var room = await _roomRepository.GetByIdAsync(id);
            if (room == null)
            {
                return ApiResponse<bool>.ErrorResponse("Номер не найден");
            }

            var allBookings = await _unitOfWork.Bookings.GetAllAsync();
            var activeBookings = allBookings
                .Where(b => b.RoomId == id)
                .Where(b =>
                {
                    var latestStatus = b.BookingStatuses
                        .OrderByDescending(bs => bs.CreatedAt)
                        .FirstOrDefault()?.Status;
                    return latestStatus.HasValue && BlockingBookingStatuses.Contains(latestStatus.Value);
                })
                .ToList();

            if (activeBookings.Any())
            {
                return ApiResponse<bool>.ErrorResponse(
                    $"Есть активное бронирование (не завершенное и не отмененное). Сначала завершите или отмените бронирование.");
            }

            await _unitOfWork.BlockHistory.SetEntityBlockStatusAsync(
                "Room",
                id,
                true,
                string.IsNullOrWhiteSpace(reason) ? "Blocked by manager" : reason,
                1);

            await _unitOfWork.SaveChangesAsync();
            return ApiResponse<bool>.SuccessResponse(true, "Номер заблокирован");
        }
        catch (Exception ex)
        {
            return ApiResponse<bool>.ErrorResponse($"Ошибка при блокировке номера: {ex.Message}");
        }
    }

    public async Task<ApiResponse<bool>> UnblockRoomAsync(int id)
    {
        try
        {
            var room = await _roomRepository.GetByIdAsync(id);
            if (room == null)
            {
                return ApiResponse<bool>.ErrorResponse("Номер не найден");
            }

            await _unitOfWork.BlockHistory.SetEntityBlockStatusAsync("Room", id, false, string.Empty, 1);

            await _unitOfWork.SaveChangesAsync();
            return ApiResponse<bool>.SuccessResponse(true, "Номер разблокирован");
        }
        catch (Exception ex)
        {
            return ApiResponse<bool>.ErrorResponse($"Ошибка при разблокировке номера: {ex.Message}");
        }
    }

    private static (Dictionary<int, BlockHistory> Latest, Dictionary<int, string?> LastBlockReasons) BuildRoomBlockMaps(
        IEnumerable<BlockHistory> histories)
    {
        var grouped = histories
            .Where(bh => bh.EntityType == "Room")
            .GroupBy(bh => bh.EntityId);

        var latest = grouped.ToDictionary(
            g => g.Key,
            g => g.OrderByDescending(bh => bh.ChangedAt).First());

        var lastReasons = grouped.ToDictionary(
            g => g.Key,
            g =>
            {
                var reason = g
                    .Where(bh => bh.IsBlocked && !string.IsNullOrWhiteSpace(bh.Reason))
                    .OrderByDescending(bh => bh.ChangedAt)
                    .Select(bh => bh.Reason)
                    .FirstOrDefault();
                return string.IsNullOrWhiteSpace(reason) ? null : reason;
            });

        return (latest, lastReasons);
    }

    private static RoomDto MapToDto(
        Room room,
        Dictionary<int, BlockHistory>? latestBlocks = null,
        Dictionary<int, string?>? lastBlockReasons = null)
    {
        var images = GetRoomImages(room);
        var blockEntry = latestBlocks != null && latestBlocks.TryGetValue(room.Id, out var bh) ? bh : null;
        var isBlocked = blockEntry?.IsBlocked ?? false;
        var displayBlockReason = isBlocked ? blockEntry?.Reason : null;
        var mealType = room.MealType;
        var mealLabel = GetMealLabel(mealType);
        return new RoomDto
        {
            Id = room.Id,
            HotelId = room.HotelId,
            RoomNumber = room.RoomNumber,
            Description = room.RoomType?.Description ?? string.Empty,
            Price = room.Price,
            MaxGuests = room.RoomType?.MaxGuests ?? 0,
            BedCount = room.RoomType?.BedCount ?? 0,
            Size = room.RoomType?.Size ?? 0,
            Image = images.FirstOrDefault() ?? DefaultRoomImage,
            ImageUrl = images.FirstOrDefault() ?? DefaultRoomImage,
            Images = images,
            RoomType = room.RoomType?.Name ?? "",
            RoomTypeId = room.RoomTypeId,
            Amenities = room.RoomAmenities?
                .Where(ra => ra.RoomAmenityType != null)
                .Select(ra => ra.RoomAmenityType!.Name)
                .ToList() ?? new List<string>(),
            IsBlocked = isBlocked,
            BlockReason = displayBlockReason,
            MealType = (int)mealType,
            MealLabel = mealLabel
        };
    }

    private static List<string> NormalizeRoomImages(IEnumerable<string>? images, string? image)
    {
        var normalized = (images ?? Enumerable.Empty<string>())
            .Append(image ?? string.Empty)
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => value.Trim())
            .Where(value => !value.Contains("block.jpg", StringComparison.OrdinalIgnoreCase))
            .Distinct()
            .ToList();

        return normalized.Count > 0 ? normalized : new List<string> { DefaultRoomImage };
    }

    private static List<string> GetRoomImages(Room room) =>
        GetRoomTypeImageUrls(room.RoomType);

    private static List<string> GetRoomTypeImageUrls(RoomType? roomType)
    {
        if (roomType?.Images == null || roomType.Images.Count == 0)
            return new List<string> { DefaultRoomImage };

        var images = roomType.Images
            .OrderByDescending(i => i.IsMain)
            .ThenBy(i => i.Id)
            .Select(i => i.Image.Trim())
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Where(s => !s.Contains("block.jpg", StringComparison.OrdinalIgnoreCase))
            .Distinct()
            .ToList();

        return images.Count > 0 ? images : new List<string> { DefaultRoomImage };
    }

    private async Task ReplaceRoomTypeImagesAsync(int roomTypeId, List<string> imageUrls)
    {
        var existing = (await _unitOfWork.RoomTypeImages.FindAsync(i => i.RoomTypeId == roomTypeId)).ToList();
        if (existing.Count > 0)
            _unitOfWork.RoomTypeImages.RemoveRange(existing);
        await _unitOfWork.SaveChangesAsync();

        var list = imageUrls
            .Where(img => !string.IsNullOrWhiteSpace(img))
            .Select(img => img.Trim())
            .Distinct()
            .Take(5)
            .ToList();
        if (list.Count == 0)
            list = new List<string> { DefaultRoomImage };

        for (var i = 0; i < list.Count; i++)
        {
            await _unitOfWork.RoomTypeImages.AddAsync(new RoomTypeImage
            {
                RoomTypeId = roomTypeId,
                Image = list[i],
                IsMain = i == 0
            });
        }

        await _unitOfWork.SaveChangesAsync();
    }

    private async Task UpsertRoomTypeDetailsAsync(
        int roomId,
        string? description,
        int? maxGuests,
        int? bedCount,
        decimal? size)
    {
        var room = await _roomRepository.GetByIdAsync(roomId);
        var roomType = room?.RoomType;
        if (roomType == null)
        {
            return;
        }

        if (!string.IsNullOrWhiteSpace(description))
        {
            roomType.Description = description;
        }

        if (maxGuests.HasValue && maxGuests.Value > 0)
        {
            roomType.MaxGuests = maxGuests.Value;
        }

        if (bedCount.HasValue && bedCount.Value > 0)
        {
            roomType.BedCount = bedCount.Value;
        }

        if (size.HasValue && size.Value > 0)
        {
            roomType.Size = size.Value;
        }

        await _unitOfWork.SaveChangesAsync();
    }

    private static bool IsRoomBookedForDates(Room room, DateTime checkInDate, DateTime checkOutDate)
    {
        return room.Bookings.Any(b =>
        {
            var latestStatus = b.BookingStatuses
                .OrderByDescending(bs => bs.CreatedAt)
                .FirstOrDefault()?.Status;

            return b.CheckInDate < checkOutDate &&
                   b.CheckOutDate > checkInDate &&
                   (latestStatus == BookingStatusEnum.Pending || 
                    latestStatus == BookingStatusEnum.Confirmed || 
                    latestStatus == BookingStatusEnum.CheckedIn);
        });
    }
}
