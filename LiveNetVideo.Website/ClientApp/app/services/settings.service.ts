import { Injectable } from '@angular/core';

import {
	LocalStorageService,
	JsHelperService,
	ConfigService
} from './index';

import {
	SettingsType
} from '../models/index';

@Injectable()
export class SettingsService {
	constructor(
		public localStorageService: LocalStorageService,
		public jsHelperService: JsHelperService,
		public configService: ConfigService
	) {
		//// get settings from localStorage and set properties
		//let key = this.configService.keySettings;
		//let settings: SettingsType = this.localStorageService.getPermanentItem<SettingsType>(key);
		//if (this.jsHelperService.isEmpty(settings) === false) {
		//	if (this.jsHelperService.isEmpty(settings.activeAudioDeviceId) === false) {
		//		this.activeAudioDeviceId = settings.activeAudioDeviceId;
		//	}

		//	if (this.jsHelperService.isEmpty(settings.activeVideoDeviceId) === false) {
		//		this.activeVideoDeviceId = settings.activeVideoDeviceId;
		//	}
		//}
	}

	//_activeVideoDeviceId: string;
	get activeVideoDeviceId(): string {
		//return this._activeVideoDeviceId;
		return this.localStorageService.getPermanentItem<string>(this.configService.keyCameraId);
	}
	set activeVideoDeviceId(value: string) {
		this.localStorageService.setPermanentItem(this.configService.keyCameraId, value);
	}

	//_activeAudioDeviceId: string;
	get activeAudioDeviceId(): string {
		return this.localStorageService.getPermanentItem<string>(this.configService.keyMicrophoneId);
	}
	set activeAudioDeviceId(value: string) {
		this.localStorageService.setPermanentItem(this.configService.keyMicrophoneId, value);
	}
}