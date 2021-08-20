# Angular

## @Input data binding

Angular does not detect changes to array inputs when the array is updated 
using push, pop, slice, etc. You must create an new instance of the array
and assign it to the parent array instance. See example

text-messaging is the child component input
```javascript
@Input('users') inputUsers: Array<GenericUserType>;
```

this is markup in the parent component using text-messaging component
```html
<text-messaging [users]="currentUsers" [(textMessages)]="textMessages" [currentMessage]="currentMessage"></text-messaging>
```

in parent component ts we have an array `currentUsers: Array<GenericUserType>`
when we update this array we have to pass it a new instance.
```javascript
async updateCurrentUsers(): Promise<void>{
	let user: GenericUserType = new GenericUserType();

	let newInstance: GenericUserType[] = this.currentUsers.push(user);

	// this will update the input users in the child component
	this.currentUsers = newInstance;
}
```
or you can just use array.slice() to create new instance

```javascript
let user: GenericUserType = new GenericUserType();
this.currentUsers.push(user);
this.currentUsers = this.currentUsers.slice();
```


