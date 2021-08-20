using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Application.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http.Features;
using LiveNetVideo.Website.Models;
using Microsoft.AspNetCore.SpaServices.Prerendering;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.NodeServices;
using Microsoft.Extensions.DependencyInjection;
using System.Net.Http;
using Microsoft.Extensions.Options;
using System.Net;
using WebApi.DTO;
using Newtonsoft.Json;

namespace LiveNetVideo.Website.Controllers
{
	public class HomeController : Controller
	{
		private IService _service;

		private readonly IOptions<AppSettings> _appSettings;

		//public HomeController(IService service)
		//{
		//    _service = service;
		//}

		private readonly IHostingEnvironment _hostingEnvironment;

		public HomeController(IHostingEnvironment hostingEnvironment, IService service, IOptions<AppSettings> appSettings)
		{
			_hostingEnvironment = hostingEnvironment;
			_service = service;

			_appSettings = appSettings;
		}

		[HttpGet]
		public IActionResult Index(int id)
		{
			var model = new WebPhoneViewModel() { PbxLineId = id };
			return View("~/Views/Home/WebPhone.cshtml", model);
		}

		public async Task<IActionResult> ContactUsStatus(long id)
		{
			ViewBag.Url = HttpContext.Request.Host;
			var dto = await _service.GetContactUsById(id);
			var model = new ContactUsStatusViewModel();
			if (dto != null)
			{
				model.ContactUsId = dto.ContactUsId;
				model.Created = dto.Created;
				model.Domain = dto.Domain;
				model.Email = dto.Email;
				model.IsResolved = dto.IsResolved;
				model.Message = dto.Message;
				model.Name = dto.Name;
				model.Notes = dto.Notes;

				model.Subject = dto.Subject;
				model.Phone = dto.Phone;
				model.Status = dto.IsResolved ? "Resolved" : "Pending Review";
			}
			return View("~/Views/Home/ContactUsStatus.cshtml", model);
		}

		private SimplifiedRequest AbstractHttpContextRequestInfo(HttpRequest request)
		{
			return new SimplifiedRequest
			{
				cookies = request.Cookies,
				headers = request.Headers,
				host = request.Host
			};
		}

		//public IActionResult Index()
		//{
		//    return View();
		//}

		//public IActionResult About()
		//{
		//    ViewData["Message"] = "Your application description page.";

		//    return View();
		//}

		//public IActionResult Contact()
		//{
		//    ViewData["Message"] = "Your contact page.";

		//    return View();
		//}

		//public IActionResult App()
		//{
		//    return View();
		//}

		//public IActionResult Error()
		//{
		//    return View();
		//}
	}
}