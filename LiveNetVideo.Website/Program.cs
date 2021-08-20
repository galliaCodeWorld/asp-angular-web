using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;

namespace BzCrm
{
	public class Program
	{
		//public static void Main(string[] args)
		//{
		//    var host = new WebHostBuilder()
		//        .UseKestrel()
		//        .UseContentRoot(Directory.GetCurrentDirectory())
		//        .UseIISIntegration()
		//        .UseStartup<Startup>()
		//        .Build();

		//    host.Run();
		//}

		public static void Main(string[] args)
		{
			BuildWebHost(args).Run();
		}

		public static IWebHost BuildWebHost(string[] args) =>
			WebHost.CreateDefaultBuilder(args)
				.UseStartup<Startup>()
				.Build();

		//public static IWebHost BuildWebHost(string[] args) =>
		//	WebHost.CreateDefaultBuilder(args)
		//		.UseStartup<Startup>()
		//		.ConfigureAppConfiguration((hostContext, config) =>
		//		{
		//			// delete all default configuration providers
		//			config.Sources.Clear();
		//			//config.SetBasePath(env.ContentRootPath);
		//			config.AddJsonFile("appsettings.json", optional: true, reloadOnChange: true);
		//			config.AddJsonFile("appsettings.Development.json", optional: true);
		//			config.AddEnvironmentVariables();
		//		})
		//		.Build();
	}
}