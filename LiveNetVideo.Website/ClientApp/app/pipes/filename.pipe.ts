import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'filename'
})

export class FileNamePipe implements PipeTransform {
    transform(fileName, companyId, folder = ''): any {
        if (fileName) {
            let slicedFileName = fileName.split('.');
            let largeFile = `${slicedFileName[0]}_lg.${slicedFileName[1]}`;
            let fullFileName = `https://nofb.org/Content/Pbx/${companyId}${folder}/${largeFile}`
            return fullFileName;
        } else {
            return '../../assets/images/default-avatar.png'
        }
    }
}