using System;
using System.Collections.Generic;
using System.Text;
using WebApi.DTO;

namespace Application.Data.WebApi
{
	public class DaoFactory : IDaoFactory
	{
		private IWebApiClient _webApiClient;

		public DaoFactory(IWebApiClient webApiClient)
		{
			_webApiClient = webApiClient;
		}

		public IMemberDao MemberDao { get { return new MemberDao(_webApiClient); } }
		public ICompanyProfileDao CompanyProfileDao { get { return new CompanyProfileDao(_webApiClient); } }
		public ICompanyEmployeeDao CompanyEmployeeDao { get { return new CompanyEmployeeDao(_webApiClient); } }
		public ICompanyEmployeeInviteDao CompanyEmployeeInviteDao { get { return new CompanyEmployeeInviteDao(_webApiClient); } }
		public IContactUsDao ContactUsDao { get { return new ContactUsDao(_webApiClient); } }
	}
}