import { Component, EventEmitter, Output, ElementRef, ViewChild, OnInit } from '@angular/core';
import {
    CapturePhotoService
} from '../../services/index'

@Component({
    selector: 'capture-photo-modal',
    styleUrls: ['./capture-photo-modal.component.scss'],
    templateUrl: './capture-photo-modal.component.html'
})
export class CapturePhotoModalComponent implements OnInit {
    @Output() close: EventEmitter<any>;
    @Output() photoSelected: EventEmitter<any>;

    @ViewChild('videoElement') video: ElementRef;
    @ViewChild('photoElement') photo: ElementRef;

    pictureTaken: boolean = false;
    canPlay: boolean = false;
    currentImage: string = '';
    constructor(private capturePhotoService: CapturePhotoService) {
        this.close = new EventEmitter;
        this.photoSelected = new EventEmitter;
    }

    ngOnInit() {
        this.capturePhotoService.init(this.video.nativeElement, this.photo.nativeElement)
        this.startCamera();
    }

    startCamera() {
        this.canPlay = false;
        this.pictureTaken = false;
        this.capturePhotoService.stop();
        this.capturePhotoService.start();
    }

    takePicture() {
        if (this.capturePhotoService.isReady) {
            this.currentImage = this.capturePhotoService.takePicture();
            this.pictureTaken = true;
            this.capturePhotoService.stop();
        }
    }

    closeClicked() {
        this.close.emit(null)
    }

    usePicture() {
        this.photoSelected.emit(this.currentImage)
    }
}