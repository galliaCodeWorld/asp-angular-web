import { NgModule } from '@angular/core';
import { ServerModule } from '@angular/platform-server';
import { sharedConfig } from './app.module.shared';
import { TransferState } from "../modules/transer-state/transfer-state";

@NgModule({
	bootstrap: sharedConfig.bootstrap,
	declarations: sharedConfig.declarations,
	imports: [
		ServerModule,
		...sharedConfig.imports
	]
})
export class AppServerModule {
	//NOTE: New Version: added

	constructor(public transferState: TransferState) { }

	// Gotcha (needs to be an arrow function)
	ngOnBootstrap = () => {
		this.transferState.inject();
	}
}