using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using WebApi.DTO;

namespace Application.Data
{
	public interface ICompanyProfileDao
	{
		Task<CompanyProfileDto> GetCompanyProfileById(int id);
	}
}