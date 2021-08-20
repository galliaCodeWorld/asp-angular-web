import { Component, EventEmitter, Output, Input } from '@angular/core';

@Component({
	selector: 'upload-photo-menu',
	templateUrl: './upload-photo-menu.component.html',
	styleUrls: ['./upload-photo-menu.component.scss']
})
export class UploadPhotoMenuComponent {
	dropdownShown: boolean = false;
	capturePhotoModalShown: boolean = false;

	@Output() pictureChanged: EventEmitter<any> = new EventEmitter;
	@Input() iconOnly = false;
	@Input() isBlob = false;

	//hideDropdown() {
	//	this.dropdownShown = false;
	//}

	hideModal() {
		this.capturePhotoModalShown = false;
	}

	takePhoto() {
		this.capturePhotoModalShown = true;
		//this.hideDropdown();
	}

	photoSelected(event: any) {
		let input: HTMLInputElement = event.target;
		if (input.files && input.files[0]) {
			var reader = new FileReader();
			let file = input.files[0]
			reader.readAsDataURL(file);
			reader.onload = (e: any) => {
				this.updatePhoto(e.target.result)
			}
		}
	}

	updatePhoto(base64: any) {
		let blob: any = this.dataURItoBlob(base64)
		this.pictureChanged.emit({
			base64,
			blob
		})
		this.hideModal();
		//this.hideDropdown();
	}

	dataURItoBlob(dataURI) {
		// convert base64 to raw binary data held in a string
		// doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
		var byteString = atob(dataURI.split(',')[1]);
		// separate out the mime component
		var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

		// write the bytes of the string to an ArrayBuffer
		var ab = new ArrayBuffer(byteString.length);
		var ia = new Uint8Array(ab);
		for (var i = 0; i < byteString.length; i++) {
			ia[i] = byteString.charCodeAt(i);
		}

		// write the ArrayBuffer to a blob, and you're done
		var bb = new Blob([ab], { type: `image/png` });
		return bb;
	}
}