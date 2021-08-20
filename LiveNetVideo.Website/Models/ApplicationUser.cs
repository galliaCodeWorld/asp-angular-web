using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;

namespace LiveNetVideo.Website.Models
{
	// Add profile data for application users by adding properties to the ApplicationUser class
	public class ApplicationUser : IdentityUser<int>
	{
		public ApplicationUser()
		{
			IsSuspended = false;
			SmsCarrierId = null;
			// set EmailConfirmed false if we require email verification
			EmailConfirmed = true;
		}

		public string FirstName { get; set; }
		public string LastName { get; set; }
		public string AvatarDataUri { get; set; }
		public bool IsSuspended { get; set; }
		public string AccessToken { get; set; }
		public string AltEmail { get; set; }
		public string CellPhone { get; set; }
		public string Fax { get; set; }
		public string MailingAddress { get; set; }
		public int? SmsCarrierId { get; set; }
		public string AvatarFilename { get; set; }
	}
}