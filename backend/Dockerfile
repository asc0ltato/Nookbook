FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
WORKDIR /src

COPY ["NookBook.API.csproj", "./"]
RUN dotnet restore "NookBook.API.csproj"

COPY . .
RUN dotnet build "NookBook.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "NookBook.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS final
WORKDIR /app

RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*

COPY --from=publish /app/publish .

EXPOSE 5223

ENTRYPOINT ["dotnet", "NookBook.API.dll"]