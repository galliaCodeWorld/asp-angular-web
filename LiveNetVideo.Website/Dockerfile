#Depending on the operating system of the host machines(s) that will build or run the containers, the image specified in the FROM statement may need to be changed.
#For more information, please see https://aka.ms/containercompat

FROM microsoft/aspnetcore:2.0-nanoserver-1803 AS base
WORKDIR /app
EXPOSE 80

FROM microsoft/aspnetcore-build:2.0-nanoserver-1803 AS build
WORKDIR /src
COPY ["LiveNetVideo.Website/LiveNetVideo.Website.csproj", "LiveNetVideo.Website/"]
COPY ["Application.NetCryptor/Application.NetCryptor.csproj", "Application.NetCryptor/"]
COPY ["Application.Services/Application.Services.csproj", "Application.Services/"]
COPY ["Application.Data/Application.Data.csproj", "Application.Data/"]
RUN dotnet restore "LiveNetVideo.Website/LiveNetVideo.Website.csproj"
COPY . .
WORKDIR "/src/LiveNetVideo.Website"
RUN dotnet build "LiveNetVideo.Website.csproj" -c Release -o /app

FROM build AS publish
RUN dotnet publish "LiveNetVideo.Website.csproj" -c Release -o /app

FROM base AS final
WORKDIR /app
COPY --from=publish /app .
ENTRYPOINT ["dotnet", "LiveNetVideo.Website.dll"]