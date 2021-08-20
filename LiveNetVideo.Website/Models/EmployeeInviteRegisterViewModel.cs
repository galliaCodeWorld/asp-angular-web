using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace LiveNetVideo.Website.Models
{
	public class EmployeeInviteRegisterViewModel
	{
		private const string _regEmail = @"\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*";

		[Required]
		public long CompanyEmployeeInviteId { get; set; }

		[Required(ErrorMessage = "The {0} field is required.")]
		[StringLength(50, ErrorMessage = "The {0} field must have {2} - {1} characters.", MinimumLength = 2)]
		[Display(Name = "First Name")]
		[RegularExpression(@"^[a-zA-Z''-'\s]{1,40}$", ErrorMessage = "Numbers and special characters are not allowed in the {0} field.")]
		[DataType(DataType.Text)]
		public string FirstName { get; set; }

		[Required(ErrorMessage = "The {0} field is required.")]
		[StringLength(50, ErrorMessage = "The {0} field must have {2} - {1} characters.", MinimumLength = 2)]
		[Display(Name = "Last Name")]
		[RegularExpression(@"^[a-zA-Z''-'\s]{1,40}$", ErrorMessage = "Numbers and special characters are not allowed in the {0} field.")]
		[DataType(DataType.Text)]
		public string LastName { get; set; }

		[Required(ErrorMessage = "The {0} field is required.")]
		[StringLength(300, ErrorMessage = "The {0} field must have {2} - {1} characters.", MinimumLength = 7)]
		[RegularExpression(_regEmail, ErrorMessage = "Please enter a valid email address for the {0} field.")]
		[DataType(DataType.EmailAddress)]
		[Display(Name = "Email")]
		public string Email { get; set; }

		[StringLength(300, ErrorMessage = "The {0} field can not container more than {1} characters.")]
		[RegularExpression(@"^[a-zA-Z''-'\s]{1,40}$", ErrorMessage = "Numbers and special characters are not allowed in the {0} field.")]
		[DataType(DataType.EmailAddress)]
		[Display(Name = "Alternative Email")]
		public string AltEmail { get; set; }

		[Required(ErrorMessage = "The {0} field is required.")]
		[StringLength(30, ErrorMessage = "The {0} field must have {2} - {1} characters.", MinimumLength = 7)]
		[DataType(DataType.Password)]
		[Display(Name = "Password")]
		public string Password { get; set; }

		[StringLength(300, ErrorMessage = "The {0} field must have {2} - {1} characters.", MinimumLength = 7)]
		public string Username { get; set; }

		public string AvatarDataUri { get; set; }

		public bool? IsVerified { get; set; }

		public bool? IsSuspended { get; set; }
	}
}