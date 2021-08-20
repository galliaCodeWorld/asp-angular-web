using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace LiveNetVideo.Website.Models
{
	public class AppSettings
	{
		public string DataProvider { get; set; }
		public string RecaptchaPublicKey { get; set; }
		public string RecaptchaPrivateKey { get; set; }
		public string WebApiBase { get; set; }
		public string JwtAuthBase { get; set; }
		public string JwtTokenEndPoints { get; set; }
		public string JwtClientSecret { get; set; }
		public string BaseUrl { get; set; }
	}
}