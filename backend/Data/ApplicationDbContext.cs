using Microsoft.EntityFrameworkCore;

using NookBook.API.Constants;
using NookBook.API.Models;



namespace NookBook.API.Data;



public class ApplicationDbContext : DbContext

{

    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)

        : base(options)

    {

    }



    public DbSet<Hotel> Hotels { get; set; }

    public DbSet<City> Cities { get; set; }

    public DbSet<HotelAmenityType> HotelAmenityTypes { get; set; }

    public DbSet<RoomAmenityType> RoomAmenityTypes { get; set; }

    public DbSet<RoomType> RoomTypes { get; set; }

    public DbSet<HotelAmenity> HotelAmenities { get; set; }

    public DbSet<RoomAmenity> RoomAmenities { get; set; }

    public DbSet<Room> Rooms { get; set; }

    public DbSet<Review> Reviews { get; set; }

    public DbSet<User> Users { get; set; }

    public DbSet<Booking> Bookings { get; set; }

    public DbSet<Favorite> Favorites { get; set; }

    public DbSet<BookingStatus> BookingStatuses { get; set; }

    public DbSet<Role> Roles { get; set; }

    public DbSet<Manager> Managers { get; set; }

    public DbSet<ReviewComment> ReviewComments { get; set; }

    public DbSet<ReviewComplaint> ReviewComplaints { get; set; }

    public DbSet<Tag> Tags { get; set; }

    public DbSet<ReviewTag> ReviewTags { get; set; }

    public DbSet<HotelImage> HotelImages { get; set; }

    public DbSet<RoomTypeImage> RoomTypeImages { get; set; }

    public DbSet<BlockHistory> BlockHistory { get; set; }

    /// <summary>Gallery URLs per room type for seed data (same ordering as former per-room JSON).</summary>
    internal static string[] RoomTypeSeedGalleryUrls(int roomTypeId) => roomTypeId switch
    {
        1 => new[] { "/assets/rooms/room1.jpg", "/assets/rooms/room2.jpg", "/assets/rooms/room3.jpg", "/assets/rooms/room4.jpg", "/assets/rooms/room5.jpg" },
        2 => new[] { "/assets/rooms/room2.jpg", "/assets/rooms/room3.jpg", "/assets/rooms/room4.jpg", "/assets/rooms/room5.jpg", "/assets/rooms/room1.jpg" },
        3 => new[] { "/assets/rooms/room3.jpg", "/assets/rooms/room4.jpg", "/assets/rooms/room5.jpg", "/assets/rooms/room1.jpg", "/assets/rooms/room2.jpg" },
        4 => new[] { "/assets/rooms/room4.jpg", "/assets/rooms/room5.jpg", "/assets/rooms/room1.jpg", "/assets/rooms/room2.jpg", "/assets/rooms/room3.jpg" },
        5 => new[] { "/assets/rooms/room5.jpg", "/assets/rooms/room1.jpg", "/assets/rooms/room2.jpg", "/assets/rooms/room3.jpg", "/assets/rooms/room4.jpg" },
        _ => new[] { "/assets/rooms/room1.jpg", "/assets/rooms/room2.jpg", "/assets/rooms/room3.jpg", "/assets/rooms/room4.jpg", "/assets/rooms/room5.jpg" }
    };

    protected override void OnModelCreating(ModelBuilder modelBuilder)

    {

        base.OnModelCreating(modelBuilder);



        modelBuilder.Entity<HotelAmenity>()

            .HasOne(ha => ha.Hotel)

            .WithMany(h => h.HotelAmenities)

            .HasForeignKey(ha => ha.HotelId);



        modelBuilder.Entity<HotelAmenity>()

            .HasOne(ha => ha.HotelAmenityType)

            .WithMany(a => a.HotelAmenities)

            .HasForeignKey(ha => ha.HotelAmenityTypeId);



        modelBuilder.Entity<RoomAmenity>()

            .HasOne(ra => ra.Room)

            .WithMany(r => r.RoomAmenities)

            .HasForeignKey(ra => ra.RoomId);



        modelBuilder.Entity<RoomAmenity>()

            .HasOne(ra => ra.RoomAmenityType)

            .WithMany(a => a.RoomAmenities)

            .HasForeignKey(ra => ra.RoomAmenityTypeId);



        modelBuilder.Entity<Room>()

            .HasOne(r => r.RoomType)

            .WithMany(rt => rt.Rooms)

            .HasForeignKey(r => r.RoomTypeId)

            .OnDelete(DeleteBehavior.Restrict);



        modelBuilder.Entity<Room>()

            .HasOne(r => r.Hotel)

            .WithMany(h => h.Rooms)

            .HasForeignKey(r => r.HotelId)

            .OnDelete(DeleteBehavior.Restrict);



        modelBuilder.Entity<Hotel>()

            .HasOne(h => h.City)

            .WithMany(c => c.Hotels)

            .HasForeignKey(h => h.CityId)

            .OnDelete(DeleteBehavior.Restrict);



        modelBuilder.Entity<Review>()

            .HasOne(r => r.Booking)

            .WithMany()

            .HasForeignKey(r => r.BookingId)

            .OnDelete(DeleteBehavior.SetNull);



        modelBuilder.Entity<Booking>()

            .HasOne(b => b.User)

            .WithMany(u => u.Bookings)

            .HasForeignKey(b => b.UserId)

            .OnDelete(DeleteBehavior.Restrict);



        modelBuilder.Entity<Booking>()

            .HasOne(b => b.Room)

            .WithMany(r => r.Bookings)

            .HasForeignKey(b => b.RoomId)

            .OnDelete(DeleteBehavior.Restrict);



        modelBuilder.Entity<BookingStatus>()

            .HasOne(bs => bs.Booking)

            .WithMany(b => b.BookingStatuses)

            .HasForeignKey(bs => bs.BookingId)

            .OnDelete(DeleteBehavior.Cascade);



        modelBuilder.Entity<BookingStatus>()

            .HasOne(bs => bs.StatusByUser)

            .WithMany()

            .HasForeignKey(bs => bs.StatusBy)

            .OnDelete(DeleteBehavior.Restrict);



        modelBuilder.Entity<Favorite>()

            .HasOne(f => f.User)

            .WithMany(u => u.Favorites)

            .HasForeignKey(f => f.UserId)

            .OnDelete(DeleteBehavior.Cascade);



        modelBuilder.Entity<Favorite>()

            .HasOne(f => f.Hotel)

            .WithMany()

            .HasForeignKey(f => f.HotelId)

            .OnDelete(DeleteBehavior.Cascade);



        modelBuilder.Entity<User>()

            .HasIndex(u => u.Email)

            .IsUnique();



        modelBuilder.Entity<Hotel>()

            .HasIndex(h => h.CityId);



        modelBuilder.Entity<Role>()

            .HasMany(r => r.Users)

            .WithOne(u => u.Role)

            .HasForeignKey(u => u.RoleId)

            .OnDelete(DeleteBehavior.Restrict);



        modelBuilder.Entity<Manager>()

            .HasKey(m => new { m.UserId, m.HotelId });

        modelBuilder.Entity<Manager>()

            .HasOne(m => m.Hotel)

            .WithMany(h => h.Managers)

            .HasForeignKey(m => m.HotelId)

            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Manager>()

            .HasOne(m => m.User)

            .WithMany()

            .HasForeignKey(m => m.UserId)

            .OnDelete(DeleteBehavior.Cascade);



        modelBuilder.Entity<ReviewComment>()

            .HasOne(rc => rc.Review)

            .WithMany(r => r.ReviewComments)

            .HasForeignKey(rc => rc.ReviewId)

            .OnDelete(DeleteBehavior.Cascade);



        modelBuilder.Entity<ReviewComment>()

            .HasOne(rc => rc.User)

            .WithMany(u => u.ReviewComments)

            .HasForeignKey(rc => rc.UserId)

            .OnDelete(DeleteBehavior.Restrict);



        modelBuilder.Entity<BlockHistory>()

            .HasOne(bh => bh.ChangedByUser)

            .WithMany()

            .HasForeignKey(bh => bh.ChangedByUserId)

            .OnDelete(DeleteBehavior.Restrict);



        modelBuilder.Entity<ReviewComplaint>()

            .HasOne(rc => rc.Review)

            .WithMany(r => r.Complaints)

            .HasForeignKey(rc => rc.ReviewId)

            .OnDelete(DeleteBehavior.Cascade);



        modelBuilder.Entity<ReviewComplaint>()

            .HasOne(rc => rc.User)

            .WithMany()

            .HasForeignKey(rc => rc.UserId)

            .OnDelete(DeleteBehavior.Restrict);



        modelBuilder.Entity<Tag>()
            .HasIndex(t => t.Name)
            .IsUnique();

        modelBuilder.Entity<ReviewTag>()
            .HasOne(rt => rt.Review)
            .WithMany(r => r.ReviewTags)
            .HasForeignKey(rt => rt.ReviewId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ReviewTag>()
            .HasOne(rt => rt.Tag)
            .WithMany(t => t.ReviewLinks)
            .HasForeignKey(rt => rt.TagId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<HotelImage>()

            .HasOne(hi => hi.Hotel)

            .WithMany(h => h.Images)

            .HasForeignKey(hi => hi.HotelId)

            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<RoomTypeImage>()

            .HasOne(ri => ri.RoomType)

            .WithMany(rt => rt.Images)

            .HasForeignKey(ri => ri.RoomTypeId)

            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Favorite>()

            .HasOne(f => f.User)

            .WithMany(u => u.Favorites)

            .HasForeignKey(f => f.UserId)

            .OnDelete(DeleteBehavior.Cascade);



        modelBuilder.Entity<Favorite>()

            .HasOne(f => f.Hotel)

            .WithMany(h => h.Favorites)

            .HasForeignKey(f => f.HotelId)

            .OnDelete(DeleteBehavior.Cascade);

        // Unique constraint to prevent duplicate favorites
        modelBuilder.Entity<Favorite>()
            .HasIndex(f => new { f.UserId, f.HotelId })
            .IsUnique();

        SeedData(modelBuilder);

    }



    private void SeedData(ModelBuilder modelBuilder)

    {

        var cities = new[]

        {

            new City { Id = 1, Name = "Минск", Image = "/assets/cities/minsk.jpg", Latitude = 53.9045m, Longitude = 27.5615m },

            new City { Id = 2, Name = "Брест", Image = "/assets/cities/brest.jpg", Latitude = 52.0975m, Longitude = 23.7341m },

            new City { Id = 3, Name = "Витебск", Image = "/assets/cities/vitebsk.jpg", Latitude = 55.1904m, Longitude = 30.2049m },

            new City { Id = 4, Name = "Гомель", Image = "/assets/cities/gomel.jpg", Latitude = 52.4345m, Longitude = 30.9754m },

            new City { Id = 5, Name = "Гродно", Image = "/assets/cities/grodno.jfif", Latitude = 53.6778m, Longitude = 23.8297m },

            new City { Id = 6, Name = "Могилев", Image = "/assets/cities/mogilev.jpg", Latitude = 53.8945m, Longitude = 30.3313m }

        };

        modelBuilder.Entity<City>().HasData(cities);



        var hotelAmenityTypes = new[]

        {

            new HotelAmenityType { Id = 1, Name = "Wi-Fi" },

            new HotelAmenityType { Id = 2, Name = "Парковка" },

            new HotelAmenityType { Id = 3, Name = "Ресторан" },

            new HotelAmenityType { Id = 4, Name = "Бар" },

            new HotelAmenityType { Id = 5, Name = "Бассейн" },

            new HotelAmenityType { Id = 6, Name = "Фитнес-центр" },

            new HotelAmenityType { Id = 7, Name = "Спа" },

            new HotelAmenityType { Id = 8, Name = "Трансфер" },

            new HotelAmenityType { Id = 9, Name = "Прачечная" },

            new HotelAmenityType { Id = 10, Name = "Доставка еды и напитков в номер" },

            new HotelAmenityType { Id = 11, Name = "Джакузи" }

        };

        modelBuilder.Entity<HotelAmenityType>().HasData(hotelAmenityTypes);



        var roomAmenityTypes = new[]

        {

            new RoomAmenityType { Id = 1, Name = "Чайник" },

            new RoomAmenityType { Id = 2, Name = "Холодильник" },

            new RoomAmenityType { Id = 3, Name = "Телевизор" },

            new RoomAmenityType { Id = 4, Name = "Звукоизолированный" },

            new RoomAmenityType { Id = 5, Name = "Кондиционер" },

            new RoomAmenityType { Id = 6, Name = "Сейф" },

            new RoomAmenityType { Id = 7, Name = "Фен" },

            new RoomAmenityType { Id = 8, Name = "Утюг" },

            new RoomAmenityType { Id = 9, Name = "Душ" },

            new RoomAmenityType { Id = 10, Name = "Ванна" },

            new RoomAmenityType { Id = 11, Name = "Мини-кухня" },

            new RoomAmenityType { Id = 12, Name = "Вид на озеро" },

            new RoomAmenityType { Id = 13, Name = "Камин" },

            new RoomAmenityType { Id = 14, Name = "Сауна" },

            new RoomAmenityType { Id = 15, Name = "Стиральная машина" }

        };

        modelBuilder.Entity<RoomAmenityType>().HasData(roomAmenityTypes);



        var roomTypes = new[]

        {

            new RoomType { Id = 1, Name = "Стандарт", Description = "Уютный стандартный номер с односпальной кроватью.", MaxGuests = 1, BedCount = 1, Size = 20 },

            new RoomType { Id = 2, Name = "Улучшенный", Description = "Улучшенный номер с двуспальной кроватью и видом на город.", MaxGuests = 2, BedCount = 1, Size = 25 },

            new RoomType { Id = 3, Name = "Бизнес", Description = "Бизнес номер с рабочим столом и высокоскоростным Wi-Fi.", MaxGuests = 2, BedCount = 1, Size = 30 },

            new RoomType { Id = 4, Name = "Люкс", Description = "Роскошный люкс с гостиной и спальней.", MaxGuests = 3, BedCount = 2, Size = 50 },

            new RoomType { Id = 5, Name = "Семейный", Description = "Семейный номер с двумя спальнями.", MaxGuests = 4, BedCount = 3, Size = 45 },

            new RoomType { Id = 6, Name = "Эконом", Description = "Эконом номер для бюджетных путешествий.", MaxGuests = 2, BedCount = 2, Size = 18 }

        };

        modelBuilder.Entity<RoomType>().HasData(roomTypes);

        var roomTypeImages = new List<RoomTypeImage>();
        var roomTypeImageId = 10000;
        for (var rtId = 1; rtId <= 6; rtId++)
        {
            var urls = RoomTypeSeedGalleryUrls(rtId);
            for (var i = 0; i < urls.Length; i++)
            {
                roomTypeImages.Add(new RoomTypeImage
                {
                    Id = ++roomTypeImageId,
                    RoomTypeId = rtId,
                    Image = urls[i],
                    IsMain = i == 0
                });
            }
        }

        modelBuilder.Entity<RoomTypeImage>().HasData(roomTypeImages);

        var hotels = new[]

        {

            new Hotel { Id = 1, Name = "Гранд Отель Европа", Description = "Роскошный отель в самом центре Минска", Stars = 5, CityId = 1, Address = "пл. Победы, 1", Latitude = 53.9082m, Longitude = 27.5492m, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },

            new Hotel { Id = 2, Name = "Беларусь", Description = "Комфортабельный отель с видом на город", Stars = 4, CityId = 1, Address = "ул. Сторожевская, 15", Latitude = 53.9006m, Longitude = 27.5590m, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },

            new Hotel { Id = 3, Name = "Виктория", Description = "Современный отель для деловых поездок", Stars = 4, CityId = 1, Address = "пр-т Победителей, 59", Latitude = 53.9314m, Longitude = 27.4781m, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },

            new Hotel { Id = 4, Name = "Беловежская", Description = "Уютный отель рядом с Брестской крепостью", Stars = 3, CityId = 2, Address = "ул. Гоголя, 7", Latitude = 52.0919m, Longitude = 23.7296m, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },

            new Hotel { Id = 5, Name = "Эридан", Description = "Отель с видом на реку Мухавец", Stars = 3, CityId = 2, Address = "ул. Гоголя, 2", Latitude = 52.0928m, Longitude = 23.7261m, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },

            new Hotel { Id = 6, Name = "Лучеса", Description = "Современный отель в Витебске", Stars = 4, CityId = 3, Address = "пр-т Фрунзе, 13/2", Latitude = 55.1982m, Longitude = 30.2076m, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },

            new Hotel { Id = 7, Name = "Гомель", Description = "Комфортабельный отель в центре Гомеля", Stars = 3, CityId = 4, Address = "пр-т Ленина, 10", Latitude = 52.4315m, Longitude = 30.9743m, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },

            new Hotel { Id = 8, Name = "Семашко", Description = "Исторический отель в Гродно", Stars = 3, CityId = 5, Address = "ул. Семашко, 1", Latitude = 53.6778m, Longitude = 23.8297m, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },

            new Hotel { Id = 9, Name = "Турист", Description = "Удобный отель в Могилеве", Stars = 2, CityId = 6, Address = "ул. Первомайская, 50", Latitude = 53.8962m, Longitude = 30.3315m, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },

            new Hotel { Id = 10, Name = "Брест Палас", Description = "Современный отель в центре Бреста", Stars = 4, CityId = 2, Address = "ул. Ленина, 12", Latitude = 52.0940m, Longitude = 23.7280m, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },

            new Hotel { Id = 11, Name = "Западный Берег", Description = "Уютный отель рядом с набережной", Stars = 3, CityId = 2, Address = "ул. Набережная, 8", Latitude = 52.0905m, Longitude = 23.7310m, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },

            new Hotel { Id = 12, Name = "Крепость Парк", Description = "Отель возле Брестской крепости", Stars = 4, CityId = 2, Address = "пр-т Машерова, 5", Latitude = 52.0870m, Longitude = 23.7215m, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },

            new Hotel { Id = 13, Name = "Лазурный", Description = "Спокойный отдых в зеленой зоне города", Stars = 3, CityId = 2, Address = "ул. Пионерская, 22", Latitude = 52.0985m, Longitude = 23.7420m, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },

            new Hotel { Id = 14, Name = "Старый Брест", Description = "Бутик-отель в историческом районе", Stars = 4, CityId = 2, Address = "ул. Советская, 44", Latitude = 52.0915m, Longitude = 23.7350m, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },

            new Hotel { Id = 15, Name = "Ривьера", Description = "Семейный отель с просторными номерами", Stars = 3, CityId = 2, Address = "ул. Московская, 73", Latitude = 52.1020m, Longitude = 23.7495m, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },

            new Hotel { Id = 16, Name = "Сити Брест", Description = "Деловой отель рядом с транспортным узлом", Stars = 4, CityId = 2, Address = "ул. Орджоникидзе, 3", Latitude = 52.0955m, Longitude = 23.7450m, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }

        };

        modelBuilder.Entity<Hotel>().HasData(hotels);



        var hotelImages = new[]
        {
            // Hotel 1 — all 5 images in order
            new HotelImage { Id = 1, HotelId = 1, Image = "/assets/hotels/hotel1.jpg", IsMain = true },
            new HotelImage { Id = 17, HotelId = 1, Image = "/assets/hotels/hotel2.jpg", IsMain = false },
            new HotelImage { Id = 18, HotelId = 1, Image = "/assets/hotels/hotel3.jpg", IsMain = false },
            new HotelImage { Id = 19, HotelId = 1, Image = "/assets/hotels/hotel4.jpg", IsMain = false },
            new HotelImage { Id = 20, HotelId = 1, Image = "/assets/hotels/hotel5.jpg", IsMain = false },
            // Hotel 2
            new HotelImage { Id = 2, HotelId = 2, Image = "/assets/hotels/hotel2.jpg", IsMain = true },
            new HotelImage { Id = 21, HotelId = 2, Image = "/assets/hotels/hotel3.jpg", IsMain = false },
            new HotelImage { Id = 22, HotelId = 2, Image = "/assets/hotels/hotel4.jpg", IsMain = false },
            new HotelImage { Id = 23, HotelId = 2, Image = "/assets/hotels/hotel5.jpg", IsMain = false },
            new HotelImage { Id = 24, HotelId = 2, Image = "/assets/hotels/hotel1.jpg", IsMain = false },
            // Hotel 3
            new HotelImage { Id = 3, HotelId = 3, Image = "/assets/hotels/hotel3.jpg", IsMain = true },
            new HotelImage { Id = 25, HotelId = 3, Image = "/assets/hotels/hotel4.jpg", IsMain = false },
            new HotelImage { Id = 26, HotelId = 3, Image = "/assets/hotels/hotel5.jpg", IsMain = false },
            new HotelImage { Id = 27, HotelId = 3, Image = "/assets/hotels/hotel1.jpg", IsMain = false },
            new HotelImage { Id = 28, HotelId = 3, Image = "/assets/hotels/hotel2.jpg", IsMain = false },
            // Hotel 4
            new HotelImage { Id = 4, HotelId = 4, Image = "/assets/hotels/hotel4.jpg", IsMain = true },
            new HotelImage { Id = 29, HotelId = 4, Image = "/assets/hotels/hotel5.jpg", IsMain = false },
            new HotelImage { Id = 30, HotelId = 4, Image = "/assets/hotels/hotel1.jpg", IsMain = false },
            new HotelImage { Id = 31, HotelId = 4, Image = "/assets/hotels/hotel2.jpg", IsMain = false },
            new HotelImage { Id = 32, HotelId = 4, Image = "/assets/hotels/hotel3.jpg", IsMain = false },
            // Hotel 5
            new HotelImage { Id = 5, HotelId = 5, Image = "/assets/hotels/hotel5.jpg", IsMain = true },
            new HotelImage { Id = 33, HotelId = 5, Image = "/assets/hotels/hotel1.jpg", IsMain = false },
            new HotelImage { Id = 34, HotelId = 5, Image = "/assets/hotels/hotel2.jpg", IsMain = false },
            new HotelImage { Id = 35, HotelId = 5, Image = "/assets/hotels/hotel3.jpg", IsMain = false },
            new HotelImage { Id = 36, HotelId = 5, Image = "/assets/hotels/hotel4.jpg", IsMain = false },
            // Hotel 6
            new HotelImage { Id = 6, HotelId = 6, Image = "/assets/hotels/hotel1.jpg", IsMain = true },
            new HotelImage { Id = 37, HotelId = 6, Image = "/assets/hotels/hotel2.jpg", IsMain = false },
            new HotelImage { Id = 38, HotelId = 6, Image = "/assets/hotels/hotel3.jpg", IsMain = false },
            new HotelImage { Id = 39, HotelId = 6, Image = "/assets/hotels/hotel4.jpg", IsMain = false },
            new HotelImage { Id = 40, HotelId = 6, Image = "/assets/hotels/hotel5.jpg", IsMain = false },
            // Hotel 7
            new HotelImage { Id = 7, HotelId = 7, Image = "/assets/hotels/hotel2.jpg", IsMain = true },
            new HotelImage { Id = 41, HotelId = 7, Image = "/assets/hotels/hotel3.jpg", IsMain = false },
            new HotelImage { Id = 42, HotelId = 7, Image = "/assets/hotels/hotel4.jpg", IsMain = false },
            new HotelImage { Id = 43, HotelId = 7, Image = "/assets/hotels/hotel5.jpg", IsMain = false },
            new HotelImage { Id = 44, HotelId = 7, Image = "/assets/hotels/hotel1.jpg", IsMain = false },
            // Hotel 8
            new HotelImage { Id = 8, HotelId = 8, Image = "/assets/hotels/hotel3.jpg", IsMain = true },
            new HotelImage { Id = 45, HotelId = 8, Image = "/assets/hotels/hotel4.jpg", IsMain = false },
            new HotelImage { Id = 46, HotelId = 8, Image = "/assets/hotels/hotel5.jpg", IsMain = false },
            new HotelImage { Id = 47, HotelId = 8, Image = "/assets/hotels/hotel1.jpg", IsMain = false },
            new HotelImage { Id = 48, HotelId = 8, Image = "/assets/hotels/hotel2.jpg", IsMain = false },
            // Hotel 9
            new HotelImage { Id = 9, HotelId = 9, Image = "/assets/hotels/hotel4.jpg", IsMain = true },
            new HotelImage { Id = 49, HotelId = 9, Image = "/assets/hotels/hotel5.jpg", IsMain = false },
            new HotelImage { Id = 50, HotelId = 9, Image = "/assets/hotels/hotel1.jpg", IsMain = false },
            new HotelImage { Id = 51, HotelId = 9, Image = "/assets/hotels/hotel2.jpg", IsMain = false },
            new HotelImage { Id = 52, HotelId = 9, Image = "/assets/hotels/hotel3.jpg", IsMain = false },
            // Hotel 10
            new HotelImage { Id = 10, HotelId = 10, Image = "/assets/hotels/hotel5.jpg", IsMain = true },
            new HotelImage { Id = 53, HotelId = 10, Image = "/assets/hotels/hotel1.jpg", IsMain = false },
            new HotelImage { Id = 54, HotelId = 10, Image = "/assets/hotels/hotel2.jpg", IsMain = false },
            new HotelImage { Id = 55, HotelId = 10, Image = "/assets/hotels/hotel3.jpg", IsMain = false },
            new HotelImage { Id = 56, HotelId = 10, Image = "/assets/hotels/hotel4.jpg", IsMain = false },
            // Hotel 11
            new HotelImage { Id = 11, HotelId = 11, Image = "/assets/hotels/hotel1.jpg", IsMain = true },
            new HotelImage { Id = 57, HotelId = 11, Image = "/assets/hotels/hotel2.jpg", IsMain = false },
            new HotelImage { Id = 58, HotelId = 11, Image = "/assets/hotels/hotel3.jpg", IsMain = false },
            new HotelImage { Id = 59, HotelId = 11, Image = "/assets/hotels/hotel4.jpg", IsMain = false },
            new HotelImage { Id = 60, HotelId = 11, Image = "/assets/hotels/hotel5.jpg", IsMain = false },
            // Hotel 12
            new HotelImage { Id = 12, HotelId = 12, Image = "/assets/hotels/hotel2.jpg", IsMain = true },
            new HotelImage { Id = 61, HotelId = 12, Image = "/assets/hotels/hotel3.jpg", IsMain = false },
            new HotelImage { Id = 62, HotelId = 12, Image = "/assets/hotels/hotel4.jpg", IsMain = false },
            new HotelImage { Id = 63, HotelId = 12, Image = "/assets/hotels/hotel5.jpg", IsMain = false },
            new HotelImage { Id = 64, HotelId = 12, Image = "/assets/hotels/hotel1.jpg", IsMain = false },
            // Hotel 13
            new HotelImage { Id = 13, HotelId = 13, Image = "/assets/hotels/hotel3.jpg", IsMain = true },
            new HotelImage { Id = 65, HotelId = 13, Image = "/assets/hotels/hotel4.jpg", IsMain = false },
            new HotelImage { Id = 66, HotelId = 13, Image = "/assets/hotels/hotel5.jpg", IsMain = false },
            new HotelImage { Id = 67, HotelId = 13, Image = "/assets/hotels/hotel1.jpg", IsMain = false },
            new HotelImage { Id = 68, HotelId = 13, Image = "/assets/hotels/hotel2.jpg", IsMain = false },
            // Hotel 14
            new HotelImage { Id = 14, HotelId = 14, Image = "/assets/hotels/hotel4.jpg", IsMain = true },
            new HotelImage { Id = 69, HotelId = 14, Image = "/assets/hotels/hotel5.jpg", IsMain = false },
            new HotelImage { Id = 70, HotelId = 14, Image = "/assets/hotels/hotel1.jpg", IsMain = false },
            new HotelImage { Id = 71, HotelId = 14, Image = "/assets/hotels/hotel2.jpg", IsMain = false },
            new HotelImage { Id = 72, HotelId = 14, Image = "/assets/hotels/hotel3.jpg", IsMain = false },
            // Hotel 15
            new HotelImage { Id = 15, HotelId = 15, Image = "/assets/hotels/hotel5.jpg", IsMain = true },
            new HotelImage { Id = 73, HotelId = 15, Image = "/assets/hotels/hotel1.jpg", IsMain = false },
            new HotelImage { Id = 74, HotelId = 15, Image = "/assets/hotels/hotel2.jpg", IsMain = false },
            new HotelImage { Id = 75, HotelId = 15, Image = "/assets/hotels/hotel3.jpg", IsMain = false },
            new HotelImage { Id = 76, HotelId = 15, Image = "/assets/hotels/hotel4.jpg", IsMain = false },
            // Hotel 16
            new HotelImage { Id = 16, HotelId = 16, Image = "/assets/hotels/hotel1.jpg", IsMain = true },
            new HotelImage { Id = 77, HotelId = 16, Image = "/assets/hotels/hotel2.jpg", IsMain = false },
            new HotelImage { Id = 78, HotelId = 16, Image = "/assets/hotels/hotel3.jpg", IsMain = false },
            new HotelImage { Id = 79, HotelId = 16, Image = "/assets/hotels/hotel4.jpg", IsMain = false },
            new HotelImage { Id = 80, HotelId = 16, Image = "/assets/hotels/hotel5.jpg", IsMain = false }
        };

        modelBuilder.Entity<HotelImage>().HasData(hotelImages);



        var hotelAmenities = new[]

        {

            new HotelAmenity { Id = 1, HotelId = 1, HotelAmenityTypeId = 1 },

            new HotelAmenity { Id = 2, HotelId = 1, HotelAmenityTypeId = 2 },

            new HotelAmenity { Id = 3, HotelId = 1, HotelAmenityTypeId = 3 },

            new HotelAmenity { Id = 4, HotelId = 1, HotelAmenityTypeId = 4 },

            new HotelAmenity { Id = 5, HotelId = 1, HotelAmenityTypeId = 5 },

            new HotelAmenity { Id = 6, HotelId = 1, HotelAmenityTypeId = 6 },

            new HotelAmenity { Id = 7, HotelId = 1, HotelAmenityTypeId = 7 },

            new HotelAmenity { Id = 8, HotelId = 1, HotelAmenityTypeId = 8 },

            new HotelAmenity { Id = 9, HotelId = 1, HotelAmenityTypeId = 9 },



            new HotelAmenity { Id = 10, HotelId = 2, HotelAmenityTypeId = 1 },

            new HotelAmenity { Id = 11, HotelId = 2, HotelAmenityTypeId = 2 },

            new HotelAmenity { Id = 12, HotelId = 2, HotelAmenityTypeId = 3 },

            new HotelAmenity { Id = 13, HotelId = 2, HotelAmenityTypeId = 6 },

            new HotelAmenity { Id = 14, HotelId = 2, HotelAmenityTypeId = 8 },



            new HotelAmenity { Id = 15, HotelId = 3, HotelAmenityTypeId = 1 },

            new HotelAmenity { Id = 16, HotelId = 3, HotelAmenityTypeId = 2 },

            new HotelAmenity { Id = 17, HotelId = 3, HotelAmenityTypeId = 6 },

            new HotelAmenity { Id = 18, HotelId = 3, HotelAmenityTypeId = 8 },



            new HotelAmenity { Id = 19, HotelId = 4, HotelAmenityTypeId = 1 },

            new HotelAmenity { Id = 20, HotelId = 4, HotelAmenityTypeId = 2 },

            new HotelAmenity { Id = 21, HotelId = 4, HotelAmenityTypeId = 3 },

            new HotelAmenity { Id = 22, HotelId = 4, HotelAmenityTypeId = 9 },



            new HotelAmenity { Id = 23, HotelId = 5, HotelAmenityTypeId = 1 },

            new HotelAmenity { Id = 24, HotelId = 5, HotelAmenityTypeId = 2 },

            new HotelAmenity { Id = 25, HotelId = 5, HotelAmenityTypeId = 3 },



            new HotelAmenity { Id = 26, HotelId = 6, HotelAmenityTypeId = 1 },

            new HotelAmenity { Id = 27, HotelId = 6, HotelAmenityTypeId = 2 },

            new HotelAmenity { Id = 28, HotelId = 6, HotelAmenityTypeId = 3 },

            new HotelAmenity { Id = 29, HotelId = 6, HotelAmenityTypeId = 6 },

            new HotelAmenity { Id = 30, HotelId = 6, HotelAmenityTypeId = 8 },



            new HotelAmenity { Id = 31, HotelId = 7, HotelAmenityTypeId = 1 },

            new HotelAmenity { Id = 32, HotelId = 7, HotelAmenityTypeId = 2 },

            new HotelAmenity { Id = 33, HotelId = 7, HotelAmenityTypeId = 3 },



            new HotelAmenity { Id = 34, HotelId = 8, HotelAmenityTypeId = 1 },

            new HotelAmenity { Id = 35, HotelId = 8, HotelAmenityTypeId = 2 },

            new HotelAmenity { Id = 36, HotelId = 8, HotelAmenityTypeId = 3 },



            new HotelAmenity { Id = 37, HotelId = 9, HotelAmenityTypeId = 1 },

            new HotelAmenity { Id = 38, HotelId = 9, HotelAmenityTypeId = 2 },

            new HotelAmenity { Id = 39, HotelId = 9, HotelAmenityTypeId = 3 },

            new HotelAmenity { Id = 40, HotelId = 1, HotelAmenityTypeId = 10 },

            new HotelAmenity { Id = 41, HotelId = 2, HotelAmenityTypeId = 11 },

            new HotelAmenity { Id = 42, HotelId = 6, HotelAmenityTypeId = 10 },

            new HotelAmenity { Id = 43, HotelId = 10, HotelAmenityTypeId = 1 },
            new HotelAmenity { Id = 44, HotelId = 10, HotelAmenityTypeId = 3 },
            new HotelAmenity { Id = 45, HotelId = 11, HotelAmenityTypeId = 1 },
            new HotelAmenity { Id = 46, HotelId = 12, HotelAmenityTypeId = 2 },
            new HotelAmenity { Id = 47, HotelId = 13, HotelAmenityTypeId = 10 },
            new HotelAmenity { Id = 48, HotelId = 14, HotelAmenityTypeId = 11 },
            new HotelAmenity { Id = 49, HotelId = 15, HotelAmenityTypeId = 1 },
            new HotelAmenity { Id = 50, HotelId = 16, HotelAmenityTypeId = 8 }

        };

        modelBuilder.Entity<HotelAmenity>().HasData(hotelAmenities);



        var rooms = BuildSeedRooms();

        modelBuilder.Entity<Room>().HasData(rooms);



        var roomAmenities = new[]

        {

            new RoomAmenity { Id = 1, RoomId = 1, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 2, RoomId = 1, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 3, RoomId = 1, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 4, RoomId = 1, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 5, RoomId = 1, RoomAmenityTypeId = 6 },

            new RoomAmenity { Id = 6, RoomId = 1, RoomAmenityTypeId = 7 },

            new RoomAmenity { Id = 7, RoomId = 2, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 8, RoomId = 2, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 9, RoomId = 2, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 10, RoomId = 2, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 11, RoomId = 2, RoomAmenityTypeId = 6 },

            new RoomAmenity { Id = 12, RoomId = 2, RoomAmenityTypeId = 7 },

            new RoomAmenity { Id = 13, RoomId = 2, RoomAmenityTypeId = 8 },

            new RoomAmenity { Id = 14, RoomId = 3, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 15, RoomId = 3, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 16, RoomId = 3, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 17, RoomId = 3, RoomAmenityTypeId = 4 },

            new RoomAmenity { Id = 18, RoomId = 3, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 19, RoomId = 3, RoomAmenityTypeId = 6 },

            new RoomAmenity { Id = 20, RoomId = 3, RoomAmenityTypeId = 7 },

            new RoomAmenity { Id = 21, RoomId = 3, RoomAmenityTypeId = 8 },

            new RoomAmenity { Id = 22, RoomId = 4, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 23, RoomId = 4, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 24, RoomId = 4, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 25, RoomId = 4, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 26, RoomId = 4, RoomAmenityTypeId = 7 },

            new RoomAmenity { Id = 27, RoomId = 5, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 28, RoomId = 5, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 29, RoomId = 5, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 30, RoomId = 5, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 31, RoomId = 5, RoomAmenityTypeId = 6 },

            new RoomAmenity { Id = 32, RoomId = 5, RoomAmenityTypeId = 7 },

            new RoomAmenity { Id = 33, RoomId = 5, RoomAmenityTypeId = 8 },

            new RoomAmenity { Id = 34, RoomId = 6, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 35, RoomId = 6, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 36, RoomId = 6, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 37, RoomId = 6, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 38, RoomId = 6, RoomAmenityTypeId = 6 },

            new RoomAmenity { Id = 39, RoomId = 6, RoomAmenityTypeId = 7 },

            new RoomAmenity { Id = 40, RoomId = 7, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 41, RoomId = 7, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 42, RoomId = 7, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 43, RoomId = 8, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 44, RoomId = 8, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 45, RoomId = 8, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 46, RoomId = 8, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 47, RoomId = 9, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 48, RoomId = 9, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 49, RoomId = 9, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 50, RoomId = 9, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 51, RoomId = 10, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 52, RoomId = 10, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 53, RoomId = 10, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 54, RoomId = 11, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 55, RoomId = 11, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 56, RoomId = 12, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 57, RoomId = 12, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 58, RoomId = 13, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 59, RoomId = 13, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 60, RoomId = 13, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 61, RoomId = 14, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 62, RoomId = 14, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 63, RoomId = 14, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 64, RoomId = 15, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 65, RoomId = 15, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 66, RoomId = 15, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 67, RoomId = 15, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 68, RoomId = 15, RoomAmenityTypeId = 6 },

            new RoomAmenity { Id = 69, RoomId = 16, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 70, RoomId = 16, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 71, RoomId = 16, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 72, RoomId = 16, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 73, RoomId = 16, RoomAmenityTypeId = 7 },

            new RoomAmenity { Id = 74, RoomId = 17, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 75, RoomId = 17, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 76, RoomId = 17, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 77, RoomId = 17, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 78, RoomId = 17, RoomAmenityTypeId = 6 },

            new RoomAmenity { Id = 79, RoomId = 18, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 80, RoomId = 18, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 81, RoomId = 18, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 82, RoomId = 18, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 83, RoomId = 18, RoomAmenityTypeId = 6 },

            new RoomAmenity { Id = 84, RoomId = 19, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 85, RoomId = 19, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 86, RoomId = 19, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 87, RoomId = 19, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 88, RoomId = 19, RoomAmenityTypeId = 6 },

            new RoomAmenity { Id = 89, RoomId = 20, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 90, RoomId = 20, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 91, RoomId = 20, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 92, RoomId = 20, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 93, RoomId = 20, RoomAmenityTypeId = 6 },

            new RoomAmenity { Id = 94, RoomId = 21, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 95, RoomId = 21, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 96, RoomId = 21, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 97, RoomId = 21, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 98, RoomId = 22, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 99, RoomId = 22, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 100, RoomId = 22, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 101, RoomId = 22, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 102, RoomId = 23, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 103, RoomId = 23, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 104, RoomId = 24, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 105, RoomId = 24, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 106, RoomId = 25, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 107, RoomId = 25, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 108, RoomId = 25, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 109, RoomId = 26, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 110, RoomId = 26, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 111, RoomId = 26, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 112, RoomId = 27, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 113, RoomId = 27, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 114, RoomId = 27, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 115, RoomId = 27, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 116, RoomId = 28, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 117, RoomId = 28, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 118, RoomId = 28, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 119, RoomId = 28, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 120, RoomId = 29, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 121, RoomId = 29, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 122, RoomId = 29, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 123, RoomId = 29, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 124, RoomId = 29, RoomAmenityTypeId = 6 },

            new RoomAmenity { Id = 125, RoomId = 30, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 126, RoomId = 30, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 127, RoomId = 30, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 128, RoomId = 30, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 129, RoomId = 30, RoomAmenityTypeId = 6 },

            new RoomAmenity { Id = 130, RoomId = 31, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 131, RoomId = 31, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 132, RoomId = 31, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 133, RoomId = 31, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 134, RoomId = 31, RoomAmenityTypeId = 6 },

            new RoomAmenity { Id = 135, RoomId = 32, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 136, RoomId = 32, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 137, RoomId = 32, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 138, RoomId = 32, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 139, RoomId = 32, RoomAmenityTypeId = 6 },

            new RoomAmenity { Id = 140, RoomId = 33, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 141, RoomId = 33, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 142, RoomId = 33, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 143, RoomId = 33, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 144, RoomId = 34, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 145, RoomId = 34, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 146, RoomId = 34, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 147, RoomId = 34, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 148, RoomId = 35, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 149, RoomId = 35, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 150, RoomId = 36, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 151, RoomId = 36, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 152, RoomId = 37, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 153, RoomId = 37, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 154, RoomId = 38, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 155, RoomId = 38, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 156, RoomId = 38, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 157, RoomId = 39, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 158, RoomId = 39, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 159, RoomId = 39, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 160, RoomId = 40, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 161, RoomId = 40, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 162, RoomId = 40, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 163, RoomId = 41, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 164, RoomId = 41, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 165, RoomId = 41, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 166, RoomId = 42, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 167, RoomId = 42, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 168, RoomId = 42, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 169, RoomId = 43, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 170, RoomId = 43, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 171, RoomId = 43, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 172, RoomId = 43, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 173, RoomId = 44, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 174, RoomId = 44, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 175, RoomId = 44, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 176, RoomId = 44, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 177, RoomId = 45, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 178, RoomId = 45, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 179, RoomId = 45, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 180, RoomId = 46, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 181, RoomId = 46, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 182, RoomId = 46, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 183, RoomId = 47, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 184, RoomId = 47, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 185, RoomId = 48, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 186, RoomId = 48, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 187, RoomId = 49, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 188, RoomId = 49, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 189, RoomId = 50, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 190, RoomId = 50, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 191, RoomId = 50, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 192, RoomId = 51, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 193, RoomId = 51, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 194, RoomId = 51, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 195, RoomId = 52, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 196, RoomId = 52, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 197, RoomId = 52, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 198, RoomId = 53, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 199, RoomId = 53, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 200, RoomId = 53, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 201, RoomId = 54, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 202, RoomId = 54, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 203, RoomId = 54, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 204, RoomId = 55, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 205, RoomId = 55, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 206, RoomId = 55, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 207, RoomId = 55, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 208, RoomId = 56, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 209, RoomId = 56, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 210, RoomId = 56, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 211, RoomId = 56, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 212, RoomId = 57, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 213, RoomId = 57, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 214, RoomId = 57, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 215, RoomId = 58, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 216, RoomId = 58, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 217, RoomId = 58, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 218, RoomId = 59, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 219, RoomId = 59, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 220, RoomId = 60, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 221, RoomId = 60, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 222, RoomId = 61, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 223, RoomId = 61, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 224, RoomId = 62, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 225, RoomId = 62, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 226, RoomId = 62, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 227, RoomId = 63, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 228, RoomId = 63, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 229, RoomId = 63, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 230, RoomId = 64, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 231, RoomId = 64, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 232, RoomId = 64, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 233, RoomId = 65, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 234, RoomId = 65, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 235, RoomId = 65, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 236, RoomId = 66, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 237, RoomId = 66, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 238, RoomId = 66, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 239, RoomId = 67, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 240, RoomId = 67, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 241, RoomId = 67, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 242, RoomId = 67, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 243, RoomId = 68, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 244, RoomId = 68, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 245, RoomId = 68, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 246, RoomId = 68, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 247, RoomId = 69, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 248, RoomId = 69, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 249, RoomId = 69, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 250, RoomId = 70, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 251, RoomId = 70, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 252, RoomId = 70, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 253, RoomId = 71, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 254, RoomId = 71, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 255, RoomId = 72, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 256, RoomId = 72, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 257, RoomId = 73, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 258, RoomId = 73, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 259, RoomId = 74, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 260, RoomId = 74, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 261, RoomId = 74, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 262, RoomId = 75, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 263, RoomId = 75, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 264, RoomId = 75, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 265, RoomId = 76, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 266, RoomId = 76, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 267, RoomId = 76, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 268, RoomId = 77, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 269, RoomId = 77, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 270, RoomId = 77, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 271, RoomId = 78, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 272, RoomId = 78, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 273, RoomId = 78, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 274, RoomId = 79, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 275, RoomId = 79, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 276, RoomId = 79, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 277, RoomId = 79, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 278, RoomId = 80, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 279, RoomId = 80, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 280, RoomId = 80, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 281, RoomId = 80, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 282, RoomId = 81, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 283, RoomId = 81, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 284, RoomId = 81, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 285, RoomId = 82, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 286, RoomId = 82, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 287, RoomId = 82, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 288, RoomId = 83, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 289, RoomId = 83, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 290, RoomId = 84, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 291, RoomId = 84, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 292, RoomId = 85, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 293, RoomId = 85, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 294, RoomId = 86, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 295, RoomId = 86, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 296, RoomId = 86, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 297, RoomId = 87, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 298, RoomId = 87, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 299, RoomId = 87, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 300, RoomId = 88, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 301, RoomId = 88, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 302, RoomId = 88, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 303, RoomId = 89, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 304, RoomId = 89, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 305, RoomId = 89, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 306, RoomId = 90, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 307, RoomId = 90, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 308, RoomId = 90, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 309, RoomId = 91, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 310, RoomId = 91, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 311, RoomId = 91, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 312, RoomId = 91, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 313, RoomId = 92, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 314, RoomId = 92, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 315, RoomId = 92, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 316, RoomId = 92, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 317, RoomId = 93, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 318, RoomId = 93, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 319, RoomId = 93, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 320, RoomId = 94, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 321, RoomId = 94, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 322, RoomId = 94, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 323, RoomId = 95, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 324, RoomId = 95, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 325, RoomId = 96, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 326, RoomId = 96, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 327, RoomId = 97, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 328, RoomId = 97, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 329, RoomId = 98, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 330, RoomId = 98, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 331, RoomId = 99, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 332, RoomId = 99, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 333, RoomId = 99, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 334, RoomId = 100, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 335, RoomId = 100, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 336, RoomId = 100, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 337, RoomId = 101, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 338, RoomId = 101, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 339, RoomId = 101, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 340, RoomId = 102, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 341, RoomId = 102, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 342, RoomId = 102, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 343, RoomId = 103, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 344, RoomId = 103, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 345, RoomId = 103, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 346, RoomId = 103, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 347, RoomId = 104, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 348, RoomId = 104, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 349, RoomId = 104, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 350, RoomId = 104, RoomAmenityTypeId = 5 },

            new RoomAmenity { Id = 351, RoomId = 105, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 352, RoomId = 105, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 353, RoomId = 105, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 354, RoomId = 106, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 355, RoomId = 106, RoomAmenityTypeId = 2 },

            new RoomAmenity { Id = 356, RoomId = 106, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 357, RoomId = 107, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 358, RoomId = 107, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 359, RoomId = 108, RoomAmenityTypeId = 1 },

            new RoomAmenity { Id = 360, RoomId = 108, RoomAmenityTypeId = 3 },

            new RoomAmenity { Id = 361, RoomId = 20, RoomAmenityTypeId = 9 },

            new RoomAmenity { Id = 362, RoomId = 20, RoomAmenityTypeId = 10 },

            new RoomAmenity { Id = 363, RoomId = 22, RoomAmenityTypeId = 11 },

            new RoomAmenity { Id = 364, RoomId = 31, RoomAmenityTypeId = 12 },

            new RoomAmenity { Id = 365, RoomId = 55, RoomAmenityTypeId = 13 },

            new RoomAmenity { Id = 366, RoomId = 68, RoomAmenityTypeId = 14 },

            new RoomAmenity { Id = 367, RoomId = 94, RoomAmenityTypeId = 15 }

        };

        modelBuilder.Entity<RoomAmenity>().HasData(roomAmenities);



        // Seed roles

        var roles = new[]

        {

            new Role { Id = 1, Name = "Guest" },

            new Role { Id = 2, Name = "User" },

            new Role { Id = 3, Name = "Manager" },

            new Role { Id = 4, Name = "Admin" }

        };

        modelBuilder.Entity<Role>().HasData(roles);

        var allTagNames = ReviewTagNames.Positive.Concat(ReviewTagNames.Negative).ToArray();
        var seedTags = allTagNames.Select((name, index) => new Tag { Id = index + 1, Name = name }).ToArray();
        modelBuilder.Entity<Tag>().HasData(seedTags);

        var adminPasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123");

        var adminUser = new User

        {

            Id = 1,

            Email = "admin@nookbook.com",

            PasswordHash = adminPasswordHash,

            FirstName = "Администратор",

            LastName = "Системы",

            PhoneNumber = "+375291234567",

            Avatar = "",

            RoleId = 4,

            

            CreatedAt = DateTime.UtcNow,

            UpdatedAt = DateTime.UtcNow

        };

        modelBuilder.Entity<User>().HasData(adminUser);



        var managerPasswordHash = BCrypt.Net.BCrypt.HashPassword("12345678Aa");
        var clientPasswordHash = BCrypt.Net.BCrypt.HashPassword("12345678Aa");
        var now = DateTime.UtcNow;

        var managerUsers = new[]
        {
            new User { Id = 2, Email = "a.kovalev@nookbook.by", PasswordHash = managerPasswordHash, FirstName = "Андрей", LastName = "Ковалев", PhoneNumber = "+375291242001", Avatar = "", RoleId = 3, CreatedAt = now, UpdatedAt = now },
            new User { Id = 3, Email = "e.savitskaya@nookbook.by", PasswordHash = managerPasswordHash, FirstName = "Екатерина", LastName = "Савицкая", PhoneNumber = "+375291242002", Avatar = "", RoleId = 3, CreatedAt = now, UpdatedAt = now },
            new User { Id = 4, Email = "d.rudak@nookbook.by", PasswordHash = managerPasswordHash, FirstName = "Дмитрий", LastName = "Рудак", PhoneNumber = "+375291242003", Avatar = "", RoleId = 3, CreatedAt = now, UpdatedAt = now },
            new User { Id = 5, Email = "o.kravchenko@nookbook.by", PasswordHash = managerPasswordHash, FirstName = "Ольга", LastName = "Кравченко", PhoneNumber = "+375291242004", Avatar = "", RoleId = 3, CreatedAt = now, UpdatedAt = now },
            new User { Id = 6, Email = "p.zhuk@nookbook.by", PasswordHash = managerPasswordHash, FirstName = "Павел", LastName = "Жук", PhoneNumber = "+375291242005", Avatar = "", RoleId = 3, CreatedAt = now, UpdatedAt = now },
            new User { Id = 7, Email = "m.shcherbak@nookbook.by", PasswordHash = managerPasswordHash, FirstName = "Марина", LastName = "Щербак", PhoneNumber = "+375291242006", Avatar = "", RoleId = 3, CreatedAt = now, UpdatedAt = now },
            new User { Id = 8, Email = "v.bondarenko@nookbook.by", PasswordHash = managerPasswordHash, FirstName = "Виктор", LastName = "Бондаренко", PhoneNumber = "+375291242007", Avatar = "", RoleId = 3, CreatedAt = now, UpdatedAt = now },
            new User { Id = 9, Email = "n.kozlova@nookbook.by", PasswordHash = managerPasswordHash, FirstName = "Наталья", LastName = "Козлова", PhoneNumber = "+375291242008", Avatar = "", RoleId = 3, CreatedAt = now, UpdatedAt = now },
            new User { Id = 10, Email = "i.pavlovets@nookbook.by", PasswordHash = managerPasswordHash, FirstName = "Игорь", LastName = "Павловец", PhoneNumber = "+375291242009", Avatar = "", RoleId = 3, CreatedAt = now, UpdatedAt = now }
        };

        var clientUsers = new[]
        {
            new User { Id = 11, Email = "ivan.petrov@mail.by", PasswordHash = clientPasswordHash, FirstName = "Иван", LastName = "Петров", PhoneNumber = "+375291243011", Avatar = "", RoleId = 2, CreatedAt = now.AddDays(-120), UpdatedAt = now.AddDays(-8) },
            new User { Id = 12, Email = "anna.moroz@mail.by", PasswordHash = clientPasswordHash, FirstName = "Анна", LastName = "Мороз", PhoneNumber = "+375291243012", Avatar = "", RoleId = 2, CreatedAt = now.AddDays(-110), UpdatedAt = now.AddDays(-6) },
            new User { Id = 13, Email = "sergey.klimov@mail.by", PasswordHash = clientPasswordHash, FirstName = "Сергей", LastName = "Климов", PhoneNumber = "+375291243013", Avatar = "", RoleId = 2, CreatedAt = now.AddDays(-104), UpdatedAt = now.AddDays(-12) },
            new User { Id = 14, Email = "elena.chernenko@mail.by", PasswordHash = clientPasswordHash, FirstName = "Елена", LastName = "Черненко", PhoneNumber = "+375291243014", Avatar = "", RoleId = 2, CreatedAt = now.AddDays(-98), UpdatedAt = now.AddDays(-3) },
            new User { Id = 15, Email = "artem.sokolov@mail.by", PasswordHash = clientPasswordHash, FirstName = "Артем", LastName = "Соколов", PhoneNumber = "+375291243015", Avatar = "", RoleId = 2, CreatedAt = now.AddDays(-95), UpdatedAt = now.AddDays(-4) },
            new User { Id = 16, Email = "yuliya.dorofeeva@mail.by", PasswordHash = clientPasswordHash, FirstName = "Юлия", LastName = "Дорофеева", PhoneNumber = "+375291243016", Avatar = "", RoleId = 2, CreatedAt = now.AddDays(-91), UpdatedAt = now.AddDays(-14) },
            new User { Id = 17, Email = "maksim.bortnik@mail.by", PasswordHash = clientPasswordHash, FirstName = "Максим", LastName = "Бортник", PhoneNumber = "+375291243017", Avatar = "", RoleId = 2, CreatedAt = now.AddDays(-87), UpdatedAt = now.AddDays(-7) },
            new User { Id = 18, Email = "polina.kisel@mail.by", PasswordHash = clientPasswordHash, FirstName = "Полина", LastName = "Кисель", PhoneNumber = "+375291243018", Avatar = "", RoleId = 2, CreatedAt = now.AddDays(-82), UpdatedAt = now.AddDays(-10) },
            new User { Id = 19, Email = "roman.danilenko@mail.by", PasswordHash = clientPasswordHash, FirstName = "Роман", LastName = "Даниленко", PhoneNumber = "+375291243019", Avatar = "", RoleId = 2, CreatedAt = now.AddDays(-78), UpdatedAt = now.AddDays(-15) },
            new User { Id = 20, Email = "kristina.loban@mail.by", PasswordHash = clientPasswordHash, FirstName = "Кристина", LastName = "Лобань", PhoneNumber = "+375291243020", Avatar = "", RoleId = 2, CreatedAt = now.AddDays(-74), UpdatedAt = now.AddDays(-2) },
            new User { Id = 21, Email = "denis.pivovar@mail.by", PasswordHash = clientPasswordHash, FirstName = "Денис", LastName = "Пивовар", PhoneNumber = "+375291243021", Avatar = "", RoleId = 2, CreatedAt = now.AddDays(-70), UpdatedAt = now.AddDays(-11) },
            new User { Id = 22, Email = "alina.baran@mail.by", PasswordHash = clientPasswordHash, FirstName = "Алина", LastName = "Баран", PhoneNumber = "+375291243022", Avatar = "", RoleId = 2, CreatedAt = now.AddDays(-66), UpdatedAt = now.AddDays(-9) },
            new User { Id = 23, Email = "oleg.melnik@mail.by", PasswordHash = clientPasswordHash, FirstName = "Олег", LastName = "Мельник", PhoneNumber = "+375291243023", Avatar = "", RoleId = 2, CreatedAt = now.AddDays(-63), UpdatedAt = now.AddDays(-16) },
            new User { Id = 24, Email = "irina.makarova@mail.by", PasswordHash = clientPasswordHash, FirstName = "Ирина", LastName = "Макарова", PhoneNumber = "+375291243024", Avatar = "", RoleId = 2, CreatedAt = now.AddDays(-58), UpdatedAt = now.AddDays(-5) },
            new User { Id = 25, Email = "pavel.romanov@mail.by", PasswordHash = clientPasswordHash, FirstName = "Павел", LastName = "Романов", PhoneNumber = "+375291243025", Avatar = "", RoleId = 2, CreatedAt = now.AddDays(-56), UpdatedAt = now.AddDays(-8) },
            new User { Id = 26, Email = "daria.lapko@mail.by", PasswordHash = clientPasswordHash, FirstName = "Дарья", LastName = "Лапко", PhoneNumber = "+375291243026", Avatar = "", RoleId = 2, CreatedAt = now.AddDays(-52), UpdatedAt = now.AddDays(-6) },
            new User { Id = 27, Email = "kirill.vlasov@mail.by", PasswordHash = clientPasswordHash, FirstName = "Кирилл", LastName = "Власов", PhoneNumber = "+375291243027", Avatar = "", RoleId = 2, CreatedAt = now.AddDays(-48), UpdatedAt = now.AddDays(-3) },
            new User { Id = 28, Email = "tatyana.zhukova@mail.by", PasswordHash = clientPasswordHash, FirstName = "Татьяна", LastName = "Жукова", PhoneNumber = "+375291243028", Avatar = "", RoleId = 2, CreatedAt = now.AddDays(-45), UpdatedAt = now.AddDays(-1) },
            new User { Id = 29, Email = "nikita.hramov@mail.by", PasswordHash = clientPasswordHash, FirstName = "Никита", LastName = "Храмов", PhoneNumber = "+375291243029", Avatar = "", RoleId = 2, CreatedAt = now.AddDays(-41), UpdatedAt = now.AddDays(-2) },
            new User { Id = 30, Email = "marina.levchuk@mail.by", PasswordHash = clientPasswordHash, FirstName = "Марина", LastName = "Левчук", PhoneNumber = "+375291243030", Avatar = "", RoleId = 2, CreatedAt = now.AddDays(-38), UpdatedAt = now.AddDays(-4) }
        };

        modelBuilder.Entity<User>().HasData(managerUsers);
        modelBuilder.Entity<User>().HasData(clientUsers);

        var managerAssignments = new[]
        {
            new Manager { UserId = 2, HotelId = 1 },
            new Manager { UserId = 3, HotelId = 2 },
            new Manager { UserId = 4, HotelId = 3 },
            new Manager { UserId = 5, HotelId = 4 },
            new Manager { UserId = 6, HotelId = 5 },
            new Manager { UserId = 7, HotelId = 6 },
            new Manager { UserId = 8, HotelId = 7 },
            new Manager { UserId = 9, HotelId = 8 },
            new Manager { UserId = 10, HotelId = 9 }
        };
        modelBuilder.Entity<Manager>().HasData(managerAssignments);

        var favorites = new[]
        {
            new Favorite { Id = 1, UserId = 11, HotelId = 1 }, new Favorite { Id = 2, UserId = 11, HotelId = 10 },
            new Favorite { Id = 3, UserId = 12, HotelId = 2 }, new Favorite { Id = 4, UserId = 12, HotelId = 14 },
            new Favorite { Id = 5, UserId = 13, HotelId = 3 }, new Favorite { Id = 6, UserId = 13, HotelId = 6 },
            new Favorite { Id = 7, UserId = 14, HotelId = 4 }, new Favorite { Id = 8, UserId = 14, HotelId = 11 },
            new Favorite { Id = 9, UserId = 15, HotelId = 5 }, new Favorite { Id = 10, UserId = 15, HotelId = 15 },
            new Favorite { Id = 11, UserId = 16, HotelId = 6 }, new Favorite { Id = 12, UserId = 16, HotelId = 16 },
            new Favorite { Id = 13, UserId = 17, HotelId = 7 }, new Favorite { Id = 14, UserId = 18, HotelId = 8 },
            new Favorite { Id = 15, UserId = 19, HotelId = 9 }, new Favorite { Id = 16, UserId = 20, HotelId = 12 },
            new Favorite { Id = 17, UserId = 21, HotelId = 13 }, new Favorite { Id = 18, UserId = 22, HotelId = 2 },
            new Favorite { Id = 19, UserId = 23, HotelId = 3 }, new Favorite { Id = 20, UserId = 24, HotelId = 4 },
            new Favorite { Id = 21, UserId = 25, HotelId = 5 }, new Favorite { Id = 22, UserId = 26, HotelId = 10 },
            new Favorite { Id = 23, UserId = 27, HotelId = 11 }, new Favorite { Id = 24, UserId = 28, HotelId = 12 },
            new Favorite { Id = 25, UserId = 29, HotelId = 14 }, new Favorite { Id = 26, UserId = 30, HotelId = 1 }
        };
        modelBuilder.Entity<Favorite>().HasData(favorites);

        var bookings = new[]
        {
            new Booking { Id = 1, UserId = 11, RoomId = 1, GuestCount = 1, TotalPrice = 450m, CheckInDate = now.AddDays(-40), CheckOutDate = now.AddDays(-37), SpecialRequests = "Тихий номер", CreatedAt = now.AddDays(-45), UpdatedAt = now.AddDays(-37) },
            new Booking { Id = 2, UserId = 12, RoomId = 14, GuestCount = 2, TotalPrice = 730m, CheckInDate = now.AddDays(-34), CheckOutDate = now.AddDays(-31), SpecialRequests = "Поздний заезд", CreatedAt = now.AddDays(-36), UpdatedAt = now.AddDays(-31) },
            new Booking { Id = 3, UserId = 13, RoomId = 25, GuestCount = 2, TotalPrice = 980m, CheckInDate = now.AddDays(-30), CheckOutDate = now.AddDays(-26), SpecialRequests = "", CreatedAt = now.AddDays(-33), UpdatedAt = now.AddDays(-26) },
            new Booking { Id = 4, UserId = 14, RoomId = 38, GuestCount = 2, TotalPrice = 620m, CheckInDate = now.AddDays(-29), CheckOutDate = now.AddDays(-26), SpecialRequests = "Высокий этаж", CreatedAt = now.AddDays(-31), UpdatedAt = now.AddDays(-26) },
            new Booking { Id = 5, UserId = 15, RoomId = 49, GuestCount = 3, TotalPrice = 1100m, CheckInDate = now.AddDays(-25), CheckOutDate = now.AddDays(-21), SpecialRequests = "Детская кроватка", CreatedAt = now.AddDays(-28), UpdatedAt = now.AddDays(-21) },
            new Booking { Id = 6, UserId = 16, RoomId = 61, GuestCount = 1, TotalPrice = 520m, CheckInDate = now.AddDays(-24), CheckOutDate = now.AddDays(-21), SpecialRequests = "", CreatedAt = now.AddDays(-27), UpdatedAt = now.AddDays(-21) },
            new Booking { Id = 7, UserId = 17, RoomId = 73, GuestCount = 2, TotalPrice = 860m, CheckInDate = now.AddDays(-20), CheckOutDate = now.AddDays(-16), SpecialRequests = "Ранний заезд", CreatedAt = now.AddDays(-23), UpdatedAt = now.AddDays(-16) },
            new Booking { Id = 8, UserId = 18, RoomId = 84, GuestCount = 2, TotalPrice = 590m, CheckInDate = now.AddDays(-18), CheckOutDate = now.AddDays(-15), SpecialRequests = "", CreatedAt = now.AddDays(-20), UpdatedAt = now.AddDays(-15) },
            new Booking { Id = 9, UserId = 19, RoomId = 95, GuestCount = 2, TotalPrice = 470m, CheckInDate = now.AddDays(-17), CheckOutDate = now.AddDays(-14), SpecialRequests = "", CreatedAt = now.AddDays(-18), UpdatedAt = now.AddDays(-14) },
            new Booking { Id = 10, UserId = 20, RoomId = 106, GuestCount = 2, TotalPrice = 990m, CheckInDate = now.AddDays(-13), CheckOutDate = now.AddDays(-10), SpecialRequests = "Трансфер из аэропорта", CreatedAt = now.AddDays(-15), UpdatedAt = now.AddDays(-10) },
            new Booking { Id = 11, UserId = 21, RoomId = 3, GuestCount = 2, TotalPrice = 680m, CheckInDate = now.AddDays(-9), CheckOutDate = now.AddDays(-6), SpecialRequests = "", CreatedAt = now.AddDays(-11), UpdatedAt = now.AddDays(-6) },
            new Booking { Id = 12, UserId = 22, RoomId = 16, GuestCount = 2, TotalPrice = 780m, CheckInDate = now.AddDays(-8), CheckOutDate = now.AddDays(-5), SpecialRequests = "Номер для некурящих", CreatedAt = now.AddDays(-10), UpdatedAt = now.AddDays(-5) },
            new Booking { Id = 13, UserId = 23, RoomId = 27, GuestCount = 2, TotalPrice = 840m, CheckInDate = now.AddDays(2), CheckOutDate = now.AddDays(5), SpecialRequests = "", CreatedAt = now.AddDays(-2), UpdatedAt = now.AddDays(-1) },
            new Booking { Id = 14, UserId = 24, RoomId = 40, GuestCount = 1, TotalPrice = 560m, CheckInDate = now.AddDays(4), CheckOutDate = now.AddDays(7), SpecialRequests = "Тихий номер", CreatedAt = now.AddDays(-1), UpdatedAt = now },
            new Booking { Id = 15, UserId = 25, RoomId = 52, GuestCount = 2, TotalPrice = 930m, CheckInDate = now.AddDays(7), CheckOutDate = now.AddDays(10), SpecialRequests = "", CreatedAt = now.AddDays(-1), UpdatedAt = now },
            new Booking { Id = 16, UserId = 26, RoomId = 64, GuestCount = 2, TotalPrice = 740m, CheckInDate = now.AddDays(8), CheckOutDate = now.AddDays(11), SpecialRequests = "", CreatedAt = now.AddDays(-1), UpdatedAt = now },
            new Booking { Id = 17, UserId = 27, RoomId = 76, GuestCount = 3, TotalPrice = 1190m, CheckInDate = now.AddDays(11), CheckOutDate = now.AddDays(15), SpecialRequests = "Вид на центр", CreatedAt = now, UpdatedAt = now },
            new Booking { Id = 18, UserId = 28, RoomId = 88, GuestCount = 2, TotalPrice = 850m, CheckInDate = now.AddDays(13), CheckOutDate = now.AddDays(16), SpecialRequests = "", CreatedAt = now, UpdatedAt = now },
            new Booking { Id = 19, UserId = 29, RoomId = 100, GuestCount = 2, TotalPrice = 610m, CheckInDate = now.AddDays(16), CheckOutDate = now.AddDays(19), SpecialRequests = "", CreatedAt = now, UpdatedAt = now },
            new Booking { Id = 20, UserId = 30, RoomId = 112, GuestCount = 2, TotalPrice = 990m, CheckInDate = now.AddDays(18), CheckOutDate = now.AddDays(21), SpecialRequests = "Поздний выезд", CreatedAt = now, UpdatedAt = now }
        };
        modelBuilder.Entity<Booking>().HasData(bookings);

        var bookingStatuses = new[]
        {
            new BookingStatus { Id = 1, BookingId = 1, Status = BookingStatusEnum.Completed, StatusBy = 2, CreatedAt = now.AddDays(-37) },
            new BookingStatus { Id = 2, BookingId = 2, Status = BookingStatusEnum.Completed, StatusBy = 3, CreatedAt = now.AddDays(-31) },
            new BookingStatus { Id = 3, BookingId = 3, Status = BookingStatusEnum.Completed, StatusBy = 4, CreatedAt = now.AddDays(-26) },
            new BookingStatus { Id = 4, BookingId = 4, Status = BookingStatusEnum.Completed, StatusBy = 5, CreatedAt = now.AddDays(-26) },
            new BookingStatus { Id = 5, BookingId = 5, Status = BookingStatusEnum.Completed, StatusBy = 6, CreatedAt = now.AddDays(-21) },
            new BookingStatus { Id = 6, BookingId = 6, Status = BookingStatusEnum.Completed, StatusBy = 7, CreatedAt = now.AddDays(-21) },
            new BookingStatus { Id = 7, BookingId = 7, Status = BookingStatusEnum.Completed, StatusBy = 8, CreatedAt = now.AddDays(-16) },
            new BookingStatus { Id = 8, BookingId = 8, Status = BookingStatusEnum.Completed, StatusBy = 9, CreatedAt = now.AddDays(-15) },
            new BookingStatus { Id = 9, BookingId = 9, Status = BookingStatusEnum.Completed, StatusBy = 10, CreatedAt = now.AddDays(-14) },
            new BookingStatus { Id = 10, BookingId = 10, Status = BookingStatusEnum.Completed, StatusBy = 2, CreatedAt = now.AddDays(-10) },
            new BookingStatus { Id = 11, BookingId = 11, Status = BookingStatusEnum.Completed, StatusBy = 3, CreatedAt = now.AddDays(-6) },
            new BookingStatus { Id = 12, BookingId = 12, Status = BookingStatusEnum.Completed, StatusBy = 4, CreatedAt = now.AddDays(-5) },
            new BookingStatus { Id = 13, BookingId = 13, Status = BookingStatusEnum.Confirmed, StatusBy = 5, CreatedAt = now.AddDays(-1) },
            new BookingStatus { Id = 14, BookingId = 14, Status = BookingStatusEnum.Pending, StatusBy = 6, CreatedAt = now },
            new BookingStatus { Id = 15, BookingId = 15, Status = BookingStatusEnum.Pending, StatusBy = 7, CreatedAt = now },
            new BookingStatus { Id = 16, BookingId = 16, Status = BookingStatusEnum.Confirmed, StatusBy = 8, CreatedAt = now },
            new BookingStatus { Id = 17, BookingId = 17, Status = BookingStatusEnum.Pending, StatusBy = 9, CreatedAt = now },
            new BookingStatus { Id = 18, BookingId = 18, Status = BookingStatusEnum.Confirmed, StatusBy = 10, CreatedAt = now },
            new BookingStatus { Id = 19, BookingId = 19, Status = BookingStatusEnum.Cancelled, StatusBy = 2, CreatedAt = now.AddDays(-1) },
            new BookingStatus { Id = 20, BookingId = 20, Status = BookingStatusEnum.Pending, StatusBy = 3, CreatedAt = now }
        };
        modelBuilder.Entity<BookingStatus>().HasData(bookingStatuses);

        var reviews = new[]
        {
            new Review { Id = 1, BookingId = 1, Rating = 9, Comment = "Отличный сервис, номер чистый и тихий.", Status = ReviewStatus.Approved, ModerationReason = "", CreatedAt = now.AddDays(-36), UpdatedAt = now.AddDays(-36) },
            new Review { Id = 2, BookingId = 2, Rating = 8, Comment = "Удачное расположение и хороший завтрак.", Status = ReviewStatus.Approved, ModerationReason = "", CreatedAt = now.AddDays(-30), UpdatedAt = now.AddDays(-30) },
            new Review { Id = 3, BookingId = 3, Rating = 7, Comment = "В целом хорошо, но слышимость в коридоре высокая.", Status = ReviewStatus.Approved, ModerationReason = "", CreatedAt = now.AddDays(-25), UpdatedAt = now.AddDays(-25) },
            new Review { Id = 4, BookingId = 4, Rating = 10, Comment = "Очень вежливый персонал, обязательно вернусь.", Status = ReviewStatus.Approved, ModerationReason = "", CreatedAt = now.AddDays(-24), UpdatedAt = now.AddDays(-24) },
            new Review { Id = 5, BookingId = 5, Rating = 9, Comment = "Просторный номер, удобные кровати, детям понравилось.", Status = ReviewStatus.Approved, ModerationReason = "", CreatedAt = now.AddDays(-20), UpdatedAt = now.AddDays(-20) },
            new Review { Id = 6, BookingId = 6, Rating = 8, Comment = "Хорошее соотношение цена-качество.", Status = ReviewStatus.Approved, ModerationReason = "", CreatedAt = now.AddDays(-20), UpdatedAt = now.AddDays(-20) },
            new Review { Id = 7, BookingId = 7, Rating = 6, Comment = "Нормально, но на ресепшене было долгое ожидание.", Status = ReviewStatus.Pending, ModerationReason = "ожидает подтверждения", CreatedAt = now.AddDays(-15), UpdatedAt = now.AddDays(-15) },
            new Review { Id = 8, BookingId = 8, Rating = 9, Comment = "Уютно, чисто, удобная локация.", Status = ReviewStatus.Approved, ModerationReason = "", CreatedAt = now.AddDays(-14), UpdatedAt = now.AddDays(-14) },
            new Review { Id = 9, BookingId = 9, Rating = 7, Comment = "Хороший бюджетный вариант для короткой поездки.", Status = ReviewStatus.Approved, ModerationReason = "", CreatedAt = now.AddDays(-13), UpdatedAt = now.AddDays(-13) },
            new Review { Id = 10, BookingId = 10, Rating = 8, Comment = "Понравился номер и завтрак, но слабый Wi-Fi вечером.", Status = ReviewStatus.Approved, ModerationReason = "", CreatedAt = now.AddDays(-9), UpdatedAt = now.AddDays(-9) }
        };
        modelBuilder.Entity<Review>().HasData(reviews);

    }

    private static (decimal Price, MealType MealType) SeedRoomPricing(int hotelId, int roomTypeId, int variantIndex)
    {
        var basePrice = roomTypeId switch
        {
            1 => 150m,
            2 => 220m,
            3 => 280m,
            4 => 450m,
            5 => 350m,
            6 => 80m,
            _ => 120m
        };
        var hotelFactor = 1m + (hotelId - 1) * 0.07m;
        var price = Math.Round(basePrice * hotelFactor, 0);
        if (variantIndex == 1)
        {
            return (Math.Round(price * 1.15m + 12m, 0), MealType.Breakfast);
        }
        if (roomTypeId is 4 or 3 && variantIndex == 0 && hotelId % 2 == 0)
        {
            return (Math.Round(price * 1.25m + 25m, 0), MealType.HalfBoard);
        }
        return (price, MealType.SelfCatering);
    }

    private static Room[] BuildSeedRooms()
    {
        var now = DateTime.UtcNow;
        var list = new List<Room>();
        var roomNumbers = new[] { "101", "102", "103", "104", "201", "202", "301", "302", "401", "402", "501", "502" };
        var typeIds = new[] { 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6 };
        var id = 1;
        for (var hotelId = 1; hotelId <= 9; hotelId++)
        {
            for (var i = 0; i < 12; i++)
            {
                var variantIndex = i % 2;
                var (price, meal) = SeedRoomPricing(hotelId, typeIds[i], variantIndex);
                list.Add(new Room
                {
                    Id = id++,
                    RoomNumber = roomNumbers[i],
                    HotelId = hotelId,
                    RoomTypeId = typeIds[i],
                    Price = price,
                    MealType = meal,
                    CreatedAt = now,
                    UpdatedAt = now
                });
            }
        }
        var extra = new (int HotelId, int TypeId, string Number)[]
        {
            (10, 1, "101"), (11, 2, "201"), (12, 3, "301"), (13, 1, "401"),
            (14, 4, "501"), (15, 5, "601"), (16, 2, "701")
        };
        foreach (var e in extra)
        {
            var (price, meal) = SeedRoomPricing(e.HotelId, e.TypeId, 0);
            list.Add(new Room
            {
                Id = id++,
                RoomNumber = e.Number,
                HotelId = e.HotelId,
                RoomTypeId = e.TypeId,
                Price = price,
                MealType = meal,
                CreatedAt = now,
                UpdatedAt = now
            });
        }
        return list.ToArray();
    }

}



