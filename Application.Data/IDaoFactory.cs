using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Data
{
	public interface IDaoFactory
	{
		IMemberDao MemberDao { get; }
		ICompanyProfileDao CompanyProfileDao { get; }
		ICompanyEmployeeInviteDao CompanyEmployeeInviteDao { get; }
		ICompanyEmployeeDao CompanyEmployeeDao { get; }
		IContactUsDao ContactUsDao { get; }
	}
}