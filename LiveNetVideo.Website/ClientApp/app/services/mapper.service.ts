import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { ConfigService, JsHelperService, LocalStorageService } from './index';
import { NetcastGenreDto, NetcastDto } from '../models';
import { NetcastGenreViewModel } from '../models/view-models/netcastGenre.viewmodel';
import { NetcastViewModel } from '../models/view-models/netcast.viewmodel';
@Injectable()
export class MapperService {
	constructor(
		private configService: ConfigService,
		private jsHelperService: JsHelperService,
		private localStorageService: LocalStorageService,
	) { }

	// TODO: create generic method that will automatically map same properties
	// and take additional mapping instructions for differing properties or custom mappings
	// similar to automapper

	mapToNetcastGenreViewModel(dto: NetcastGenreDto): NetcastGenreViewModel {
		try {
			let vgvm: NetcastGenreViewModel = new NetcastGenreViewModel();
			vgvm.name = dto.value;
			vgvm.description = dto.description;
			vgvm.netcastGenreId = dto.netcastGenreId;
			vgvm.imageSrc = this.configService.netcastGenreImageBaseUrl + dto.netcastGenreId.toString() + "/" + dto.imageFilename + "?" + Date.now().toString();
			return vgvm;
		}
		catch (e) {
			throw (e);
		}
	}

	mapToNetcastViewModel(dto: NetcastDto): NetcastViewModel {
		try {
			let nvm: NetcastViewModel = new NetcastViewModel();
			nvm.title = dto.title;
			nvm.description = dto.description;
			let shortDescription: string = dto.description.substring(0, 300);
			nvm.shortDescription = (shortDescription.length > 300) ? shortDescription + "..." : shortDescription;
			nvm.startDateTime = moment(dto.startDateTime).format('ddd @ hh:mm A, MM/DD/YY');
			nvm.endDateTime = moment(dto.endDateTime).format('ddd @ hh:mm A, MM/DD/YY');
			nvm.isPrerecorded = dto.isPrerecorded;
			nvm.localFileLocation = dto.localFileLocation;
			nvm.netcastId = dto.netcastId;
			nvm.isPrivate = dto.isPrivate;
			nvm.tags = dto.tags.split(',');
			nvm.netcasteeLink = this.configService.netcasteeBaseUrl + dto.netcastId.toString();
			if (!this.jsHelperService.isEmpty(nvm.tags)) {
				nvm.tags.forEach((t) => {
					// remote white spaces
					t = t.trim();
				});
			}
			nvm.imageSrc = this.jsHelperService.isEmpty(dto.imageFilename)
				? this.configService.defaultAvatar
				: this.configService.netcastImageUrl + dto.netcastId.toString() + "/" + dto.imageFilename + "?" + Date.now().toString();
			if (!this.jsHelperService.isEmpty(dto.netcastGenre)) {
				nvm.genre = this.mapToNetcastGenreViewModel(dto.netcastGenre);
			}

			return nvm;
		}
		catch (e) {
			throw (e);
		}
	}
}