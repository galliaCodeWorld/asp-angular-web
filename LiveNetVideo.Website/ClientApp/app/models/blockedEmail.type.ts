export class BlockedEmailType {
	constructor() {
		this.blockedEmailId = 0;
		this.blockDate = null;
		this.blockerId = 0;
		this.blockerEmail = "";
		this.emailBlocked = "";
		this.isDeleted = false;
		this.deleteDate = null;
	}
	blockedEmailId: number;
	blockDate: Date;
	blockerId: number;
	blockerEmail: string;
	emailBlocked: string;
	isDeleted: boolean;
	deleteDate: Date;
}