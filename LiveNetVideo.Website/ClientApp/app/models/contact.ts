// NOTE: do not use this type anymore, use PhoneContactType from phoneContact.type.ts
export class Contact {
	public ContactID: number;
	public Name: string;
	public Email: string;
	public Phone: number;
	public AvatarDataUri: string;
	public Notes: string;

	constructor(id: number, name: string, em: string, ph: number, dp: string, notes: string) {
		this.ContactID = id;
		this.Name = name;
		this.Email = em;
		this.Phone = ph;
		this.AvatarDataUri = dp;
		this.Notes = notes;
	}
}
