using System;
using System.Collections.Generic;
using System.Text;
using WebApi.DTO;

namespace Application.Data
{
	// This static class is used to decide which data access technology to use
	public class DaoFactories
	{
		// NOTE: we are not currently using this class, instead DI is injecting IDaoFactory directly
		//       into Service and its using WebApi factory
		public static IDaoFactory GetFactory(IWebApiClient webApiClient, string dataProvider)
		{
			// return the requested DaoFactory

			switch (dataProvider.ToLower())
			{
				//case "ado.net": return new AdoNet.DaoFactory();
				//case "linq2sql": return new Linq2Sql.DaoFactory();
				case "WebApi": return new WebApi.DaoFactory(webApiClient);

				default: return new WebApi.DaoFactory(webApiClient);
			}
		}
	}
}