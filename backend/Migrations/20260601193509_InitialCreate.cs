using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace NookBook.API.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Cities",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Image = table.Column<string>(type: "text", nullable: false),
                    Latitude = table.Column<decimal>(type: "numeric", nullable: true),
                    Longitude = table.Column<decimal>(type: "numeric", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Cities", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "HotelAmenityTypes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HotelAmenityTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Roles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Roles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RoomAmenityTypes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoomAmenityTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RoomTypes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    MaxGuests = table.Column<int>(type: "integer", nullable: false),
                    BedCount = table.Column<int>(type: "integer", nullable: false),
                    Size = table.Column<decimal>(type: "numeric", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoomTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Tags",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tags", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Hotels",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Stars = table.Column<int>(type: "integer", nullable: false),
                    CityId = table.Column<int>(type: "integer", nullable: false),
                    Address = table.Column<string>(type: "text", nullable: false),
                    Latitude = table.Column<decimal>(type: "numeric", nullable: true),
                    Longitude = table.Column<decimal>(type: "numeric", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Hotels", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Hotels_Cities_CityId",
                        column: x => x.CityId,
                        principalTable: "Cities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FirstName = table.Column<string>(type: "text", nullable: false),
                    LastName = table.Column<string>(type: "text", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    PhoneNumber = table.Column<string>(type: "text", nullable: false),
                    Avatar = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RoleId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Users_Roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RoomTypeImages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Image = table.Column<string>(type: "text", nullable: false),
                    RoomTypeId = table.Column<int>(type: "integer", nullable: false),
                    IsMain = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoomTypeImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RoomTypeImages_RoomTypes_RoomTypeId",
                        column: x => x.RoomTypeId,
                        principalTable: "RoomTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "HotelAmenities",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    HotelId = table.Column<int>(type: "integer", nullable: false),
                    HotelAmenityTypeId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HotelAmenities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HotelAmenities_HotelAmenityTypes_HotelAmenityTypeId",
                        column: x => x.HotelAmenityTypeId,
                        principalTable: "HotelAmenityTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_HotelAmenities_Hotels_HotelId",
                        column: x => x.HotelId,
                        principalTable: "Hotels",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "HotelImages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Image = table.Column<string>(type: "text", nullable: false),
                    HotelId = table.Column<int>(type: "integer", nullable: false),
                    IsMain = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HotelImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HotelImages_Hotels_HotelId",
                        column: x => x.HotelId,
                        principalTable: "Hotels",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Rooms",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RoomNumber = table.Column<string>(type: "text", nullable: false),
                    Price = table.Column<decimal>(type: "numeric", nullable: false),
                    MealType = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RoomTypeId = table.Column<int>(type: "integer", nullable: false),
                    HotelId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Rooms", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Rooms_Hotels_HotelId",
                        column: x => x.HotelId,
                        principalTable: "Hotels",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Rooms_RoomTypes_RoomTypeId",
                        column: x => x.RoomTypeId,
                        principalTable: "RoomTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "BlockHistory",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EntityType = table.Column<string>(type: "text", nullable: false),
                    EntityId = table.Column<int>(type: "integer", nullable: false),
                    IsBlocked = table.Column<bool>(type: "boolean", nullable: false),
                    Reason = table.Column<string>(type: "text", nullable: true),
                    ChangedByUserId = table.Column<int>(type: "integer", nullable: false),
                    ChangedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BlockHistory", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BlockHistory_Users_ChangedByUserId",
                        column: x => x.ChangedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Favorites",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    HotelId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Favorites", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Favorites_Hotels_HotelId",
                        column: x => x.HotelId,
                        principalTable: "Hotels",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Favorites_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Managers",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    HotelId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Managers", x => new { x.UserId, x.HotelId });
                    table.ForeignKey(
                        name: "FK_Managers_Hotels_HotelId",
                        column: x => x.HotelId,
                        principalTable: "Hotels",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Managers_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Bookings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    GuestCount = table.Column<int>(type: "integer", nullable: false),
                    TotalPrice = table.Column<decimal>(type: "numeric", nullable: false),
                    CheckInDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CheckOutDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SpecialRequests = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    RoomId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Bookings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Bookings_Rooms_RoomId",
                        column: x => x.RoomId,
                        principalTable: "Rooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Bookings_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RoomAmenities",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RoomId = table.Column<int>(type: "integer", nullable: false),
                    RoomAmenityTypeId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoomAmenities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RoomAmenities_RoomAmenityTypes_RoomAmenityTypeId",
                        column: x => x.RoomAmenityTypeId,
                        principalTable: "RoomAmenityTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RoomAmenities_Rooms_RoomId",
                        column: x => x.RoomId,
                        principalTable: "Rooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BookingStatuses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    StatusBy = table.Column<int>(type: "integer", nullable: true),
                    BookingId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BookingStatuses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BookingStatuses_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BookingStatuses_Users_StatusBy",
                        column: x => x.StatusBy,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Reviews",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Comment = table.Column<string>(type: "text", nullable: false),
                    Rating = table.Column<decimal>(type: "numeric", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    ModerationReason = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    BookingId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reviews", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Reviews_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "ReviewComments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Comment = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ReviewId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReviewComments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReviewComments_Reviews_ReviewId",
                        column: x => x.ReviewId,
                        principalTable: "Reviews",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ReviewComments_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ReviewComplaints",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ComplaintType = table.Column<int>(type: "integer", nullable: false),
                    Comment = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ReviewId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    ResolvedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReviewComplaints", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReviewComplaints_Reviews_ReviewId",
                        column: x => x.ReviewId,
                        principalTable: "Reviews",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ReviewComplaints_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ReviewTags",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ReviewId = table.Column<int>(type: "integer", nullable: false),
                    TagId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReviewTags", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReviewTags_Reviews_ReviewId",
                        column: x => x.ReviewId,
                        principalTable: "Reviews",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ReviewTags_Tags_TagId",
                        column: x => x.TagId,
                        principalTable: "Tags",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "Cities",
                columns: new[] { "Id", "Image", "Latitude", "Longitude", "Name" },
                values: new object[,]
                {
                    { 1, "/assets/cities/minsk.jpg", 53.9045m, 27.5615m, "Минск" },
                    { 2, "/assets/cities/brest.jpg", 52.0975m, 23.7341m, "Брест" },
                    { 3, "/assets/cities/vitebsk.jpg", 55.1904m, 30.2049m, "Витебск" },
                    { 4, "/assets/cities/gomel.jpg", 52.4345m, 30.9754m, "Гомель" },
                    { 5, "/assets/cities/grodno.jfif", 53.6778m, 23.8297m, "Гродно" },
                    { 6, "/assets/cities/mogilev.jpg", 53.8945m, 30.3313m, "Могилёв" }
                });

            migrationBuilder.InsertData(
                table: "HotelAmenityTypes",
                columns: new[] { "Id", "Name" },
                values: new object[,]
                {
                    { 1, "Wi-Fi" },
                    { 2, "Парковка" },
                    { 3, "Ресторан" },
                    { 4, "Бар" },
                    { 5, "Бассейн" },
                    { 6, "Фитнес-центр" },
                    { 7, "Спа" },
                    { 8, "Трансфер" },
                    { 9, "Прачечная" },
                    { 10, "Доставка еды и напитков в номер" },
                    { 11, "Джакузи" }
                });

            migrationBuilder.InsertData(
                table: "Roles",
                columns: new[] { "Id", "Name" },
                values: new object[,]
                {
                    { 1, "Guest" },
                    { 2, "User" },
                    { 3, "Manager" },
                    { 4, "Admin" }
                });

            migrationBuilder.InsertData(
                table: "RoomAmenityTypes",
                columns: new[] { "Id", "Name" },
                values: new object[,]
                {
                    { 1, "Чайник" },
                    { 2, "Холодильник" },
                    { 3, "Телевизор" },
                    { 4, "Звукоизолированный" },
                    { 5, "Кондиционер" },
                    { 6, "Сейф" },
                    { 7, "Фен" },
                    { 8, "Утюг" },
                    { 9, "Душ" },
                    { 10, "Ванна" },
                    { 11, "Мини-кухня" },
                    { 12, "Вид на озеро" },
                    { 13, "Камин" },
                    { 14, "Сауна" },
                    { 15, "Стиральная машина" }
                });

            migrationBuilder.InsertData(
                table: "RoomTypes",
                columns: new[] { "Id", "BedCount", "Description", "MaxGuests", "Name", "Size" },
                values: new object[,]
                {
                    { 1, 1, "Уютный стандартный номер с односпальной кроватью.", 1, "Стандарт", 20m },
                    { 2, 1, "Улучшенный номер с двуспальной кроватью и видом на город.", 2, "Улучшенный", 25m },
                    { 3, 1, "Бизнес номер с рабочим столом и высокоскоростным Wi-Fi.", 2, "Бизнес", 30m },
                    { 4, 2, "Роскошный люкс с гостиной и спальней.", 3, "Люкс", 50m },
                    { 5, 3, "Семейный номер с двумя спальнями.", 4, "Семейный", 45m },
                    { 6, 2, "Эконом номер для бюджетных путешествий.", 2, "Эконом", 18m }
                });

            migrationBuilder.InsertData(
                table: "Tags",
                columns: new[] { "Id", "Name" },
                values: new object[,]
                {
                    { 1, "Чистота" },
                    { 2, "Комфорт" },
                    { 3, "Персонал" },
                    { 4, "Завтрак" },
                    { 5, "Расположение" },
                    { 6, "Wi-Fi" },
                    { 7, "Парковка" },
                    { 8, "Бассейн" },
                    { 9, "Спортзал" },
                    { 10, "Тишина" },
                    { 11, "Цена-качество" },
                    { 12, "Вид из окна" },
                    { 13, "Шум" },
                    { 14, "Грязно" },
                    { 15, "Плохой Wi-Fi" },
                    { 16, "Нет парковки" },
                    { 17, "Некомфортная кровать" },
                    { 18, "Сломанный душ" },
                    { 19, "Невежливый персонал" },
                    { 20, "Дорого" },
                    { 21, "Холодно" },
                    { 22, "Жарко" }
                });

            migrationBuilder.InsertData(
                table: "Hotels",
                columns: new[] { "Id", "Address", "CityId", "CreatedAt", "Description", "Latitude", "Longitude", "Name", "Stars", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, "пл. Победы, 1", 1, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(6636), "Роскошный отель в самом центре Минска", 53.9082m, 27.5492m, "Гранд Отель Европа", 5, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(6637) },
                    { 2, "ул. Сторожевская, 15", 1, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(6642), "Комфортабельный отель с видом на город", 53.9006m, 27.5590m, "Беларусь", 4, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(6642) },
                    { 3, "пр-т Победителей, 59", 1, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(6646), "Современный отель для деловых поездок", 53.9314m, 27.4781m, "Виктория", 4, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(6647) },
                    { 4, "ул. Гоголя, 7", 2, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(6650), "Уютный отель рядом с Брестской крепостью", 52.0919m, 23.7296m, "Беловежская", 3, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(6651) },
                    { 5, "ул. Гоголя, 2", 2, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(6654), "Отель с видом на реку Мухавец", 52.0928m, 23.7261m, "Эридан", 3, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(6655) },
                    { 6, "пр-т Фрунзе, 13/2", 3, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(6659), "Современный отель в Витебске", 55.1982m, 30.2076m, "Лучеса", 4, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(6659) },
                    { 7, "пр-т Ленина, 10", 4, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(6663), "Комфортабельный отель в центре Гомеля", 52.4315m, 30.9743m, "Гомель", 3, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(6663) },
                    { 8, "ул. Семашко, 1", 5, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(6667), "Исторический отель в Гродно", 53.6778m, 23.8297m, "Семашко", 3, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(6667) },
                    { 9, "ул. Первомайская, 50", 6, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(6685), "Удобный отель в Могилёве", 53.8962m, 30.3315m, "Турист", 2, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(6685) },
                    { 10, "ул. Ленина, 12", 2, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(6689), "Современный отель в центре Бреста", 52.0940m, 23.7280m, "Брест Палас", 4, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(6689) },
                    { 11, "ул. Набережная, 8", 2, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(6693), "Уютный отель рядом с набережной", 52.0905m, 23.7310m, "Западный Берег", 3, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(6694) },
                    { 12, "пр-т Машерова, 5", 2, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(6699), "Отель возле Брестской крепости", 52.0870m, 23.7215m, "Крепость Парк", 4, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(6699) },
                    { 13, "ул. Пионерская, 22", 2, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(6702), "Спокойный отдых в зеленой зоне города", 52.0985m, 23.7420m, "Лазурный", 3, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(6703) },
                    { 14, "ул. Советская, 44", 2, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(6706), "Бутик-отель в историческом районе", 52.0915m, 23.7350m, "Старый Брест", 4, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(6707) },
                    { 15, "ул. Московская, 73", 2, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(6770), "Семейный отель с просторными номерами", 52.1020m, 23.7495m, "Ривьера", 3, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(6771) },
                    { 16, "ул. Орджоникидзе, 3", 2, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(6775), "Деловой отель рядом с транспортным узлом", 52.0955m, 23.7450m, "Сити Брест", 4, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(6775) }
                });

            migrationBuilder.InsertData(
                table: "RoomTypeImages",
                columns: new[] { "Id", "Image", "IsMain", "RoomTypeId" },
                values: new object[,]
                {
                    { 10001, "/assets/rooms/room1.jpg", true, 1 },
                    { 10002, "/assets/rooms/room2.jpg", false, 1 },
                    { 10003, "/assets/rooms/room3.jpg", false, 1 },
                    { 10004, "/assets/rooms/room4.jpg", false, 1 },
                    { 10005, "/assets/rooms/room5.jpg", false, 1 },
                    { 10006, "/assets/rooms/room2.jpg", true, 2 },
                    { 10007, "/assets/rooms/room3.jpg", false, 2 },
                    { 10008, "/assets/rooms/room4.jpg", false, 2 },
                    { 10009, "/assets/rooms/room5.jpg", false, 2 },
                    { 10010, "/assets/rooms/room1.jpg", false, 2 },
                    { 10011, "/assets/rooms/room3.jpg", true, 3 },
                    { 10012, "/assets/rooms/room4.jpg", false, 3 },
                    { 10013, "/assets/rooms/room5.jpg", false, 3 },
                    { 10014, "/assets/rooms/room1.jpg", false, 3 },
                    { 10015, "/assets/rooms/room2.jpg", false, 3 },
                    { 10016, "/assets/rooms/room4.jpg", true, 4 },
                    { 10017, "/assets/rooms/room5.jpg", false, 4 },
                    { 10018, "/assets/rooms/room1.jpg", false, 4 },
                    { 10019, "/assets/rooms/room2.jpg", false, 4 },
                    { 10020, "/assets/rooms/room3.jpg", false, 4 },
                    { 10021, "/assets/rooms/room5.jpg", true, 5 },
                    { 10022, "/assets/rooms/room1.jpg", false, 5 },
                    { 10023, "/assets/rooms/room2.jpg", false, 5 },
                    { 10024, "/assets/rooms/room3.jpg", false, 5 },
                    { 10025, "/assets/rooms/room4.jpg", false, 5 },
                    { 10026, "/assets/rooms/room1.jpg", true, 6 },
                    { 10027, "/assets/rooms/room2.jpg", false, 6 },
                    { 10028, "/assets/rooms/room3.jpg", false, 6 },
                    { 10029, "/assets/rooms/room4.jpg", false, 6 },
                    { 10030, "/assets/rooms/room5.jpg", false, 6 }
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "Avatar", "CreatedAt", "Email", "FirstName", "LastName", "PasswordHash", "PhoneNumber", "RoleId", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, "", new DateTime(2026, 6, 1, 19, 35, 8, 180, DateTimeKind.Utc).AddTicks(7521), "admin@nookbook.com", "Администратор", "Системы", "$2a$11$28P.JJk2B.JdoT4Dwz8y.OWp9HLs17hhdOqL5KyQFWbqA25koawAW", "+375291234567", 4, new DateTime(2026, 6, 1, 19, 35, 8, 180, DateTimeKind.Utc).AddTicks(7521) },
                    { 2, "", new DateTime(2026, 6, 1, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), "a.kovalev@nookbook.by", "Андрей", "Ковалев", "$2a$11$i/CCbaLsdH/kTh9hqXSfJ.KXkOf6JylLueggsig9fiuRM32NUB.pO", "+375291242001", 3, new DateTime(2026, 6, 1, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852) },
                    { 3, "", new DateTime(2026, 6, 1, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), "e.savitskaya@nookbook.by", "Екатерина", "Савицкая", "$2a$11$i/CCbaLsdH/kTh9hqXSfJ.KXkOf6JylLueggsig9fiuRM32NUB.pO", "+375291242002", 3, new DateTime(2026, 6, 1, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852) },
                    { 4, "", new DateTime(2026, 6, 1, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), "d.rudak@nookbook.by", "Дмитрий", "Рудак", "$2a$11$i/CCbaLsdH/kTh9hqXSfJ.KXkOf6JylLueggsig9fiuRM32NUB.pO", "+375291242003", 3, new DateTime(2026, 6, 1, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852) },
                    { 5, "", new DateTime(2026, 6, 1, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), "o.kravchenko@nookbook.by", "Ольга", "Кравченко", "$2a$11$i/CCbaLsdH/kTh9hqXSfJ.KXkOf6JylLueggsig9fiuRM32NUB.pO", "+375291242004", 3, new DateTime(2026, 6, 1, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852) },
                    { 6, "", new DateTime(2026, 6, 1, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), "p.zhuk@nookbook.by", "Павел", "Жук", "$2a$11$i/CCbaLsdH/kTh9hqXSfJ.KXkOf6JylLueggsig9fiuRM32NUB.pO", "+375291242005", 3, new DateTime(2026, 6, 1, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852) },
                    { 7, "", new DateTime(2026, 6, 1, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), "m.shcherbak@nookbook.by", "Марина", "Щербак", "$2a$11$i/CCbaLsdH/kTh9hqXSfJ.KXkOf6JylLueggsig9fiuRM32NUB.pO", "+375291242006", 3, new DateTime(2026, 6, 1, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852) },
                    { 8, "", new DateTime(2026, 6, 1, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), "v.bondarenko@nookbook.by", "Виктор", "Бондаренко", "$2a$11$i/CCbaLsdH/kTh9hqXSfJ.KXkOf6JylLueggsig9fiuRM32NUB.pO", "+375291242007", 3, new DateTime(2026, 6, 1, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852) },
                    { 9, "", new DateTime(2026, 6, 1, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), "n.kozlova@nookbook.by", "Наталья", "Козлова", "$2a$11$i/CCbaLsdH/kTh9hqXSfJ.KXkOf6JylLueggsig9fiuRM32NUB.pO", "+375291242008", 3, new DateTime(2026, 6, 1, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852) },
                    { 10, "", new DateTime(2026, 6, 1, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), "i.pavlovets@nookbook.by", "Игорь", "Павловец", "$2a$11$i/CCbaLsdH/kTh9hqXSfJ.KXkOf6JylLueggsig9fiuRM32NUB.pO", "+375291242009", 3, new DateTime(2026, 6, 1, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852) },
                    { 11, "", new DateTime(2026, 2, 1, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), "ivan.petrov@nookbook.by", "Иван", "Петров", "$2a$11$NmHS5sqeBTTZhcB/edlhee02./GeDffUD26OgJclZqdO9SrP9aKCu", "+375291243011", 2, new DateTime(2026, 5, 24, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852) },
                    { 12, "", new DateTime(2026, 2, 11, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), "anna.moroz@nookbook.by", "Анна", "Мороз", "$2a$11$NmHS5sqeBTTZhcB/edlhee02./GeDffUD26OgJclZqdO9SrP9aKCu", "+375291243012", 2, new DateTime(2026, 5, 26, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852) },
                    { 13, "", new DateTime(2026, 2, 17, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), "sergey.klimov@nookbook.by", "Сергей", "Климов", "$2a$11$NmHS5sqeBTTZhcB/edlhee02./GeDffUD26OgJclZqdO9SrP9aKCu", "+375291243013", 2, new DateTime(2026, 5, 20, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852) },
                    { 14, "", new DateTime(2026, 2, 23, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), "elena.chernenko@nookbook.by", "Елена", "Черненко", "$2a$11$NmHS5sqeBTTZhcB/edlhee02./GeDffUD26OgJclZqdO9SrP9aKCu", "+375291243014", 2, new DateTime(2026, 5, 29, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852) },
                    { 15, "", new DateTime(2026, 2, 26, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), "artem.sokolov@nookbook.by", "Артем", "Соколов", "$2a$11$NmHS5sqeBTTZhcB/edlhee02./GeDffUD26OgJclZqdO9SrP9aKCu", "+375291243015", 2, new DateTime(2026, 5, 28, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852) },
                    { 16, "", new DateTime(2026, 3, 2, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), "yuliya.dorofeeva@nookbook.by", "Юлия", "Дорофеева", "$2a$11$NmHS5sqeBTTZhcB/edlhee02./GeDffUD26OgJclZqdO9SrP9aKCu", "+375291243016", 2, new DateTime(2026, 5, 18, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852) },
                    { 17, "", new DateTime(2026, 3, 6, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), "maksim.bortnik@nookbook.by", "Максим", "Бортник", "$2a$11$NmHS5sqeBTTZhcB/edlhee02./GeDffUD26OgJclZqdO9SrP9aKCu", "+375291243017", 2, new DateTime(2026, 5, 25, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852) },
                    { 18, "", new DateTime(2026, 3, 11, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), "polina.kisel@nookbook.by", "Полина", "Кисель", "$2a$11$NmHS5sqeBTTZhcB/edlhee02./GeDffUD26OgJclZqdO9SrP9aKCu", "+375291243018", 2, new DateTime(2026, 5, 22, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852) },
                    { 19, "", new DateTime(2026, 3, 15, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), "roman.danilenko@nookbook.by", "Роман", "Даниленко", "$2a$11$NmHS5sqeBTTZhcB/edlhee02./GeDffUD26OgJclZqdO9SrP9aKCu", "+375291243019", 2, new DateTime(2026, 5, 17, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852) },
                    { 20, "", new DateTime(2026, 3, 19, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), "kristina.loban@nookbook.by", "Кристина", "Лобань", "$2a$11$NmHS5sqeBTTZhcB/edlhee02./GeDffUD26OgJclZqdO9SrP9aKCu", "+375291243020", 2, new DateTime(2026, 5, 30, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852) },
                    { 21, "", new DateTime(2026, 3, 23, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), "denis.pivovar@nookbook.by", "Денис", "Пивовар", "$2a$11$NmHS5sqeBTTZhcB/edlhee02./GeDffUD26OgJclZqdO9SrP9aKCu", "+375291243021", 2, new DateTime(2026, 5, 21, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852) },
                    { 22, "", new DateTime(2026, 3, 27, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), "alina.baran@nookbook.by", "Алина", "Баран", "$2a$11$NmHS5sqeBTTZhcB/edlhee02./GeDffUD26OgJclZqdO9SrP9aKCu", "+375291243022", 2, new DateTime(2026, 5, 23, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852) },
                    { 23, "", new DateTime(2026, 3, 30, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), "oleg.melnik@nookbook.by", "Олег", "Мельник", "$2a$11$NmHS5sqeBTTZhcB/edlhee02./GeDffUD26OgJclZqdO9SrP9aKCu", "+375291243023", 2, new DateTime(2026, 5, 16, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852) },
                    { 24, "", new DateTime(2026, 4, 4, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), "irina.makarova@nookbook.by", "Ирина", "Макарова", "$2a$11$NmHS5sqeBTTZhcB/edlhee02./GeDffUD26OgJclZqdO9SrP9aKCu", "+375291243024", 2, new DateTime(2026, 5, 27, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852) },
                    { 25, "", new DateTime(2026, 4, 6, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), "pavel.romanov@nookbook.by", "Павел", "Романов", "$2a$11$NmHS5sqeBTTZhcB/edlhee02./GeDffUD26OgJclZqdO9SrP9aKCu", "+375291243025", 2, new DateTime(2026, 5, 24, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852) },
                    { 26, "", new DateTime(2026, 4, 10, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), "daria.lapko@nookbook.by", "Дарья", "Лапко", "$2a$11$NmHS5sqeBTTZhcB/edlhee02./GeDffUD26OgJclZqdO9SrP9aKCu", "+375291243026", 2, new DateTime(2026, 5, 26, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852) },
                    { 27, "", new DateTime(2026, 4, 14, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), "kirill.vlasov@nookbook.by", "Кирилл", "Власов", "$2a$11$NmHS5sqeBTTZhcB/edlhee02./GeDffUD26OgJclZqdO9SrP9aKCu", "+375291243027", 2, new DateTime(2026, 5, 29, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852) },
                    { 28, "", new DateTime(2026, 4, 17, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), "tatyana.zhukova@nookbook.by", "Татьяна", "Жукова", "$2a$11$NmHS5sqeBTTZhcB/edlhee02./GeDffUD26OgJclZqdO9SrP9aKCu", "+375291243028", 2, new DateTime(2026, 5, 31, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852) },
                    { 29, "", new DateTime(2026, 4, 21, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), "nikita.hramov@nookbook.by", "Никита", "Храмов", "$2a$11$NmHS5sqeBTTZhcB/edlhee02./GeDffUD26OgJclZqdO9SrP9aKCu", "+375291243029", 2, new DateTime(2026, 5, 30, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852) },
                    { 30, "", new DateTime(2026, 4, 24, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), "marina.levchuk@nookbook.by", "Марина", "Левчук", "$2a$11$NmHS5sqeBTTZhcB/edlhee02./GeDffUD26OgJclZqdO9SrP9aKCu", "+375291243030", 2, new DateTime(2026, 5, 28, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852) }
                });

            migrationBuilder.InsertData(
                table: "Favorites",
                columns: new[] { "Id", "HotelId", "UserId" },
                values: new object[,]
                {
                    { 1, 1, 11 },
                    { 2, 10, 11 },
                    { 3, 2, 12 },
                    { 4, 14, 12 },
                    { 5, 3, 13 },
                    { 6, 6, 13 },
                    { 7, 4, 14 },
                    { 8, 11, 14 },
                    { 9, 5, 15 },
                    { 10, 15, 15 },
                    { 11, 6, 16 },
                    { 12, 16, 16 },
                    { 13, 7, 17 },
                    { 14, 8, 18 },
                    { 15, 9, 19 },
                    { 16, 12, 20 },
                    { 17, 13, 21 },
                    { 18, 2, 22 },
                    { 19, 3, 23 },
                    { 20, 4, 24 },
                    { 21, 5, 25 },
                    { 22, 10, 26 },
                    { 23, 11, 27 },
                    { 24, 12, 28 },
                    { 25, 14, 29 },
                    { 26, 1, 30 }
                });

            migrationBuilder.InsertData(
                table: "HotelAmenities",
                columns: new[] { "Id", "HotelAmenityTypeId", "HotelId" },
                values: new object[,]
                {
                    { 1, 1, 1 },
                    { 2, 2, 1 },
                    { 3, 3, 1 },
                    { 4, 4, 1 },
                    { 5, 5, 1 },
                    { 6, 6, 1 },
                    { 7, 7, 1 },
                    { 8, 8, 1 },
                    { 9, 9, 1 },
                    { 10, 1, 2 },
                    { 11, 2, 2 },
                    { 12, 3, 2 },
                    { 13, 6, 2 },
                    { 14, 8, 2 },
                    { 15, 1, 3 },
                    { 16, 2, 3 },
                    { 17, 6, 3 },
                    { 18, 8, 3 },
                    { 19, 1, 4 },
                    { 20, 2, 4 },
                    { 21, 3, 4 },
                    { 22, 9, 4 },
                    { 23, 1, 5 },
                    { 24, 2, 5 },
                    { 25, 3, 5 },
                    { 26, 1, 6 },
                    { 27, 2, 6 },
                    { 28, 3, 6 },
                    { 29, 6, 6 },
                    { 30, 8, 6 },
                    { 31, 1, 7 },
                    { 32, 2, 7 },
                    { 33, 3, 7 },
                    { 34, 1, 8 },
                    { 35, 2, 8 },
                    { 36, 3, 8 },
                    { 37, 1, 9 },
                    { 38, 2, 9 },
                    { 39, 3, 9 },
                    { 40, 10, 1 },
                    { 41, 11, 2 },
                    { 42, 10, 6 },
                    { 43, 1, 10 },
                    { 44, 3, 10 },
                    { 45, 1, 11 },
                    { 46, 2, 12 },
                    { 47, 10, 13 },
                    { 48, 11, 14 },
                    { 49, 1, 15 },
                    { 50, 8, 16 }
                });

            migrationBuilder.InsertData(
                table: "HotelImages",
                columns: new[] { "Id", "HotelId", "Image", "IsMain" },
                values: new object[,]
                {
                    { 1, 1, "/assets/hotels/hotel1.jpg", true },
                    { 2, 2, "/assets/hotels/hotel2.jpg", true },
                    { 3, 3, "/assets/hotels/hotel3.jpg", true },
                    { 4, 4, "/assets/hotels/hotel4.jpg", true },
                    { 5, 5, "/assets/hotels/hotel5.jpg", true },
                    { 6, 6, "/assets/hotels/hotel1.jpg", true },
                    { 7, 7, "/assets/hotels/hotel2.jpg", true },
                    { 8, 8, "/assets/hotels/hotel3.jpg", true },
                    { 9, 9, "/assets/hotels/hotel4.jpg", true },
                    { 10, 10, "/assets/hotels/hotel5.jpg", true },
                    { 11, 11, "/assets/hotels/hotel1.jpg", true },
                    { 12, 12, "/assets/hotels/hotel2.jpg", true },
                    { 13, 13, "/assets/hotels/hotel3.jpg", true },
                    { 14, 14, "/assets/hotels/hotel4.jpg", true },
                    { 15, 15, "/assets/hotels/hotel5.jpg", true },
                    { 16, 16, "/assets/hotels/hotel1.jpg", true },
                    { 17, 1, "/assets/hotels/hotel2.jpg", false },
                    { 18, 1, "/assets/hotels/hotel3.jpg", false },
                    { 19, 1, "/assets/hotels/hotel4.jpg", false },
                    { 20, 1, "/assets/hotels/hotel5.jpg", false },
                    { 21, 2, "/assets/hotels/hotel3.jpg", false },
                    { 22, 2, "/assets/hotels/hotel4.jpg", false },
                    { 23, 2, "/assets/hotels/hotel5.jpg", false },
                    { 24, 2, "/assets/hotels/hotel1.jpg", false },
                    { 25, 3, "/assets/hotels/hotel4.jpg", false },
                    { 26, 3, "/assets/hotels/hotel5.jpg", false },
                    { 27, 3, "/assets/hotels/hotel1.jpg", false },
                    { 28, 3, "/assets/hotels/hotel2.jpg", false },
                    { 29, 4, "/assets/hotels/hotel5.jpg", false },
                    { 30, 4, "/assets/hotels/hotel1.jpg", false },
                    { 31, 4, "/assets/hotels/hotel2.jpg", false },
                    { 32, 4, "/assets/hotels/hotel3.jpg", false },
                    { 33, 5, "/assets/hotels/hotel1.jpg", false },
                    { 34, 5, "/assets/hotels/hotel2.jpg", false },
                    { 35, 5, "/assets/hotels/hotel3.jpg", false },
                    { 36, 5, "/assets/hotels/hotel4.jpg", false },
                    { 37, 6, "/assets/hotels/hotel2.jpg", false },
                    { 38, 6, "/assets/hotels/hotel3.jpg", false },
                    { 39, 6, "/assets/hotels/hotel4.jpg", false },
                    { 40, 6, "/assets/hotels/hotel5.jpg", false },
                    { 41, 7, "/assets/hotels/hotel3.jpg", false },
                    { 42, 7, "/assets/hotels/hotel4.jpg", false },
                    { 43, 7, "/assets/hotels/hotel5.jpg", false },
                    { 44, 7, "/assets/hotels/hotel1.jpg", false },
                    { 45, 8, "/assets/hotels/hotel4.jpg", false },
                    { 46, 8, "/assets/hotels/hotel5.jpg", false },
                    { 47, 8, "/assets/hotels/hotel1.jpg", false },
                    { 48, 8, "/assets/hotels/hotel2.jpg", false },
                    { 49, 9, "/assets/hotels/hotel5.jpg", false },
                    { 50, 9, "/assets/hotels/hotel1.jpg", false },
                    { 51, 9, "/assets/hotels/hotel2.jpg", false },
                    { 52, 9, "/assets/hotels/hotel3.jpg", false },
                    { 53, 10, "/assets/hotels/hotel1.jpg", false },
                    { 54, 10, "/assets/hotels/hotel2.jpg", false },
                    { 55, 10, "/assets/hotels/hotel3.jpg", false },
                    { 56, 10, "/assets/hotels/hotel4.jpg", false },
                    { 57, 11, "/assets/hotels/hotel2.jpg", false },
                    { 58, 11, "/assets/hotels/hotel3.jpg", false },
                    { 59, 11, "/assets/hotels/hotel4.jpg", false },
                    { 60, 11, "/assets/hotels/hotel5.jpg", false },
                    { 61, 12, "/assets/hotels/hotel3.jpg", false },
                    { 62, 12, "/assets/hotels/hotel4.jpg", false },
                    { 63, 12, "/assets/hotels/hotel5.jpg", false },
                    { 64, 12, "/assets/hotels/hotel1.jpg", false },
                    { 65, 13, "/assets/hotels/hotel4.jpg", false },
                    { 66, 13, "/assets/hotels/hotel5.jpg", false },
                    { 67, 13, "/assets/hotels/hotel1.jpg", false },
                    { 68, 13, "/assets/hotels/hotel2.jpg", false },
                    { 69, 14, "/assets/hotels/hotel5.jpg", false },
                    { 70, 14, "/assets/hotels/hotel1.jpg", false },
                    { 71, 14, "/assets/hotels/hotel2.jpg", false },
                    { 72, 14, "/assets/hotels/hotel3.jpg", false },
                    { 73, 15, "/assets/hotels/hotel1.jpg", false },
                    { 74, 15, "/assets/hotels/hotel2.jpg", false },
                    { 75, 15, "/assets/hotels/hotel3.jpg", false },
                    { 76, 15, "/assets/hotels/hotel4.jpg", false },
                    { 77, 16, "/assets/hotels/hotel2.jpg", false },
                    { 78, 16, "/assets/hotels/hotel3.jpg", false },
                    { 79, 16, "/assets/hotels/hotel4.jpg", false },
                    { 80, 16, "/assets/hotels/hotel5.jpg", false }
                });

            migrationBuilder.InsertData(
                table: "Managers",
                columns: new[] { "HotelId", "UserId" },
                values: new object[,]
                {
                    { 1, 2 },
                    { 2, 3 },
                    { 3, 4 },
                    { 4, 5 },
                    { 5, 6 },
                    { 6, 7 },
                    { 7, 8 },
                    { 8, 9 },
                    { 9, 10 }
                });

            migrationBuilder.InsertData(
                table: "Rooms",
                columns: new[] { "Id", "CreatedAt", "HotelId", "MealType", "Price", "RoomNumber", "RoomTypeId", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 1, 0, 150m, "101", 1, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 2, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 1, 1, 184m, "102", 1, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 3, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 1, 0, 220m, "103", 2, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 4, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 1, 1, 265m, "104", 2, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 5, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 1, 0, 280m, "201", 3, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 6, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 1, 1, 334m, "202", 3, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 7, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 1, 0, 450m, "301", 4, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 8, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 1, 1, 530m, "302", 4, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 9, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 1, 0, 350m, "401", 5, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 10, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 1, 1, 414m, "402", 5, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 11, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 1, 0, 80m, "501", 6, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 12, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 1, 1, 104m, "502", 6, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 13, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 2, 0, 160m, "101", 1, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 14, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 2, 1, 196m, "102", 1, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 15, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 2, 0, 235m, "103", 2, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 16, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 2, 1, 282m, "104", 2, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 17, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 2, 2, 400m, "201", 3, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 18, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 2, 1, 357m, "202", 3, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 19, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 2, 2, 628m, "301", 4, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 20, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 2, 1, 566m, "302", 4, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 21, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 2, 0, 374m, "401", 5, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 22, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 2, 1, 442m, "402", 5, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 23, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 2, 0, 86m, "501", 6, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 24, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 2, 1, 111m, "502", 6, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 25, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 3, 0, 171m, "101", 1, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 26, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 3, 1, 209m, "102", 1, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 27, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 3, 0, 251m, "103", 2, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 28, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 3, 1, 301m, "104", 2, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 29, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 3, 0, 319m, "201", 3, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 30, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 3, 1, 379m, "202", 3, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 31, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 3, 0, 513m, "301", 4, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 32, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 3, 1, 602m, "302", 4, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 33, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 3, 0, 399m, "401", 5, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 34, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 3, 1, 471m, "402", 5, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 35, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 3, 0, 91m, "501", 6, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 36, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 3, 1, 117m, "502", 6, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 37, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 4, 0, 182m, "101", 1, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 38, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 4, 1, 221m, "102", 1, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 39, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 4, 0, 266m, "103", 2, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 40, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 4, 1, 318m, "104", 2, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 41, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 4, 2, 449m, "201", 3, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 42, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 4, 1, 402m, "202", 3, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 43, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 4, 2, 705m, "301", 4, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 44, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 4, 1, 638m, "302", 4, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 45, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 4, 0, 424m, "401", 5, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 46, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 4, 1, 500m, "402", 5, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 47, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 4, 0, 97m, "501", 6, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 48, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 4, 1, 124m, "502", 6, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 49, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 5, 0, 192m, "101", 1, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 50, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 5, 1, 233m, "102", 1, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 51, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 5, 0, 282m, "103", 2, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 52, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 5, 1, 336m, "104", 2, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 53, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 5, 0, 358m, "201", 3, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 54, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 5, 1, 424m, "202", 3, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 55, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 5, 0, 576m, "301", 4, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 56, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 5, 1, 674m, "302", 4, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 57, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 5, 0, 448m, "401", 5, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 58, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 5, 1, 527m, "402", 5, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 59, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 5, 0, 102m, "501", 6, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 60, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 5, 1, 129m, "502", 6, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 61, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 6, 0, 202m, "101", 1, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 62, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 6, 1, 244m, "102", 1, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 63, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 6, 0, 297m, "103", 2, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 64, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 6, 1, 354m, "104", 2, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 65, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 6, 2, 498m, "201", 3, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 66, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 6, 1, 447m, "202", 3, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 67, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 6, 2, 785m, "301", 4, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 68, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 6, 1, 711m, "302", 4, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 69, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 6, 0, 472m, "401", 5, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 70, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 6, 1, 555m, "402", 5, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 71, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 6, 0, 108m, "501", 6, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 72, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 6, 1, 136m, "502", 6, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 73, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 7, 0, 213m, "101", 1, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 74, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 7, 1, 257m, "102", 1, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 75, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 7, 0, 312m, "103", 2, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 76, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 7, 1, 371m, "104", 2, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 77, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 7, 0, 398m, "201", 3, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 78, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 7, 1, 470m, "202", 3, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 79, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 7, 0, 639m, "301", 4, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 80, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 7, 1, 747m, "302", 4, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 81, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 7, 0, 497m, "401", 5, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 82, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 7, 1, 584m, "402", 5, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 83, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 7, 0, 114m, "501", 6, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 84, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 7, 1, 143m, "502", 6, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 85, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 8, 0, 224m, "101", 1, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 86, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 8, 1, 270m, "102", 1, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 87, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 8, 0, 328m, "103", 2, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 88, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 8, 1, 389m, "104", 2, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 89, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 8, 2, 546m, "201", 3, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 90, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 8, 1, 492m, "202", 3, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 91, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 8, 2, 862m, "301", 4, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 92, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 8, 1, 782m, "302", 4, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 93, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 8, 0, 522m, "401", 5, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 94, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 8, 1, 612m, "402", 5, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 95, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 8, 0, 119m, "501", 6, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 96, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 8, 1, 149m, "502", 6, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 97, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 9, 0, 234m, "101", 1, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 98, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 9, 1, 281m, "102", 1, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 99, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 9, 0, 343m, "103", 2, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 100, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 9, 1, 406m, "104", 2, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 101, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 9, 0, 437m, "201", 3, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 102, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 9, 1, 515m, "202", 3, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 103, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 9, 0, 702m, "301", 4, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 104, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 9, 1, 819m, "302", 4, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 105, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 9, 0, 546m, "401", 5, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 106, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 9, 1, 640m, "402", 5, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 107, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 9, 0, 125m, "501", 6, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 108, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 9, 1, 156m, "502", 6, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 109, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 10, 0, 244m, "101", 1, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 110, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 11, 0, 374m, "201", 2, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 111, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 12, 2, 645m, "301", 3, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 112, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 13, 0, 276m, "401", 1, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 113, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 14, 2, 1100m, "501", 4, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 114, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 15, 0, 693m, "601", 5, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) },
                    { 115, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138), 16, 0, 451m, "701", 2, new DateTime(2026, 6, 1, 19, 35, 8, 18, DateTimeKind.Utc).AddTicks(7138) }
                });

            migrationBuilder.InsertData(
                table: "Bookings",
                columns: new[] { "Id", "CheckInDate", "CheckOutDate", "CreatedAt", "GuestCount", "RoomId", "SpecialRequests", "TotalPrice", "UpdatedAt", "UserId" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 4, 22, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), new DateTime(2026, 4, 25, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), new DateTime(2026, 4, 17, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 1, 1, "Тихий номер", 450m, new DateTime(2026, 4, 25, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 11 },
                    { 2, new DateTime(2026, 4, 28, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), new DateTime(2026, 5, 1, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), new DateTime(2026, 4, 26, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 2, 14, "Поздний заезд", 730m, new DateTime(2026, 5, 1, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 12 },
                    { 3, new DateTime(2026, 5, 2, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), new DateTime(2026, 5, 6, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), new DateTime(2026, 4, 29, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 2, 25, "", 980m, new DateTime(2026, 5, 6, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 13 },
                    { 4, new DateTime(2026, 5, 3, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), new DateTime(2026, 5, 6, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), new DateTime(2026, 5, 1, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 2, 38, "Высокий этаж", 620m, new DateTime(2026, 5, 6, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 14 },
                    { 5, new DateTime(2026, 5, 7, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), new DateTime(2026, 5, 11, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), new DateTime(2026, 5, 4, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 3, 49, "Детская кроватка", 1100m, new DateTime(2026, 5, 11, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 15 },
                    { 6, new DateTime(2026, 5, 8, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), new DateTime(2026, 5, 11, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), new DateTime(2026, 5, 5, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 1, 61, "", 520m, new DateTime(2026, 5, 11, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 16 },
                    { 7, new DateTime(2026, 5, 12, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), new DateTime(2026, 5, 16, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), new DateTime(2026, 5, 9, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 2, 73, "Ранний заезд", 860m, new DateTime(2026, 5, 16, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 17 },
                    { 8, new DateTime(2026, 5, 14, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), new DateTime(2026, 5, 17, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), new DateTime(2026, 5, 12, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 2, 84, "", 590m, new DateTime(2026, 5, 17, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 18 },
                    { 9, new DateTime(2026, 5, 15, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), new DateTime(2026, 5, 18, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), new DateTime(2026, 5, 14, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 2, 95, "", 470m, new DateTime(2026, 5, 18, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 19 },
                    { 10, new DateTime(2026, 5, 19, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), new DateTime(2026, 5, 22, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), new DateTime(2026, 5, 17, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 2, 106, "Трансфер из аэропорта", 990m, new DateTime(2026, 5, 22, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 20 },
                    { 11, new DateTime(2026, 5, 23, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), new DateTime(2026, 5, 26, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), new DateTime(2026, 5, 21, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 2, 3, "", 680m, new DateTime(2026, 5, 26, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 21 },
                    { 12, new DateTime(2026, 5, 24, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), new DateTime(2026, 5, 27, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), new DateTime(2026, 5, 22, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 2, 16, "Номер для некурящих", 780m, new DateTime(2026, 5, 27, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 22 },
                    { 13, new DateTime(2026, 6, 3, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), new DateTime(2026, 6, 6, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), new DateTime(2026, 5, 30, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 2, 27, "", 840m, new DateTime(2026, 5, 31, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 23 },
                    { 14, new DateTime(2026, 6, 5, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), new DateTime(2026, 6, 8, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), new DateTime(2026, 5, 31, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 1, 40, "Тихий номер", 560m, new DateTime(2026, 6, 1, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 24 },
                    { 15, new DateTime(2026, 6, 8, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), new DateTime(2026, 6, 11, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), new DateTime(2026, 5, 31, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 2, 52, "", 930m, new DateTime(2026, 6, 1, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 25 },
                    { 16, new DateTime(2026, 6, 9, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), new DateTime(2026, 6, 12, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), new DateTime(2026, 5, 31, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 2, 64, "", 740m, new DateTime(2026, 6, 1, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 26 },
                    { 17, new DateTime(2026, 6, 12, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), new DateTime(2026, 6, 16, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), new DateTime(2026, 6, 1, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 3, 76, "Вид на центр", 1190m, new DateTime(2026, 6, 1, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 27 },
                    { 18, new DateTime(2026, 6, 14, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), new DateTime(2026, 6, 17, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), new DateTime(2026, 6, 1, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 2, 88, "", 850m, new DateTime(2026, 6, 1, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 28 },
                    { 19, new DateTime(2026, 6, 17, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), new DateTime(2026, 6, 20, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), new DateTime(2026, 6, 1, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 2, 100, "", 610m, new DateTime(2026, 6, 1, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 29 },
                    { 20, new DateTime(2026, 6, 19, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), new DateTime(2026, 6, 22, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), new DateTime(2026, 6, 1, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 2, 112, "Поздний выезд", 990m, new DateTime(2026, 6, 1, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 30 }
                });

            migrationBuilder.InsertData(
                table: "RoomAmenities",
                columns: new[] { "Id", "RoomAmenityTypeId", "RoomId" },
                values: new object[,]
                {
                    { 1, 1, 1 },
                    { 2, 2, 1 },
                    { 3, 3, 1 },
                    { 4, 5, 1 },
                    { 5, 6, 1 },
                    { 6, 7, 1 },
                    { 7, 1, 2 },
                    { 8, 2, 2 },
                    { 9, 3, 2 },
                    { 10, 5, 2 },
                    { 11, 6, 2 },
                    { 12, 7, 2 },
                    { 13, 8, 2 },
                    { 14, 1, 3 },
                    { 15, 2, 3 },
                    { 16, 3, 3 },
                    { 17, 4, 3 },
                    { 18, 5, 3 },
                    { 19, 6, 3 },
                    { 20, 7, 3 },
                    { 21, 8, 3 },
                    { 22, 1, 4 },
                    { 23, 2, 4 },
                    { 24, 3, 4 },
                    { 25, 5, 4 },
                    { 26, 7, 4 },
                    { 27, 1, 5 },
                    { 28, 2, 5 },
                    { 29, 3, 5 },
                    { 30, 5, 5 },
                    { 31, 6, 5 },
                    { 32, 7, 5 },
                    { 33, 8, 5 },
                    { 34, 1, 6 },
                    { 35, 2, 6 },
                    { 36, 3, 6 },
                    { 37, 5, 6 },
                    { 38, 6, 6 },
                    { 39, 7, 6 },
                    { 40, 1, 7 },
                    { 41, 3, 7 },
                    { 42, 5, 7 },
                    { 43, 1, 8 },
                    { 44, 2, 8 },
                    { 45, 3, 8 },
                    { 46, 5, 8 },
                    { 47, 1, 9 },
                    { 48, 2, 9 },
                    { 49, 3, 9 },
                    { 50, 5, 9 },
                    { 51, 1, 10 },
                    { 52, 2, 10 },
                    { 53, 3, 10 },
                    { 54, 1, 11 },
                    { 55, 3, 11 },
                    { 56, 1, 12 },
                    { 57, 3, 12 },
                    { 58, 1, 13 },
                    { 59, 3, 13 },
                    { 60, 5, 13 },
                    { 61, 1, 14 },
                    { 62, 3, 14 },
                    { 63, 5, 14 },
                    { 64, 1, 15 },
                    { 65, 2, 15 },
                    { 66, 3, 15 },
                    { 67, 5, 15 },
                    { 68, 6, 15 },
                    { 69, 1, 16 },
                    { 70, 2, 16 },
                    { 71, 3, 16 },
                    { 72, 5, 16 },
                    { 73, 7, 16 },
                    { 74, 1, 17 },
                    { 75, 2, 17 },
                    { 76, 3, 17 },
                    { 77, 5, 17 },
                    { 78, 6, 17 },
                    { 79, 1, 18 },
                    { 80, 2, 18 },
                    { 81, 3, 18 },
                    { 82, 5, 18 },
                    { 83, 6, 18 },
                    { 84, 1, 19 },
                    { 85, 2, 19 },
                    { 86, 3, 19 },
                    { 87, 5, 19 },
                    { 88, 6, 19 },
                    { 89, 1, 20 },
                    { 90, 2, 20 },
                    { 91, 3, 20 },
                    { 92, 5, 20 },
                    { 93, 6, 20 },
                    { 94, 1, 21 },
                    { 95, 2, 21 },
                    { 96, 3, 21 },
                    { 97, 5, 21 },
                    { 98, 1, 22 },
                    { 99, 2, 22 },
                    { 100, 3, 22 },
                    { 101, 5, 22 },
                    { 102, 1, 23 },
                    { 103, 3, 23 },
                    { 104, 1, 24 },
                    { 105, 3, 24 },
                    { 106, 1, 25 },
                    { 107, 3, 25 },
                    { 108, 5, 25 },
                    { 109, 1, 26 },
                    { 110, 3, 26 },
                    { 111, 5, 26 },
                    { 112, 1, 27 },
                    { 113, 2, 27 },
                    { 114, 3, 27 },
                    { 115, 5, 27 },
                    { 116, 1, 28 },
                    { 117, 2, 28 },
                    { 118, 3, 28 },
                    { 119, 5, 28 },
                    { 120, 1, 29 },
                    { 121, 2, 29 },
                    { 122, 3, 29 },
                    { 123, 5, 29 },
                    { 124, 6, 29 },
                    { 125, 1, 30 },
                    { 126, 2, 30 },
                    { 127, 3, 30 },
                    { 128, 5, 30 },
                    { 129, 6, 30 },
                    { 130, 1, 31 },
                    { 131, 2, 31 },
                    { 132, 3, 31 },
                    { 133, 5, 31 },
                    { 134, 6, 31 },
                    { 135, 1, 32 },
                    { 136, 2, 32 },
                    { 137, 3, 32 },
                    { 138, 5, 32 },
                    { 139, 6, 32 },
                    { 140, 1, 33 },
                    { 141, 2, 33 },
                    { 142, 3, 33 },
                    { 143, 5, 33 },
                    { 144, 1, 34 },
                    { 145, 2, 34 },
                    { 146, 3, 34 },
                    { 147, 5, 34 },
                    { 148, 1, 35 },
                    { 149, 3, 35 },
                    { 150, 1, 36 },
                    { 151, 3, 36 },
                    { 152, 1, 37 },
                    { 153, 3, 37 },
                    { 154, 1, 38 },
                    { 155, 3, 38 },
                    { 156, 5, 38 },
                    { 157, 1, 39 },
                    { 158, 2, 39 },
                    { 159, 3, 39 },
                    { 160, 1, 40 },
                    { 161, 2, 40 },
                    { 162, 3, 40 },
                    { 163, 1, 41 },
                    { 164, 2, 41 },
                    { 165, 3, 41 },
                    { 166, 1, 42 },
                    { 167, 2, 42 },
                    { 168, 3, 42 },
                    { 169, 1, 43 },
                    { 170, 2, 43 },
                    { 171, 3, 43 },
                    { 172, 5, 43 },
                    { 173, 1, 44 },
                    { 174, 2, 44 },
                    { 175, 3, 44 },
                    { 176, 5, 44 },
                    { 177, 1, 45 },
                    { 178, 2, 45 },
                    { 179, 3, 45 },
                    { 180, 1, 46 },
                    { 181, 2, 46 },
                    { 182, 3, 46 },
                    { 183, 1, 47 },
                    { 184, 3, 47 },
                    { 185, 1, 48 },
                    { 186, 3, 48 },
                    { 187, 1, 49 },
                    { 188, 3, 49 },
                    { 189, 1, 50 },
                    { 190, 3, 50 },
                    { 191, 5, 50 },
                    { 192, 1, 51 },
                    { 193, 2, 51 },
                    { 194, 3, 51 },
                    { 195, 1, 52 },
                    { 196, 2, 52 },
                    { 197, 3, 52 },
                    { 198, 1, 53 },
                    { 199, 2, 53 },
                    { 200, 3, 53 },
                    { 201, 1, 54 },
                    { 202, 2, 54 },
                    { 203, 3, 54 },
                    { 204, 1, 55 },
                    { 205, 2, 55 },
                    { 206, 3, 55 },
                    { 207, 5, 55 },
                    { 208, 1, 56 },
                    { 209, 2, 56 },
                    { 210, 3, 56 },
                    { 211, 5, 56 },
                    { 212, 1, 57 },
                    { 213, 2, 57 },
                    { 214, 3, 57 },
                    { 215, 1, 58 },
                    { 216, 2, 58 },
                    { 217, 3, 58 },
                    { 218, 1, 59 },
                    { 219, 3, 59 },
                    { 220, 1, 60 },
                    { 221, 3, 60 },
                    { 222, 1, 61 },
                    { 223, 3, 61 },
                    { 224, 1, 62 },
                    { 225, 3, 62 },
                    { 226, 5, 62 },
                    { 227, 1, 63 },
                    { 228, 2, 63 },
                    { 229, 3, 63 },
                    { 230, 1, 64 },
                    { 231, 2, 64 },
                    { 232, 3, 64 },
                    { 233, 1, 65 },
                    { 234, 2, 65 },
                    { 235, 3, 65 },
                    { 236, 1, 66 },
                    { 237, 2, 66 },
                    { 238, 3, 66 },
                    { 239, 1, 67 },
                    { 240, 2, 67 },
                    { 241, 3, 67 },
                    { 242, 5, 67 },
                    { 243, 1, 68 },
                    { 244, 2, 68 },
                    { 245, 3, 68 },
                    { 246, 5, 68 },
                    { 247, 1, 69 },
                    { 248, 2, 69 },
                    { 249, 3, 69 },
                    { 250, 1, 70 },
                    { 251, 2, 70 },
                    { 252, 3, 70 },
                    { 253, 1, 71 },
                    { 254, 3, 71 },
                    { 255, 1, 72 },
                    { 256, 3, 72 },
                    { 257, 1, 73 },
                    { 258, 3, 73 },
                    { 259, 1, 74 },
                    { 260, 3, 74 },
                    { 261, 5, 74 },
                    { 262, 1, 75 },
                    { 263, 2, 75 },
                    { 264, 3, 75 },
                    { 265, 1, 76 },
                    { 266, 2, 76 },
                    { 267, 3, 76 },
                    { 268, 1, 77 },
                    { 269, 2, 77 },
                    { 270, 3, 77 },
                    { 271, 1, 78 },
                    { 272, 2, 78 },
                    { 273, 3, 78 },
                    { 274, 1, 79 },
                    { 275, 2, 79 },
                    { 276, 3, 79 },
                    { 277, 5, 79 },
                    { 278, 1, 80 },
                    { 279, 2, 80 },
                    { 280, 3, 80 },
                    { 281, 5, 80 },
                    { 282, 1, 81 },
                    { 283, 2, 81 },
                    { 284, 3, 81 },
                    { 285, 1, 82 },
                    { 286, 2, 82 },
                    { 287, 3, 82 },
                    { 288, 1, 83 },
                    { 289, 3, 83 },
                    { 290, 1, 84 },
                    { 291, 3, 84 },
                    { 292, 1, 85 },
                    { 293, 3, 85 },
                    { 294, 1, 86 },
                    { 295, 3, 86 },
                    { 296, 5, 86 },
                    { 297, 1, 87 },
                    { 298, 2, 87 },
                    { 299, 3, 87 },
                    { 300, 1, 88 },
                    { 301, 2, 88 },
                    { 302, 3, 88 },
                    { 303, 1, 89 },
                    { 304, 2, 89 },
                    { 305, 3, 89 },
                    { 306, 1, 90 },
                    { 307, 2, 90 },
                    { 308, 3, 90 },
                    { 309, 1, 91 },
                    { 310, 2, 91 },
                    { 311, 3, 91 },
                    { 312, 5, 91 },
                    { 313, 1, 92 },
                    { 314, 2, 92 },
                    { 315, 3, 92 },
                    { 316, 5, 92 },
                    { 317, 1, 93 },
                    { 318, 2, 93 },
                    { 319, 3, 93 },
                    { 320, 1, 94 },
                    { 321, 2, 94 },
                    { 322, 3, 94 },
                    { 323, 1, 95 },
                    { 324, 3, 95 },
                    { 325, 1, 96 },
                    { 326, 3, 96 },
                    { 327, 1, 97 },
                    { 328, 3, 97 },
                    { 329, 1, 98 },
                    { 330, 3, 98 },
                    { 331, 1, 99 },
                    { 332, 2, 99 },
                    { 333, 3, 99 },
                    { 334, 1, 100 },
                    { 335, 2, 100 },
                    { 336, 3, 100 },
                    { 337, 1, 101 },
                    { 338, 2, 101 },
                    { 339, 3, 101 },
                    { 340, 1, 102 },
                    { 341, 2, 102 },
                    { 342, 3, 102 },
                    { 343, 1, 103 },
                    { 344, 2, 103 },
                    { 345, 3, 103 },
                    { 346, 5, 103 },
                    { 347, 1, 104 },
                    { 348, 2, 104 },
                    { 349, 3, 104 },
                    { 350, 5, 104 },
                    { 351, 1, 105 },
                    { 352, 2, 105 },
                    { 353, 3, 105 },
                    { 354, 1, 106 },
                    { 355, 2, 106 },
                    { 356, 3, 106 },
                    { 357, 1, 107 },
                    { 358, 3, 107 },
                    { 359, 1, 108 },
                    { 360, 3, 108 },
                    { 361, 9, 20 },
                    { 362, 10, 20 },
                    { 363, 11, 22 },
                    { 364, 12, 31 },
                    { 365, 13, 55 },
                    { 366, 14, 68 },
                    { 367, 15, 94 }
                });

            migrationBuilder.InsertData(
                table: "BookingStatuses",
                columns: new[] { "Id", "BookingId", "CreatedAt", "Status", "StatusBy" },
                values: new object[,]
                {
                    { 1, 1, new DateTime(2026, 4, 25, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 3, 2 },
                    { 2, 2, new DateTime(2026, 5, 1, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 3, 3 },
                    { 3, 3, new DateTime(2026, 5, 6, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 3, 4 },
                    { 4, 4, new DateTime(2026, 5, 6, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 3, 5 },
                    { 5, 5, new DateTime(2026, 5, 11, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 3, 6 },
                    { 6, 6, new DateTime(2026, 5, 11, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 3, 7 },
                    { 7, 7, new DateTime(2026, 5, 16, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 3, 8 },
                    { 8, 8, new DateTime(2026, 5, 17, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 3, 9 },
                    { 9, 9, new DateTime(2026, 5, 18, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 3, 10 },
                    { 10, 10, new DateTime(2026, 5, 22, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 3, 2 },
                    { 11, 11, new DateTime(2026, 5, 26, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 3, 3 },
                    { 12, 12, new DateTime(2026, 5, 27, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 3, 4 },
                    { 13, 13, new DateTime(2026, 5, 31, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 1, 5 },
                    { 14, 14, new DateTime(2026, 6, 1, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 0, 6 },
                    { 15, 15, new DateTime(2026, 6, 1, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 0, 7 },
                    { 16, 16, new DateTime(2026, 6, 1, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 1, 8 },
                    { 17, 17, new DateTime(2026, 6, 1, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 0, 9 },
                    { 18, 18, new DateTime(2026, 6, 1, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 1, 10 },
                    { 19, 19, new DateTime(2026, 5, 31, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 4, 2 },
                    { 20, 20, new DateTime(2026, 6, 1, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), 0, 3 }
                });

            migrationBuilder.InsertData(
                table: "Reviews",
                columns: new[] { "Id", "BookingId", "Comment", "CreatedAt", "ModerationReason", "Rating", "Status", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, 1, "Отличный сервис, номер чистый и тихий.", new DateTime(2026, 4, 26, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), "", 9m, 1, new DateTime(2026, 4, 26, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852) },
                    { 2, 2, "Удачное расположение и хороший завтрак.", new DateTime(2026, 5, 2, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), "", 8m, 1, new DateTime(2026, 5, 2, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852) },
                    { 3, 3, "В целом хорошо, но слышимость в коридоре высокая.", new DateTime(2026, 5, 7, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), "", 7m, 1, new DateTime(2026, 5, 7, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852) },
                    { 4, 4, "Очень вежливый персонал, обязательно вернусь.", new DateTime(2026, 5, 8, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), "", 10m, 1, new DateTime(2026, 5, 8, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852) },
                    { 5, 5, "Просторный номер, удобные кровати, детям понравилось.", new DateTime(2026, 5, 12, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), "", 9m, 1, new DateTime(2026, 5, 12, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852) },
                    { 6, 6, "Хорошее соотношение цена-качество.", new DateTime(2026, 5, 12, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), "", 8m, 1, new DateTime(2026, 5, 12, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852) },
                    { 7, 7, "Нормально, но на ресепшене было долгое ожидание.", new DateTime(2026, 5, 17, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), "ожидает подтверждения", 6m, 0, new DateTime(2026, 5, 17, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852) },
                    { 8, 8, "Уютно, чисто, удобная локация.", new DateTime(2026, 5, 18, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), "", 9m, 1, new DateTime(2026, 5, 18, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852) },
                    { 9, 9, "Хороший бюджетный вариант для короткой поездки.", new DateTime(2026, 5, 19, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), "", 7m, 1, new DateTime(2026, 5, 19, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852) },
                    { 10, 10, "Понравился номер и завтрак, но слабый Wi-Fi вечером.", new DateTime(2026, 5, 23, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852), "", 8m, 1, new DateTime(2026, 5, 23, 19, 35, 8, 464, DateTimeKind.Utc).AddTicks(852) }
                });

            migrationBuilder.CreateIndex(
                name: "IX_BlockHistory_ChangedByUserId",
                table: "BlockHistory",
                column: "ChangedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_RoomId",
                table: "Bookings",
                column: "RoomId");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_UserId",
                table: "Bookings",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_BookingStatuses_BookingId",
                table: "BookingStatuses",
                column: "BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_BookingStatuses_StatusBy",
                table: "BookingStatuses",
                column: "StatusBy");

            migrationBuilder.CreateIndex(
                name: "IX_Favorites_HotelId",
                table: "Favorites",
                column: "HotelId");

            migrationBuilder.CreateIndex(
                name: "IX_Favorites_UserId_HotelId",
                table: "Favorites",
                columns: new[] { "UserId", "HotelId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_HotelAmenities_HotelAmenityTypeId",
                table: "HotelAmenities",
                column: "HotelAmenityTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_HotelAmenities_HotelId",
                table: "HotelAmenities",
                column: "HotelId");

            migrationBuilder.CreateIndex(
                name: "IX_HotelImages_HotelId",
                table: "HotelImages",
                column: "HotelId");

            migrationBuilder.CreateIndex(
                name: "IX_Hotels_CityId",
                table: "Hotels",
                column: "CityId");

            migrationBuilder.CreateIndex(
                name: "IX_Managers_HotelId",
                table: "Managers",
                column: "HotelId");

            migrationBuilder.CreateIndex(
                name: "IX_ReviewComments_ReviewId",
                table: "ReviewComments",
                column: "ReviewId");

            migrationBuilder.CreateIndex(
                name: "IX_ReviewComments_UserId",
                table: "ReviewComments",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ReviewComplaints_ReviewId",
                table: "ReviewComplaints",
                column: "ReviewId");

            migrationBuilder.CreateIndex(
                name: "IX_ReviewComplaints_UserId",
                table: "ReviewComplaints",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_BookingId",
                table: "Reviews",
                column: "BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_ReviewTags_ReviewId",
                table: "ReviewTags",
                column: "ReviewId");

            migrationBuilder.CreateIndex(
                name: "IX_ReviewTags_TagId",
                table: "ReviewTags",
                column: "TagId");

            migrationBuilder.CreateIndex(
                name: "IX_RoomAmenities_RoomAmenityTypeId",
                table: "RoomAmenities",
                column: "RoomAmenityTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_RoomAmenities_RoomId",
                table: "RoomAmenities",
                column: "RoomId");

            migrationBuilder.CreateIndex(
                name: "IX_Rooms_HotelId",
                table: "Rooms",
                column: "HotelId");

            migrationBuilder.CreateIndex(
                name: "IX_Rooms_RoomTypeId",
                table: "Rooms",
                column: "RoomTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_RoomTypeImages_RoomTypeId",
                table: "RoomTypeImages",
                column: "RoomTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Tags_Name",
                table: "Tags",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_RoleId",
                table: "Users",
                column: "RoleId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BlockHistory");

            migrationBuilder.DropTable(
                name: "BookingStatuses");

            migrationBuilder.DropTable(
                name: "Favorites");

            migrationBuilder.DropTable(
                name: "HotelAmenities");

            migrationBuilder.DropTable(
                name: "HotelImages");

            migrationBuilder.DropTable(
                name: "Managers");

            migrationBuilder.DropTable(
                name: "ReviewComments");

            migrationBuilder.DropTable(
                name: "ReviewComplaints");

            migrationBuilder.DropTable(
                name: "ReviewTags");

            migrationBuilder.DropTable(
                name: "RoomAmenities");

            migrationBuilder.DropTable(
                name: "RoomTypeImages");

            migrationBuilder.DropTable(
                name: "HotelAmenityTypes");

            migrationBuilder.DropTable(
                name: "Reviews");

            migrationBuilder.DropTable(
                name: "Tags");

            migrationBuilder.DropTable(
                name: "RoomAmenityTypes");

            migrationBuilder.DropTable(
                name: "Bookings");

            migrationBuilder.DropTable(
                name: "Rooms");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "Hotels");

            migrationBuilder.DropTable(
                name: "RoomTypes");

            migrationBuilder.DropTable(
                name: "Roles");

            migrationBuilder.DropTable(
                name: "Cities");
        }
    }
}
