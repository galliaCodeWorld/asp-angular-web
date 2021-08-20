export class FormItemType {
    constructor() {
        this.key = "";
        this.label = "";
        this.value = "";
        this.required = false;
        this.maxLength = 0;
        this.minLength = 0;
        this.isEmail = false;
    }

    key: string; // javascript property name
    label: string;
    value: string;
    required: boolean;
    maxLength: number;
    minLength: number;
    isEmail: boolean;
}