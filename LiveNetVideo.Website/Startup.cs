using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.SpaServices.Webpack;
using Microsoft.AspNetCore.SpaServices.Extensions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Hosting;

using LiveNetVideo.Website.Data;
using LiveNetVideo.Website.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using LiveNetVideo.Website.Services;
using PaulMiami.AspNetCore.Mvc.Recaptcha;
using Application.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Http;
using System.IO;

using Microsoft.Extensions.FileProviders;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Rewrite;
using WebApi.DTO;
using Application.Data;
using Application.Data.WebApi;


namespace BzCrm
{
	public class Startup
	{
		public Startup(IConfiguration configuration)
		{
			Configuration = configuration;
		}

		public IConfiguration Configuration { get; }

		[System.Obsolete("Use Microsoft.AspNetCore.SpaServices.Extensions")]
		// This method gets called by the runtime. Use this method to add services to the container.
		public void ConfigureServices(IServiceCollection services)
		{
			var appSettings = Configuration.GetSection("AppSettings");
			services.Configure<AppSettings>(appSettings);
			var dataProvider = appSettings.GetSection("DataProvider").Value;

			// Add framework services.
			services.AddDbContext<ApplicationDbContext>(options =>
				options.UseSqlServer(Configuration.GetConnectionString("IdentityConnection")));

			//services.AddIdentity<ApplicationUser, ApplicationRole>()
			//	.AddEntityFrameworkStores<ApplicationDbContext, int>()
			//	.AddDefaultTokenProviders();
			services.AddIdentity<ApplicationUser, ApplicationRole>()
			.AddEntityFrameworkStores<ApplicationDbContext>()
			.AddDefaultTokenProviders();

			services.Configure<MvcOptions>(options =>
			{
				options.Filters.Add(new RequireHttpsAttribute());
			});

			services.AddMvc(option => option.EnableEndpointRouting = false).AddNewtonsoftJson();

			//NOTE: New Version: added
			services.AddNodeServices();

			// Add application services.
			services.AddTransient<IEmailSender, AuthMessageSender>();
			services.AddTransient<ISmsSender, AuthMessageSender>();

			services.AddScoped<IPasswordHasher<ApplicationUser>, IdentityPasswordHasher>();
			services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();
			services.AddTransient<ILocalStorage, LocalStorage>();
			var webApiConfig = new WebApiConfig()
			{
				ApiBaseUrl = appSettings.GetSection("JwtAuthBase").Value,
				ClientSecret = appSettings.GetSection("JwtClientSecret").Value,
				GuestTokenEndPoint = appSettings.GetSection("JwtTokenEndPoints").Value,
				MemberTokenEndPoint = appSettings.GetSection("JwtTokenEndPoints").Value,
				RefreshTokenEndPoint = appSettings.GetSection("JwtTokenEndPoints").Value
			};
			services.AddSingleton(webApiConfig);
			services.AddTransient<IWebApiClient, WebApiClient>();
			services.AddSingleton<IService, Service>();
			services.AddTransient<IDaoFactory, DaoFactory>();
			services.AddRecaptcha(new RecaptchaOptions
			{
				SiteKey = appSettings.GetSection("RecaptchaPublicKey").Value,
				SecretKey = appSettings.GetSection("RecaptchaPrivateKey").Value
			});
			//services.AddTransient<IWebApiClient, WebApiClient>();
			services.AddDatabaseDeveloperPageExceptionFilter();
		}

		// This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
		public void Configure(IApplicationBuilder app, IWebHostEnvironment env, ILoggerFactory loggerFactory)
		{

			if (env.IsDevelopment())
			{
				app.UseDeveloperExceptionPage();
				// NOTE: New Version: commented
				//app.UseWebpackDevMiddleware(new WebpackDevMiddlewareOptions
				//{
				//	HotModuleReplacement = true
				//});
				app.UseMigrationsEndPoint();
				app.UseBrowserLink();
			}
			else
			{
				app.UseExceptionHandler("/Home/Error");
			}
			app.UseDefaultFiles();
			app.UseStaticFiles();

			//app.UseIdentity();
			app.UseAuthentication();

			var options = new RewriteOptions()
			.AddRedirectToHttps();

			app.UseRewriter(options);

			app.UseMvc(routes =>
			{
				routes.MapRoute(
					name: "default",
					template: "{controller=Home}/{action=Index}/{id?}");

				routes.MapSpaFallbackRoute(
					name: "spa-fallback",
					defaults: new { controller = "Home", action = "Index" });
			});

			////handle client side routes
			//app.Run(async (context) =>
			//{
			//	context.Response.ContentType = "text/html";
			//	await context.Response.SendFileAsync(Path.Combine(env.WebRootPath, "index.html"));
			//});
		}
	}
}