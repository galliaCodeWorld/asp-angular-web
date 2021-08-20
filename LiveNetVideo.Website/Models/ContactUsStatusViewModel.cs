using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace LiveNetVideo.Website.Models
{
	public class ContactUsStatusViewModel
	{
		public ContactUsStatusViewModel()
		{
			Status = "Unknown";
		}

		public long ContactUsId { get; set; } // ContactUsId (Primary key)
		public System.DateTime Created { get; set; } // Created
		public string Domain { get; set; } // Domain (length: 100)
		public string Name { get; set; } // Name (length: 200)
		public string Email { get; set; } // Email (length: 300)
		public string Phone { get; set; } // Phone (length: 15)
		public string Subject { get; set; } // Subject (length: 200)
		public string Message { get; set; } // Messsage (length: 4000)
		public bool IsResolved { get; set; } // IsResolved
		public string Notes { get; set; } // Notes (length: 1000)

		public string Status { get; set; }
	}
}