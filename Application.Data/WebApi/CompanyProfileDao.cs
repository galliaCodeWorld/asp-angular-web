using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using WebApi.DTO;

namespace Application.Data.WebApi
{
	public class CompanyProfileDao : ICompanyProfileDao
	{
		private IWebApiClient _webApiClient;

		public CompanyProfileDao(IWebApiClient webApiClient)
		{
			_webApiClient = webApiClient;
		}

		public async Task<CompanyProfileDto> GetCompanyProfileById(int id)
		{
			throw new NotImplementedException();
		}
	}
}