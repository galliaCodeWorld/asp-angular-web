using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using WebApi.DTO;

namespace LiveNetVideo.Website.Services
{
	public class LocalStorage : ILocalStorage
	{
		private string _guestCookie { get; } = "GuestJwtToken";
		private string _memberCookie { get; } = "MemberJwtToken";

		private IHttpContextAccessor _httpContextAccessor;
		private HttpContext _httpContext { get { return _httpContextAccessor.HttpContext; } }

		public LocalStorage(IHttpContextAccessor httpContextAccessor)
		{
			_httpContextAccessor = httpContextAccessor;
		}

		public bool DeleteGuestToken()
		{
			_httpContext.Response.Cookies.Delete(_guestCookie);
			return true;
		}

		public bool DeleteMemberToken()
		{
			_httpContext.Response.Cookies.Delete(_memberCookie);
			return true;
		}

		public string RetrieveGuestToken()
		{
			return _httpContext.Request.Cookies[_guestCookie];
		}

		public string RetrieveMemberToken()
		{
			return _httpContext.Request.Cookies[_memberCookie];
		}

		public bool StoreGuestToken(string jwtToken)
		{
			CookieOptions option = new CookieOptions
			{
				Expires = DateTime.Now.AddMinutes(7200)
			};

			_httpContext.Response.Cookies.Append(_guestCookie, jwtToken, option);

			return true;
		}

		public bool StoreMemberToken(string jwtToken)
		{
			CookieOptions option = new CookieOptions
			{
				Expires = DateTime.Now.AddMinutes(7200)
			};

			_httpContext.Response.Cookies.Append(_memberCookie, jwtToken, option);

			return true;
		}
	}
}