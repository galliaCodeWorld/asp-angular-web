using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using WebApi.DTO;

namespace Application.Data
{
	public interface IMemberDao
	{
		Task<MemberDto> CreateMember(RegisterDto model, List<string> outErrors);

		Task<MemberDto> GetMemberByEmail(string email);

		Task<MemberDto> GetMemberById(int id);
	}
}