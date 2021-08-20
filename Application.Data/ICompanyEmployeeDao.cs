using Application.Data.WebApi;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using WebApi.DTO;

namespace Application.Data
{
	public interface ICompanyEmployeeDao
	{
		Task<CompanyEmployeeDto> Create(CompanyEmployeeDto model, List<string> outErrors);

		Task<CompanyEmployeeDto> GetCompanyEmployeeByEmail(string email, int companyProfileId);
	}
}