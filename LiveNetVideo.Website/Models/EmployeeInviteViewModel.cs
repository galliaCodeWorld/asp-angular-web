using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using WebApi.DTO;

namespace LiveNetVideo.Website.Models
{
	public class EmployeeInviteViewModel
	{
		public EmployeeInviteViewModel()
		{
			AcceptLink = "";
			DenyLink = "";
		}

		public string AcceptLink { get; set; }
		public string DenyLink { get; set; }

		public MemberDto Member { get; set; }
		public CompanyEmployeeInviteDto EmployeeInvite { get; set; }
		public EmployeeInviteRegisterViewModel Registration { get; set; }
	}
}